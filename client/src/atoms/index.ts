import { atom } from 'recoil';
import type { User, Post } from '../types/models';

/**
 * Message Types
 */
export interface Conversation {
	_id: string;
	userId?: string;
	username?: string;
	userProfilePic?: string;
	mock?: boolean;
	lastMessage?: {
		text?: string;
		sender?: string;
		seen?: boolean;
		img?: string;
		gif?: string;
		voice?: string;
		file?: string;
		fileName?: string;
		emoji?: string;
		createdAt?: string;
	};
	participants?: any[];
	isFederated?: boolean;
	roomCode?: string;
	name?: string;
	groupPhoto?: string;
	platforms?: string[];
	peers?: string[];
	creator?: any;
	updatedAt?: string;
}

/**
 * Auth Atoms
 */
export const authScreenAtom = atom<'login' | 'signup'>({
	key: 'authScreenAtom',
	default: 'login',
});

/**
 * User Atoms
 */
export const userAtom = atom<User | null>({
	key: 'userAtom',
	default: null,
});

/**
 * Post Atoms
 */
export const postsAtom = atom<Post[]>({
	key: 'postsAtom',
	default: [],
});

/**
 * Message Atoms
 */
export const conversationsAtom = atom<Conversation[]>({
	key: "conversationsAtom",
	default: [],
});

export const selectedConversationAtom = atom<Partial<Conversation>>({
	key: "selectedConversationAtom",
	default: {},
});

export const messagesAtom = atom<any[]>({
	key: 'messagesAtom',
	default: [],
});

export const notificationsAtom = atom<any[]>({
	key: 'notificationsAtom',
	default: [],
});

export const suggestedUsersAtom = atom<any[]>({
	key: 'suggestedUsersAtom',
	default: [],
});

export const searchResultsAtom = atom<any[]>({
	key: 'searchResultsAtom',
	default: [],
});

/**
 * Theme Atoms
 */
export const themeAtom = atom<'light' | 'dark' | 'system'>({
	key: 'themeAtom',
	default: 'system',
});
