import mongoose from "mongoose";

const federationRoomSchema = new mongoose.Schema(
	{
		roomId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		name: {
			type: String,
			required: true,
			trim: true
		},
		peers: [{
			type: String
		}],
		messageCount: {
			type: Number,
			default: 0
		},
		createdAt: {
			type: Date,
			default: Date.now
		}
	},
	{ timestamps: true }
);

// Index for efficient queries
federationRoomSchema.index({ roomId: 1 });

const FederationRoom = mongoose.model("FederationRoom", federationRoomSchema);

export default FederationRoom;
