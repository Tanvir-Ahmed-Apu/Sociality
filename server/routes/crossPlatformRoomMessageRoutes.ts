import express from "express";
import multer from "multer";
import os from "os";
import axios from "axios";
import Room from "../models/roomModel.js";
import CrossPlatformMessage from "../models/crossPlatformMessageModel.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadImage, uploadFile } from "../utils/cloudinary.js";
import { FEDERATION_REGISTRY_URL, PLATFORM_URL } from "../services/crossPlatformHelpers.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});

const router = express.Router({ mergeParams: true });

router.get("/", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit) || 50;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.json({ success: true, messages: [] });
    }

    if (room.settings?.isPrivate) {
      const isParticipant = room.participants.some((p: any) => p.user.toString() === userId.toString());
      if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'Access denied. You must join this room to view messages.' });
      }
    }

    const localMessages = await CrossPlatformMessage.find({
      roomId,
      deletedForEveryone: { $ne: true },
      deletedFor: { $nin: [userId.toString()] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedMessages = localMessages.map(msg => ({
      id: msg.messageId || msg._id.toString(),
      _id: msg.messageId || msg._id.toString(),
      text: msg.text,
      img: msg.img || "",
      file: msg.file || "",
      fileName: msg.fileName || "",
      fileSize: msg.fileSize || 0,
      attachmentType: msg.attachmentType || 'none',
      sender: {
        _id: msg.sender,
        username: msg.senderUsername,
        platform: msg.senderPlatform
      },
      senderUsername: msg.senderUsername,
      senderProfilePic: msg.senderProfilePic || '',
      timestamp: msg.createdAt,
      createdAt: msg.createdAt,
      roomId: msg.roomId,
      platform: msg.platform,
      isFederated: true,
      deletedFor: msg.deletedFor || [],
      deletedForEveryone: msg.deletedForEveryone || false
    }));

    res.json({ success: true, messages: formattedMessages.reverse() });
  } catch (error: any) {
    console.error('Error fetching cross-platform room messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch room messages', message: error.message });
  }
});

router.post("/", protectRoute, upload.fields([
  { name: 'img', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user?._id;
    const username = req.user?.username;
    const displayName = req.user?.name || username;

    const hasText = message && message.trim();
    const hasFiles = req.files && (req.files.img || req.files.file);

    if (!hasText && !hasFiles) {
      return res.status(400).json({ success: false, error: 'Message text or attachment is required' });
    }

    if (!userId || !username) {
      return res.status(400).json({ success: false, error: 'Authentication is required' });
    }

    let img = "";
    let file = "";
    let fileName = "";
    let fileSize = 0;
    let attachmentType = "none";

    if (req.files && req.files.img && req.files.img[0]) {
      const imageFile = req.files.img[0];
      img = await uploadImage(imageFile.path, {
        folder: 'cross_platform_images',
        access_mode: 'public',
        type: 'upload'
      });
      attachmentType = "image";
    }

    if (req.files && req.files.file && req.files.file[0]) {
      const fileUpload = req.files.file[0];
      try {
        const upload = await uploadFile(fileUpload.path, {
          folder: 'cross_platform_files',
          format: fileUpload.mimetype ? fileUpload.mimetype.split('/')[1] : undefined
        });
        file = upload.secure_url;
        fileName = fileUpload.originalname;
        fileSize = fileUpload.size;
        attachmentType = "document";
      } catch (uploadError: any) {
        console.error('Failed to upload file to Cloudinary:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
    }

    const room = await Room.findOne({ roomId });
    if (room && room.settings?.isPrivate) {
      const isParticipant = room.participants.some((p: any) => p.user.toString() === userId.toString());
      if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'Access denied. You must join this room to send messages.' });
      }
    }

    const federatedMessage = {
      from: {
        userId: userId.toString(),
        displayName,
        platform: 'sociality'
      },
      text: message || "",
      img,
      file,
      fileName,
      fileSize,
      attachmentType,
      sentAt: new Date()
    };

    const localMessage = new CrossPlatformMessage({
      roomId,
      sender: userId.toString(),
      senderUsername: displayName,
      senderProfilePic: req.user?.profilePic || '',
      senderPlatform: 'sociality',
      text: message || "",
      img,
      file,
      fileName,
      fileSize,
      attachmentType,
      platform: 'sociality',
      messageId: Date.now().toString()
    });
    await localMessage.save();

    const io = req.app.get('io');
    if (io) {
      const socketMessage = {
        id: localMessage.messageId,
        _id: localMessage.messageId,
        messageId: localMessage.messageId,
        text: message || "",
        img,
        file,
        fileName,
        fileSize,
        attachmentType,
        sender: {
          _id: userId.toString(),
          username: displayName,
          platform: 'sociality'
        },
        senderUsername: displayName,
        senderProfilePic: req.user?.profilePic || '',
        timestamp: localMessage.createdAt.toISOString(),
        roomId,
        isCrossPlatform: true,
        platform: 'sociality'
      };
      io.to(`room_${roomId}`).emit('crossPlatformMessage', socketMessage);
    }

    try {
      const relayResponse = await axios.post(`${FEDERATION_REGISTRY_URL}/federation/relay-message`, {
        roomId,
        message: federatedMessage,
        originatingPlatform: PLATFORM_URL
      });

      res.json({
        success: true,
        message: 'Message sent to cross-platform room',
        localMessage: {
          id: localMessage._id.toString(),
          text: message || "",
          img,
          file,
          fileName,
          fileSize,
          attachmentType,
          sender: {
            _id: userId.toString(),
            username: displayName,
            platform: 'sociality'
          },
          timestamp: localMessage.createdAt.toISOString(),
          roomId,
          platform: 'sociality'
        },
        relayResults: relayResponse.data.results
      });
    } catch (relayError: any) {
      res.json({
        success: true,
        message: 'Message sent locally but failed to relay to other platforms',
        localMessage: {
          id: localMessage._id.toString(),
          text: message || "",
          img,
          file,
          fileName,
          fileSize,
          attachmentType,
          sender: {
            _id: userId.toString(),
            username: displayName,
            platform: 'sociality'
          },
          timestamp: localMessage.createdAt.toISOString(),
          roomId,
          platform: 'sociality'
        },
        relayError: relayError.message
      });
    }
  } catch (error: any) {
    console.error('Error sending cross-platform message:', error);
    res.status(500).json({ success: false, error: 'Failed to send cross-platform message', message: error.message });
  }
});

router.delete("/:messageId", protectRoute, async (req: any, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.user._id.toString();

    let message = await CrossPlatformMessage.findOne({ messageId, roomId });
    if (!message) {
      try {
        message = await CrossPlatformMessage.findOne({ _id: messageId, roomId });
      } catch (_error) {
        // Ignore invalid ObjectId format
      }
    }

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.roomId !== roomId) {
      return res.status(400).json({ success: false, error: 'Message does not belong to this room' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId);
    if (!userParticipant) {
      return res.status(403).json({ success: false, error: 'You must be a member of this room to delete messages' });
    }

    const isOwnMessage = message.sender === userId;

    if (deleteForEveryone) {
      if (!isOwnMessage) {
        return res.status(403).json({ success: false, error: 'You can only delete your own messages for everyone' });
      }

      message.deletedForEveryone = true;
      const io = req.app.get('io');
      if (io) {
        room.participants.forEach((participant: any) => {
          if (participant.user.toString() !== userId) {
            io.to(participant.user.toString()).emit('messageDeleted', {
              messageId: message.messageId || message._id.toString(),
              roomId,
              deleteForEveryone: true
            });
          }
        });
      }
    } else {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('messageDeletedForMe', {
          messageId: message.messageId || message._id.toString(),
          roomId,
          deleteForEveryone: false
        });
      }
    }

    await message.save();
    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cross-platform message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
