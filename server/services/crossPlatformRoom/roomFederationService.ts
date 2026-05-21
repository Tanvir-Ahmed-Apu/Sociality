import axios from "axios";
import mongoose from "mongoose";
import Room from "../../models/roomModel.js";
import { FEDERATION_REGISTRY_URL, PLATFORM_URL } from "../crossPlatformHelpers.js";

export class RoomFederationService {
  async fetchRemoteRoom(roomId: string): Promise<any> {
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

  registerRoomWithFederation(roomId: string, name: string): Promise<void> {
    return axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
      roomId,
      name,
      peerUrl: PLATFORM_URL
    });
  }

  updateRoomInFederation(roomId: string, data: any): Promise<void> {
    return axios.put(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`, data);
  }

  removeRoomFromFederation(roomId: string): Promise<void> {
    return axios.delete(`${FEDERATION_REGISTRY_URL}/federation/rooms/${roomId}`);
  }
}

export const roomFederationService = new RoomFederationService();
