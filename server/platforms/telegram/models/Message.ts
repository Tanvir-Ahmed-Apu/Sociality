import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;
  from: {
    userId: string;
    displayName: string;
    platform: string;
  };
  text: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'delivered' | 'failed';
  metadata: Record<string, any>;
}

const MessageSchema = new Schema<IMessage>({
  roomId: {
    type: String,
    required: true
  },
  from: {
    userId: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      default: function(this: any) {
        // If no displayName is provided, use userId as fallback
        return this.from?.userId;
      }
    },
    platform: {
      type: String,
      required: true
    }
  },
  text: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'pending', 'delivered', 'failed'],
    default: 'sent'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
