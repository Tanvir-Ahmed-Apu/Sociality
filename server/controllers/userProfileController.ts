import { Request, Response } from "express";
import mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const getUserProfile = async (req: Request, res: Response) => {
	const { query } = req.params;
	try {
		let user;

		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query })
				.select("-password -updatedAt")
				.populate("followers", "_id username name profilePic")
				.populate("following", "_id username name profilePic");
		} else {
			user = await User.findOne({ username: query })
				.select("-password -updatedAt")
				.populate("followers", "_id username name profilePic coverPic")
				.populate("following", "_id username name profilePic coverPic");
		}

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.status(200).json(user);
	} catch (err: any) {
		logger.error("Error in getUserProfile", err);
		return res.status(500).json({ error: err.message });
	}
};

const updateUser = async (req: any, res: Response) => {
	const { name, email, username, password, bio } = req.body;
	let { profilePic, coverPic } = req.body;
	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString()) {
			return res.status(400).json({ error: "You cannot update other user's profile" });
		}

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		if (profilePic && profilePic.trim() !== '') {
			if (user.profilePic) {
				await deleteImage(user.profilePic);
			}

			if (profilePic.startsWith('data:image')) {
				try {
					profilePic = await uploadImage(profilePic, { resource_type: "auto" });
				} catch (err: any) {
					logger.error("Error uploading to Cloudinary", err);
					return res.status(500).json({ error: err.message || "Error uploading image" });
				}
			} else if (!profilePic.startsWith('http')) {
				return res.status(400).json({ error: "Invalid image URL" });
			}
		} else {
			profilePic = user.profilePic;
		}

		if (coverPic && coverPic.trim() !== '') {
			if (user.coverPic) {
				await deleteImage(user.coverPic);
			}

			if (coverPic.startsWith('data:image')) {
				try {
					coverPic = await uploadImage(coverPic, { resource_type: "auto" });
				} catch (err: any) {
					logger.error("Error uploading to Cloudinary", err);
					return res.status(500).json({ error: err.message || "Error uploading cover image" });
				}
			} else if (!coverPic.startsWith('http')) {
				return res.status(400).json({ error: "Invalid image URL" });
			}
		} else {
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

		user.password = undefined;
		return res.status(200).json(user);
	} catch (err: any) {
		logger.error("Error in updateUser", err);
		return res.status(500).json({ error: err.message });
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

		return res.status(200).json({ success: true });
	} catch (error: any) {
		logger.error("Error in freezeAccount", error);
		return res.status(500).json({ error: error.message });
	}
};

const deleteAccount = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		await Post.deleteMany({ postedBy: userId });

		await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
		await User.updateMany({ following: userId }, { $pull: { following: userId } });

		await Notification.deleteMany({
			$or: [
				{ recipient: userId },
				{ sender: userId }
			]
		});

		const conversations = await Conversation.find({ participants: userId });
		const conversationIds = conversations.map(conv => conv._id);

		await Message.deleteMany({ conversationId: { $in: conversationIds } });
		await Conversation.deleteMany({ participants: userId });
		await User.findByIdAndDelete(userId);

		res.cookie("jwt", "", { maxAge: 1 });
		return res.status(200).json({ success: true, message: "Account deleted successfully" });
	} catch (error: any) {
		logger.error("Error in deleteAccount", error);
		return res.status(500).json({ error: error.message });
	}
};

const checkProfileCompletion = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).select("isProfileComplete name username bio profilePic coverPic googleId isGoogleUser email createdAt");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		let isActuallyComplete = user.isProfileComplete;
		const hasRequiredFields = user.name && user.username && user.email;

		if (user.isGoogleUser) {
			if (hasRequiredFields && !isActuallyComplete) {
				isActuallyComplete = true;
				await User.findByIdAndUpdate(userId, { isProfileComplete: true });
			}
		} else {
			if (!isActuallyComplete && hasRequiredFields) {
				isActuallyComplete = true;
				await User.findByIdAndUpdate(userId, { isProfileComplete: true });
			}
		}

		return res.status(200).json({
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
		logger.error("Error in checkProfileCompletion", error);
		return res.status(500).json({ error: error.message });
	}
};

const completeProfile = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		let { name, username, bio, profilePic, coverPic } = req.body;

		if (!name || !username) {
			return res.status(400).json({ error: "Name and username are required" });
		}

		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
		}

		const existingUser = await User.findOne({
			username: username.trim(),
			_id: { $ne: userId }
		});

		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

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
		).select("-password").lean() as any;

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const sessionPath = req.query.session || '';

		return res.status(200).json({
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
			sessionPath
		});
	} catch (error: any) {
		logger.error("Error in completeProfile", error);
		return res.status(500).json({ error: error.message });
	}
};

export {
	getUserProfile,
	updateUser,
	freezeAccount,
	deleteAccount,
	checkProfileCompletion,
	completeProfile
};