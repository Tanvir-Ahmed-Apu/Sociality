import { v4 as uuidv4 } from "uuid";
import Room from "../../models/roomModel.js";
import CrossPlatformMessage from "../../models/crossPlatformMessageModel.js";
import { getRoomByIdOrRoomId, generateRoomCode } from "../crossPlatformHelpers.js";
import { uploadImage } from "../../utils/cloudinary.js";
import { CreateRoomRequest } from "../../types/crossPlatformRoom.js";
import { roomFederationService } from "./roomFederationService.js";

export class RoomCoreService {
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

    roomFederationService.registerRoomWithFederation(roomId, name).catch(err =>
      console.warn('Failed to register room with federation registry:', err.message)
    );

    return room;
  }

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

    roomFederationService.updateRoomInFederation(roomId, { name: room.name }).catch(err =>
      console.warn('Failed to update room name in federation registry:', err.message)
    );

    return room.name;
  }

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
    
    roomFederationService.removeRoomFromFederation(roomId).catch(err =>
      console.warn('Failed to remove room from federation registry:', err.message)
    );

    await Room.deleteOne({ roomId });
  }
}

export const roomCoreService = new RoomCoreService();
