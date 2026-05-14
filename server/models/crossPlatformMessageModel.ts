import mongoose from "mongoose";

const crossPlatformMessageSchema = new mongoose.Schema(
	{
		roomId: {
			type: String,
			required: true,
			index: true
		},
		sender: {
			type: String, // User ID from any platform
			required: true
		},
		senderUsername: {
			type: String,
			required: true
		},
		senderProfilePic: {
			type: String,
			default: ""
		},
		senderPlatform: {
			type: String,
			required: true,
			enum: ['sociality', 'telegram', 'discord', 'platform-a', 'platform-b', 'platform-c']
		},
		text: {
			type: String,
			required: false // Allow messages with only attachments
		},
		// Attachment fields
		img: {
			type: String,
			default: ""
		},
		file: {
			type: String,
			default: ""
		},
		fileName: {
			type: String,
			default: ""
		},
		fileSize: {
			type: Number,
			default: 0
		},
		attachmentType: {
			type: String,
			enum: ['image', 'document', 'none'],
			default: 'none'
		},
		platform: {
			type: String,
			required: true,
			enum: ['sociality', 'telegram', 'discord', 'platform-a', 'platform-b', 'platform-c']
		},
		messageId: {
			type: String, // Original message ID from the source platform
			index: true
		},
		relayedFrom: {
			type: String, // URL of the platform that relayed this message
			default: null
		},
		// Delete functionality
		deletedFor: [{
			type: String // User IDs from any platform
		}],
		deletedForEveryone: {
			type: Boolean,
			default: false
		},
		metadata: {
			type: Object,
			default: {}
		},
		isStarred: {
			type: Boolean,
			default: false
		}
	},
	{ timestamps: true }
);

// Index for efficient queries
crossPlatformMessageSchema.index({ roomId: 1, createdAt: -1 });
crossPlatformMessageSchema.index({ sender: 1 });
crossPlatformMessageSchema.index({ senderPlatform: 1 });

const CrossPlatformMessage = mongoose.model("CrossPlatformMessage", crossPlatformMessageSchema);

export default CrossPlatformMessage;
