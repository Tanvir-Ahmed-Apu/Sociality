export interface CreateRoomRequest {
  name: string;
  allowedPlatforms?: string[];
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface UpdateRoomNameRequest {
  name: string;
}

export interface UpdateRoomPhotoRequest {
  photo: string;
}

export interface RoomResponse {
  roomId: string;
  roomCode: string;
  name: string;
  groupPhoto?: string;
  creator?: any;
  peers?: string[];
  participantCount: number;
  isPrivate: boolean;
  lastActivity?: Date;
  platforms?: string[];
  lastMessage?: {
    text?: string;
    sender?: string;
    seen?: boolean;
    img?: string;
    file?: string;
    fileName?: string;
    createdAt?: Date;
  };
}

export interface ParticipantInfo {
  id: string;
  username: string;
  name: string;
  profilePic: string;
  platform: string;
  role: string;
  joinedAt?: Date;
  lastSeen?: Date;
  messageCount?: number;
  isOnline: boolean;
}

export interface ParticipantsResponse {
  participants: ParticipantInfo[];
  summary: {
    total: number;
    sociality: number;
    telegram: number;
    discord: number;
    other: number;
  };
}

export interface RoomDetailsResponse extends RoomResponse {
  _id: string;
  participants: ParticipantInfo[];
  createdAt: Date;
}
