import { Server, Socket } from "socket.io";
import Room from "../../../models/roomModel.js";
import logger from "../../../utils/logger.js";

export const handleRooms = (io: Server, socket: Socket) => {
	socket.on("joinRoom", async ({ roomId }) => {
		try {
			const userId = socket.handshake.query.userId as string;
			if (!userId || !roomId) {
				logger.error("Missing userId or roomId for room join");
				return;
			}

			let room = await Room.findOne({ roomId });
			
			if (!room) {
				logger.error(`Attempt to join non-existent room: ${roomId}`);
				socket.emit("roomJoined", { roomId, success: false, error: "Room not found" });
				return;
			}

			if (!room.isParticipant(userId)) {
				logger.warn(`Unauthorized socket room join attempt: user ${userId} for room ${roomId}`);
				socket.emit("roomJoined", { roomId, success: false, error: "Unauthorized: You must join the room first" });
				return;
			}

			socket.join(`room_${roomId}`);

			logger.socket(`User ${userId} joined socket room ${roomId}`);
			socket.emit("roomJoined", { roomId, success: true });
		} catch (error: any) {
			logger.error("Error joining room:", error);
			socket.emit("roomJoined", { roomId, success: false, error: error.message });
		}
	});

	socket.on("leaveRoom", async ({ roomId }) => {
		try {
			const userId = socket.handshake.query.userId as string;
			if (!userId || !roomId) {
				logger.error("Missing userId or roomId for room leave");
				return;
			}

			socket.leave(`room_${roomId}`);

			logger.socket(`User ${userId} left room ${roomId}`);
			socket.emit("roomLeft", { roomId, success: true });
		} catch (error: any) {
			logger.error("Error leaving room:", error);
			socket.emit("roomLeft", { roomId, success: false, error: error.message });
		}
	});

	socket.on("sendRoomMessage", async ({ roomId, message }) => {
		try {
			const userId = socket.handshake.query.userId as string;
			if (!userId || !roomId || !message) {
				logger.error("Missing required data for room message");
				return;
			}

			io.to(`room_${roomId}`).emit("roomMessage", {
				id: Date.now().toString(),
				text: message,
				sender: {
					_id: userId,
					username: "Current User",
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
};
