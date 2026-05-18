import mongoose from "mongoose";

const federationPeerSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true
		},
		url: {
			type: String,
			required: true,
			trim: true
		},
		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active'
		},
		registeredAt: {
			type: Date,
			default: Date.now
		},
		lastSeen: {
			type: Date,
			default: Date.now
		}
	},
	{ timestamps: true }
);

// Index for efficient queries
federationPeerSchema.index({ name: 1 });

const FederationPeer = mongoose.model("FederationPeer", federationPeerSchema);

export default FederationPeer;
