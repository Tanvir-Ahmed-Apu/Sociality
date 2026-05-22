import { createContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { userAtom } from "../atoms";
import {
  initializeSocket,
  registerSocketEvent,
  emitSocketEvent,
  disconnectSocket,
  updateConnectionStatus
} from "../services/socketService";

import { Socket } from "socket.io-client";

declare global {
  interface Window {
    socketUrl?: string;
  }
}

interface SocketContextValue {
  socket: Socket | null;
  onlineUsers: string[];
  userLastSeen: Record<string, string>;
  connectionStatus: string;
  connectionInfo: string;
  isConnected: boolean;
  emit: (event: string, data: any, callback?: (response: any) => void) => Promise<any>;
  joinRoom: (roomId: string) => Promise<any> | void;
  leaveRoom: (roomId: string) => Promise<any> | void;
}

// Create context
export const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Socket context provider
 * Manages socket connection and provides socket context to components
 */
export const SocketContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [userLastSeen, setUserLastSeen] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<string>('');
  const user = useRecoilValue<any>(userAtom);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) {
      console.log("No user ID available, cannot initialize socket");
      return;
    }

    console.log("Initializing socket connection for user:", user._id);

    // In production, connect directly to backend; in dev, use Vite proxy
    const socketUrl = import.meta.env.VITE_API_BASE_URL || '/';

    console.log("Socket URL:", socketUrl);

    // Initialize socket connection
    const { socket: socketInstance, status } = initializeSocket(user._id);

    // Update state
    setSocket(socketInstance);
    setConnectionStatus(status);


    // Log socket instance
    console.log("Socket instance:", socketInstance ? "Created" : "Failed to create");

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (connectionStatus !== 'connected') {
        console.log("Socket connection timeout - server might be on a different port");
        setConnectionInfo('Connection to socket server timed out. Please check if the backend server is running on port 5000.');
      }
    }, 5000);

    // Set up event listeners
    if (socketInstance) {
      // Connection events
      registerSocketEvent(socketInstance, "connect", () => {
        clearTimeout(connectionTimeout);
        console.log("Socket connected!", socketInstance.id);
        setConnectionStatus('connected');
        updateConnectionStatus('connected');
        setConnectionInfo('');
        socketInstance.emit("verifyConnection", { userId: user._id });

        // Log additional connection information
        console.log("Socket connection details:", {
          id: socketInstance.id,
          connected: socketInstance.connected,
          disconnected: socketInstance.disconnected,
          url: window.socketUrl
        });
      });

      registerSocketEvent(socketInstance, "connectionVerified", (data) => {
        console.log("Socket connection verified with server", data);
        setConnectionStatus('connected');
        updateConnectionStatus('connected');
      });

      registerSocketEvent(socketInstance, "disconnect", (reason) => {
        console.log("Socket disconnected", reason);
        setConnectionStatus('disconnected');
        updateConnectionStatus('disconnected');

        if (reason === "io server disconnect") {
          setConnectionStatus('connecting');
          updateConnectionStatus('connecting');
          socketInstance.connect();
        }
      });

      registerSocketEvent(socketInstance, "reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        setConnectionStatus('connected');
        updateConnectionStatus('connected');
        socketInstance.emit("verifyConnection", { userId: user._id });
      });

      registerSocketEvent(socketInstance, "reconnect_attempt", () => {
        setConnectionStatus('connecting');
        updateConnectionStatus('connecting');
      });

      registerSocketEvent(socketInstance, "connect_error", (error) => {
        console.log("Socket connection error", error.message);
        setConnectionStatus('connecting');
        updateConnectionStatus('connecting');
      });

      // Application events
      registerSocketEvent(socketInstance, "getOnlineUsers", (data) => {
        setOnlineUsers(data.onlineUsers);
        setUserLastSeen(data.lastSeenTimestamps || {});
      });

      // Listen for user status updates
      registerSocketEvent(socketInstance, "userStatusUpdate", (data) => {
        if (data.status === "online") {
          setOnlineUsers(prev => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
        } else if (data.status === "offline") {
          setOnlineUsers(prev => prev.filter(id => id !== data.userId));
          setUserLastSeen(prev => ({
            ...prev,
            [data.userId]: data.timestamp
          }));
        }
      });
    }

    // Cleanup function
    return () => {
      clearTimeout(connectionTimeout);
      disconnectSocket();
    };
  }, [user?._id]);

  // Emit event with error handling
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!socket) {
      console.warn('Socket not available for event:', event);
      return Promise.reject(new Error('Socket not available'));
    }

    return emitSocketEvent(socket, event, data, callback);
  }, [socket]);

  // Join a room with error handling
  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !roomId) return;

    return emit('joinRoom', { roomId });
  }, [socket, emit]);

  // Leave a room with error handling
  const leaveRoom = useCallback((roomId: string) => {
    if (!socket || !roomId) return;

    return emit('leaveRoom', { roomId });
  }, [socket, emit]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    socket,
    onlineUsers,
    userLastSeen,
    connectionStatus,
    connectionInfo,
    isConnected: connectionStatus === 'connected',
    emit,
    joinRoom,
    leaveRoom
  }), [
    socket,
    onlineUsers,
    userLastSeen,
    connectionStatus,
    connectionInfo,
    emit,
    joinRoom,
    leaveRoom
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
