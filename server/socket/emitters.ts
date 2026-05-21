import { io } from "./socket.js";
import { getAllSocketIdsForUser } from "./state.js";
import logger from "../utils/logger.js";

// Send message to all active sockets of a user
export const sendMessageToUser = (userId: string, event: string, data: any) => {
	const socketIds = getAllSocketIdsForUser(userId);
	if (socketIds.length > 0) {
		if (event === 'newMessage' || event === 'newReply') {
			logger.socket(`Sending ${event} to user`, { userId, activeConnections: socketIds.length });
		}

		socketIds.forEach(socketId => {
			try {
				io.to(socketId).emit(event, data);
			} catch (error) {
				logger.error(`Error sending to socket ${socketId}:`, error);
			}
		});

		try {
			io.to(`user:${userId}`).emit(event, data);
		} catch (error) {
			logger.error(`Error broadcasting to user room:`, { userId, error });
		}

		return true;
	}

	if (event === 'newMessage' || event === 'newReply') {
		logger.socket(`No active sockets found for user - ${event} will be missed`, { userId });
	}
	return false;
};

// Broadcast post update to all online users
export const broadcastPostUpdate = (postId: string, data: any) => {
	try {
		logger.socket(`Broadcasting post update`, { postId });
		
		io.emit('postUpdate', { postId, ...data });

		const connectedSockets = io.sockets.sockets.size;
		console.log(`Post update broadcast to ${connectedSockets} connected clients`);

		return true;
	} catch (error) {
		logger.error(`Error broadcasting post update:`, error);
		return false;
	}
};
