import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import logger from "../utils/logger.js";

const followUnFollowUser = async (req: any, res: Response) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) {
			return res.status(400).json({ error: "User not found" });
		}

		const isFollowing = currentUser.following.some(followingId =>
			followingId.toString() === id.toString()
		);

		if (isFollowing) {
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			return res.status(200).json({ message: "User unfollowed successfully" });
		}

		await User.findByIdAndUpdate(id, { $addToSet: { followers: req.user._id } });
		await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: id } });

		const newNotification = new Notification({
			recipient: id,
			sender: req.user._id,
			type: "follow",
		});
		await newNotification.save();

		return res.status(200).json({ message: "User followed successfully" });
	} catch (err: any) {
		logger.error("Error in followUnFollowUser", err);
		return res.status(500).json({ error: err.message });
	}
};

const getSuggestedUsers = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ error: "Invalid userId" });
		}

		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const followingIds = currentUser.following.map(id => new mongoose.Types.ObjectId(id));
		const matchStage = {
			$match: {
				$and: [
					{ _id: { $ne: new mongoose.Types.ObjectId(userId) } },
					{ _id: { $nin: followingIds } },
					{ followers: { $ne: new mongoose.Types.ObjectId(userId) } }
				]
			}
		};

		const popularUsers = await User.aggregate([
			matchStage,
			{
				$lookup: {
					from: 'posts',
					localField: '_id',
					foreignField: 'postedBy',
					as: 'userPosts'
				}
			},
			{
				$project: {
					_id: 1,
					username: 1,
					profilePic: 1,
					name: 1,
					postsCount: { $size: '$userPosts' }
				}
			},
			{ $sort: { postsCount: -1 } },
			{ $limit: 5 }
		]);

		return res.status(200).json(popularUsers);
	} catch (error: any) {
		logger.error("Error in getSuggestedUsers", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

const searchUsers = async (req: any, res: Response) => {
	const { query } = req.query;
	const userId = req.user._id;

	if (!query) {
		return res.status(400).json({ error: "Search query is required" });
	}

	try {
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const users = await User.find({
			$or: [
				{ username: { $regex: `^${query.trim()}`, $options: "i" } },
				{ name: { $regex: `^${query.trim()}`, $options: "i" } },
				{ username: { $regex: query.trim(), $options: "i" } },
				{ name: { $regex: query.trim(), $options: "i" } }
			]
		})
			.select("-password")
			.sort({ name: 1 });

		return res.status(200).json(users);
	} catch (error: any) {
		logger.error("Error in searchUsers", error);
		return res.status(500).json({ error: error.message });
	}
};

const resetFollowing = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		for (const followingId of currentUser.following) {
			await User.findByIdAndUpdate(followingId, { $pull: { followers: userId } });
		}

		currentUser.following = [];
		await currentUser.save();

		const updatedUser = await User.findById(userId)
			.select("-password -updatedAt")
			.populate("followers", "_id username name profilePic coverPic")
			.populate("following", "_id username name profilePic coverPic");

		return res.status(200).json(updatedUser);
	} catch (err: any) {
		logger.error("Error in resetFollowing", err);
		return res.status(500).json({ error: err.message });
	}
};

const getFollowers = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username }).populate("followers", "username name profilePic bio followers");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.status(200).json(user.followers);
	} catch (err: any) {
		logger.error("Error in getFollowers", err);
		return res.status(500).json({ error: err.message });
	}
};

const getFollowing = async (req: Request, res: Response) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username }).populate("following", "username name profilePic bio followers");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.status(200).json(user.following);
	} catch (err: any) {
		logger.error("Error in getFollowing", err);
		return res.status(500).json({ error: err.message });
	}
};

const removeFollower = async (req: any, res: Response) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const userToRemove = await User.findById(id);
		if (!userToRemove) {
			return res.status(404).json({ error: "User not found" });
		}

		await User.findByIdAndUpdate(userId, { $pull: { followers: id } });
		await User.findByIdAndUpdate(id, { $pull: { following: userId } });

		return res.status(200).json({ message: "Follower removed successfully" });
	} catch (err: any) {
		logger.error("Error in removeFollower", err);
		return res.status(500).json({ error: err.message });
	}
};

export {
	followUnFollowUser,
	getSuggestedUsers,
	searchUsers,
	resetFollowing,
	getFollowers,
	getFollowing,
	removeFollower
};