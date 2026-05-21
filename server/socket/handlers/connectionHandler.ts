import { Server, Socket } from "socket.io";
import { addUserSocket, removeUserSocket, userLastSeen, userSocketMap } from "../state.js";
import logger from "../../utils/logger.js";

export const handleConnection = (io: Server, socket: Socket) => {
	logger.socket("User connected", socket.id);
	const userId = socket.handshake.query.userId as string;

	if (userId && userId !== "undefined") {
		const isFirstConnection = !userSocketMap[userId] || userSocketMap[userId].length === 0;
		addUserSocket(userId, socket.id);

		if (isFirstConnection) {
			io.emit("userStatusUpdate", {
				userId,
				status: "online",
				timestamp: new Date().toISOString()
			});
		}

		logger.socket(`User ${userId} connected with socket ${socket.id}`,
			{ totalConnections: userSocketMap[userId].length });

		socket.join(`user:${userId}`);

		io.emit("getOnlineUsers", {
			onlineUsers: Object.keys(userSocketMap),
			lastSeenTimestamps: userLastSeen
		});
	}

	socket.on("verifyConnection", ({ userId }) => {
		socket.emit("connectionVerified", { success: true });
	});

	socket.on("messageReceived", ({ messageId }) => {
		// Log for troubleshooting
	});

	socket.on("disconnect", (reason) => {
		logger.socket("User disconnected", { socketId: socket.id, reason });

		const userIdToUpdate = removeUserSocket(socket.id);

		if (userIdToUpdate) {
			if (!userSocketMap[userIdToUpdate]) {
				const now = new Date().toISOString();
				userLastSeen[userIdToUpdate] = now;
				
				io.emit("userStatusUpdate", {
					userId: userIdToUpdate,
					status: "offline",
					timestamp: now
				});
			}
			
			logger.socket("Updated socket mapping for user", { userId: userIdToUpdate });
			
			if (!userSocketMap[userIdToUpdate]) {
				io.emit("getOnlineUsers", {
					onlineUsers: Object.keys(userSocketMap),
					lastSeenTimestamps: userLastSeen
				});
			}
		}
	});

	socket.on("error", (error) => {
		logger.error("Socket error:", error);
	});
};
