import mongoose, { Document } from "mongoose";

export interface IMessage {
	conversationId: mongoose.Types.ObjectId;
	sender: mongoose.Types.ObjectId;
	text?: string;
	seen: boolean;
	img: string;
	gif: string;
	voice: string;
	voiceDuration: number;
	file: string;
	fileName: string;
	fileSize: number;
	emoji: string;
	deletedFor: mongoose.Types.ObjectId[];
	deletedForEveryone: boolean;
	tempId?: string;
	isStarred: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new mongoose.Schema<IMessageDocument>(
	{
		conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		text: String,
		seen: {
			type: Boolean,
			default: false,
		},
		img: {
			type: String,
			default: "",
		},
		gif: {
			type: String,
			default: "",
		},
		voice: {
			type: String,
			default: "",
		},
		voiceDuration: {
			type: Number,
			default: 0,
		},
		file: {
			type: String,
			default: "",
		},
		fileName: {
			type: String,
			default: "",
		},
		fileSize: {
			type: Number,
			default: 0,
		},
		emoji: {
			type: String,
			default: "",
		},
		deletedFor: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}],
		deletedForEveryone: {
			type: Boolean,
			default: false
		},
		tempId: {
			type: String,
			index: true // Add index for faster lookups
		},
		isStarred: {
			type: Boolean,
			default: false
		},

	},
	{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
