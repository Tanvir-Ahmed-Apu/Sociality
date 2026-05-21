export interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConversation: any;
  onUpdateGroup?: (group: any) => void;
  onDeleteGroup?: (group: any) => void;
}

export interface Participant {
  platform: string;
  id: string;
  name?: string;
  username?: string;
  profilePic?: string;
  role?: string;
  messageCount?: number;
}

export interface RoomDetails {
  participantCount?: number;
}
