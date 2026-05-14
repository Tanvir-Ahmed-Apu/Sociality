import { useEffect, useCallback } from 'react';
import userEvents, { USER_EVENTS } from '../utils/userEvents';

/**
 * Hook for subscribing to and emitting user events
 */
const useUserEvents = () => {
    // Subscribe to user update events
    const subscribeToUserUpdates = useCallback((callback: (data: any) => void) => {
        return userEvents.subscribe(USER_EVENTS.USER_UPDATED, callback);
    }, []);

    // Subscribe to follow change events
    const subscribeToFollowChanges = useCallback((callback: (data: any) => void) => {
        return userEvents.subscribe(USER_EVENTS.FOLLOW_CHANGED, callback);
    }, []);

    // Emit user update event
    const emitUserUpdate = useCallback((userData: any) => {
        console.log('Emitting user update event:', userData);
        userEvents.emit(USER_EVENTS.USER_UPDATED, userData);
    }, []);

    // Emit follow change event
    const emitFollowChange = useCallback((data: any) => {
        console.log('Emitting follow change event:', data);
        userEvents.emit(USER_EVENTS.FOLLOW_CHANGED, data);
    }, []);

    return {
        subscribeToUserUpdates,
        subscribeToFollowChanges,
        emitUserUpdate,
        emitFollowChange
    };
};

export default useUserEvents;
