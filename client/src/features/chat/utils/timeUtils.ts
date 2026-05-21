export const formatMessageTime = (timestamp: string | Date | number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
};

export const formatTime = (s: number) => {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
};

export const shouldDisplayTimestamp = (currentMsg: any, previousMsg: any) => {
    if (!previousMsg) return true;
    const current = new Date(currentMsg.createdAt).getTime();
    const previous = new Date(previousMsg.createdAt).getTime();
    // Show timestamp if messages are more than 30 minutes apart
    return (current - previous) > 30 * 60 * 1000;
};
