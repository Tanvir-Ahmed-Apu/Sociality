import { Response } from "express";
import Room from "../models/roomModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import suggestionCache from "../utils/cache.js";
import axios from "axios";

// Get intelligent room suggestions for cross-platform chat search
const getChatRoomSuggestions = async (req: any, res: Response) => {
	try {
		const userId = req.user._id;
		const { query } = req.query; // Get search query from query parameters

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ error: "Invalid userId" });
		}

		// Create cache key that includes search query
		const cacheKey = query ? `room_suggestions_${query}` : 'room_suggestions';
		const cachedSuggestions = suggestionCache.get(cacheKey, userId);
		if (cachedSuggestions) {
			return res.status(200).json(cachedSuggestions);
		}

		// Get current user
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Build search filter if query is provided
		let searchFilter = {};
		if (query && query.trim()) {
			searchFilter = {
				$or: [
					{ name: { $regex: query.trim(), $options: "i" } },
					{ roomId: { $regex: query.trim(), $options: "i" } },
					{ description: { $regex: query.trim(), $options: "i" } }
				]
			};
		}

		// Get rooms where user is a participant
		let userRoomsFilter = {
			'participants.user': userId,
			isActive: true
		};
		if (query && query.trim()) {
			userRoomsFilter = { ...userRoomsFilter, ...searchFilter };
		}

		const userRooms = await Room.find(userRoomsFilter)
			.select('roomId name description participants lastActivity messageCount federationSettings')
			.sort({ lastActivity: -1 })
			.limit(5);

		// Get popular federated rooms (most participants, recent activity)
		let popularRoomsFilter = {
			'participants.user': { $ne: userId }, // Exclude rooms user is already in
			'federationSettings.isEnabled': true,
			isActive: true
		};
		if (query && query.trim()) {
			popularRoomsFilter = { ...popularRoomsFilter, ...searchFilter };
		}

		const popularRooms = await Room.find(popularRoomsFilter)
			.select('roomId name description participants lastActivity messageCount federationSettings')
			.sort({
				'participants.length': -1, // Most participants first
				lastActivity: -1 // Most recent activity
			})
			.limit(5);

		// Get recently active rooms (excluding user's rooms)
		let recentRoomsFilter = {
			'participants.user': { $ne: userId },
			'federationSettings.isEnabled': true,
			isActive: true,
			lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
		};
		if (query && query.trim()) {
			recentRoomsFilter = { ...recentRoomsFilter, ...searchFilter };
		}

		const recentRooms = await Room.find(recentRoomsFilter)
			.select('roomId name description participants lastActivity messageCount federationSettings')
			.sort({ lastActivity: -1 })
			.limit(3);

		// If we have a search query, also get direct search results
		let searchResults: any[] = [];
		if (query && query.trim()) {
			searchResults = await Room.find({
				...searchFilter,
				isActive: true,
				'federationSettings.isEnabled': true
			})
			.select('roomId name description participants lastActivity messageCount federationSettings')
			.limit(10);
		}

		// Federated rooms are now private and joined only via code
		let federatedRooms: any[] = [];

		// Helper function to check if room matches search at start
		const startsWithQuery = (room: any, query: string) => {
			if (!query) return false;
			const q = query.toLowerCase();
			return room.name.toLowerCase().startsWith(q) ||
				   room.roomId.toLowerCase().startsWith(q);
		};

		// Combine and prioritize suggestions
		let suggestions: any[] = [];

		if (query && query.trim()) {
			// When searching, prioritize direct search results
			suggestions = [
				...searchResults.map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description,
					participantCount: room.participants.length,
					lastActivity: room.lastActivity,
					messageCount: room.messageCount,
					isParticipant: room.participants.some(p => p.user.toString() === userId.toString()),
					priority: startsWithQuery(room, query) ? 'search_exact' : 'search_contains',
					peers: room.federationSettings?.registeredPeers || []
				})),
				...userRooms.slice(0, 2).map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description,
					participantCount: room.participants.length,
					lastActivity: room.lastActivity,
					messageCount: room.messageCount,
					isParticipant: true,
					priority: 'user_rooms',
					peers: room.federationSettings?.registeredPeers || []
				})),
				...popularRooms.slice(0, 2).map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description,
					participantCount: room.participants.length,
					lastActivity: room.lastActivity,
					messageCount: room.messageCount,
					isParticipant: false,
					priority: 'popular',
					peers: room.federationSettings?.registeredPeers || []
				}))
			];
		} else {
			// When not searching, use original priority
			suggestions = [
				...userRooms.map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description,
					participantCount: room.participants.length,
					lastActivity: room.lastActivity,
					messageCount: room.messageCount,
					isParticipant: true,
					priority: 'user_rooms',
					peers: room.federationSettings?.registeredPeers || []
				})),
				...popularRooms.map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description,
					participantCount: room.participants.length,
					lastActivity: room.lastActivity,
					messageCount: room.messageCount,
					isParticipant: false,
					priority: 'popular',
					peers: room.federationSettings?.registeredPeers || []
				})),
				...recentRooms.map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description,
					participantCount: room.participants.length,
					lastActivity: room.lastActivity,
					messageCount: room.messageCount,
					isParticipant: false,
					priority: 'recent',
					peers: room.federationSettings?.registeredPeers || []
				})),
				...federatedRooms.map(room => ({
					roomId: room.roomId,
					name: room.name,
					description: room.description || '',
					participantCount: room.participantCount || 0,
					lastActivity: room.lastActivity || new Date(),
					messageCount: room.messageCount || 0,
					isParticipant: false,
					priority: 'federated',
					peers: room.peers || []
				}))
			];
		}

		// Remove duplicates based on roomId
		const uniqueSuggestions = suggestions.filter((room, index, self) =>
			index === self.findIndex(r => r.roomId === room.roomId)
		);

		// Sort by priority and activity
		let sortedSuggestions;
		if (query && query.trim()) {
			const priorityOrder = { 'search_exact': 1, 'search_contains': 2, 'user_rooms': 3, 'popular': 4, 'recent': 5, 'federated': 6 };
			sortedSuggestions = uniqueSuggestions.sort((a, b) => {
				const aPriority = priorityOrder[a.priority] || 999;
				const bPriority = priorityOrder[b.priority] || 999;
				if (aPriority !== bPriority) {
					return aPriority - bPriority;
				}
				return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
			});
		} else {
			const priorityOrder = { 'user_rooms': 1, 'popular': 2, 'recent': 3, 'federated': 4 };
			sortedSuggestions = uniqueSuggestions.sort((a, b) => {
				if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
					return priorityOrder[a.priority] - priorityOrder[b.priority];
				}
				return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
			});
		}

		// Limit to 8 suggestions total
		const finalSuggestions = sortedSuggestions.slice(0, 8);

		// Cache the results
		suggestionCache.set(cacheKey, userId, finalSuggestions);

		console.log(`🔍 getChatRoomSuggestions - Returning ${finalSuggestions.length} suggestions for query: "${query}"`);
		console.log('📋 Room suggestions:', finalSuggestions.map(r => ({ name: r.name, roomId: r.roomId, priority: r.priority })));
		res.status(200).json(finalSuggestions);
	} catch (error: any) {
		logger.error("Error in getChatRoomSuggestions", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export {
	getChatRoomSuggestions,
};
