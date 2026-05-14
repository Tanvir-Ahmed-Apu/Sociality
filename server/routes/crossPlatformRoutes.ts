import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import multer from "multer";
import os from "os";
import Room from "../models/roomModel.js";
import CrossPlatformMessage from "../models/crossPlatformMessageModel.js";
import TelegramBinding from "../models/telegramBindingModel.js";
import DiscordBinding from "../models/discordBindingModel.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadImage, uploadFile, verifyFileAccessibility } from "../utils/cloudinary.js";

const router = express.Router();

// Helper function to generate a short unique room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Health check endpoint for file accessibility
router.post("/files/verify", protectRoute, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const verification = await verifyFileAccessibility(url);

    res.json({
      success: true,
      verification
    });
  } catch (error: any) {
    console.error('File verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify file accessibility'
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// Use OS temp directory for cross-platform compatibility
		cb(null, os.tmpdir())
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 50 * 1024 * 1024 // 50MB limit for cross-platform messages
	},
	fileFilter: function (req, file, cb) {
		// Accept all file types for cross-platform messages
		cb(null, true);
	}
});

// Federation Registry URL
const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://localhost:7300';
const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:5000';

// Register platform with federation registry
const registerWithFederation = async () => {
  try {
    await axios.post(`${FEDERATION_REGISTRY_URL}/federation/peers`, {
      name: 'sociality',
      url: PLATFORM_URL
    });
    console.log('✅ Registered with federation registry');
  } catch (error: any) {
    console.warn('⚠️ Failed to register with federation registry:', error.message);
  }
};

// Create a cross-platform room with UUID
router.post("/rooms", protectRoute, async (req: any, res) => {
  try {
    const { name, allowedPlatforms = ['sociality', 'telegram', 'discord'] } = req.body;
    const userId = req.user?._id;
    const username = req.user?.username;

    console.log('Creating cross-platform room:', { name, userId, username, allowedPlatforms });

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Generate UUID for cross-platform room
    const roomId = uuidv4();
    const roomCode = generateRoomCode();

    // Create room in local database (private by default)
    const room = new Room({
      roomId,
      roomCode,
      name,
      creator: userId,
      participants: userId ? [{ user: userId, role: 'admin' }] : [],
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
    console.log('Room saved to database:', { roomId, name, creator: userId });

    // Register room with federation registry
    try {
      const federationResponse = await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
        roomId,
        name,
        peerUrl: PLATFORM_URL
      });
      console.log('Room registered with federation registry:', federationResponse.data);
    } catch (federationError: any) {
      console.warn('Failed to register room with federation registry:', federationError.message);
    }

    const responseData = {
      success: true,
      room: {
        roomId,
        roomCode,
        name,
        creator: userId,
        federationSettings: room.federationSettings
      }
    };

    console.log('Sending room creation response:', responseData);
    res.status(201).json(responseData);
  } catch (error: any) {
    console.error('Error creating cross-platform room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cross-platform room',
      message: error.message
    });
  }
});

// Get cross-platform rooms for authenticated user
router.get("/rooms", protectRoute, async (req: any, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get local rooms where user is a participant and federation is enabled
    const userRooms = await Room.find({
      'federationSettings.isEnabled': true,
      'participants.user': userId
    })
      .populate('creator', 'username name profilePic')
      .lean();

    // Format rooms for response
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

    res.json({
      success: true,
      rooms: formattedRooms
    });
  } catch (error: any) {
    console.error('Error fetching cross-platform rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cross-platform rooms',
      message: error.message
    });
  }
});

// Join a cross-platform room by room ID
router.post("/rooms/:roomId/join", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;
    const username = req.user?.username;

    if (!userId || !username) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find the room locally first (by roomCode only for security)
    let room = await Room.findOne({ 
      roomCode: roomId.toUpperCase()
    });

    if (!room) {
      // For private rooms, we need to check if the room exists elsewhere
      // Try to get room info from federation registry
      try {
        const response = await axios.get(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
        const federatedRoom = response.data;

        if (federatedRoom) {
          // Create a local copy of the federated room
          room = new Room({
            roomId,
            name: federatedRoom.name || `Room ${roomId}`,
            creator: new mongoose.Types.ObjectId('000000000000000000000000'), // System user for federated rooms
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
          return res.status(404).json({
            success: false,
            error: 'Room not found. Please check the room ID.'
          });
        }
      } catch (federationError) {
        return res.status(404).json({
          success: false,
          error: 'Room not found. Please check the room ID.'
        });
      }
    }

    // Check if user is already a participant
    const existingParticipant = room.participants.find(p => p.user.toString() === userId.toString());
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
    res.status(500).json({
      success: false,
      error: 'Failed to join cross-platform room',
      message: error.message
    });
  }
});

// Backfill profile pictures for existing cross-platform users
router.post('/rooms/:roomId/backfill-profile-pics', protectRoute, async (req, res) => {
  try {
    const { roomId } = req.params;

    console.log(`🔄 Starting profile picture backfill for room: ${roomId}`);

    // Get all cross-platform messages without profile pictures
    const messagesToUpdate = await CrossPlatformMessage.find({
      roomId,
      senderPlatform: { $in: ['telegram', 'discord'] },
      $or: [
        { senderProfilePic: { $exists: false } },
        { senderProfilePic: '' },
        { senderProfilePic: null }
      ]
    });

    console.log(`📊 Found ${messagesToUpdate.length} messages to update`);

    let updatedCount = 0;
    const userProfileCache = new Map();

    for (const message of messagesToUpdate) {
      const cacheKey = `${message.senderPlatform}-${message.sender}`;

      if (userProfileCache.has(cacheKey)) {
        // Use cached profile picture
        const profilePic = userProfileCache.get(cacheKey);
        if (profilePic) {
          await CrossPlatformMessage.updateOne(
            { _id: message._id },
            { senderProfilePic: profilePic }
          );
          updatedCount++;
        }
        continue;
      }

      let profilePic = '';

      if (message.senderPlatform === 'telegram') {
        // Create a nice avatar for Telegram users
        profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderUsername)}&background=0088cc&color=fff&size=256&bold=true`;
      } else if (message.senderPlatform === 'discord') {
        // Create a nice avatar for Discord users
        profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderUsername)}&background=5865F2&color=fff&size=256&bold=true`;
      }

      if (profilePic) {
        userProfileCache.set(cacheKey, profilePic);
        await CrossPlatformMessage.updateOne(
          { _id: message._id },
          { senderProfilePic: profilePic }
        );
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} messages with profile pictures`);

    res.json({
      success: true,
      message: `Updated ${updatedCount} messages with profile pictures`,
      totalProcessed: messagesToUpdate.length,
      updated: updatedCount
    });

  } catch (error: any) {
    console.error('Error backfilling profile pictures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to backfill profile pictures'
    });
  }
});

// Get room details
router.get("/rooms/:roomId/details", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;

    console.log('Room details request - User:', req.user ? 'authenticated' : 'not authenticated', 'UserId:', userId, 'RoomId:', roomId);

    if (!userId) {
      console.log('No userId found, req.user:', req.user);
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find the room by roomId or _id (handle both UUID and ObjectId formats)
    let room;
    try {
      // Try to find by roomId first (UUID format)
      room = await Room.findOne({ roomId: roomId }).populate('participants.user', 'username name profilePic');

      // If not found and roomId looks like a valid ObjectId, try _id
      if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
        room = await Room.findOne({ _id: roomId }).populate('participants.user', 'username name profilePic');
      }
    } catch (error: any) {
      console.error('Error finding room:', error);
      // If there's an error with ObjectId casting, just try roomId
      room = await Room.findOne({ roomId: roomId }).populate('participants.user', 'username name profilePic');
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    console.log('Room found:', {
      roomId: room.roomId,
      name: room.name,
      participantCount: room.participants?.length,
      isFederated: room.federationSettings?.isEnabled,
      isPrivate: room.settings?.isPrivate
    });

    // For federated rooms, be very lenient with access control
    // Only check for private rooms, allow access to all federated rooms otherwise
    const isFederatedRoom = room.federationSettings && room.federationSettings.isEnabled;
    const isPrivateRoom = room.settings && room.settings.isPrivate;

    console.log('Access control check:', { isFederatedRoom, isPrivateRoom });

    if (isPrivateRoom) {
      // Only check participant membership for private rooms
      const userParticipant = room.participants && room.participants.find(p => {
        if (!p || !p.user) return false;
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId.toString();
      });

      if (!userParticipant) {
        console.log('User not a participant in private room. Room participants:', room.participants?.map(p => p.user));
        return res.status(403).json({
          success: false,
          error: 'You must be a member of this room to view its details'
        });
      }
    }
    // For non-private federated rooms, allow access to any authenticated user

    res.json({
      success: true,
      room: {
        _id: room._id,
        roomId: room.roomId,
        roomCode: room.roomCode,
        name: room.name,
        groupPhoto: room.groupPhoto,
        participantCount: room.participants.filter(p => p && p.user).length,
        participants: room.participants.filter(p => p && p.user).map(p => ({
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room details',
      message: error.message
    });
  }
});

// Get comprehensive participants from all platforms
router.get("/rooms/:roomId/participants", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;

    console.log('Participants request - User:', req.user ? 'authenticated' : 'not authenticated', 'UserId:', userId, 'RoomId:', roomId);

    if (!userId) {
      console.log('No userId found in participants endpoint, req.user:', req.user);
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find the room
    let room;
    try {
      room = await Room.findOne({ roomId: roomId }).populate('participants.user', 'username name profilePic');
      if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
        room = await Room.findOne({ _id: roomId }).populate('participants.user', 'username name profilePic');
      }
    } catch (error: any) {
      console.error('Error finding room:', error);
      room = await Room.findOne({ roomId: roomId }).populate('participants.user', 'username name profilePic');
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    console.log('Participants - Room found:', {
      roomId: room.roomId,
      name: room.name,
      participantCount: room.participants?.length,
      isFederated: room.federationSettings?.isEnabled,
      isPrivate: room.settings?.isPrivate
    });

    // For federated rooms, be very lenient with access control
    // Only check for private rooms, allow access to all federated rooms otherwise
    const isFederatedRoom = room.federationSettings && room.federationSettings.isEnabled;
    const isPrivateRoom = room.settings && room.settings.isPrivate;

    console.log('Participants - Access control check:', { isFederatedRoom, isPrivateRoom });

    if (isPrivateRoom) {
      // Only check participant membership for private rooms
      const isParticipant = room.participants && room.participants.some(p => {
        if (!p || !p.user) return false;
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId.toString();
      });

      if (!isParticipant) {
        console.log('User not a participant in private room (participants endpoint). Room participants:', room.participants?.map(p => p.user));
        return res.status(403).json({
          success: false,
          error: 'You must be a member of this room to view participants'
        });
      }
    }
    // For non-private federated rooms, allow access to any authenticated user

    // Get Sociality participants with null safety and deduplication
    const socialityParticipantsRaw = room.participants
      .filter(p => p && p.user) // Filter out null/undefined participants
      .map(p => ({
        id: p.user._id.toString(),
        username: p.user.username,
        name: p.user.name,
        profilePic: p.user.profilePic,
        platform: 'sociality',
        role: p.role,
        joinedAt: p.joinedAt,
        isOnline: false // Will be updated by socket status
      }));

    // Debug: Check for duplicates in raw Sociality participants
    console.log('Raw Sociality participants before deduplication:');
    socialityParticipantsRaw.forEach((p, index) => {
      console.log(`  ${index}: ${p.username} (${p.id})`);
    });

    // Deduplicate Sociality participants by user ID
    const socialityParticipants = socialityParticipantsRaw.filter((participant, index, array) =>
      array.findIndex(p => p.id === participant.id) === index
    );

    console.log('Deduplicated Sociality participants:');
    socialityParticipants.forEach((p, index) => {
      console.log(`  ${index}: ${p.username} (${p.id})`);
    });

    // Get unique cross-platform users from recent messages
    const crossPlatformUsers = await CrossPlatformMessage.aggregate([
      { $match: { roomId: roomId } },
      {
        $group: {
          _id: {
            sender: "$sender",
            platform: "$senderPlatform"
          },
          username: { $last: "$senderUsername" },
          profilePic: { $last: "$senderProfilePic" },
          lastSeen: { $max: "$createdAt" },
          messageCount: { $sum: 1 }
        }
      },
      { $match: { "_id.platform": { $ne: "sociality" } } },
      { $sort: { lastSeen: -1 } }
    ]);

    // Format cross-platform participants
    const crossPlatformParticipants = crossPlatformUsers.map(user => ({
      id: user._id.sender,
      username: user.username,
      name: user.username, // Use username as name for cross-platform users
      profilePic: user.profilePic || '', // Include profile pic from messages
      platform: user._id.platform,
      role: 'member',
      joinedAt: null, // Not tracked for cross-platform users
      lastSeen: user.lastSeen,
      messageCount: user.messageCount,
      isOnline: false
    }));

    // Get Sociality user IDs to avoid duplicates
    const socialityUserIds = socialityParticipants.map(p => p.id);

    // Filter out cross-platform users who are already in Sociality participants
    // This prevents Sociality users from appearing twice
    const uniqueCrossPlatformParticipants = crossPlatformParticipants.filter(p =>
      !socialityUserIds.includes(p.id)
    );

    // Combine all participants (no duplicates)
    const allParticipants = [...socialityParticipants, ...uniqueCrossPlatformParticipants];

    // Debug participant data
    console.log('Final participants data:');
    allParticipants.forEach(p => {
      console.log(`- ${p.username} (${p.platform}): profilePic = ${p.profilePic || 'none'}`);
    });

    res.json({
      success: true,
      participants: allParticipants,
      summary: {
        total: allParticipants.length,
        sociality: socialityParticipants.length,
        telegram: uniqueCrossPlatformParticipants.filter(p => p.platform === 'telegram').length,
        discord: uniqueCrossPlatformParticipants.filter(p => p.platform === 'discord').length,
        other: uniqueCrossPlatformParticipants.filter(p => !['telegram', 'discord'].includes(p.platform)).length
      }
    });
  } catch (error: any) {
    console.error('Error fetching room participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room participants',
      message: error.message
    });
  }
});

// Update room name
router.put("/rooms/:roomId/name", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    // Find the room by roomId or _id (handle both UUID and ObjectId formats)
    let room;
    try {
      // Try to find by roomId first (UUID format)
      room = await Room.findOne({ roomId: roomId });

      // If not found and roomId looks like a valid ObjectId, try _id
      if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
        room = await Room.findOne({ _id: roomId });
      }
    } catch (error: any) {
      console.error('Error finding room:', error);
      // If there's an error with ObjectId casting, just try roomId
      room = await Room.findOne({ roomId: roomId });
    }
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if user is a participant in the room
    const userParticipant = room.participants.find(p => p.user.toString() === userId.toString());
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You must be a member of this room to update its name'
      });
    }

    // Update room name
    room.name = name.trim();
    await room.save();

    // Update federation registry (non-blocking)
    setImmediate(async () => {
      try {
        await axios.put(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`, {
          name: room.name
        });
        console.log('Room name updated in federation registry');
      } catch (federationError: any) {
        console.warn('Failed to update room name in federation registry:', federationError.message);
      }
    });

    res.json({
      success: true,
      name: room.name,
      message: 'Room name updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating room name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update room name',
      message: error.message
    });
  }
});

// Update room photo
router.put("/rooms/:roomId/photo", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { photo } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!photo) {
      return res.status(400).json({
        success: false,
        error: 'Photo data is required'
      });
    }

    // Find the room by roomId or _id (handle both UUID and ObjectId formats)
    let room;
    try {
      // Try to find by roomId first (UUID format)
      room = await Room.findOne({ roomId: roomId });

      // If not found and roomId looks like a valid ObjectId, try _id
      if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
        room = await Room.findOne({ _id: roomId });
      }
    } catch (error: any) {
      console.error('Error finding room:', error);
      // If there's an error with ObjectId casting, just try roomId
      room = await Room.findOne({ roomId: roomId });
    }
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if user is a participant in the room
    const userParticipant = room.participants.find(p => p.user.toString() === userId.toString());
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You must be a member of this room to update its photo'
      });
    }

    // Upload photo to Cloudinary
    const imgUrl = await uploadImage(photo, {
      folder: 'room_photos',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Update room photo
    room.groupPhoto = imgUrl;
    await room.save();

    res.json({
      success: true,
      groupPhoto: room.groupPhoto,
      message: 'Room photo updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating room photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update room photo',
      message: error.message
    });
  }
});

// Delete a cross-platform room
router.delete("/rooms/:roomId", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find the room by roomId or _id (handle both UUID and ObjectId formats)
    let room;
    try {
      // Try to find by roomId first (UUID format)
      room = await Room.findOne({ roomId: roomId });

      // If not found and roomId looks like a valid ObjectId, try _id
      if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
        room = await Room.findOne({ _id: roomId });
      }
    } catch (error: any) {
      console.error('Error finding room:', error);
      // If there's an error with ObjectId casting, just try roomId
      room = await Room.findOne({ roomId: roomId });
    }
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if user is a participant in the room
    const userParticipant = room.participants.find(p => p.user.toString() === userId.toString());
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You must be a member of this room to delete it'
      });
    }

    // Delete all messages in the room
    await CrossPlatformMessage.deleteMany({ roomId });

    // Remove room from federation registry
    try {
      await axios.delete(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
      console.log('Room removed from federation registry');
    } catch (federationError: any) {
      console.warn('Failed to remove room from federation registry:', federationError.message);
    }

    // Delete the room
    await Room.deleteOne({ roomId });

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting cross-platform room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete room',
      message: error.message
    });
  }
});

// Get messages from a cross-platform room
router.get("/rooms/:roomId/messages", protectRoute, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit) || 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find the room locally
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.json({
        success: true,
        messages: []
      });
    }

    // Check if user is a participant in private rooms
    if (room.settings?.isPrivate) {
      const isParticipant = room.participants.some(p => p.user.toString() === userId.toString());
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You must join this room to view messages.'
        });
      }
    }

    // Get local cross-platform messages for this room, excluding deleted ones
    const localMessages = await CrossPlatformMessage.find({
      roomId,
      deletedForEveryone: { $ne: true }, // Exclude messages deleted for everyone
      deletedFor: { $nin: [userId.toString()] } // Exclude messages deleted for this user
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Transform messages to a consistent format
    const formattedMessages = localMessages.map(msg => ({
      id: msg.messageId || msg._id.toString(), // Use messageId for cross-platform compatibility
      _id: msg.messageId || msg._id.toString(), // Add _id for compatibility
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
      createdAt: msg.createdAt, // Add createdAt for compatibility
      roomId: msg.roomId,
      platform: msg.platform,
      isFederated: true,
      deletedFor: msg.deletedFor || [],
      deletedForEveryone: msg.deletedForEveryone || false
    }));

    res.json({
      success: true,
      messages: formattedMessages.reverse() // Return in chronological order
    });
  } catch (error: any) {
    console.error('Error fetching cross-platform room messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room messages',
      message: error.message
    });
  }
});

// Send message to cross-platform room
router.post("/rooms/:roomId/messages", protectRoute, upload.fields([
	{ name: 'img', maxCount: 1 },
	{ name: 'file', maxCount: 1 }
]), async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user?._id;
    const username = req.user?.username;
    const displayName = req.user?.name || username;

    console.log(`Sending cross-platform message to room ${roomId}:`, { message, userId, username, displayName });
    console.log('Files received:', req.files);

    // Check if we have either message text or attachments
    const hasText = message && message.trim();
    const hasFiles = req.files && (req.files.img || req.files.file);

    if (!hasText && !hasFiles) {
      return res.status(400).json({
        success: false,
        error: 'Message text or attachment is required'
      });
    }

    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        error: 'Authentication is required'
      });
    }

    // Handle file uploads
    let img = "";
    let file = "";
    let fileName = "";
    let fileSize = 0;
    let attachmentType = "none";

    // Process image upload
    if (req.files && req.files.img && req.files.img[0]) {
      const imageFile = req.files.img[0];
      img = await uploadImage(imageFile.path, {
        folder: 'cross_platform_images',
        access_mode: 'public', // Make images publicly accessible
        type: 'upload'
      });
      attachmentType = "image";
      console.log('Image uploaded to Cloudinary:', img);
    }

    // Process file upload
    if (req.files && req.files.file && req.files.file[0]) {
      const fileUpload = req.files.file[0];

      try {
        const upload = await uploadFile(fileUpload.path, {
          folder: 'cross_platform_files',
          // Ensure proper content type detection
          format: fileUpload.mimetype ? fileUpload.mimetype.split('/')[1] : undefined
        });

        file = upload.secure_url;
        fileName = fileUpload.originalname;
        fileSize = fileUpload.size;
        attachmentType = "document";
        console.log('File uploaded to Cloudinary successfully:', {
          url: file,
          fileName,
          fileSize,
          publicId: upload.public_id,
          format: upload.format
        });

      } catch (uploadError: any) {
        console.error('Failed to upload file to Cloudinary:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
    }

    // Check if user has access to this room
    const room = await Room.findOne({ roomId });
    if (room && room.settings?.isPrivate) {
      const isParticipant = room.participants.some(p => p.user.toString() === userId.toString());
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You must join this room to send messages.'
        });
      }
    }

    // Prepare message for federation
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

    // Store the message locally first
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
    console.log(`Saved local message:`, localMessage);

    // Emit the message to connected Sociality users immediately via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const socketMessage = {
        id: localMessage.messageId,
        _id: localMessage.messageId, // Add _id for frontend compatibility
        messageId: localMessage.messageId, // Add messageId for cross-platform compatibility
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

      console.log(`Emitting crossPlatformMessage to room_${roomId}:`, socketMessage);
      io.to(`room_${roomId}`).emit('crossPlatformMessage', socketMessage);
    } else {
      console.warn('Socket.IO instance not available');
    }

    // Note: Removed direct platform relay to prevent duplicate messages
    // All cross-platform communication now goes through federation registry only

    // Send to federation registry for relay to other platforms
    try {
      console.log(`🔍 Sending to federation registry - federatedMessage:`, JSON.stringify(federatedMessage, null, 2));

      const relayResponse = await axios.post(`${FEDERATION_REGISTRY_URL}/federation/relay-message`, {
        roomId,
        message: federatedMessage,
        originatingPlatform: PLATFORM_URL
      });

      console.log(`✅ Federation relay response:`, relayResponse.data);

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
      console.error('Failed to relay message:', relayError.message);

      // Still return success since local message was saved and emitted
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
    res.status(500).json({
      success: false,
      error: 'Failed to send cross-platform message',
      message: error.message
    });
  }
});

// Relay endpoint for receiving messages from federation registry
router.post("/relay", async (req, res) => {
  try {
    const { roomId, message } = req.body;

    if (!roomId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and message are required'
      });
    }

    console.log(`📨 Received relayed message for room ${roomId} from ${message.from?.platform || 'unknown platform'}`);

    // Skip if message is from Sociality to avoid loops
    if (message.from?.platform === 'sociality') {
      console.log('⏭️ Skipping message from Sociality to avoid loop');
      return res.json({ success: true, message: 'Message skipped (same platform)' });
    }

    // Find the room
    let room = await Room.findOne({ roomId });

    if (!room) {
      // Create a local copy of the federated room if it doesn't exist
      // Use a system user ID for cross-platform rooms
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

    // Store the message locally with flexible field mapping
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
      relayedFrom: req.body.originatingPlatform
    });
    await crossPlatformMessage.save();

    // Update room's last activity
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await room.save();

    // Emit the message to connected Sociality users via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const socketMessage = {
        id: message.id || Date.now().toString(),
        _id: message.id || Date.now().toString(), // Add _id for frontend compatibility
        messageId: message.id || Date.now().toString(), // Add messageId for cross-platform compatibility
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

      console.log(`🔄 Emitting crossPlatformMessage to room_${roomId} from ${message.from?.platform}:`, socketMessage);
      io.to(`room_${roomId}`).emit('crossPlatformMessage', socketMessage);
    } else {
      console.warn('⚠️ Socket.IO instance not available for message relay');
    }

    res.json({
      success: true,
      message: 'Message relayed to Sociality users'
    });
  } catch (error: any) {
    console.error('Error handling relayed message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle relayed message',
      message: error.message
    });
  }
});

// Cross-platform relay endpoint for direct platform-to-platform communication
router.post("/relay-direct", async (req, res) => {
  try {
    const { roomId, message, originatingPlatform } = req.body;

    if (!roomId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and message are required'
      });
    }

    console.log(`📨 Received direct relay message for room ${roomId} from ${message.from?.platform || 'unknown platform'}`);

    // Skip if message is from Sociality to avoid loops
    if (message.from?.platform === 'sociality') {
      console.log('⏭️ Skipping message from Sociality to avoid loop');
      return res.json({ success: true, message: 'Message skipped (same platform)' });
    }

    // Find the room
    let room = await Room.findOne({ roomId });

    if (!room) {
      // Create a local copy of the federated room if it doesn't exist
      // Use a system user ID for cross-platform rooms
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

    // Store the message locally with flexible field mapping
    const crossPlatformMessage = new CrossPlatformMessage({
      roomId,
      sender: message.from?.userId || message.from?.id || 'unknown',
      senderUsername: message.from?.displayName || message.from?.username || 'Unknown User',
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

    // Update room's last activity
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await room.save();

    // Emit the message to connected Sociality users via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const socketMessage = {
        id: message.id || Date.now().toString(),
        _id: message.id || Date.now().toString(), // Add _id for frontend compatibility
        messageId: message.id || Date.now().toString(), // Add messageId for cross-platform compatibility
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

      console.log(`🔄 Emitting crossPlatformMessage to room_${roomId} from ${message.from?.platform}:`, socketMessage);
      io.to(`room_${roomId}`).emit('crossPlatformMessage', socketMessage);
    } else {
      console.warn('⚠️ Socket.IO instance not available for message relay');
    }

    res.json({
      success: true,
      message: 'Message relayed to Sociality users'
    });
  } catch (error: any) {
    console.error('Error handling direct relay message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle direct relay message',
      message: error.message
    });
  }
});

// Get Telegram binding for a room
router.get("/rooms/:roomId/telegram", async (req, res) => {
  try {
    const { roomId } = req.params;

    const binding = await TelegramBinding.findByRoomId(roomId);

    if (!binding) {
      return res.json({
        success: true,
        bound: false,
        message: 'No Telegram chat bound to this room'
      });
    }

    res.json({
      success: true,
      bound: true,
      binding: {
        telegramChatId: binding.telegramChatId,
        telegramChatType: binding.telegramChatType,
        telegramChatTitle: binding.telegramChatTitle,
        createdAt: binding.createdAt,
        messageCount: binding.messageCount,
        lastMessageAt: binding.lastMessageAt,
        createdBy: binding.createdBy
      }
    });
  } catch (error: any) {
    console.error('Error getting Telegram binding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Telegram binding',
      message: error.message
    });
  }
});

// Get all Telegram bindings (admin endpoint)
router.get("/telegram/bindings", protectRoute, async (req, res) => {
  try {
    const bindings = await TelegramBinding.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      bindings: bindings.map(binding => ({
        roomId: binding.roomId,
        telegramChatId: binding.telegramChatId,
        telegramChatType: binding.telegramChatType,
        telegramChatTitle: binding.telegramChatTitle,
        createdAt: binding.createdAt,
        messageCount: binding.messageCount,
        lastMessageAt: binding.lastMessageAt,
        createdBy: binding.createdBy
      }))
    });
  } catch (error: any) {
    console.error('Error getting Telegram bindings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Telegram bindings',
      message: error.message
    });
  }
});

// Delete message endpoint
router.delete('/rooms/:roomId/messages/:messageId', protectRoute, async (req: any, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.user._id.toString();

    // Find the message by messageId field OR MongoDB _id (for compatibility)
    let message = await CrossPlatformMessage.findOne({
      messageId: messageId,
      roomId: roomId
    });

    // If not found by messageId, try finding by MongoDB _id
    if (!message) {
      try {
        message = await CrossPlatformMessage.findOne({
          _id: messageId,
          roomId: roomId
        });
      } catch (error: any) {
        // Invalid ObjectId format, continue with original error
      }
    }

    if (!message) {
      console.log(`Message not found with ID: ${messageId} in room: ${roomId}`);
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if message belongs to this room
    if (message.roomId !== roomId) {
      return res.status(400).json({
        success: false,
        error: 'Message does not belong to this room'
      });
    }

    // Check if user is a participant in the room
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const userParticipant = room.participants.find(p => p.user.toString() === userId);
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You must be a member of this room to delete messages'
      });
    }

    // Check if this is the user's message for "delete for everyone"
    const isOwnMessage = message.sender === userId;

    if (deleteForEveryone) {
      // Only message sender can delete for everyone
      if (!isOwnMessage) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own messages for everyone'
        });
      }

      // Mark as deleted for everyone
      message.deletedForEveryone = true;

      // Notify other participants about message deletion via socket
      const io = req.app.get('io');
      if (io) {
        // Emit to all users in the room except the sender
        room.participants.forEach(participant => {
          if (participant.user.toString() !== userId) {
            io.to(participant.user.toString()).emit('messageDeleted', {
              messageId: message.messageId || message._id.toString(),
              roomId: roomId,
              deleteForEveryone: true
            });
          }
        });
      }
    } else {
      // Delete just for this user
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }

      // Emit real-time update for "delete for me" to the current user only
      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('messageDeletedForMe', {
          messageId: message.messageId || message._id.toString(),
          roomId: roomId,
          deleteForEveryone: false
        });
      }
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting cross-platform message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize federation registration
registerWithFederation();

// Toggle star for a cross-platform message
router.put("/messages/:messageId/star", protectRoute, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await CrossPlatformMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    message.isStarred = !message.isStarred;
    await message.save();

    res.json({
      success: true,
      isStarred: message.isStarred
    });
  } catch (error: any) {
    console.error('Error toggling star for cross-platform message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle star'
    });
  }
});

export default router;
