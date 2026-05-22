import { Request, Response } from "express";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js"; // Import Notification model
import { uploadImage, uploadMultipleImages, deleteImage, deleteImages } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";
import { broadcastPostUpdate, sendMessageToUser } from "../socket/socket.js";

const createPost = async (req: any, res: Response) => {
	try {
		const { postedBy, text } = req.body;
		let { img } = req.body;
		let { images } = req.body;

		if (!postedBy) {
			return res.status(400).json({ error: "PostedBy field is required" });
		}

		// Check if we have either text, a single image, or multiple images
		const hasImages = Array.isArray(images) && images.length > 0;

		// Allow empty text if any image is provided
		if (!text && !img && !hasImages) {
			return res.status(400).json({ error: "Either text or at least one image is required for a post" });
		}

		const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user._id.toString() !== req.user!._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		const maxLength = 500;
		if (text && text.length > maxLength) {
			return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
		}

		// Process single image (for backward compatibility)
		if (img) {
			img = await uploadImage(img);
		}

		// Process multiple images if provided
		const uploadedImages: string[] = await uploadMultipleImages(images);

		// If we have a single image but no multiple images, use the single image
		if (img && uploadedImages.length === 0) {
			uploadedImages.push(img);
		}

		// Create the post with all data
		const newPost = new Post({
			postedBy,
			text,
			img: uploadedImages.length > 0 ? uploadedImages[0] : null, // Set first image as main image
			images: uploadedImages
		});

		await newPost.save();

		// Populate postedBy field in the response
		const populatedPost = await Post.findById(newPost._id).populate("postedBy", "username profilePic");

		res.status(201).json(populatedPost);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in createPost", err);
	}
};

const getPost = async (req: Request, res: Response) => {
	try {
		const postId = req.params.id;
		// Check if the ID is a valid MongoDB ObjectId
		if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({ error: "Invalid post ID format" });
		}

		// Populate postedBy field with username and profilePic
		const post = await Post.findById(postId).populate("postedBy", "username profilePic");

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		res.status(200).json(post);
	} catch (err: any) {
		console.error(`❌ [getPost] Error: ${err.message}`);
		res.status(500).json({ error: err.message });
	}
};

const deletePost = async (req: any, res: Response) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.postedBy.toString() !== req.user!._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		// Delete main image if it exists
		if (post.img) {
			await deleteImage(post.img);
		}

		// Delete all images in the images array
		if (post.images && post.images.length > 0) {
			await deleteImages(post.images);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

const updatePost = async (req: any, res: Response) => {
try {
	const { text } = req.body;
	let { img } = req.body;
	let { images } = req.body;
	const postId = req.params.id;

	const post = await Post.findById(postId);
	if (!post) {
		return res.status(404).json({ error: "Post not found" });
	}

	if (post.postedBy.toString() !== req.user!._id.toString()) {
		return res.status(401).json({ error: "Unauthorized to update post" });
	}

	// Check if we have either text, a single image, or multiple images
	const hasImages = Array.isArray(images) && images.length > 0;

	// Allow empty text if any image is provided
	if (!text && !img && !hasImages) {
		return res.status(400).json({ error: "Either text or at least one image is required for a post" });
	}

	const maxLength = 500;
	if (text && text.length > maxLength) {
		return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
	}

	// Process single image (for backward compatibility)
	if (img) {
		img = await uploadImage(img);
	}

	// Process multiple images if provided
	const uploadedImages: string[] = await uploadMultipleImages(images);

	// If we have a single image but no multiple images, use the single image
	if (img && uploadedImages.length === 0) {
		uploadedImages.push(img);
	}

	// Update the post
	const updateData = {
		text,
		img: uploadedImages.length > 0 ? uploadedImages[0] : post.img,
		images: uploadedImages.length > 0 ? uploadedImages : post.images
	};

	const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true })
		.populate("postedBy", "username profilePic");

	res.status(200).json(updatedPost);
} catch (err: any) {
	res.status(500).json({ error: err.message });
	logger.error("Error in updatePost", err);
}
};

const likeUnlikePost = async (req: any, res: Response) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user!._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();

			// Create like notification (only if someone else's post is liked)
			if (post.postedBy.toString() !== userId.toString()) {
				const newNotification = new Notification({
					recipient: post.postedBy,
					sender: userId,
					type: "like",
					postId: postId,
				});
				await newNotification.save();
			}

			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

const replyToPost = async (req: any, res: Response) => {
	try {
		const { text } = req.body;
		let img = req.body.img; // For base64 data
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		// Handle FormData file upload (when using FormData from frontend)
		if (req.files && req.files.img && req.files.img[0]) {
			img = await uploadImage(req.files.img[0].path);
		}
		// Handle base64 image data (when using JSON from frontend)
		else if (img && typeof img === 'string' && img.startsWith('data:')) {
			img = await uploadImage(img);
		}

		// Allow empty text if an image is provided
		if (!text && !img) {
			return res.status(400).json({ error: "Either text or image is required for a reply" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			console.log(`Error: Post ${postId} not found`);
			return res.status(404).json({ error: "Post not found" });
		}

		// Create reply object with all fields
		const reply = {
			userId,
			text,
			img,
			userProfilePic,
			username,
			createdAt: new Date()
		};

		// Add the reply to the beginning of the array for immediate visibility
		post.replies.unshift(reply as any);
		const savedPost = await post.save();

		// Get the saved reply with its generated _id
		const savedReply = savedPost.replies[0]; // The reply we just added at the beginning

		// Create comment notification (only if someone else's post is commented on)
		if (post.postedBy.toString() !== userId.toString()) {
			const newNotification = new Notification({
				recipient: post.postedBy,
				sender: userId,
				type: "comment",
				postId: postId,
			});
			await newNotification.save();

			// Send real-time notification to post owner
			sendMessageToUser(post.postedBy.toString(), "newReply", {
				postId,
				reply
			});
		}

		// Broadcast the reply to all users who might be viewing the post
		broadcastPostUpdate(postId, {
			type: "newReply",
			reply: savedReply,
			postId
		});

		res.status(200).json(savedReply);
	} catch (err: any) {
		console.error("Error in replyToPost:", err);
		res.status(500).json({ error: err.message });
		logger.error("Error in replyToPost", err);
	}
};

// Get trending posts based on engagement (likes and comments)
const getTrendingPosts = async (limit = 20) => {
	try {
		// Find all posts
		const posts = await Post.find({})
			.populate("postedBy", "username profilePic")
			.lean();

		// Calculate engagement score for each post (likes count + replies count)
		const postsWithEngagement = posts.map(post => {
			const likesCount = post.likes?.length || 0;
			const repliesCount = post.replies?.length || 0;
			const engagementScore = likesCount + repliesCount;

			return {
				...post,
				engagementScore
			};
		});

		// Sort by engagement score (highest first)
		const sortedPosts = postsWithEngagement.sort((a, b) => b.engagementScore - a.engagementScore);

		// Return the top posts based on limit
		return sortedPosts.slice(0, limit);
	} catch (error: any) {
		console.error("Error in getTrendingPosts:", error);
		throw error;
	}
};

// Route handler for trending posts
const getTrendingPostsHandler = async (req: Request, res: Response) => {
	try {
		// Get limit from query parameter or use default
		const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

		// Get trending posts
		const trendingPosts = await getTrendingPosts(limit);

		res.status(200).json(trendingPosts);
	} catch (error: any) {
		console.error("Error in getTrendingPostsHandler:", error);
		res.status(500).json({ error: error.message });
	}
};

// For You feed - shows all posts with engagement-based algorithm (thread-like system)
const getForYouPosts = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = user.following || [];
		const followers = user.followers || [];
		const notInterestedPosts = user.notInterestedPosts || [];

		// Get ALL posts (thread-like system) excluding not interested posts
		const allPosts = await Post.find({
			_id: { $nin: notInterestedPosts } // Exclude not interested posts
		})
			.populate("postedBy", "username profilePic")
			.lean();

		// Calculate engagement score for each post
		const now = new Date();
		const calculatePostScore = (post) => {
			const postAge = (now.getTime() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60); // Age in hours
			const likesCount = post.likes?.length || 0;
			const repliesCount = post.replies?.length || 0;
			const repostsCount = post.reposts?.length || 0;

			// Base engagement score
			const engagementScore = likesCount + (repliesCount * 2) + (repostsCount * 1.5);

			// Time decay factor (newer posts get boost)
			const timeDecay = Math.max(0.1, 1 - (postAge / 168)); // Decay over 1 week

			// Following boost (posts from people you follow get priority)
			const postedById = post.postedBy?._id?.toString() || post.postedBy?.toString() || null;
			const isFromFollowing = postedById && following.includes(postedById);
			const followingBoost = isFromFollowing ? 100 : 0;

			// Your own posts boost
			const isOwnPost = postedById === userId.toString();
			const ownPostBoost = isOwnPost ? 50 : 0;

			// Mutual connection boost
			const isMutualConnection = postedById && followers.includes(postedById);
			const mutualBoost = isMutualConnection && !isFromFollowing ? 30 : 0;

			// Recent post boost (posts from last 6 hours)
			const recentBoost = postAge < 6 ? 20 : 0;

			// Final score calculation
			const finalScore = (engagementScore * timeDecay) + followingBoost + ownPostBoost + mutualBoost + recentBoost;

			return {
				...post,
				engagementScore: finalScore
			};
		};

		// Filter out posts with null postedBy and apply scoring
		const validPosts = allPosts.filter(post => post.postedBy);
		const scoredPosts = validPosts.map(calculatePostScore);

		// Sort by engagement score (highest first)
		const sortedPosts = scoredPosts.sort((a, b) => b.engagementScore - a.engagementScore);

		// Limit final feed size
		const feedPosts = sortedPosts.slice(0, 50);

		// Clean up the response (remove scoring metadata)
		const cleanFeedPosts = feedPosts.map(post => {
			const { engagementScore, ...cleanPost } = post;
			return cleanPost;
		});

		res.status(200).json(cleanFeedPosts);
	} catch (err: any) {
		console.error("Error in getForYouPosts:", err);
		res.status(500).json({ error: err.message });
	}
};

// Following feed - shows only posts from people you follow
const getFollowingPosts = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = user.following || [];
		const notInterestedPosts = user.notInterestedPosts || [];

		// If user is not following anyone, return empty array
		if (following.length === 0) {
			return res.status(200).json([]);
		}

		// Get posts only from people you follow
		const followingIds = [...following];
		const followingPosts = await Post.find({
			postedBy: { $in: followingIds },
			_id: { $nin: notInterestedPosts } // Exclude not interested posts
		})
			.populate("postedBy", "username profilePic")
			.sort({ createdAt: -1 }) // Simple chronological order for following feed
			.limit(50);

		res.status(200).json(followingPosts);
	} catch (err: any) {
		console.error("Error in getFollowingPosts:", err);
		res.status(500).json({ error: err.message });
	}
};

// Legacy feed function - now redirects to For You feed for backward compatibility
const getFeedPosts = async (req: Request, res: Response) => {
	return getForYouPosts(req, res);
};



const getUserPosts = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Populate postedBy field for user posts
		const posts = await Post.find({ postedBy: user._id })
			.populate("postedBy", "username profilePic") // Populate user details
			.sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

const repostPost = async (req: any, res: Response) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Prevent reposting own post
		if (post.postedBy.toString() === userId.toString()) {
			return res.status(400).json({ error: "Cannot repost your own post" });
		}

		const userRepostedPost = post.reposts.includes(userId);

		if (userRepostedPost) {
			// Un-repost post
			await Post.updateOne({ _id: postId }, { $pull: { reposts: userId } });
			res.status(200).json({ message: "Post un-reposted successfully" });
		} else {
			// Repost post
			post.reposts.push(userId);
			await post.save();
			res.status(200).json({ message: "Post reposted successfully" });
		}
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

// New function to get posts where the user has replied
const getUserReplies = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Find posts where the user's ID is in the replies array
		const posts = await Post.find({ "replies.userId": user._id })
			.populate("postedBy", "username profilePic") // Populate original poster details
			.sort({ createdAt: -1 }) // Sort by original post creation for now
			.lean(); // Use .lean() for plain JS objects to allow modification

		// Add the specific user's reply to each post object
		const postsWithSpecificReply = posts.map(post => {
			// Find the reply by this user within the post's replies array
			const userReply = post.replies.find(reply => reply.userId.toString() === user._id.toString());
			return {
				...post,
				userReply: userReply || null // Add the found reply (or null if somehow not found)
			};
		});

		res.status(200).json(postsWithSpecificReply);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
		logger.error("Error in getUserReplies", error);
	}
};

// New function to get posts the user has reposted
const getUserReposts = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Find posts where the user's ID is in the reposts array
		const repostedPosts = await Post.find({ reposts: user._id })
			.populate("postedBy", "username profilePic") // Populate original poster details
			.sort({ createdAt: -1 }); // Or sort by repost time if available/needed

		res.status(200).json(repostedPosts);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};


const replyToComment = async (req: any, res: Response) => {
	try {
		const { text } = req.body;
		let { img } = req.body;
		const { postId, commentId } = req.params;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		// Allow empty text if an image is provided
		if (!text && !img) {
			return res.status(400).json({ error: "Either text or image is required for a reply" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Find the comment to reply to
		const commentToReply = (post.replies as any).id(commentId);
		if (!commentToReply) {
			return res.status(404).json({ error: "Comment not found" });
		}

		// Upload image to Cloudinary if provided
		if (img) {
			img = await uploadImage(img);
		}

		// Create reply object with all fields
		const reply = {
			userId,
			text,
			img,
			userProfilePic,
			username,
			createdAt: new Date(),
			parentReplyId: commentId
		};

		// Add the reply to the beginning of the array for immediate visibility
		post.replies.unshift(reply as any);
		await post.save();

		// Create notification for the comment owner (if it's not the user's own comment)
		if (commentToReply.userId.toString() !== userId.toString()) {
			const newNotification = new Notification({
				recipient: commentToReply.userId,
				sender: userId,
				type: "comment",
				postId: postId,
			});
			await newNotification.save();

			// Send real-time notification to comment owner
			sendMessageToUser(commentToReply.userId.toString(), "newReply", {
				postId,
				reply,
				parentReplyId: commentId
			});
		}

		// Broadcast the reply to all users who might be viewing the post
		broadcastPostUpdate(postId, {
			type: "nestedReply",
			reply,
			postId,
			parentReplyId: commentId
		});

		res.status(200).json(reply);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in replyToComment", err);
	}
};

const likeUnlikeComment = async (req: any, res: Response) => {
	try {
		const { postId, commentId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Find the comment in the post's replies array
		const comment = (post.replies as any).id(commentId);

		if (!comment) {
			return res.status(404).json({ error: "Comment not found" });
		}

		// Initialize likes array if it doesn't exist
		if (!comment.likes) {
			comment.likes = [];
		}

		const userLikedComment = comment.likes.includes(userId);

		if (userLikedComment) {
			// Unlike comment - remove user ID from likes array
			comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
			await post.save();
			res.status(200).json({ message: "Comment unliked successfully" });
		} else {
			// Like comment - add user ID to likes array
			comment.likes.push(userId);
			await post.save();

			// Send a notification to the comment owner if it's not their own comment
			if (comment.userId.toString() !== userId.toString()) {
				const newNotification = new Notification({
					recipient: comment.userId,
					sender: userId,
					type: "like-comment",
					postId: postId,
				});
				await newNotification.save();
			}

			res.status(200).json({ message: "Comment liked successfully" });
		}
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

// Delete a comment/reply from a post
const deleteComment = async (req: any, res: Response) => {
	try {
		const { postId, commentId } = req.params;
		const userId = req.user._id;

		// Find the post
		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Find the comment
		const comment = (post.replies as any).id(commentId);
		if (!comment) {
			return res.status(404).json({ error: "Comment not found" });
		}

		// Check if the user is authorized to delete the comment
		// Users can delete their own comments or comments on their own posts
		const isCommentOwner = comment.userId.toString() === userId.toString();
		const isPostOwner = post.postedBy.toString() === userId.toString();

		if (!isCommentOwner && !isPostOwner) {
			return res.status(401).json({ error: "Unauthorized to delete this comment" });
		}

		// Delete image from Cloudinary if it exists
		if (comment.img) {
			await deleteImage(comment.img);
		}

		// Remove the comment from the post using pull operator
		await Post.updateOne(
			{ _id: postId },
			{ $pull: { replies: { _id: commentId } } }
		);

		// Broadcast the deletion to all users viewing the post
		broadcastPostUpdate(postId, {
			type: "commentDeleted",
			commentId,
			postId
		});

		res.status(200).json({ message: "Comment deleted successfully" });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
		logger.error("Error in deleteComment", err);
	}
};

const markPostNotInterested = async (req, res) => {
	try {
		console.log("=== MARK POST NOT INTERESTED FUNCTION CALLED ===");
		console.log("Request params:", req.params);
		console.log("Request query:", req.query);
		console.log("Request user:", req.user ? { id: req.user._id, username: req.user.username } : 'null');

		const { postId } = req.params;
		const userId = req.user._id;

		console.log(`[markPostNotInterested] User ${userId} marking post ${postId} as not interested`);

		// Check if post exists
		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Add post to user's notInterestedPosts array if not already there
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		if (!user.notInterestedPosts.includes(postId)) {
			user.notInterestedPosts.push(postId);
			await user.save();
			console.log(`[markPostNotInterested] Post ${postId} added to not interested list for user ${userId}`);
		} else {
			console.log(`[markPostNotInterested] Post ${postId} already in not interested list for user ${userId}`);
		}

		res.status(200).json({ message: "Post marked as not interested" });
	} catch (err: any) {
		console.error("Error in markPostNotInterested:", err);
		res.status(500).json({ error: err.message });
	}
};

export {
	createPost,
	getPost,
	deletePost,
	updatePost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getForYouPosts,
	getFollowingPosts,
	getUserPosts,
	repostPost,
	getUserReplies,
	getUserReposts,
	replyToComment,
	likeUnlikeComment,
	deleteComment,
	getTrendingPosts,
	getTrendingPostsHandler,
	markPostNotInterested,
};
