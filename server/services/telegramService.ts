import express from 'express';
import cors from 'cors';
import axios from 'axios';
import TelegramBinding from '../models/telegramBindingModel.js';
import Room from '../models/roomModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import TelegramBotClient from '../utils/TelegramBotClient.js';


// Load environment variables from the main .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.TELEGRAM_PORT) || 7301;

// Middleware
app.use(cors());
app.use(express.json());

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://127.0.0.1:7300';
const PLATFORM_URL = process.env.TELEGRAM_PLATFORM_URL || 'http://127.0.0.1:7301';

// Initialize Telegram Bot (only if token is provided)
let bot: any = null;
const telegramChats = new Map(); // Map room IDs to Telegram chat IDs
const roomMappings = new Map(); // Map Telegram chat IDs to room IDs

if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN') {
  try {
    bot = new TelegramBotClient(TELEGRAM_BOT_TOKEN);
    bot.startPolling();


    // Prevent unhandled rejections from polling errors
    bot.on('polling_error', (error: any) => {
      console.warn('⚠️ Telegram polling error:', error.message);
    });

    bot.on('error', (error: any) => {
      console.warn('⚠️ Telegram bot error:', error.message);
    });

    // Note: Main message handler is defined later to avoid conflicts

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot!.sendMessage(chatId,
        '🤖 Welcome to Sociality Cross-Platform Messaging!\n\n' +
        'This bot connects your Telegram chat to the Sociality platform.\n' +
        'Messages sent here will be relayed to Discord and web users.\n\n' +
        'Commands:\n' +
        '/bind <room-id> - Connect to a cross-platform room\n' +
        '/help - Show this help message\n' +
        '/status - Check connection status\n' +
        '/leave - Disconnect from current room'
      );
    });

    // Handle /help command
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      bot!.sendMessage(chatId,
        '📋 Available Commands:\n\n' +
        '/start - Initialize the bot\n' +
        '/bind <room-id> - Connect to a cross-platform room\n' +
        '/join <room-id> - Same as /bind (alias)\n' +
        '/leave - Disconnect from current room\n' +
        '/status - Check connection status\n' +
        '/help - Show this help message\n\n' +
        '💬 After binding to a room, just send regular messages to chat with users on other platforms!\n\n' +
        '🌐 Example: /bind test-room-123'
      );
    });

    // Handle /join command (alias for /bind)
    bot.onText(/\/join (.+)/, async (msg, match) => {
      await handleRoomBinding(msg, match);
    });

    // Handle /bind command (primary command)
    bot.onText(/\/bind (.+)/, async (msg, match) => {
      await handleRoomBinding(msg, match);
    });

    // Common function to handle room binding
    async function handleRoomBinding(msg, match) {
      const chatId = msg.chat.id;
      const roomId = match[1].trim();

      try {
        // Check if this Telegram chat is already bound to a room
        const existingBinding = await TelegramBinding.findByTelegramChatId(chatId.toString());
        if (existingBinding) {
          bot!.sendMessage(chatId,
            `❌ This Telegram chat is already connected to room: ${existingBinding.roomId}\n\n` +
            `Use /leave to disconnect first, then try joining a new room.`
          );
          return;
        }

        const roomId = match[1].trim();
        let actualRoomId = roomId;

        // Try to find the room by roomCode if it's not a UUID
        if (roomId.length <= 10) {
          const room = await Room.findOne({ roomCode: roomId.toUpperCase() });
          if (room) {
            actualRoomId = room.roomId;
          }
        }

        // Check if the room is already bound to another Telegram chat
        const roomBinding = await TelegramBinding.findByRoomId(actualRoomId);
        if (roomBinding) {
          bot!.sendMessage(chatId,
            `❌ Room ${roomId} is already connected to another Telegram chat.\n\n` +
            `Each room can only be bound to one Telegram chat at a time.`
          );
          return;
        }

        // Create new binding
        const binding = new TelegramBinding({
          roomId: actualRoomId,
          telegramChatId: chatId.toString(),
          telegramChatType: msg.chat.type,
          telegramChatTitle: msg.chat.title || null,
          createdBy: {
            telegramUserId: msg.from.id.toString(),
            telegramUsername: msg.from.username || null,
            telegramFirstName: msg.from.first_name,
            telegramLastName: msg.from.last_name || null
          }
        });

        await binding.save();

        // Update in-memory mappings
        telegramChats.set(actualRoomId, chatId.toString());
        roomMappings.set(chatId, actualRoomId);

        // Register room with federation registry
        try {
          await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
            roomId: actualRoomId,
            name: `Telegram Room ${actualRoomId}`,
            peerUrl: PLATFORM_URL
          });
        } catch (federationError: any) {
          console.warn(`⚠️ Failed to register room with federation:`, federationError.message);
        }

        bot!.sendMessage(chatId,
          `✅ Successfully connected to cross-platform room!\n\n` +
          `🏠 Room ID: ${actualRoomId}\n` +
          (roomId !== actualRoomId ? `🔑 Room Code: ${roomId}\n` : '') +
          `💬 Messages in this chat will now be shared with users on other platforms.\n` +
          `📱 Users on Sociality web app and Discord can now chat with you!\n\n` +
          `Commands:\n` +
          `/status - Check connection status\n` +
          `/leave - Disconnect from the room`
        );

      } catch (error: any) {
        console.error('Error binding room:', error);
        if (bot) bot.sendMessage(chatId, `❌ Failed to bind room: ${error.message}`);
      }
    }

    // Handle /leave command
    bot.onText(/\/leave/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const binding = await TelegramBinding.findByTelegramChatId(chatId.toString());
        if (!binding) {
          bot!.sendMessage(chatId, `❌ This chat is not connected to any room.`);
          return;
        }

        const roomId = binding.roomId;

        // Deactivate binding
        await binding.deactivate();

        // Remove from in-memory mappings
        telegramChats.delete(roomId);
        roomMappings.delete(chatId);

        bot!.sendMessage(chatId,
          `✅ Successfully disconnected from room ${roomId}.\n\n` +
          `You can join a new room using /join <room_id>`
        );

      } catch (error: any) {
        console.error('Error leaving room:', error);
        if (bot) bot.sendMessage(chatId, `❌ Failed to leave room: ${error.message}`);
      }
    });

    // Handle /status command
    bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const binding = await TelegramBinding.findByTelegramChatId(chatId.toString());

        let statusMessage = '📊 Connection Status:\n\n';
        statusMessage += `🔗 Chat ID: ${chatId}\n`;
        statusMessage += `🏠 Room ID: ${binding ? binding.roomId : 'Not connected to a room'}\n`;

        if (binding) {
          statusMessage += `📅 Connected since: ${binding.createdAt.toLocaleDateString()}\n`;
          statusMessage += `💬 Messages sent: ${binding.messageCount}\n`;
          statusMessage += `🕐 Last activity: ${binding.lastMessageAt.toLocaleString()}\n`;
        }

        try {
          const response = await axios.get(`${FEDERATION_REGISTRY_URL}/health`);
          statusMessage += `🌐 Federation Registry: ✅ Online\n`;
        } catch (error) {
          statusMessage += `🌐 Federation Registry: ❌ Offline\n`;
        }

        if (bot) bot.sendMessage(chatId, statusMessage);
      } catch (error: any) {
        console.error('Error getting status:', error);
        if (bot) bot.sendMessage(chatId, `❌ Failed to get status: ${error.message}`);
      }
    });

    // Handle regular messages (the missing piece!)
    bot.on('message', async (msg) => {
      // Skip if it's a command
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      // Skip non-text messages for now
      if (!msg.text) {
        return;
      }

      const chatId = msg.chat.id;

      try {
        // Find binding for this chat
        const binding = await TelegramBinding.findByTelegramChatId(chatId.toString());
        if (!binding) {
          return; // Not connected to a room, ignore message
        }

        const roomId = binding.roomId;

        // Store user info
        const username = msg.from?.username || msg.from?.first_name || 'Unknown User';

        // Prepare message for federation with correct structure
        const federatedMessage = {
          id: msg.message_id.toString(),
          text: msg.text,
          from: {
            userId: msg.from?.id.toString() || 'unknown',
            displayName: username,
            username: username,
            platform: 'telegram'
          },
          sentAt: new Date(msg.date * 1000).toISOString(),
          timestamp: new Date(msg.date * 1000).toISOString(),
          roomId
        };


        // Send to federation registry for relay
        await axios.post(`${FEDERATION_REGISTRY_URL}/federation/relay-message`, {
          roomId,
          message: federatedMessage,
          originatingPlatform: PLATFORM_URL
        });


        // Update binding message count
        try {
          binding.messageCount = (binding.messageCount || 0) + 1;
          binding.lastMessageAt = new Date();
          await binding.save();
        } catch (updateError: any) {
          console.warn('Failed to update binding message count:', updateError.message);
        }

      } catch (error: any) {
        console.error('❌ Error relaying message:', error);
      }
    });


  } catch (error: any) {
    console.warn('⚠️ Failed to initialize Telegram Bot:', error.message);
  }
} else {
  console.warn('⚠️ Telegram Bot Token not provided. Telegram integration disabled.');
}

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'ok',
    platform: 'telegram',
    timestamp: new Date().toISOString(),
    botActive: bot !== null,
    connectedChats: telegramChats.size
  });
});

// Connect a Telegram chat to a room
app.post('/connect-room', async (req: any, res: any) => {
  try {
    const { roomId, chatId } = req.body;

    if (!roomId || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and Chat ID are required'
      });
    }

    // Store the mapping
    telegramChats.set(roomId, chatId);
    roomMappings.set(chatId, roomId);


    // Send confirmation message to Telegram chat
    if (bot) {
      try {
        await bot.sendMessage(chatId,
          `🎉 Successfully connected to cross-platform room!\n\n` +
          `🏠 Room ID: ${roomId}\n` +
          `💬 You can now chat with users from other platforms.`
        );
      } catch (error: any) {
        console.warn('Failed to send confirmation to Telegram:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Telegram chat connected to room',
      roomId,
      chatId
    });
  } catch (error: any) {
    console.error('Error connecting Telegram chat to room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect chat to room',
      message: error.message
    });
  }
});

// Relay endpoint for receiving messages from Sociality
app.post('/api/cross-platform/relay', async (req: any, res: any) => {
  try {
    const { roomId, message } = req.body;

    if (!roomId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and message are required'
      });
    }

    // Find binding for this room
    const binding = await TelegramBinding.findByRoomId(roomId);
    if (!binding) {
      return res.status(404).json({
        success: false,
        error: 'No Telegram chat connected to this room'
      });
    }

    if (!bot) {
      return res.status(503).json({
        success: false,
        error: 'Telegram bot not available'
      });
    }

    // Don't relay messages that originated from Telegram
    if (message.from?.platform === 'telegram') {
      return res.json({
        success: true,
        message: 'Skipped - message originated from Telegram'
      });
    }

    // Handle attachments directly to avoid model conflicts
    const platformEmoji = message.from?.platform === 'sociality' ? '🌐' :
                         message.from?.platform === 'discord' ? '🎮' : '📱';

    const displayName = message.from?.displayName || message.from?.username || 'Unknown User';


    // Handle image attachments
    if (message.img && message.attachmentType === 'image') {

      const caption = `${platformEmoji} **${displayName}**${message.text ? `: ${message.text}` : ''}`;

      try {
        // Send the image with URL - Telegram Bot API supports URLs directly
        const result = await bot.sendPhoto(binding.telegramChatId, message.img, {
          caption: caption,
          parse_mode: 'Markdown'
        });
      } catch (photoError) {
        console.error(`❌ Failed to send photo with markdown:`, photoError);
        try {
          // Try without markdown parsing
          const simpleCaption = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}`;
          const result = await bot.sendPhoto(binding.telegramChatId, message.img, {
            caption: simpleCaption
          });
        } catch (photoError2) {
          console.error(`❌ Failed to send photo entirely:`, photoError2);
          // Final fallback: send as text message with image URL
          const fallbackText = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}\n\n📸 Image: ${message.img}`;
          await bot.sendMessage(binding.telegramChatId, fallbackText);
        }
      }
    }
    // Handle file attachments
    else if (message.file && message.attachmentType === 'document') {

      const caption = `${platformEmoji} **${displayName}**${message.text ? `: ${message.text}` : ''}`;

      try {
        // First, try sending the file URL directly to Telegram (most efficient)

        try {
          const result = await bot!.sendDocument(binding.telegramChatId, message.file, {
            caption: caption,
            parse_mode: 'Markdown'
          });
          return; // Success, exit early
        } catch (urlError) {
        }

        // Fallback: Download file from Cloudinary and send as buffer

        const response = await axios.get(message.file, {
          responseType: 'stream',
          timeout: 60000, // Increased timeout to 60 seconds
          headers: {
            'User-Agent': 'Sociality-Bot/1.0',
            'Accept': '*/*'
          },
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 300; // Accept only 2xx status codes
          }
        });


        // Send the file stream directly to Telegram
        const result = await bot!.sendDocument(binding.telegramChatId, response.data, {
          caption: caption,
          parse_mode: 'Markdown'
        });

      } catch (fileError: any) {
        console.error(`❌ Failed to send file after all attempts:`, {
          error: fileError.message,
          stack: fileError.stack,
          url: message.file,
          fileName: message.fileName
        });

        // Enhanced fallback: send as formatted text with file info and clickable link
        const fallbackText = `${caption}\n\n📎 **${message.fileName || 'File'}**\n🔗 [Download File](${message.file})\n\n⚠️ If the link doesn't work, the file may be temporarily unavailable.`;

        try {
          if (bot) {
            await bot.sendMessage(binding.telegramChatId, fallbackText, {
              parse_mode: 'Markdown',
              disable_web_page_preview: false // Allow link preview
            });
          }
        } catch (fallbackError: any) {
          console.error(`❌ Even fallback message failed:`, fallbackError.message);
          // Final fallback without markdown
          const simpleFallback = `${message.from.displayName}: ${message.text || '[File attachment]'}\n\nFile: ${message.fileName || 'Unknown'}\nLink: ${message.file}`;
          if (bot) await bot.sendMessage(binding.telegramChatId, simpleFallback);
        }
      }
    }
    // Handle text-only messages
    else if (message.text) {
      const formattedMessage = `${platformEmoji} ${displayName}:\n${message.text}`;
      if (bot) await bot.sendMessage(binding.telegramChatId, formattedMessage);
    }


    res.json({
      success: true,
      message: 'Message relayed to Telegram'
    });
  } catch (error: any) {
    console.error('Error relaying message to Telegram:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to relay message to Telegram',
      message: error.message
    });
  }
});

// Get connected rooms
app.get('/rooms', (req: any, res: any) => {
  try {
    const rooms = Array.from(telegramChats.entries()).map(([roomId, chatId]) => ({
      roomId,
      chatId,
      platform: 'telegram'
    }));

    res.json({
      success: true,
      rooms
    });
  } catch (error: any) {
    console.error('Error fetching Telegram rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms',
      message: error.message
    });
  }
});

// Register with federation registry
const registerWithFederation = async () => {
  try {
    await axios.post(`${FEDERATION_REGISTRY_URL}/federation/peers`, {
      name: 'telegram',
      url: PLATFORM_URL
    });

    // Re-register all existing rooms after peer registration
    await reRegisterExistingRooms();
  } catch (error: any) {
    console.warn('⚠️ Failed to register with federation registry:', error.message);
  }
};

// Re-register all existing rooms with federation registry
const reRegisterExistingRooms = async () => {
  try {
    // Get all existing telegram bindings from database
    const TelegramBinding = (await import('../models/telegramBindingModel.js')).default;
    const bindings = await TelegramBinding.find({});


    for (const binding of bindings) {
      try {
        await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
          roomId: binding.roomId,
          name: `Telegram Room ${binding.roomId}`,
          peerUrl: PLATFORM_URL
        });
      } catch (error: any) {
        console.warn(`⚠️ Failed to re-register room ${binding.roomId}:`, error.message);
      }
    }

  } catch (error: any) {
    console.warn('⚠️ Failed to re-register existing rooms:', error.message);
  }
};

// Start the Telegram service
const startTelegramService = () => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`📱 Telegram Service running on http://127.0.0.1:${PORT}`);

    // Register with federation registry after a short delay
    setTimeout(registerWithFederation, 2000);
  });
};

// Export for use in main server
export { app as telegramApp, startTelegramService };
export default app;
