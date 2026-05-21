import mongoose from "mongoose";

export const getMessageTypeText = (messageData: any): string => {
	const { img, gif, voice, file, fileName, emoji } = messageData;
	if (img) return "Image";
	if (gif) return "GIF";
	if (voice) return "Voice message";
	if (file) return `File: ${fileName || 'Document'}`;
	if (emoji) return "Emoji";
	return "";
};

export const isValidObjectId = (id: string): boolean => {
	return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

export const isMockConversationId = (id: string | number): boolean => {
	return /^\d+$/.test(String(id)) && !isValidObjectId(String(id));
};
