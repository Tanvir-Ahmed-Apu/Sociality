import express from 'express';
import cors from 'cors';
import axios from 'axios';
import logger from '../utils/logger.js';
import FederationPeer from '../models/federationPeerModel.js';
import FederationRoom from '../models/federationRoomModel.js';

const app = express();
const PORT = Number(process.env.FEDERATION_PORT) || 7300;

// Helper to normalize localhost to 127.0.0.1
const normalizeUrl = (url: string) => {
  if (!url) return url;
  return url.replace('//localhost:', '//127.0.0.1:').replace(/\/$/, '');
};

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req: any, res: any) => {
  try {
    const peerCount = await FederationPeer.countDocuments();
    const roomCount = await FederationRoom.countDocuments();
    res.json({
      status: 'ok',
      service: 'federation-registry',
      timestamp: new Date().toISOString(),
      peers: peerCount,
      rooms: roomCount
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database error' });
  }
});

// Register a peer platform
app.post('/federation/peers', async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Name and URL are required'
      });
    }

    const normalizedUrl = normalizeUrl(url);

    const peerData = await FederationPeer.findOneAndUpdate(
      { name },
      {
        name,
        url: normalizedUrl,
        lastSeen: new Date(),
        status: 'active'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: `Peer ${name} registered successfully`,
      peer: peerData
    });
  } catch (error: any) {
    console.error('Error registering peer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register peer',
      message: error.message
    });
  }
});

// Get all registered peers
app.get('/federation/peers', async (req, res) => {
  try {
    const peerList = await FederationPeer.find({}).lean();
    res.json({
      success: true,
      peers: peerList
    });
  } catch (error: any) {
    console.error('Error fetching peers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch peers',
      message: error.message
    });
  }
});

// Register a room
app.post('/federation/rooms', async (req, res) => {
  try {
    const { roomId, name, peerUrl } = req.body;

    if (!roomId || !name || !peerUrl) {
      return res.status(400).json({
        success: false,
        error: 'Room ID, name, and peer URL are required'
      });
    }

    const normalizedUrl = normalizeUrl(peerUrl);

    // Ensure all platform peers are included in every room
    const allPlatformUrls = [
      'http://127.0.0.1:5000',  // sociality
      'http://127.0.0.1:7301',  // telegram
      'http://127.0.0.1:7302'   // discord
    ];
    
    const peersToAdd = new Set([normalizedUrl, ...allPlatformUrls]);

    const room = await FederationRoom.findOneAndUpdate(
      { roomId },
      {
        $setOnInsert: { name, roomId, messageCount: 0 },
        $addToSet: { peers: { $each: Array.from(peersToAdd) } }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: `Room ${name} registered successfully`,
      room: {
        roomId: room.roomId,
        name: room.name,
        peers: room.peers,
        messageCount: room.messageCount
      }
    });
  } catch (error: any) {
    console.error('Error registering room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register room',
      message: error.message
    });
  }
});

// Get all rooms
app.get('/federation/rooms', async (req, res) => {
  try {
    const rooms = await FederationRoom.find({}).lean();
    
    const roomList = rooms.map(room => ({
      roomId: room.roomId,
      name: room.name,
      createdAt: room.createdAt,
      peers: room.peers || [],
      messageCount: room.messageCount,
      participantCount: (room.peers || []).length
    }));

    res.json(roomList);
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms',
      message: error.message
    });
  }
});

// Relay message to all peers in a room
app.post('/federation/relay-message', async (req, res) => {
  try {
    const { roomId, message, originatingPlatform } = req.body;

    if (!roomId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and message are required'
      });
    }

    let room = await FederationRoom.findOne({ roomId });
    if (!room) {
      // Auto-create room if it doesn't exist
      room = await FederationRoom.create({
        roomId,
        name: `Auto-created Room ${roomId}`,
        peers: [
          'http://127.0.0.1:5000',  // sociality
          'http://127.0.0.1:7301',  // telegram
          'http://127.0.0.1:7302'   // discord
        ],
        messageCount: 0
      });
    }

    // Increment message count
    room.messageCount += 1;
    await room.save();

    // Relay to all peers except the originating platform
    const normalizedOrigin = normalizeUrl(originatingPlatform);
    const peers = room.peers || [];
    const relayPromises = peers
      .filter((peerUrl: string) => normalizeUrl(peerUrl) !== normalizedOrigin)
      .map(async (peerUrl: string) => {
        try {
          const response = await axios.post(`${peerUrl}/api/cross-platform/relay`, {
            roomId,
            message: {
              ...message,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          }, {
            timeout: 15000 // Increased timeout from 5000 to 15000ms
          });

          return {
            peer: peerUrl,
            success: true,
            status: response.status
          };
        } catch (error: any) {
          console.error(`❌ Failed to relay to ${peerUrl}:`, {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          return {
            peer: peerUrl,
            success: false,
            error: error.message,
            code: error.code,
            status: error.response?.status
          };
        }
      });

    const results = await Promise.allSettled(relayPromises);
    const relayResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : {
        success: false,
        error: result.reason?.message || 'Unknown error'
      }
    );

    res.json({
      success: true,
      message: 'Message relayed to peers',
      results: relayResults,
      roomMessageCount: room.messageCount
    });
  } catch (error: any) {
    console.error('Error relaying message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to relay message',
      message: error.message
    });
  }
});

// Remove inactive peers (cleanup endpoint)
app.delete('/federation/peers/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const result = await FederationPeer.deleteOne({ name });

    if (result.deletedCount > 0) {
      res.json({
        success: true,
        message: `Peer ${name} removed successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Peer not found'
      });
    }
  } catch (error: any) {
    console.error('Error removing peer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove peer',
      message: error.message
    });
  }
});

// Add endpoint to get room peers for debugging
app.get('/federation/rooms/:roomId/peers', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await FederationRoom.findOne({ roomId }).lean();

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      roomId: room.roomId,
      name: room.name,
      peers: room.peers || [],
      messageCount: room.messageCount
    });
  } catch (error: any) {
    console.error('Error getting room peers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room peers',
      message: error.message
    });
  }
});

// Ensure all platforms are registered in all existing rooms
const ensureAllPlatformsInRooms = async () => {
  try {
    const allPlatformUrls = [
      'http://127.0.0.1:5000',  // sociality
      'http://127.0.0.1:7301',  // telegram
      'http://127.0.0.1:7302'   // discord
    ];

    await FederationRoom.updateMany(
      {},
      { $addToSet: { peers: { $each: allPlatformUrls } } }
    );
  } catch (error) {
    console.error('Error ensuring platforms in rooms:', error);
  }
};

// Start the federation registry server
const startFederationRegistry = () => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`🌐 Federation Registry running on http://127.0.0.1:${PORT}`);

    // Ensure all platforms are in all rooms
    ensureAllPlatformsInRooms();
  });
};

// Export for use in main server
export { app as federationApp, startFederationRegistry };
export default app;
