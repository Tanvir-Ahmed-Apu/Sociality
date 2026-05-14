import mongoose, { Document, Schema } from 'mongoose';

export interface ITelegramBinding extends Document {
  telegramChatId: string;
  platformRoomId: string;
  createdAt: Date;
  lastValidatedAt: Date;
  isValid: boolean;
  isDynamic: boolean;
  priority: number;
  isPermanent: boolean;
  dynamicRelayEnabled: boolean;
  lastUsedAt: Date;
  createdBy: {
    userId: string;
    username: string;
  };
}

const TelegramBindingSchema = new Schema<ITelegramBinding>({
  telegramChatId: {
    type: String,
    required: true,
    unique: true
  },
  platformRoomId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastValidatedAt: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  },
  isDynamic: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  isPermanent: {
    type: Boolean,
    default: true
  },
  dynamicRelayEnabled: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  }
});

export default mongoose.model<ITelegramBinding>('TelegramBinding', TelegramBindingSchema);
