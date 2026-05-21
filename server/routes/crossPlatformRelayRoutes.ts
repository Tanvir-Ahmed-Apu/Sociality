import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import Room from "../models/roomModel.js";
import CrossPlatformMessage from "../models/crossPlatformMessageModel.js";
import { FEDERATION_REGISTRY_URL } from "../services/crossPlatformHelpers.js";

const router = express.Router();

const storeRelayedMessage = async (roomId: string, message: any, originatingPlatform?: string) => {
  let room = await Room.findOne({ roomId });
  if (!room) {
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000000');
    room = new Room({
      roomId,
      name: `Federated Room ${roomId}`,
      creator: systemUserId,
      participants: [],
      federationSettings: {
        isEnabled: true,
        allowedPlatforms: ['sociality', 'telegram', 'discord'],
        registeredPeers: [],
        lastSyncAt: new Date()
      }
    });
    await room.save();
  }

  const crossPlatformMessage = new CrossPlatformMessage({
    roomId,
    sender: message.from?.userId || message.from?.id || 'unknown',
    senderUsername: message.from?.displayName || message.from?.username || 'Unknown User',
    senderProfilePic: message.from?.profilePic || message.from?.avatar || '',
    senderPlatform: message.from?.platform || 'unknown',
    text: message.text,
    img: message.img || "",
    file: message.file || "",
    fileName: message.fileName || "",
    fileSize: message.fileSize || 0,
    attachmentType: message.attachmentType || 'none',
    platform: message.from?.platform || 'unknown',
    messageId: message.id || Date.now().toString(),
    relayedFrom: originatingPlatform
  });
  await crossPlatformMessage.save();

  room.lastActivity = new Date();
  room.messageCount = (room.messageCount || 0) + 1;
  await room.save();

  return { room, crossPlatformMessage };
};

const emitRelayMessage = (req: any, roomId: string, message: any) => {
  const io = req.app.get('io');
  if (!io) return;

  const socketMessage = {
    id: message.id || Date.now().toString(),
    _id: message.id || Date.now().toString(),
    messageId: message.id || Date.now().toString(),
    text: message.text,
    img: message.img || "",
    file: message.file || "",
    fileName: message.fileName || "",
    fileSize: message.fileSize || 0,
    attachmentType: message.attachmentType || 'none',
    sender: {
      _id: message.from?.userId || message.from?.id || 'unknown',
      username: message.from?.displayName || message.from?.username || 'Unknown User',
      platform: message.from?.platform || 'unknown'
    },
    senderUsername: message.from?.displayName || message.from?.username || 'Unknown User',
    senderProfilePic: message.from?.profilePic || message.from?.avatar || '',
    timestamp: message.sentAt || message.timestamp || new Date().toISOString(),
    roomId,
    isCrossPlatform: true,
    isFederated: true,
    platform: message.from?.platform || 'unknown'
  };

  io.to(`room_${roomId}`).emit('crossPlatformMessage', socketMessage);
};

router.post("/", async (req, res) => {
  try {
    const { roomId, message } = req.body;
    if (!roomId || !message) {
      return res.status(400).json({ success: false, error: 'Room ID and message are required' });
    }

    if (message.from?.platform === 'sociality') {
      return res.json({ success: true, message: 'Message skipped (same platform)' });
    }

    await storeRelayedMessage(roomId, message, req.body.originatingPlatform);
    emitRelayMessage(req, roomId, message);

    res.json({ success: true, message: 'Message relayed to Sociality users' });
  } catch (error: any) {
    console.error('Error handling relayed message:', error);
    res.status(500).json({ success: false, error: 'Failed to handle relayed message', message: error.message });
  }
});

router.post("/direct", async (req, res) => {
  try {
    const { roomId, message, originatingPlatform } = req.body;
    if (!roomId || !message) {
      return res.status(400).json({ success: false, error: 'Room ID and message are required' });
    }

    if (message.from?.platform === 'sociality') {
      return res.json({ success: true, message: 'Message skipped (same platform)' });
    }

    await storeRelayedMessage(roomId, message, originatingPlatform);
    emitRelayMessage(req, roomId, message);

    res.json({ success: true, message: 'Message relayed to Sociality users' });
  } catch (error: any) {
    console.error('Error handling direct relay message:', error);
    res.status(500).json({ success: false, error: 'Failed to handle direct relay message', message: error.message });
  }
});

export default router;
