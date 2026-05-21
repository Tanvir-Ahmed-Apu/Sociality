import axios from "axios";
import mongoose from "mongoose";
import Room from "../models/roomModel.js";

export const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://localhost:7300';
export const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:5000';

export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const registerWithFederation = async () => {
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

export const getRoomByIdOrRoomId = async (roomId: string, populate?: string) => {
  const query = { roomId };
  let room = populate
    ? await Room.findOne(query).populate(populate)
    : await Room.findOne(query);

  if (!room && mongoose.Types.ObjectId.isValid(roomId)) {
    const idQuery = { _id: roomId };
    room = populate
      ? await Room.findOne(idQuery).populate(populate)
      : await Room.findOne(idQuery);
  }

  return room;
};

export const isUserParticipant = (room: any, userId: string) => {
  if (!room || !room.participants) return false;
  return room.participants.some((p: any) => {
    if (!p || !p.user) return false;
    const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
    return participantUserId === userId.toString();
  });
};
