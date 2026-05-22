/**
 * Socket service
 * Centralized service for socket.io operations
 */
import io, { Socket } from "socket.io-client";

// Socket instance cache
let socketInstance: Socket | null = null;

// Connection status
let connectionStatus: string = 'disconnected';

// Event listeners registry to avoid duplicate listeners
const eventListeners = new Map<string, any>();

/**
 * Initialize socket connection
 * @param {string} userId - User ID for authentication
 * @returns {object} - Socket instance and connection methods
 */
export const initializeSocket = (userId: string | undefined): { socket: Socket | null, status: string } => {
  // Don't create a socket connection if there's no user ID
  if (!userId) {
    console.log("No user ID provided, not creating socket connection");
    return { socket: null, status: 'disconnected' };
  }

  // If socket already exists and is connected, return it
  if (socketInstance && socketInstance.connected) {
    console.log("Reusing existing socket connection:", socketInstance.id);
    return {
      socket: socketInstance,
      status: connectionStatus
    };
  }

  // In production, connect directly to backend server for WebSocket
  // In development, use relative URL to leverage Vite proxy
  const backendUrl = import.meta.env.VITE_API_BASE_URL || '';
  const socketUrl = backendUrl || '/';

  console.log("Creating new socket connection to:", socketUrl);

  // Create new socket instance with optimized configuration
  socketInstance = io(socketUrl, {
    query: { userId },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['polling', 'websocket'],
    upgrade: true,
    forceNew: false,
    autoConnect: true,
  });

  // Add event listeners for debugging
  socketInstance.on('connect', () => {
    console.log("Socket connected in socketService:", socketInstance?.id);
    connectionStatus = 'connected';
  });

  socketInstance.on('connect_error', (error) => {
    console.error("Socket connection error in socketService:", error.message);
    console.error("Error details:", error);
    connectionStatus = 'error';
  });

  socketInstance.on('disconnect', (reason) => {
    console.log("Socket disconnected in socketService:", reason);
    connectionStatus = 'disconnected';
  });

  socketInstance.on('reconnect', (attemptNumber) => {
    console.log("Socket reconnected after", attemptNumber, "attempts");
    connectionStatus = 'connected';
  });

  socketInstance.on('reconnect_error', (error) => {
    console.error("Socket reconnection error:", error.message);
    connectionStatus = 'error';
  });

  // Update connection status
  connectionStatus = 'connecting';

  return {
    socket: socketInstance,
    status: connectionStatus
  };
};

/**
 * Register socket event listener with deduplication
 * @param {Socket} socket - Socket.io instance
 * @param {string} event - Event name
 * @param {function} callback - Event callback
 */
export const registerSocketEvent = (socket: Socket | null, event: string, callback: (...args: any[]) => void) => {
  if (!socket) return;

  // Create unique key for this event + callback combination
  const callbackKey = `${event}_${callback.toString()}`;

  // Remove existing listener for this event + callback if exists
  if (eventListeners.has(callbackKey)) {
    socket.off(event, eventListeners.get(callbackKey));
    eventListeners.delete(callbackKey);
  }

  // Register new listener
  socket.on(event, callback);
  eventListeners.set(callbackKey, callback);
};

/**
 * Emit socket event with retry logic
 * @param {Socket} socket - Socket.io instance
 * @param {string} event - Event name
 * @param {any} data - Event data
 * @param {function} callback - Optional acknowledgement callback
 * @returns {Promise} - Resolves when event is sent or rejects on error
 */
export const emitSocketEvent = (socket: Socket | null, event: string, data: any, callback: ((...args: any[]) => void) | null = null): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {

      reject(new Error('Socket not connected'));
      return;
    }

    try {
      if (callback) {
        socket.emit(event, data, callback);
      } else {
        socket.emit(event, data);
      }
      resolve();
    } catch (error) {

      reject(error);
    }
  });
};

/**
 * Disconnect socket and clean up resources
 */
export const disconnectSocket = () => {
  if (socketInstance) {

    socketInstance.disconnect();
    socketInstance.removeAllListeners();
    socketInstance = null;
    connectionStatus = 'disconnected';
    eventListeners.clear();
  }
};

/**
 * Get current socket instance
 * @returns {object|null} - Current socket instance or null
 */
export const getSocketInstance = () => socketInstance;

/**
 * Get current connection status
 * @returns {string} - Connection status
 */
export const getConnectionStatus = () => connectionStatus;

/**
 * Update connection status
 * @param {string} status - New connection status
 */
export const updateConnectionStatus = (status: string) => {
  connectionStatus = status;
};
