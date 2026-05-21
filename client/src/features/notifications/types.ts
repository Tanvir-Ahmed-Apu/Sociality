export interface Notification {
  _id: string;
  type: string;
  createdAt: string;
  sender?: {
    username: string;
    profilePic?: string;
  };
  recipient?: {
    username: string;
  };
  postId?: string;
  read: boolean;
}
