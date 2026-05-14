import { Request, Response } from "express";
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io, sendMessageToUser } from "../socket/socket.js";
import { uploadImage } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

async function sendMessage(req: any, res: Response) {
	try {
		const { recipientId, text, tempId } = req.body;
		let img = req.body.img;
		let gif = req.body.gif;
		let voice = req.body.voice;
		let file = req.body.file;
		let fileName = req.body.fileName;
		let fileSize = req.body.fileSize;
		let emoji = req.body.emoji;
		let voiceDuration = req.body.voiceDuration || req.body.duration;
		const senderId = req.user!._id;

		// Check if a message with this tempId already exists (from socket.io)
		if (tempId) {
			const existingMessage = await Message.findOne({ tempId });
			if (existingMessage) {
				if (img) {
					existingMessage.img = await uploadImage(img);
				}
				if (voice && voice.startsWith('data:')) {
					existingMessage.voice = await uploadImage(voice, {
						resource_type: "auto"
					});
				}
				if (file && file.startsWith('data:')) {
					existingMessage.file = await uploadImage(file, {
						resource_type: "auto"
					});
				}
				await existingMessage.save();
				sendMessageToUser(recipientId, "newMessage", existingMessage);
				sendMessageToUser(senderId, "newMessage", existingMessage);
				return res.status(200).json(existingMessage);
			}
		}

		// Handle multipart (FormData) uploads
		if (req.files) {
			if (req.files.img && req.files.img[0]) {
				img = await uploadImage(req.files.img[0].path);
			}
			if (req.files.gif && req.files.gif[0]) {
				gif = await uploadImage(req.files.gif[0].path);
			}
			if (req.files.voice && req.files.voice[0]) {
				voice = await uploadImage(req.files.voice[0].path, { resource_type: 'auto' });
			}
			if (req.files.file && req.files.file[0]) {
				const fileUpload = req.files.file[0];
				file = await uploadImage(fileUpload.path, {
					resource_type: 'auto',
					folder: 'message_files'
				});
				fileName = fileName || fileUpload.originalname;
				fileSize = fileSize || fileUpload.size;
			}
		}

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, recipientId] },
		});
		if (!conversation) {
			conversation = new Conversation({
				participants: [senderId, recipientId],
				lastMessage: {
					text: text,
					sender: senderId,
				},
			});
			await conversation.save();
		}
		if (img && typeof img === 'string' && img.startsWith('data:')) {
			img = await uploadImage(img);
		}
		if (gif && typeof gif === 'string' && gif.startsWith('data:')) {
			gif = await uploadImage(gif);
		}
		if (voice && typeof voice === 'string' && voice.startsWith('data:')) {
			voice = await uploadImage(voice, {
				resource_type: "auto"
			});
		}
		if (file && typeof file === 'string' && file.startsWith('data:')) {
			file = await uploadImage(file, {
				resource_type: "auto"
			});
		}
		// Check if message has any content (text, media, or emoji)
		const hasContent = (text && text.trim() !== '') || img || gif || voice || file || emoji;
		if (!hasContent) {
			return res.status(400).json({ error: 'Cannot send empty message.' });
		}
		const newMessage = new Message({
			conversationId: conversation._id,
			sender: senderId,
			text: text || "",
			img: img || "",
			gif: gif || "",
			voice: voice || "",
			voiceDuration: voiceDuration || 0,
			file: file || "",
			fileName: fileName || "",
			fileSize: fileSize || 0,
			emoji: emoji || "",
			deletedFor: [],
			deletedForEveryone: false,
			tempId: tempId || undefined,
		});
		await newMessage.save();
		// Create appropriate last message text
		const lastMessageText = text ||
			(file ? `📎 ${fileName || 'File'}` : '') ||
			(img ? '🖼️ Image' : '') ||
			(gif ? '🎬 GIF' : '') ||
			(voice ? '🎤 Voice' : '') ||
			(emoji ? emoji : '');

		conversation.lastMessage = {
			text: lastMessageText,
			sender: senderId,
			seen: false,
		};
		await conversation.save();

		const populatedMessage = await Message.findById(newMessage._id).populate("sender", "username profilePic");

		sendMessageToUser(recipientId, "newMessage", populatedMessage);
		sendMessageToUser(senderId, "newMessage", populatedMessage);
		return res.status(201).json(populatedMessage);
	} catch (error: any) {
		console.error("Error in sendMessage:", error);
		return res.status(500).json({ error: "Failed to send message." });
	}
}

async function getMessages(req: any, res: Response) {
	const { otherUserId } = req.params;
	const userId = req.user!._id;
	const since = req.query.since;

	try {
		const conversation = await Conversation.findOne({
			participants: { $all: [userId, otherUserId] },
		});

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		const query: any = {
			conversationId: conversation._id,
			deletedFor: { $ne: userId },
		};

		if (since) {
			query.createdAt = { $gt: new Date(since) };
		}

		const messages = await Message.find(query).sort({ createdAt: 1 }).populate("sender", "username profilePic");

		if (since && messages.length > 0) {
		}

		res.status(200).json(messages);
	} catch (error: any) {
		console.error("Error fetching messages:", error);
		res.status(500).json({ error: error.message });
	}
}

async function getConversations(req: any, res: Response) {
	if (!req.user || !req.user._id) {
		return res.status(401).json({ error: "Unauthorized: user not authenticated" });
	}
	const userId = req.user!._id;
	try {
		const conversations = await Conversation.find({ participants: userId }).populate({
			path: "participants",
			select: "username profilePic",
		});

		// remove the current user from the participants array
		conversations.forEach((conversation) => {
			conversation.participants = conversation.participants.filter(
				(participant) => participant._id.toString() !== userId.toString()
			);
		});
		res.status(200).json(conversations);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
}

async function deleteMessage(req: any, res: Response) {
	const { messageId } = req.params;
	const { deleteForEveryone } = req.body;
	const userId = req.user!._id;

	try {
		const message = await Message.findById(messageId);

		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Check if this is the user's message
		const isOwnMessage = message.sender.toString() === userId.toString();

		if (deleteForEveryone) {
			// Only message sender can delete for everyone
			if (!isOwnMessage) {
				return res.status(403).json({ error: "You can only delete your own messages for everyone" });
			}

			// Mark as deleted for everyone
			message.deletedForEveryone = true;

			// Notify other user about message deletion
			const conversation = await Conversation.findById(message.conversationId);
			if (conversation) {
				const recipientId = conversation.participants.find(
					(participant) => participant.toString() !== userId.toString()
				);

				if (recipientId) {
					// Use the new sendMessageToUser function
					sendMessageToUser(recipientId, "messageDeleted", {
						messageId: message._id,
						deleteForEveryone: true
					});
				}
			}
		} else {
			// Delete just for this user
			if (!message.deletedFor.includes(userId)) {
				message.deletedFor.push(userId);
			}

			// Emit real-time update for "delete for me" to the current user only
			sendMessageToUser(userId, "messageDeletedForMe", {
				messageId: message._id,
				deleteForEveryone: false
			});
		}

		await message.save();

		res.status(200).json({ success: true, message: "Message deleted successfully" });
	} catch (error: any) {
		console.error("Error deleting message:", error);
		res.status(500).json({ error: error.message });
	}
}

async function toggleStarMessage(req: any, res: Response) {
	const { messageId } = req.params;
	const userId = req.user!._id;

	try {
		const message = await Message.findById(messageId);

		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Update starred status
		message.isStarred = !message.isStarred;
		await message.save();

		res.status(200).json({ success: true, isStarred: message.isStarred });
	} catch (error: any) {
		console.error("Error toggling star message:", error);
		res.status(500).json({ error: error.message });
	}
}

export { sendMessage, getMessages, getConversations, deleteMessage, toggleStarMessage };
