export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePic?: string;
  coverPic?: string;
  bio?: string;
  location?: string;
  website?: string;
  isProfileComplete: boolean;
  sessionPath?: string;
  followers?: (string | User)[];
  following?: (string | User)[];
  isGoogleUser?: boolean;
  setupRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reply {
  _id: string;
  userId: string;
  text?: string;
  img?: string;
  userProfilePic?: string;
  username?: string;
  createdAt: string;
  likes: string[];
  parentReplyId?: string;
}

export interface Post {
  _id: string;
  postedBy: User;
  text?: string;
  img?: string;
  images: string[];
  likes: string[];
  reposts: string[];
  replies: Reply[];
  userReply?: any;
  createdAt: string;
  updatedAt: string;
}
