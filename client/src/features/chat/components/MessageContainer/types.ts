export interface MessageType {
	_id: string;
	text?: string;
	img?: string;
	file?: string;
	fileName?: string;
	fileSize?: number;
	attachmentType?: string;
	sender: string;
	senderUsername?: string;
	senderPlatform?: string;
	createdAt?: string;
	isFederated?: boolean;
	platform?: string;
	isNew?: boolean;
	tempId?: string;
	isTemp?: boolean;
	originalTempId?: string;
	isOptimistic?: boolean;
	animationDelay?: string;
	conversationId?: string;
	seen?: boolean;
	deletedForEveryone?: boolean;
	messageId?: string;
	timestamp?: string;
	isStarred?: boolean;
}

export interface MessageContainerProps {
	onShareRoom?: (room: any, event: React.MouseEvent) => void;
	onDeleteRoom?: (room: any, event: React.MouseEvent) => void;
}
