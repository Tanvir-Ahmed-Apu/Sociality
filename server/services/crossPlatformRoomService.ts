import { CreateRoomRequest, RoomResponse, RoomDetailsResponse, ParticipantsResponse } from "../types/crossPlatformRoom.js";
import { roomCoreService } from "./crossPlatformRoom/roomCoreService.js";
import { roomParticipantService } from "./crossPlatformRoom/roomParticipantService.js";
import { roomFederationService } from "./crossPlatformRoom/roomFederationService.js";

export class CrossPlatformRoomService {
  async createRoom(userId: string, data: CreateRoomRequest): Promise<any> {
    return roomCoreService.createRoom(userId, data);
  }

  async getUserRooms(userId: string): Promise<RoomResponse[]> {
    return roomParticipantService.getUserRooms(userId);
  }

  async joinRoom(roomId: string, userId: string, username: string): Promise<any> {
    return roomParticipantService.joinRoom(roomId, userId, username);
  }

  async getRoomDetails(roomId: string, userId: string): Promise<RoomDetailsResponse> {
    return roomParticipantService.getRoomDetails(roomId, userId);
  }

  async getRoomParticipants(roomId: string, userId: string): Promise<ParticipantsResponse> {
    return roomParticipantService.getRoomParticipants(roomId, userId);
  }

  async updateRoomName(roomId: string, userId: string, newName: string): Promise<string> {
    return roomCoreService.updateRoomName(roomId, userId, newName);
  }

  async updateRoomPhoto(roomId: string, userId: string, photoData: string): Promise<string> {
    return roomCoreService.updateRoomPhoto(roomId, userId, photoData);
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    return roomCoreService.deleteRoom(roomId, userId);
  }

  async backfillProfilePictures(roomId: string): Promise<{ updated: number; total: number }> {
    return roomParticipantService.backfillProfilePictures(roomId);
  }
}

export default new CrossPlatformRoomService();
