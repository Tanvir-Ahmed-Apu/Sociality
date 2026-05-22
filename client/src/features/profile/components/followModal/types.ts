import type { User } from "../../../../types/models";

export interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUserUpdate?: (user: User) => void;
  initialTab?: number;
}

export type FollowTab = 0 | 1;
