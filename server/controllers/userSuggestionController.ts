import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Conversation from "../models/conversationModel.js";
import suggestionCache from "../utils/cache.js";
import logger from "../utils/logger.js";

const getChatUserSuggestions = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const { query } = req.query;

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ error: "Invalid userId" });
		}

		const cacheKey = query ? `user_suggestions_${query}` : 'user_suggestions';
		const cachedSuggestions = suggestionCache.get(cacheKey, userId);
		if (cachedSuggestions) {
			return res.status(200).json(cachedSuggestions);
		}

		const currentUser = await User.findById(userId).populate('following', '_id');
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		let searchFilter = {};
		if (query && query.trim()) {
			searchFilter = {
				$or: [
					{ username: { $regex: query.trim(), $options: "i" } },
					{ name: { $regex: query.trim(), $options: "i" } }
				]
			};
		}

		const recentConversations = await Conversation.find({ participants: userId })
			.populate('participants', '_id username name profilePic')
			.sort({ updatedAt: -1 })
			.limit(10);

		let recentChatUsers: any[] = [];
		recentConversations.forEach(conv => {
			conv.participants.forEach(participant => {
				if (participant._id.toString() !== userId.toString()) {
					recentChatUsers.push(participant);
				}
			});
		});

		if (query && query.trim()) {
			recentChatUsers = recentChatUsers.filter(user =>
				user.username.toLowerCase().includes(query.trim().toLowerCase()) ||
				user.name.toLowerCase().includes(query.trim().toLowerCase())
			);
		}

		let followingFilter = { _id: { $in: currentUser.following } };
		if (query && query.trim()) {
			followingFilter = { ...followingFilter, ...searchFilter };
		}
		const followingUsers = await User.find(followingFilter)
			.select('_id username name profilePic');

		let mutualMatchStage: any = {
			'theirFollowing._id': { $ne: userId, $nin: currentUser.following }
		};
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
			{ $match: { _id: { $in: currentUser.following } } },
			{
				$lookup: {
					from: 'users',
					localField: 'following',
					foreignField: '_id',
					as: 'theirFollowing'
				}
			},
			{ $unwind: '$theirFollowing' },
			{ $match: mutualMatchStage },
			{ $group: {
					_id: '$theirFollowing._id',
					username: { $first: '$theirFollowing.username' },
					name: { $first: '$theirFollowing.name' },
					profilePic: { $first: '$theirFollowing.profilePic' },
					mutualCount: { $sum: 1 }
				}
			},
			{ $sort: { mutualCount: -1 } },
			{ $limit: 5 }
		]);

		const excludeIds = [
			userId,
			...recentChatUsers.map(u => u._id),
			...followingUsers.map(u => u._id),
			...mutualConnections.map(u => u._id)
		];

		let popularFilter: any = { _id: { $nin: excludeIds } };
		if (query && query.trim()) {
			popularFilter = { ...popularFilter, ...searchFilter };
		}
		const popularUsers = await User.find(popularFilter)
			.select('_id username name profilePic followers')
			.sort({ 'followers.length': -1 })
			.limit(3);

		let searchResults: any[] = [];
		if (query && query.trim()) {
			searchResults = await User.find({ ...searchFilter })
				.select('_id username name profilePic')
				.limit(10);
		}

		const startsWithQuery = (user: any, query: string) => {
			if (!query) return false;
			const q = query.toLowerCase();
			return user.username.toLowerCase().startsWith(q) || user.name.toLowerCase().startsWith(q);
		};

		let suggestions: any[] = [];
		if (query && query.trim()) {
			suggestions = [
				...searchResults.map(user => ({ ...user.toObject(), priority: startsWithQuery(user, query) ? 'search_exact' : 'search_contains' })),
				...recentChatUsers.slice(0, 3).map(user => ({ ...user.toObject(), priority: 'recent' })),
				...followingUsers.slice(0, 2).map(user => ({ ...user.toObject(), priority: 'following' })),
				...mutualConnections.slice(0, 2).map(user => ({ ...user, priority: 'mutual' })),
				...popularUsers.slice(0, 1).map(user => ({ ...user.toObject(), priority: 'popular' }))
			];
		} else {
			suggestions = [
				...recentChatUsers.slice(0, 5).map(user => ({ ...user.toObject(), priority: 'recent' })),
				...followingUsers.slice(0, 3).map(user => ({ ...user.toObject(), priority: 'following' })),
				...mutualConnections.map(user => ({ ...user, priority: 'mutual' })),
				...popularUsers.map(user => ({ ...user.toObject(), priority: 'popular' }))
			];
		}

		const uniqueSuggestions = suggestions.filter((user, index, self) =>
			index === self.findIndex(u => u._id.toString() === user._id.toString())
		);

		if (query && query.trim()) {
			const priorityOrder: any = { search_exact: 1, search_contains: 2, recent: 3, following: 4, mutual: 5, popular: 6 };
			uniqueSuggestions.sort((a, b) => {
				const aPriority = priorityOrder[a.priority] || 999;
				const bPriority = priorityOrder[b.priority] || 999;
				return aPriority - bPriority;
			});
		}

		const finalSuggestions = uniqueSuggestions.slice(0, 8);
		suggestionCache.set(cacheKey, userId, finalSuggestions);

		return res.status(200).json(finalSuggestions);
	} catch (error: any) {
		logger.error("Error in getChatUserSuggestions", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export { getChatUserSuggestions };