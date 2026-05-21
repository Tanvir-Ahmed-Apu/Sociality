import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { getRoomByIdOrRoomId, generateRoomCode, FEDERATION_REGISTRY_URL, PLATFORM_URL } from "../services/crossPlatformHelpers.js";
import Room from "../models/roomModel.js";
import CrossPlatformMessage from "../models/crossPlatformMessageModel.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadImage } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/", protectRoute, async (req: any, res) => {
  try {
    const { name, allowedPlatforms = ['sociality', 'telegram', 'discord'] } = req.body;
    const userId = req.user?._id;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const roomId = uuidv4();
    const roomCode = generateRoomCode();
    const room = new Room({
      roomId,
      roomCode,
      name,
      creator: userId,
      participants: [{ user: userId, role: 'admin' }],
      settings: {
        isPrivate: true,
        requireApproval: false,
        maxParticipants: 100
      },
      federationSettings: {
        isEnabled: true,
        allowedPlatforms,
        registeredPeers: [],
        lastSyncAt: new Date()
      }
    });

    await room.save();

    try {
      await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
        roomId,
        name,
        peerUrl: PLATFORM_URL
      });
    } catch (federationError: any) {
      console.warn('Failed to register room with federation registry:', federationError.message);
    }

    res.status(201).json({ success: true, room });
  } catch (error: any) {
    console.error('Error creating cross-platform room:', error);
    res.status(500).json({ success: false, error: 'Failed to create cross-platform room', message: error.message });
  }
});

router.get("/", protectRoute, async (req: any, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userRooms = await Room.find({
      'federationSettings.isEnabled': true,
      'participants.user': userId
    })
      .populate('creator', 'username name profilePic')
      .lean();

    const formattedRooms = userRooms.map(room => ({
      roomId: room.roomId,
      roomCode: room.roomCode,
      name: room.name,
      groupPhoto: room.groupPhoto,
      creator: room.creator,
      peers: room.federationSettings.registeredPeers || [],
      participantCount: room.participants?.length || 0,
      isPrivate: room.settings?.isPrivate || false,
      lastActivity: room.lastActivity
    }));

    res.json({ success: true, rooms: formattedRooms });
  } catch (error: any) {
    console.error('Error fetching cross-platform rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cross-platform rooms', message: error.message });
  }
});

router.post("/:roomId/join", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;
    const username = req.user?.username;

    if (!userId || !username) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    if (!room) {
      try {
        const response = await axios.get(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
        const federatedRoom = response.data;

        if (federatedRoom) {
          room = new Room({
            roomId,
            name: federatedRoom.name || `Room ${roomId}`,
            creator: new mongoose.Types.ObjectId('000000000000000000000000'),
            participants: [],
            settings: {
              isPrivate: true,
              requireApproval: false,
              maxParticipants: 100
            },
            federationSettings: {
              isEnabled: true,
              allowedPlatforms: ['sociality', 'telegram', 'discord'],
              registeredPeers: federatedRoom.peers || [],
              lastSyncAt: new Date()
            }
          });
        } else {
          return res.status(404).json({ success: false, error: 'Room not found. Please check the room ID.' });
        }
      } catch (_federationError) {
        return res.status(404).json({ success: false, error: 'Room not found. Please check the room ID.' });
      }
    }

    const existingParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!existingParticipant) {
      room.participants.push({ user: userId, role: 'member' });
      await room.save();
    }

    res.json({
      success: true,
      message: 'Successfully joined cross-platform room',
      room: {
        roomId: room.roomId,
        roomCode: room.roomCode,
        name: room.name,
        participantCount: room.participants.length,
        isPrivate: room.settings?.isPrivate || false
      }
    });
  } catch (error: any) {
    console.error('Error joining cross-platform room:', error);
    res.status(500).json({ success: false, error: 'Failed to join cross-platform room', message: error.message });
  }
});

router.post('/:roomId/backfill-profile-pics', protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const messagesToUpdate = await CrossPlatformMessage.find({
      roomId,
      senderPlatform: { $in: ['telegram', 'discord'] },
      $or: [
        { senderProfilePic: { $exists: false } },
        { senderProfilePic: '' },
        { senderProfilePic: null }
      ]
    });

    let updatedCount = 0;
    const userProfileCache = new Map();

    for (const message of messagesToUpdate) {
      const cacheKey = `${message.senderPlatform}-${message.sender}`;
      if (userProfileCache.has(cacheKey)) {
        const profilePic = userProfileCache.get(cacheKey);
        if (profilePic) {
          await CrossPlatformMessage.updateOne({ _id: message._id }, { senderProfilePic: profilePic });
          updatedCount++;
        }
        continue;
      }

      let profilePic = '';
      if (message.senderPlatform === 'telegram') {
        profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderUsername)}&background=0088cc&color=fff&size=256&bold=true`;
      } else if (message.senderPlatform === 'discord') {
        profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderUsername)}&background=5865F2&color=fff&size=256&bold=true`;
      }

      if (profilePic) {
        userProfileCache.set(cacheKey, profilePic);
        await CrossPlatformMessage.updateOne({ _id: message._id }, { senderProfilePic: profilePic });
        updatedCount++;
      }
    }

    res.json({ success: true, message: `Updated ${updatedCount} messages with profile pictures`, totalProcessed: messagesToUpdate.length, updated: updatedCount });
  } catch (error: any) {
    console.error('Error backfilling profile pictures:', error);
    res.status(500).json({ success: false, error: 'Failed to backfill profile pictures' });
  }
});

router.get("/:roomId/details", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let room = await getRoomByIdOrRoomId(roomId, 'participants.user');
    if (!room) {
      room = await getRoomByIdOrRoomId(roomId, 'participants.user');
    }

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const isPrivateRoom = room.settings?.isPrivate;
    if (isPrivateRoom) {
      const userParticipant = room.participants && room.participants.find((p: any) => {
        if (!p || !p.user) return false;
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId.toString();
      });

      if (!userParticipant) {
        return res.status(403).json({ success: false, error: 'You must be a member of this room to view its details' });
      }
    }

    res.json({
      success: true,
      room: {
        _id: room._id,
        roomId: room.roomId,
        roomCode: room.roomCode,
        name: room.name,
        groupPhoto: room.groupPhoto,
        participantCount: room.participants.filter((p: any) => p && p.user).length,
        participants: room.participants.filter((p: any) => p && p.user).map((p: any) => ({
          _id: p.user._id,
          username: p.user.username,
          name: p.user.name,
          profilePic: p.user.profilePic,
          role: p.role,
          joinedAt: p.joinedAt
        })),
        creator: room.creator,
        createdAt: room.createdAt,
        platforms: room.federationSettings?.allowedPlatforms || ['sociality', 'telegram', 'discord']
      }
    });
  } catch (error: any) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch room details', message: error.message });
  }
});

router.get("/:roomId/participants", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const room = await getRoomByIdOrRoomId(roomId, 'participants.user');
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const isPrivateRoom = room.settings?.isPrivate;
    if (isPrivateRoom) {
      const isParticipant = room.participants && room.participants.some((p: any) => {
        if (!p || !p.user) return false;
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId.toString();
      });

      if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'You must be a member of this room to view participants' });
      }
    }

    const socialityParticipantsRaw = room.participants
      .filter((p: any) => p && p.user)
      .map((p: any) => ({
        id: p.user._id.toString(),
        username: p.user.username,
        name: p.user.name,
        profilePic: p.user.profilePic,
        platform: 'sociality',
        role: p.role,
        joinedAt: p.joinedAt,
        isOnline: false
      }));

    const socialityParticipants = socialityParticipantsRaw.filter((participant, index, array) =>
      array.findIndex(p => p.id === participant.id) === index
    );

    const crossPlatformUsers = await CrossPlatformMessage.aggregate([
      { $match: { roomId } },
      {
        $group: {
          _id: { sender: "$sender", platform: "$senderPlatform" },
          username: { $last: "$senderUsername" },
          profilePic: { $last: "$senderProfilePic" },
          lastSeen: { $max: "$createdAt" },
          messageCount: { $sum: 1 }
        }
      },
      { $match: { "_id.platform": { $ne: "sociality" } } },
      { $sort: { lastSeen: -1 } }
    ]);

    const uniqueCrossPlatformParticipants = crossPlatformUsers
      .filter((user: any) => !socialityParticipants.map((p: any) => p.id).includes(user._id.sender))
      .map((user: any) => ({
        id: user._id.sender,
        username: user.username,
        name: user.username,
        profilePic: user.profilePic || '',
        platform: user._id.platform,
        role: 'member',
        joinedAt: null,
        lastSeen: user.lastSeen,
        messageCount: user.messageCount,
        isOnline: false
      }));

    const allParticipants = [...socialityParticipants, ...uniqueCrossPlatformParticipants];

    res.json({
      success: true,
      participants: allParticipants,
      summary: {
        total: allParticipants.length,
        sociality: socialityParticipants.length,
        telegram: uniqueCrossPlatformParticipants.filter((p: any) => p.platform === 'telegram').length,
        discord: uniqueCrossPlatformParticipants.filter((p: any) => p.platform === 'discord').length,
        other: uniqueCrossPlatformParticipants.filter((p: any) => !['telegram', 'discord'].includes(p.platform)).length
      }
    });
  } catch (error: any) {
    console.error('Error fetching room participants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch room participants', message: error.message });
  }
});

router.put("/:roomId/name", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }

    const room = await getRoomByIdOrRoomId(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!userParticipant) {
      return res.status(403).json({ success: false, error: 'You must be a member of this room to update its name' });
    }

    room.name = name.trim();
    await room.save();

    setImmediate(async () => {
      try {
        await axios.put(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`, { name: room.name });
      } catch (federationError: any) {
        console.warn('Failed to update room name in federation registry:', federationError.message);
      }
    });

    res.json({ success: true, name: room.name, message: 'Room name updated successfully' });
  } catch (error: any) {
    console.error('Error updating room name:', error);
    res.status(500).json({ success: false, error: 'Failed to update room name', message: error.message });
  }
});

router.put("/:roomId/photo", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { photo } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!photo) {
      return res.status(400).json({ success: false, error: 'Photo data is required' });
    }

    const room = await getRoomByIdOrRoomId(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!userParticipant) {
      return res.status(403).json({ success: false, error: 'You must be a member of this room to update its photo' });
    }

    const imgUrl = await uploadImage(photo, {
      folder: 'room_photos',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    room.groupPhoto = imgUrl;
    await room.save();

    res.json({ success: true, groupPhoto: room.groupPhoto, message: 'Room photo updated successfully' });
  } catch (error: any) {
    console.error('Error updating room photo:', error);
    res.status(500).json({ success: false, error: 'Failed to update room photo', message: error.message });
  }
});

router.delete("/:roomId", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const room = await getRoomByIdOrRoomId(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!userParticipant) {
      return res.status(403).json({ success: false, error: 'You must be a member of this room to delete it' });
    }

    await CrossPlatformMessage.deleteMany({ roomId });
    try {
      await axios.delete(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
    } catch (federationError: any) {
      console.warn('Failed to remove room from federation registry:', federationError.message);
    }

    await Room.deleteOne({ roomId });
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cross-platform room:', error);
    res.status(500).json({ success: false, error: 'Failed to delete room', message: error.message });
  }
});

export default router;
