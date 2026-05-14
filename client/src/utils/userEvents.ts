/**
 * Global event system for user data updates
 * Ensures all components stay in sync when user data changes
 */

class UserEventEmitter {
    private listeners: Map<string, Set<(data: any) => void>>;

    constructor() {
        this.listeners = new Map();
    }

    // Subscribe to user update events
    subscribe(eventType: string, callback: (data: any) => void) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(eventType);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    // Emit user update events
    emit(eventType: string, data: any) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in user event callback:', error);
                }
            });
        }
    }

    // Clear all listeners
    clear() {
        this.listeners.clear();
    }
}

// Create singleton instance
const userEvents = new UserEventEmitter();

// Event types
export const USER_EVENTS = {
    USER_UPDATED: 'user_updated',
    FOLLOW_CHANGED: 'follow_changed',
    PROFILE_UPDATED: 'profile_updated'
};

export default userEvents;
