import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  name: string;
  participants: {
    userId: string;
    joinedAt: Date;
  }[];
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

const RoomSchema = new Schema<IRoom>({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  participants: [{
    userId: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

export default mongoose.model<IRoom>('Room', RoomSchema);
