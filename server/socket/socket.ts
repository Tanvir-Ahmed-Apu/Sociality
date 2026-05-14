import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import Room from "../models/roomModel.js";
import logger from "../utils/logger.js";

// Updated to support multiple connections per user
const userSocketMap: Record<string, string[]> = {}; // userId: [socketId1, socketId2, ...]
const userLastSeen: Record<string, string> = {}; // userId: timestamp

// Helper function to determine message type text
const getMessageTypeText = (messageData: any): string => {
	const { img, gif, voice, file, fileName, emoji } = messageData;
	if (img) return "Image";
	if (gif) return "GIF";
	if (voice) return "Voice message";
	if (file) return `File: ${fileName || 'Document'}`;
	if (emoji) return "Emoji";
	return "";
};

// Helper function to validate if a string is a valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
	return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

// Helper function to check if an ID is a mock conversation ID (numeric timestamp)
const isMockConversationId = (id: string | number): boolean => {
	// Mock conversation IDs are created with Date.now(), so they're numeric strings or numbers
	return /^\d+$/.test(String(id)) && !isValidObjectId(String(id));
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.NODE_ENV === "production" 
			? false 
			: [
				"http://localhost:7100", 
				"http://localhost:7101",
				// Allow ngrok URLs
				/^https:\/\/.*\.ngrok\.io$/,
				// Allow custom ngrok domains if using paid plan
				process.env.FRONTEND_URL
			].filter(Boolean),
		methods: ["GET", "POST"],
		credentials: true,
	},
	pingTimeout: 60000, // 1 minute without a pong packet to consider the connection closed
	pingInterval: 25000, // send a ping packet every 25 seconds
	transports: ['websocket', 'polling'],
	allowUpgrades: true,
	maxHttpBufferSize: 5e6, // 5MB for file uploads
	connectTimeout: 30000, // 30 seconds
});


// Get the recipient's socket ID for messaging

export const getRecipientSocketId = (recipientId: string) => {
	return userSocketMap[recipientId] ? userSocketMap[recipientId][0] : null;
};

// Get all socket IDs for a user
const getAllSocketIdsForUser = (userId: string) => {
	return userSocketMap[userId] || [];
};

io.on("connection", (socket) => {
	logger.socket("User connected", socket.id);
	const userId = socket.handshake.query.userId;

	if (userId && userId !== "undefined") {
		// Add this socket to the user's socket list
		if (!userSocketMap[userId]) {
			userSocketMap[userId] = [];

			// Broadcast user coming online to all clients
			io.emit("userStatusUpdate", {
				userId,
				status: "online",
				timestamp: new Date().toISOString()
			});
		}
		userSocketMap[userId].push(socket.id);

		// Log connection but with less verbose output
		logger.socket(`User ${userId} connected with socket ${socket.id}`,
			{ totalConnections: userSocketMap[userId].length });

		// Join a room specific to this user for broadcasting
		socket.join(`user:${userId}`);

		// Broadcast online users and last seen timestamps to all connected clients
		io.emit("getOnlineUsers", {
			onlineUsers: Object.keys(userSocketMap),
			lastSeenTimestamps: userLastSeen
		});
	}

	// Verify connection on request (no need to log each verification)
	socket.on("verifyConnection", ({ userId }) => {
		// Removed logging for routine verifications
		socket.emit("connectionVerified", { success: true });
	});

	// Handle acknowledgment when client receives a message
	socket.on("messageReceived", ({ messageId }) => {
		// Only log for troubleshooting, not in production
		// console.log(`Message ${messageId} received by client ${socket.id}`);
	});

	// Handle real-time message sending via socket
	socket.on("sendMessage", async (messageData) => {
		try {
			const {
				tempId,
				recipientId,
				message,
				img,
				gif,
				voice,
				file,
				fileName,
				fileSize,
				emoji,
				voiceDuration
			} = messageData;

			// Get the sender ID from the socket's query
			const senderId = socket.handshake.query.userId;

			if (!senderId || !recipientId) {
				logger.error("Missing sender or recipient ID for socket message");
				return;
			}

			logger.socket(`Socket message from ${senderId} to ${recipientId}`, { tempId });

			// === [CASCADE PATCH] Prevent sending empty messages via socket ===
			if (
				(!message || message.trim() === '') &&
				!img && !gif && !voice && !file && !emoji
			) {
				logger.error("Blocked empty message via socket", { senderId, recipientId });
				return;
			}
			// === [END PATCH] ===

			// Find or create conversation
			let conversation = await Conversation.findOne({
				participants: { $all: [senderId, recipientId] },
			});

			if (!conversation) {
				conversation = new Conversation({
					participants: [senderId, recipientId],
					lastMessage: {
						text: message || getMessageTypeText(messageData),
						sender: senderId,
					},
				});
				await conversation.save();
			}

			// Create a new message document
			// Note: We're not saving media here - that will be handled by the REST API
			// This is just for immediate real-time delivery
			const newMessage = new Message({
				conversationId: conversation._id,
				sender: senderId,
				text: message || "",
				img: "",  // Don't include media in socket message for performance
				gif: gif || "",  // GIFs are usually URLs so we can include them
				voice: "",
				voiceDuration: voiceDuration || 0,
				file: "",
				fileName: fileName || "",
				fileSize: fileSize || 0,
				emoji: emoji || "",
				tempId: tempId  // Include the tempId for client-side matching
			});

			// Save the message to get an _id
			await newMessage.save();

			// Update conversation's last message
			await conversation.updateOne({
				lastMessage: {
					text: message || getMessageTypeText(messageData),
					sender: senderId,
				},
			});

			// Send the message to the recipient
			sendMessageToUser(recipientId, "newMessage", newMessage);

			// Also send to the sender's other devices
			sendMessageToUser(senderId, "newMessage", newMessage);

			logger.socket(`Real-time message delivered via socket`, { messageId: newMessage._id });
		} catch (error) {
			logger.error("Error handling socket message:", error);
		}
	});

	// Handle marking messages as seen
	socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
		try {
			logger.socket("Marking messages as seen", { conversationId, userId });

			// Check if this is a mock conversation (created with Date.now())
			if (isMockConversationId(conversationId)) {
				logger.socket("Skipping mark as seen for mock conversation", { conversationId });
				// For mock conversations, we don't have actual database records to update
				// Just notify the client that messages were "seen" for UI consistency
				const recipientSocketIds = getAllSocketIdsForUser(userId);
				if (recipientSocketIds.length > 0) {
					recipientSocketIds.forEach(socketId => {
						io.to(socketId).emit("messagesSeen", { conversationId });
					});
				}
				return;
			}

			// Check if conversationId is a UUID format and skip validation
			const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
			if (isUUID) {
				logger.socket("Skipping mark as seen for UUID conversation (temporary)", { conversationId });
				// For UUID conversations, just emit the event for UI consistency
				const recipientSocketIds = getAllSocketIdsForUser(userId);
				if (recipientSocketIds.length > 0) {
					recipientSocketIds.forEach(socketId => {
						io.to(socketId).emit("messagesSeen", { conversationId });
					});
				}
				return;
			}

			// Validate that conversationId is a proper MongoDB ObjectId
			if (!isValidObjectId(conversationId)) {
				logger.error("Invalid conversationId format", { conversationId, type: typeof conversationId });
				return;
			}

			// Update all unseen messages in the conversation
			await Message.updateMany(
				{ conversationId: conversationId, seen: false },
				{ $set: { seen: true } }
			);

			// Update the conversation's last message seen status
			await Conversation.updateOne(
				{ _id: conversationId },
				{ $set: { "lastMessage.seen": true } }
			);

			// Notify the sender that their messages have been seen
			const recipientSocketIds = getAllSocketIdsForUser(userId);
			if (recipientSocketIds.length > 0) {
				logger.socket("Notifying user that messages were seen", { userId });
				recipientSocketIds.forEach(socketId => {
					io.to(socketId).emit("messagesSeen", { conversationId });
				});
			}
		} catch (error) {
			logger.error("Error marking messages as seen:", error);
		}
	});

	// Handle joining cross-platform rooms
	socket.on("joinRoom", async ({ roomId }) => {
		try {
			const userId = socket.handshake.query.userId;
			if (!userId || !roomId) {
				logger.error("Missing userId or roomId for room join");
				return;
			}

			// Find the room in database
			let room = await Room.findOne({ roomId });
			
			if (!room) {
				logger.error(`Attempt to join non-existent room: ${roomId}`);
				socket.emit("roomJoined", { roomId, success: false, error: "Room not found" });
				return;
			}

			// Check if user is a participant
			if (!room.isParticipant(userId)) {
				logger.warn(`Unauthorized socket room join attempt: user ${userId} for room ${roomId}`);
				socket.emit("roomJoined", { roomId, success: false, error: "Unauthorized: You must join the room first" });
				return;
			}

			// Join the socket room for real-time updates ONLY if participant
			socket.join(`room_${roomId}`);

			logger.socket(`User ${userId} joined socket room ${roomId}`);
			socket.emit("roomJoined", { roomId, success: true });
		} catch (error: any) {
			logger.error("Error joining room:", error);
			socket.emit("roomJoined", { roomId, success: false, error: error.message });
		}
	});

	// Handle leaving cross-platform rooms
	socket.on("leaveRoom", async ({ roomId }) => {
		try {
			const userId = socket.handshake.query.userId;
			if (!userId || !roomId) {
				logger.error("Missing userId or roomId for room leave");
				return;
			}

			// Leave the socket room
			socket.leave(`room_${roomId}`);

			logger.socket(`User ${userId} left room ${roomId}`);
			socket.emit("roomLeft", { roomId, success: true });
		} catch (error: any) {
			logger.error("Error leaving room:", error);
			socket.emit("roomLeft", { roomId, success: false, error: error.message });
		}
	});

	// Handle cross-platform room messages
	socket.on("sendRoomMessage", async ({ roomId, message }) => {
		try {
			const userId = socket.handshake.query.userId;
			if (!userId || !roomId || !message) {
				logger.error("Missing required data for room message");
				return;
			}

			// Emit to all users in the room
			io.to(`room_${roomId}`).emit("roomMessage", {
				id: Date.now().toString(),
				text: message,
				sender: {
					_id: userId,
					username: "Current User", // This would be populated from user data
					platform: "sociality"
				},
				timestamp: new Date().toISOString(),
				roomId,
				isCrossPlatform: false
			});

			logger.socket(`Room message sent in ${roomId} by ${userId}`);
		} catch (error) {
			logger.error("Error sending room message:", error);
		}
	});

	// Handle client disconnection
	socket.on("disconnect", (reason) => {
		logger.socket("User disconnected", { socketId: socket.id, reason });

		// Find which user this socket belongs to
		let userIdToUpdate: string | null = null;

		for (const [userId, socketIds] of Object.entries(userSocketMap)) {
			const index = socketIds.indexOf(socket.id);
			if (index !== -1) {
				// Remove this socket from the user's socket list
				userSocketMap[userId].splice(index, 1);
				userIdToUpdate = userId;

				// If this was the user's last socket, remove the user entry and update last seen
				if (userSocketMap[userId].length === 0) {
					delete userSocketMap[userId];

					// Update last seen timestamp
					const now = new Date().toISOString();
					userLastSeen[userId] = now;

					// Broadcast user going offline
					io.emit("userStatusUpdate", {
						userId,
						status: "offline",
						timestamp: now
					});
				}
				break;
			}
		}

		if (userIdToUpdate) {
			logger.socket("Updated socket mapping for user", { userId: userIdToUpdate });
			// Broadcast updated online users list if a user was completely disconnected
			if (!userSocketMap[userIdToUpdate]) {
				io.emit("getOnlineUsers", {
					onlineUsers: Object.keys(userSocketMap),
					lastSeenTimestamps: userLastSeen
				});
			}
		}
	});

	// Handle errors
	socket.on("error", (error) => {
		logger.error("Socket error:", error);
	});
});

// Update the message controller's message sending to use multiple sockets
export const sendMessageToUser = (userId: string, event: string, data: any) => {
	const socketIds = getAllSocketIdsForUser(userId);
	if (socketIds.length > 0) {
		// Log only for important events, not routine ones
		if (event === 'newMessage' || event === 'newReply') {
			logger.socket(`Sending ${event} to user`, { userId, activeConnections: socketIds.length });
		}

		// Try sending to each socket individually
		socketIds.forEach(socketId => {
			// Removed individual socket log messages for production
			try {
				io.to(socketId).emit(event, data);
			} catch (error) {
				logger.error(`Error sending to socket ${socketId}:`, error);
			}
		});

		// Also send to all sockets in the user's room for redundancy
		try {
			io.to(`user:${userId}`).emit(event, data);
		} catch (error) {
			logger.error(`Error broadcasting to user room:`, { userId, error });
		}

		return true;
	}

	// Only log for important events
	if (event === 'newMessage' || event === 'newReply') {
		logger.socket(`No active sockets found for user - ${event} will be missed`, { userId });
	}
	return false;
};

// Function to broadcast a post update to all online users
export const broadcastPostUpdate = (postId: string, data: any) => {
	try {
		logger.socket(`Broadcasting post update`, { postId });
		console.log(`Broadcasting post update for post ${postId}:`, data);

		// Emit to all connected clients
		io.emit('postUpdate', { postId, ...data });

		// Log the number of connected clients
		const connectedSockets = io.sockets.sockets.size;
		console.log(`Post update broadcast to ${connectedSockets} connected clients`);

		return true;
	} catch (error) {
		logger.error(`Error broadcasting post update:`, error);
		console.error(`Error broadcasting post update:`, error);
		return false;
	}
};

// Make io available to other modules
app.set('io', io);

export { io, server, app };
