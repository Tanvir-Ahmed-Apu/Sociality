import mongoose, { Document } from "mongoose";

export interface IConversation {
	participants: mongoose.Types.ObjectId[];
	lastMessage: {
		text?: string;
		sender: mongoose.Types.ObjectId;
		seen: boolean;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface IConversationDocument extends IConversation, Document {}

const conversationSchema = new mongoose.Schema<IConversationDocument>(
	{
		participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		lastMessage: {
			text: String,
			sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			seen: {
				type: Boolean,
				default: false,
			},
		},
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
