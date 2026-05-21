import axios from "axios";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Room from "../models/roomModel.js";
import CrossPlatformMessage from "../models/crossPlatformMessageModel.js";
import { getRoomByIdOrRoomId, generateRoomCode, FEDERATION_REGISTRY_URL, PLATFORM_URL } from "./crossPlatformHelpers.js";
import { uploadImage } from "../utils/cloudinary.js";
import {
  CreateRoomRequest,
  RoomResponse,
  RoomDetailsResponse,
  ParticipantInfo,
  ParticipantsResponse
} from "../types/crossPlatformRoom.js";

export class CrossPlatformRoomService {
  /**
   * Create a new cross-platform room
   */
  async createRoom(userId: string, data: CreateRoomRequest): Promise<any> {
    const { name, allowedPlatforms = ['sociality', 'telegram', 'discord'] } = data;

    if (!name) {
      throw new Error('Room name is required');
    }
    if (!userId) {
      throw new Error('Authentication required');
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

    // Register with federation registry asynchronously
    this.registerRoomWithFederation(roomId, name).catch(err =>
      console.warn('Failed to register room with federation registry:', err.message)
    );

    return room;
  }

  /**
   * Get all rooms for a user
   */
  async getUserRooms(userId: string): Promise<RoomResponse[]> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    const userRooms = await Room.find({
      'federationSettings.isEnabled': true,
      'participants.user': userId
    })
      .populate('creator', 'username name profilePic')
      .lean();

    return userRooms.map(room => ({
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
  }

  /**
   * Join a cross-platform room
   */
  async joinRoom(roomId: string, userId: string, username: string): Promise<any> {
    if (!userId || !username) {
      throw new Error('Authentication required');
    }

    let room = await Room.findOne({ roomCode: roomId.toUpperCase() });

    if (!room) {
      room = await this.fetchRemoteRoom(roomId);
    }

    if (!room) {
      throw new Error('Room not found. Please check the room ID.');
    }

    const existingParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!existingParticipant) {
      room.participants.push({ user: userId, role: 'member' });
      await room.save();
    }

    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      name: room.name,
      participantCount: room.participants.length,
      isPrivate: room.settings?.isPrivate || false
    };
  }

  /**
   * Get detailed room information
   */
  async getRoomDetails(roomId: string, userId: string): Promise<RoomDetailsResponse> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    let room = await getRoomByIdOrRoomId(roomId, 'participants.user');

    if (!room) {
      throw new Error('Room not found');
    }

    // Check access permissions for private rooms
    const isPrivateRoom = room.settings?.isPrivate;
    if (isPrivateRoom) {
      const userParticipant = this.findUserParticipant(room, userId);
      if (!userParticipant) {
        throw new Error('You must be a member of this room to view its details');
      }
    }

    return {
      _id: room._id,
      roomId: room.roomId,
      roomCode: room.roomCode,
      name: room.name,
      groupPhoto: room.groupPhoto,
      participantCount: room.participants.filter((p: any) => p && p.user).length,
      participants: room.participants
        .filter((p: any) => p && p.user)
        .map((p: any) => ({
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
    };
  }

  /**
   * Get room participants from all platforms
   */
  async getRoomParticipants(roomId: string, userId: string): Promise<ParticipantsResponse> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    const room = await getRoomByIdOrRoomId(roomId, 'participants.user');
    if (!room) {
      throw new Error('Room not found');
    }

    // Check access permissions for private rooms
    const isPrivateRoom = room.settings?.isPrivate;
    if (isPrivateRoom) {
      const isParticipant = this.isUserParticipant(room, userId);
      if (!isParticipant) {
        throw new Error('You must be a member of this room to view participants');
      }
    }

    const socialityParticipants = await this.getSocialityParticipants(room);
    const crossPlatformParticipants = await this.getCrossPlatformParticipants(roomId, socialityParticipants);
    const allParticipants = [...socialityParticipants, ...crossPlatformParticipants];

    return {
      participants: allParticipants,
      summary: {
        total: allParticipants.length,
        sociality: socialityParticipants.length,
        telegram: crossPlatformParticipants.filter((p: any) => p.platform === 'telegram').length,
        discord: crossPlatformParticipants.filter((p: any) => p.platform === 'discord').length,
        other: crossPlatformParticipants.filter((p: any) => !['telegram', 'discord'].includes(p.platform)).length
      }
    };
  }

  /**
   * Update room name
   */
  async updateRoomName(roomId: string, userId: string, newName: string): Promise<string> {
    if (!userId) {
      throw new Error('Authentication required');
    }
    if (!newName || !newName.trim()) {
      throw new Error('Room name is required');
    }

    const room = await getRoomByIdOrRoomId(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!userParticipant) {
      throw new Error('You must be a member of this room to update its name');
    }

    room.name = newName.trim();
    await room.save();

    // Update federation registry asynchronously
    this.updateRoomInFederation(roomId, { name: room.name }).catch(err =>
      console.warn('Failed to update room name in federation registry:', err.message)
    );

    return room.name;
  }

  /**
   * Update room photo
   */
  async updateRoomPhoto(roomId: string, userId: string, photoData: string): Promise<string> {
    if (!userId) {
      throw new Error('Authentication required');
    }
    if (!photoData) {
      throw new Error('Photo data is required');
    }

    const room = await getRoomByIdOrRoomId(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!userParticipant) {
      throw new Error('You must be a member of this room to update its photo');
    }

    const imgUrl = await uploadImage(photoData, {
      folder: 'room_photos',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    room.groupPhoto = imgUrl;
    await room.save();

    return imgUrl;
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId: string, userId: string): Promise<void> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    const room = await getRoomByIdOrRoomId(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const userParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!userParticipant) {
      throw new Error('You must be a member of this room to delete it');
    }

    await CrossPlatformMessage.deleteMany({ roomId });
    
    // Remove from federation registry asynchronously
    this.removeRoomFromFederation(roomId).catch(err =>
      console.warn('Failed to remove room from federation registry:', err.message)
    );

    await Room.deleteOne({ roomId });
  }

  /**
   * Backfill missing profile pictures for cross-platform messages
   */
  async backfillProfilePictures(roomId: string): Promise<{ updated: number; total: number }> {
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
      const profilePic = this.generateProfilePic(
        message.senderPlatform,
        message.senderUsername,
        userProfileCache
      );

      if (profilePic) {
        await CrossPlatformMessage.updateOne({ _id: message._id }, { senderProfilePic: profilePic });
        updatedCount++;
      }
    }

    return { updated: updatedCount, total: messagesToUpdate.length };
  }

  // ============ PRIVATE HELPER METHODS ============

  private async fetchRemoteRoom(roomId: string): Promise<any> {
    try {
      const response = await axios.get(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
      const federatedRoom = response.data;

      if (federatedRoom) {
        return new Room({
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
      }
    } catch (_error) {
      return null;
    }
  }

  private findUserParticipant(room: any, userId: string): any {
    return room.participants.find((p: any) => {
      if (!p || !p.user) return false;
      const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
      return participantUserId === userId.toString();
    });
  }

  private isUserParticipant(room: any, userId: string): boolean {
    return room.participants.some((p: any) => {
      if (!p || !p.user) return false;
      const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
      return participantUserId === userId.toString();
    });
  }

  private async getSocialityParticipants(room: any): Promise<ParticipantInfo[]> {
    const participants = room.participants
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

    // Remove duplicates
    return participants.filter((participant, index, array) =>
      array.findIndex(p => p.id === participant.id) === index
    );
  }

  private async getCrossPlatformParticipants(roomId: string, socialityParticipants: ParticipantInfo[]): Promise<ParticipantInfo[]> {
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

    const socialityIds = socialityParticipants.map((p: any) => p.id);

    return crossPlatformUsers
      .filter((user: any) => !socialityIds.includes(user._id.sender))
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
  }

  private generateProfilePic(
    platform: string,
    username: string,
    cache: Map<string, string>
  ): string {
    const cacheKey = `${platform}-${username}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) || '';
    }

    let profilePic = '';
    const bgColor = platform === 'telegram' ? '0088cc' : '5865F2';
    const label = platform === 'telegram' ? 'Telegram' : 'Discord';

    profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${bgColor}&color=fff&size=256&bold=true`;
    cache.set(cacheKey, profilePic);

    return profilePic;
  }

  private registerRoomWithFederation(roomId: string, name: string): Promise<void> {
    return axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
      roomId,
      name,
      peerUrl: PLATFORM_URL
    });
  }

  private updateRoomInFederation(roomId: string, data: any): Promise<void> {
    return axios.put(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`, data);
  }

  private removeRoomFromFederation(roomId: string): Promise<void> {
    return axios.delete(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
  }
}

export default new CrossPlatformRoomService();
