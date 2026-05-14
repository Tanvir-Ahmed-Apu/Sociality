import mongoose, { Document } from "mongoose";

export interface IReply {
	_id: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	text?: string;
	img?: string;
	userProfilePic?: string;
	username?: string;
	createdAt: Date;
	parentReplyId?: mongoose.Types.ObjectId | null;
	likes: mongoose.Types.ObjectId[];
}

export interface IPost {
	postedBy: mongoose.Types.ObjectId;
	text?: string;
	img?: string;
	images: string[];
	likes: mongoose.Types.ObjectId[];
	reposts: mongoose.Types.ObjectId[];
	replies: IReply[];
	createdAt: Date;
	updatedAt: Date;
}

export interface IPostDocument extends IPost, Document {}

const postSchema = new mongoose.Schema<IPostDocument>(
	{
		postedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
			maxLength: 500,
		},
		img: {
			type: String,
		},
		images: {
			type: [String],
			default: [],
		},
		likes: {
			// array of user ids
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],
		},
		reposts: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],
		},
		replies: [
			{
				_id: {
					type: mongoose.Schema.Types.ObjectId,
					auto: true,
					default: () => new mongoose.Types.ObjectId()
				},
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				text: {
					type: String,
					// Removed conditional required - validation handled in controller
				},
				img: {
					type: String,
					// Removed conditional required - validation handled in controller
				},
				userProfilePic: {
					type: String,
				},
				username: {
					type: String,
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
				parentReplyId: {
					type: mongoose.Schema.Types.ObjectId,
					default: null,
				},
				likes: {
					type: [mongoose.Schema.Types.ObjectId],
					ref: "User",
					default: [],
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

const Post = mongoose.model("Post", postSchema);

export default Post;
