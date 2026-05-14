import { Request, Response } from "express";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import Notification from "../models/notificationModel.js"; // Import Notification model
import Message from "../models/messageModel.js"; // Import Message model
import Conversation from "../models/conversationModel.js"; // Import Conversation model
import logger from "../utils/logger.js";
import suggestionCache from "../utils/cache.js";

const getUserProfile = async (req: Request, res: Response) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query })
				.select("-password -updatedAt")
				.populate("followers", "_id username name profilePic")
				.populate("following", "_id username name profilePic");
		} else {
			// query is username
			user = await User.findOne({ username: query })
				.select("-password -updatedAt")
				.populate("followers", "_id username name profilePic coverPic")
				.populate("following", "_id username name profilePic coverPic");
		}

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in getUserProfile", err);
	}
};

const signupUser = async (req: Request, res: Response) => {
	try {
		const { name, password } = req.body;
		// Normalize early so duplicate check and save use the same values
		const email = (req.body.email || "").trim().toLowerCase();
		const username = (req.body.username || "").trim().toLowerCase();

		if (!name || !email || !username || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}

		// Check duplicate with normalized values
		const existingUser = await User.findOne({ $or: [{ email }, { username }] });
		if (existingUser) {
			if (existingUser.email === email) {
				return res.status(400).json({ error: "Email is already registered" });
			}
			return res.status(400).json({ error: "Username is already taken" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			name: name.trim(),
			email,
			username,
			password: hashedPassword,
			isProfileComplete: true
		});
		await newUser.save();
		suggestionCache.clear();

		if (newUser) {
			const sessionPath = (req.query.session as string) || '';
			generateTokenAndSetCookie(newUser._id, res, sessionPath);

			res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
				coverPic: newUser.coverPic,
				location: newUser.location || "",
				website: newUser.website || "",
				isProfileComplete: true,
				sessionPath: sessionPath
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in signupUser", err);
	}
};

const loginUser = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}

		const identifier = (username || "").trim().toLowerCase();
		// Allow login with username OR email
		const user = await User.findOne({
			$or: [
				{ username: identifier },
				{ email: identifier }
			]
		});
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

		if (user.isFrozen) {
			user.isFrozen = false;
			await user.save();
		}

		// Auto-fix: mark profile complete for regular users who have all required fields
		if (!user.isProfileComplete && !user.isGoogleUser && user.name && user.username && user.email) {
			await User.findByIdAndUpdate(user._id, { isProfileComplete: true });
			user.isProfileComplete = true;
		}

		const sessionPath = (req.query.session as string) || '';
		generateTokenAndSetCookie(user._id, res, sessionPath);

		// Clear the entire suggestion cache to ensure all users see the latest status of this user
		suggestionCache.clear();

		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
			coverPic: user.coverPic,
			location: user.location || "",
			website: user.website || "",
			isProfileComplete: user.isProfileComplete ?? true,
			sessionPath: sessionPath
		});
	} catch (error: any) {
		res.status(500).json({ error: error.message });
		logger.error("Error in loginUser", error);
	}
};

const logoutUser = (req: Request, res: Response) => {
	try {
		// Clear all possible JWT cookies for multi-tab support
		res.cookie("jwt", "", { maxAge: 1 });
		res.cookie("jwt-sociality", "", { maxAge: 1 });

		// Clear session-specific cookie if session path is provided
		const sessionPath = (req.query.session as string) || '';
		if (sessionPath) {
			const cookieName = `jwt-sociality${sessionPath.replace(/\//g, '-')}`;
			res.cookie(cookieName, "", { maxAge: 1 });
		}

		res.status(200).json({ message: "User logged out successfully" });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in logoutUser", err);
	}
};

const followUnFollowUser = async (req: any, res: Response) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString())
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		// Check if current user is following the target user
		const isFollowing = currentUser.following.some(followingId =>
			followingId.toString() === id.toString()
		);

		if (isFollowing) {
			// Unfollow user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow user
			await User.findByIdAndUpdate(id, { $addToSet: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: id } });

			// Create follow notification
			const newNotification = new Notification({
				recipient: id, // The user being followed
				sender: req.user._id, // The user who followed
				type: "follow",
			});
			await newNotification.save();
			// Note: We don't wait for the notification save to send the response for faster UX

			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in followUnFollowUser", err);
	}
};

const updateUser = async (req: any, res: Response) => {
	const { name, email, username, password, bio } = req.body;
	let { profilePic, coverPic } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		if (profilePic && profilePic.trim() !== '') {
			if (user.profilePic) {
				await deleteImage(user.profilePic);
			}

			// Check if profilePic is a base64 string
			if (profilePic.startsWith('data:image')) {
				try {
					profilePic = await uploadImage(profilePic, {
						resource_type: "auto"
					});
				} catch (err: any) {
					logger.error("Error uploading to Cloudinary", err);
					return res.status(500).json({ error: err.message || "Error uploading image" });
				}
			} else if (!profilePic.startsWith('http')) {
				return res.status(400).json({ error: "Invalid image URL" });
			}
		} else {
			// No new profilePic sent — keep existing
			profilePic = user.profilePic;
		}

		if (coverPic && coverPic.trim() !== '') {
			if (user.coverPic) {
				await deleteImage(user.coverPic);
			}

			// Check if coverPic is a base64 string
			if (coverPic.startsWith('data:image')) {
				try {
					coverPic = await uploadImage(coverPic, {
						resource_type: "auto"
					});
				} catch (err: any) {
					logger.error("Error uploading to Cloudinary", err);
					return res.status(500).json({ error: err.message || "Error uploading cover image" });
				}
			} else if (!coverPic.startsWith('http')) {
				return res.status(400).json({ error: "Invalid image URL" });
			}
		} else {
			// No new coverPic sent — keep existing
			coverPic = user.coverPic;
		}

		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.coverPic = coverPic || user.coverPic;
		user.bio = bio || user.bio;
		user.location = req.body.location || user.location;
		user.website = req.body.website || user.website;

		user = await user.save();

		// Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in updateUser", err);
	}
};

const getSuggestedUsers = async (req: any, res: Response) => {
    try {
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Get the current user to access their following list
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Convert following array to ObjectIds
        const followingIds = currentUser.following.map(id => new mongoose.Types.ObjectId(id));

        // Match stage: exclude current user, users the current user is following, and users following the current user
        const matchStage = {
            $match: {
                $and: [
                    { _id: { $ne: new mongoose.Types.ObjectId(userId) } },  // Not the current user
                    { _id: { $nin: followingIds } },                        // Not users the current user is following
                    { followers: { $ne: new mongoose.Types.ObjectId(userId) } } // Not users following the current user
                ]
            }
        };

        const lookupStage = {
            $lookup: {
                from: 'posts',
                localField: '_id',
                foreignField: 'postedBy',
                as: 'userPosts'
            }
        };
        const projectStage = {
            $project: {
                _id: 1,
                username: 1,
                profilePic: 1,
                name: 1,
                postsCount: { $size: '$userPosts' }
            }
        };
        const sortStage = { $sort: { postsCount: -1 } };
        const limitStage = { $limit: 5 };

        const popularUsers = await User.aggregate([
            matchStage,
            lookupStage,
            projectStage,
            sortStage,
            limitStage
        ]);

        res.status(200).json(popularUsers);
    } catch (error: any) {
        logger.error("Error in getSuggestedUsers", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const freezeAccount = async (req: any, res: Response) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

// New function to search users
const searchUsers = async (req: any, res: Response) => {
	const { query } = req.query; // Get search query from query parameters
	const userId = req.user._id; // Get current user ID from protectRoute middleware

	if (!query) {
		return res.status(400).json({ error: "Search query is required" });
	}

	try {
		// Get the current user to access their following list
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Use a regex for case-insensitive search on username or name
		const users = await User.find({
			$and: [
				{
					$or: [
						{ username: { $regex: `^${query.trim()}`, $options: "i" } }, // Starts with
						{ name: { $regex: `^${query.trim()}`, $options: "i" } },     // Starts with
						{ username: { $regex: query.trim(), $options: "i" } }, // Contains
						{ name: { $regex: query.trim(), $options: "i" } },     // Contains
					],
				}
			],
		})
		.select("-password")
		.sort({ name: 1 }); // Sort by name for consistent results

		res.status(200).json(users);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
		logger.error("Error in searchUsers", error);
	}
};

// Function to reset a user's following list
const resetFollowing = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;

		// Get the current user
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// For each user that the current user is following, remove the current user from their followers
		for (const followingId of currentUser.following) {
			await User.findByIdAndUpdate(followingId, {
				$pull: { followers: userId }
			});
		}

		// Clear the current user's following list
		currentUser.following = [];
		await currentUser.save();

		// Get the updated user with populated fields
		const updatedUser = await User.findById(userId)
			.select("-password -updatedAt")
			.populate("followers", "_id username name profilePic coverPic")
			.populate("following", "_id username name profilePic coverPic");

		res.status(200).json(updatedUser);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in resetFollowing", err);
	}
};


// Delete user account permanently
const deleteAccount = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Delete user's posts
		await Post.deleteMany({ postedBy: userId });

		// Remove user from followers' following lists
		await User.updateMany(
			{ followers: userId },
			{ $pull: { followers: userId } }
		);

		// Remove user from following users' followers lists
		await User.updateMany(
			{ following: userId },
			{ $pull: { following: userId } }
		);

		// Delete user's notifications
		await Notification.deleteMany({
			$or: [
				{ recipient: userId },
				{ sender: userId }
			]
		});

		// Find all conversations involving the user
		const conversations = await Conversation.find({
			participants: userId
		});

		// Get conversation IDs
		const conversationIds = conversations.map(conv => conv._id);

		// Delete all messages in those conversations
		await Message.deleteMany({
			conversationId: { $in: conversationIds }
		});

		// Delete all conversations involving the user
		await Conversation.deleteMany({
			participants: userId
		});

		// Delete the user
		await User.findByIdAndDelete(userId);

		// Clear the JWT cookie
		res.cookie("jwt", "", { maxAge: 1 });

		res.status(200).json({ success: true, message: "Account deleted successfully" });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
		logger.error("Error in deleteAccount", error);
	}
};

const checkProfileCompletion = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).select("isProfileComplete name username bio profilePic coverPic googleId isGoogleUser email createdAt");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Smart profile completion detection
		let isActuallyComplete = user.isProfileComplete;

		// Define what constitutes a complete profile
		const hasRequiredFields = user.name && user.username && user.email;

		// For Google OAuth users, if they exist in the system, they should be considered complete
		// Profile setup is only for brand new Google OAuth users
		if (user.isGoogleUser) {
			// If this is an existing Google OAuth user, mark as complete
			if (hasRequiredFields && !isActuallyComplete) {
				isActuallyComplete = true;
				await User.findByIdAndUpdate(userId, { isProfileComplete: true });
			}
		} else {
			// For non-Google users, if they have required fields, consider complete
			if (!isActuallyComplete && hasRequiredFields) {
				isActuallyComplete = true;
				await User.findByIdAndUpdate(userId, { isProfileComplete: true });
			}
		}

		res.status(200).json({
			isProfileComplete: isActuallyComplete,
			profile: {
				name: user.name,
				username: user.username,
				bio: user.bio,
				profilePic: user.profilePic,
				coverPic: user.coverPic,
				isGoogleUser: user.isGoogleUser
			}
		});
	} catch (error: any) {
		res.status(500).json({ error: error.message });
		logger.error("Error in checkProfileCompletion", error);
	}
};

const completeProfile = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		let { name, username, bio, profilePic, coverPic } = req.body;

		// Validate required fields
		if (!name || !username) {
			return res.status(400).json({ error: "Name and username are required" });
		}

		// Validate username format
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
		}

		// Check if username is already taken by another user
		const existingUser = await User.findOne({
			username: username.trim(),
			_id: { $ne: userId }
		});

		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

		// Handle profile picture upload if provided
		if (profilePic && profilePic.startsWith('data:image')) {
			try {
				profilePic = await uploadImage(profilePic, {
					resource_type: "auto",
					folder: "profile_pics"
				});
			} catch (uploadError) {
				logger.error("Error uploading profile picture to Cloudinary", uploadError);
				return res.status(500).json({ error: "Error uploading profile picture" });
			}
		}

		// Handle cover picture upload if provided
		if (coverPic && coverPic.startsWith('data:image')) {
			try {
				coverPic = await uploadImage(coverPic, {
					resource_type: "auto",
					folder: "cover_pics"
				});
			} catch (uploadError) {
				logger.error("Error uploading cover picture to Cloudinary", uploadError);
				return res.status(500).json({ error: "Error uploading cover picture" });
			}
		}

		// Update user profile
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{
				name: name.trim(),
				username: username.trim(),
				bio: bio ? bio.trim() : "",
				location: req.body.location ? req.body.location.trim() : "",
				website: req.body.website ? req.body.website.trim() : "",
				profilePic: profilePic || "",
				coverPic: coverPic || "",
				isProfileComplete: true
			},
			{ new: true }
		).select("-password");

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get session path from query to include in response
		const sessionPath = req.query.session || '';

		// Ensure we return a proper JSON response
		res.status(200).json({
			_id: updatedUser._id,
			name: updatedUser.name,
			email: updatedUser.email,
			username: updatedUser.username,
			bio: updatedUser.bio,
			location: updatedUser.location || "",
			website: updatedUser.website || "",
			profilePic: updatedUser.profilePic,
			coverPic: updatedUser.coverPic,
			isProfileComplete: updatedUser.isProfileComplete,
			followers: updatedUser.followers,
			following: updatedUser.following,
			isFrozen: updatedUser.isFrozen,
			googleId: updatedUser.googleId,
			isGoogleUser: updatedUser.isGoogleUser,
			createdAt: updatedUser.createdAt,
			updatedAt: updatedUser.updatedAt,
			sessionPath: sessionPath // Include session path in response
		});
	} catch (error: any) {
		logger.error("Error in completeProfile", error);
		res.status(500).json({ error: error.message });
	}
};

// Get intelligent user suggestions for chat search
const getChatUserSuggestions = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const { query } = req.query; // Get search query from query parameters

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ error: "Invalid userId" });
		}

		// Create cache key that includes search query
		const cacheKey = query ? `user_suggestions_${query}` : 'user_suggestions';
		const cachedSuggestions = suggestionCache.get(cacheKey, userId);
		if (cachedSuggestions) {
			return res.status(200).json(cachedSuggestions);
		}

		// Get current user with their conversations and following
		const currentUser = await User.findById(userId).populate('following', '_id');
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Build search filter if query is provided
		let searchFilter = {};
		if (query && query.trim()) {
			searchFilter = {
				$or: [
					{ username: { $regex: query.trim(), $options: "i" } },
					{ name: { $regex: query.trim(), $options: "i" } }
				]
			};
		}

		// Get users from recent conversations
		const recentConversations = await Conversation.find({
			participants: userId
		})
		.populate('participants', '_id username name profilePic')
		.sort({ updatedAt: -1 })
		.limit(10);

		// Extract users from recent conversations (excluding current user)
		let recentChatUsers: any[] = [];
		recentConversations.forEach(conv => {
			conv.participants.forEach(participant => {
				if (participant._id.toString() !== userId.toString()) {
					recentChatUsers.push(participant);
				}
			});
		});

		// Filter recent chat users by search query if provided
		if (query && query.trim()) {
			recentChatUsers = recentChatUsers.filter(user =>
				user.username.toLowerCase().includes(query.trim().toLowerCase()) ||
				user.name.toLowerCase().includes(query.trim().toLowerCase())
			);
		}

		// Get users that current user is following
		let followingFilter = { _id: { $in: currentUser.following } };
		if (query && query.trim()) {
			followingFilter = {
				...followingFilter,
				...searchFilter
			};
		}
		const followingUsers = await User.find(followingFilter)
			.select('_id username name profilePic');

		// Get mutual connections (users followed by people current user follows)
		let mutualMatchStage: any = {
			'theirFollowing._id': { $ne: userId, $nin: currentUser.following }
		};

		// Add search filter for mutual connections if query provided
		if (query && query.trim()) {
			mutualMatchStage = {
				...mutualMatchStage,
				$or: [
					{ 'theirFollowing.username': { $regex: query.trim(), $options: "i" } },
					{ 'theirFollowing.name': { $regex: query.trim(), $options: "i" } }
				]
			};
		}

		const mutualConnections = await User.aggregate([
			{
				$match: {
					_id: { $in: currentUser.following },
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'following',
					foreignField: '_id',
					as: 'theirFollowing'
				}
			},
			{
				$unwind: '$theirFollowing'
			},
			{
				$match: mutualMatchStage
			},
			{
				$group: {
					_id: '$theirFollowing._id',
					username: { $first: '$theirFollowing.username' },
					name: { $first: '$theirFollowing.name' },
					profilePic: { $first: '$theirFollowing.profilePic' },
					mutualCount: { $sum: 1 }
				}
			},
			{
				$sort: { mutualCount: -1 }
			},
			{
				$limit: 5
			}
		]);

		// Get popular users (users with most followers, excluding already connected)
		const excludeIds = [
			userId,
			...recentChatUsers.map(u => u._id),
			...followingUsers.map(u => u._id),
			...mutualConnections.map(u => u._id)
		];

		let popularFilter = { _id: { $nin: excludeIds } };
		if (query && query.trim()) {
			popularFilter = {
				...popularFilter,
				...searchFilter
			};
		}

		const popularUsers = await User.find(popularFilter)
			.select('_id username name profilePic followers')
			.sort({ 'followers.length': -1 })
			.limit(3);

		// If we have a search query, also get direct search results
		let searchResults: any[] = [];
		if (query && query.trim()) {
			searchResults = await User.find({
				...searchFilter
			})
			.select('_id username name profilePic')
			.limit(10);
		}

		// Helper function to check if user matches search at start
		const startsWithQuery = (user: any, query: string) => {
			if (!query) return false;
			const q = query.toLowerCase();
			return user.username.toLowerCase().startsWith(q) ||
				   user.name.toLowerCase().startsWith(q);
		};

		// Combine and prioritize suggestions
		let suggestions: any[] = [];

		if (query && query.trim()) {
			// When searching, prioritize direct search results
			suggestions = [
				...searchResults.map(user => ({
					...user.toObject(),
					priority: startsWithQuery(user, query) ? 'search_exact' : 'search_contains'
				})),
				...recentChatUsers.slice(0, 3).map(user => ({ ...user.toObject(), priority: 'recent' })),
				...followingUsers.slice(0, 2).map(user => ({ ...user.toObject(), priority: 'following' })),
				...mutualConnections.slice(0, 2).map(user => ({ ...user, priority: 'mutual' })),
				...popularUsers.slice(0, 1).map(user => ({ ...user.toObject(), priority: 'popular' }))
			];
		} else {
			// When not searching, use original priority
			suggestions = [
				...recentChatUsers.slice(0, 5).map(user => ({ ...user.toObject(), priority: 'recent' })),
				...followingUsers.slice(0, 3).map(user => ({ ...user.toObject(), priority: 'following' })),
				...mutualConnections.map(user => ({ ...user, priority: 'mutual' })),
				...popularUsers.map(user => ({ ...user.toObject(), priority: 'popular' }))
			];
		}

		// Remove duplicates based on _id
		const uniqueSuggestions = suggestions.filter((user, index, self) =>
			index === self.findIndex(u => u._id.toString() === user._id.toString())
		);

		// Sort by priority when searching
		if (query && query.trim()) {
			const priorityOrder = { 'search_exact': 1, 'search_contains': 2, 'recent': 3, 'following': 4, 'mutual': 5, 'popular': 6 };
			uniqueSuggestions.sort((a, b) => {
				const aPriority = priorityOrder[a.priority] || 999;
				const bPriority = priorityOrder[b.priority] || 999;
				return aPriority - bPriority;
			});
		}

		// Limit to 8 suggestions total
		const finalSuggestions = uniqueSuggestions.slice(0, 8);

		// Cache the results
		suggestionCache.set(cacheKey, userId, finalSuggestions);

		res.status(200).json(finalSuggestions);
	} catch (error: any) {
		logger.error("Error in getChatUserSuggestions", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

const getFollowers = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username }).populate("followers", "username name profilePic bio followers");
		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user.followers);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

const getFollowing = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username }).populate("following", "username name profilePic bio followers");
		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user.following);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

const removeFollower = async (req: any, res: Response) => {
	try {
		const { id } = req.params; // The ID of the follower to remove
		const userId = req.user._id; // The current user's ID

		const userToRemove = await User.findById(id);
		if (!userToRemove) return res.status(404).json({ error: "User not found" });

		// Remove the follower from the current user's followers list
		await User.findByIdAndUpdate(userId, { $pull: { followers: id } });
		// Remove the current user from the follower's following list
		await User.findByIdAndUpdate(id, { $pull: { following: userId } });

		res.status(200).json({ message: "Follower removed successfully" });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

export {
	signupUser,
	loginUser,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	freezeAccount,
	searchUsers,
	resetFollowing,
	deleteAccount,
	completeProfile,
	checkProfileCompletion,
	getChatUserSuggestions,
	getFollowers,
	getFollowing,
	removeFollower,
};
