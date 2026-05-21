export const userSocketMap: Record<string, string[]> = {};
export const userLastSeen: Record<string, string> = {};

export const getRecipientSocketId = (recipientId: string) => {
	return userSocketMap[recipientId] ? userSocketMap[recipientId][0] : null;
};

export const getAllSocketIdsForUser = (userId: string) => {
	return userSocketMap[userId] || [];
};

export const addUserSocket = (userId: string, socketId: string) => {
	if (!userSocketMap[userId]) {
		userSocketMap[userId] = [];
	}
	userSocketMap[userId].push(socketId);
};

export const removeUserSocket = (socketId: string): string | null => {
	let userIdToUpdate: string | null = null;
	for (const [userId, socketIds] of Object.entries(userSocketMap)) {
		const index = socketIds.indexOf(socketId);
		if (index !== -1) {
			userSocketMap[userId].splice(index, 1);
			userIdToUpdate = userId;
			if (userSocketMap[userId].length === 0) {
				delete userSocketMap[userId];
			}
			break;
		}
	}
	return userIdToUpdate;
};
