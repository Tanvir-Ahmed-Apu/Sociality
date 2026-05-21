import { Server, Socket } from "socket.io";
import Message from "../../../models/messageModel.js";
import Conversation from "../../../models/conversationModel.js";
import logger from "../../../utils/logger.js";
import { getMessageTypeText, isMockConversationId, isValidObjectId } from "../utils.js";
import { getAllSocketIdsForUser } from "../state.js";
import { sendMessageToUser } from "../emitters.js";

export const handleMessages = (io: Server, socket: Socket) => {
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

			const senderId = socket.handshake.query.userId as string;

			if (!senderId || !recipientId) {
				logger.error("Missing sender or recipient ID for socket message");
				return;
			}

			logger.socket(`Socket message from ${senderId} to ${recipientId}`, { tempId });

			if (
				(!message || message.trim() === '') &&
				!img && !gif && !voice && !file && !emoji
			) {
				logger.error("Blocked empty message via socket", { senderId, recipientId });
				return;
			}

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

			const newMessage = new Message({
				conversationId: conversation._id,
				sender: senderId,
				text: message || "",
				img: "",
				gif: gif || "",
				voice: "",
				voiceDuration: voiceDuration || 0,
				file: "",
				fileName: fileName || "",
				fileSize: fileSize || 0,
				emoji: emoji || "",
				tempId: tempId
			});

			await newMessage.save();

			await conversation.updateOne({
				lastMessage: {
					text: message || getMessageTypeText(messageData),
					sender: senderId,
				},
			});

			sendMessageToUser(recipientId, "newMessage", newMessage);
			sendMessageToUser(senderId, "newMessage", newMessage);

			logger.socket(`Real-time message delivered via socket`, { messageId: newMessage._id });
		} catch (error) {
			logger.error("Error handling socket message:", error);
		}
	});

	socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
		try {
			logger.socket("Marking messages as seen", { conversationId, userId });

			if (isMockConversationId(conversationId)) {
				logger.socket("Skipping mark as seen for mock conversation", { conversationId });
				const recipientSocketIds = getAllSocketIdsForUser(userId);
				if (recipientSocketIds.length > 0) {
					recipientSocketIds.forEach(socketId => {
						io.to(socketId).emit("messagesSeen", { conversationId });
					});
				}
				return;
			}

			const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
			if (isUUID) {
				logger.socket("Skipping mark as seen for UUID conversation (temporary)", { conversationId });
				const recipientSocketIds = getAllSocketIdsForUser(userId);
				if (recipientSocketIds.length > 0) {
					recipientSocketIds.forEach(socketId => {
						io.to(socketId).emit("messagesSeen", { conversationId });
					});
				}
				return;
			}

			if (!isValidObjectId(conversationId)) {
				logger.error("Invalid conversationId format", { conversationId, type: typeof conversationId });
				return;
			}

			await Message.updateMany(
				{ conversationId: conversationId, seen: false },
				{ $set: { seen: true } }
			);

			await Conversation.updateOne(
				{ _id: conversationId },
				{ $set: { "lastMessage.seen": true } }
			);

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
};
