import Room from "../../models/roomModel.js";
import CrossPlatformMessage from "../../models/crossPlatformMessageModel.js";
import mongoose from "mongoose";
import { getRoomByIdOrRoomId } from "../crossPlatformHelpers.js";
import { roomFederationService } from "./roomFederationService.js";
import { RoomResponse, RoomDetailsResponse, ParticipantInfo, ParticipantsResponse } from "../../types/crossPlatformRoom.js";

export class RoomParticipantService {
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

    const roomIds = userRooms.map(room => room.roomId);
    const latestMessages = roomIds.length
      ? await CrossPlatformMessage.aggregate([
        {
          $match: {
            roomId: { $in: roomIds },
            deletedForEveryone: { $ne: true },
            deletedFor: { $nin: [userId.toString()] }
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$roomId",
            message: { $first: "$$ROOT" }
          }
        }
      ])
      : [];
    const latestMessageByRoomId = new Map(
      latestMessages.map(({ _id, message }: any) => [_id, message])
    );

    return userRooms.map(room => ({
      roomId: room.roomId,
      roomCode: room.roomCode || "",
      name: room.name,
      groupPhoto: room.groupPhoto,
      creator: room.creator,
      peers: room.federationSettings?.registeredPeers || [],
      participantCount: room.participants?.length || 0,
      isPrivate: room.settings?.isPrivate || false,
      lastActivity: room.lastActivity,
      lastMessage: this.formatLastMessage(latestMessageByRoomId.get(room.roomId))
    }));
  }

  async joinRoom(roomId: string, userId: string, username: string): Promise<any> {
    if (!userId || !username) {
      throw new Error('Authentication required');
    }

    let room = await Room.findOne({ roomCode: roomId.toUpperCase() });

    if (!room) {
      room = await roomFederationService.fetchRemoteRoom(roomId);
    }

    if (!room) {
      throw new Error('Room not found. Please check the room ID.');
    }

    const existingParticipant = room.participants.find((p: any) => p.user.toString() === userId.toString());
    if (!existingParticipant) {
      room.participants.push({ user: new mongoose.Types.ObjectId(userId), role: 'member', joinedAt: new Date() });
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

  async getRoomDetails(roomId: string, userId: string): Promise<RoomDetailsResponse> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    let room = await getRoomByIdOrRoomId(roomId, 'participants.user');

    if (!room) {
      throw new Error('Room not found');
    }

    const isPrivateRoom = room.settings?.isPrivate;
    if (isPrivateRoom) {
      const userParticipant = this.findUserParticipant(room, userId);
      if (!userParticipant) {
        throw new Error('You must be a member of this room to view its details');
      }
    }

    return {
      _id: room._id.toString(),
      roomId: room.roomId,
      roomCode: room.roomCode || "",
      isPrivate: room.settings?.isPrivate || false,
      name: room.name,
      groupPhoto: room.groupPhoto,
      participantCount: room.participants.filter((p: any) => p && p.user).length,
      participants: room.participants
        .filter((p: any) => p && p.user)
        .map((p: any) => ({
          id: p.user._id.toString(),
          username: p.user.username,
          name: p.user.name,
          profilePic: p.user.profilePic,
          platform: 'sociality',
          isOnline: false,
          role: p.role,
          joinedAt: p.joinedAt
        })),
      creator: room.creator,
      createdAt: room.createdAt,
      platforms: room.federationSettings?.allowedPlatforms || ['sociality', 'telegram', 'discord']
    };
  }

  async getRoomParticipants(roomId: string, userId: string): Promise<ParticipantsResponse> {
    if (!userId) {
      throw new Error('Authentication required');
    }

    const room = await getRoomByIdOrRoomId(roomId, 'participants.user');
    if (!room) {
      throw new Error('Room not found');
    }

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
        joinedAt: undefined,
        lastSeen: user.lastSeen,
        messageCount: user.messageCount,
        isOnline: false
      }));
  }

  private formatLastMessage(message: any) {
    if (!message) return undefined;

    const attachmentText = message.img
      ? "Image"
      : message.file
        ? message.fileName || "File"
        : "";

    return {
      text: message.text || attachmentText,
      sender: message.sender,
      seen: true,
      img: message.img || undefined,
      file: message.file || undefined,
      fileName: message.fileName || undefined,
      createdAt: message.createdAt
    };
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

    profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${bgColor}&color=fff&size=256&bold=true`;
    cache.set(cacheKey, profilePic);

    return profilePic;
  }
}

export const roomParticipantService = new RoomParticipantService();
