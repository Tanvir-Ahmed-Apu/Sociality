import axios from 'axios';
import TelegramBinding from '../../models/telegramBindingModel.js';
import Room from '../../models/roomModel.js';
import TelegramBotClient from '../../utils/TelegramBotClient.js';
import logger from '../../utils/logger.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://127.0.0.1:7300';
const PLATFORM_URL = process.env.TELEGRAM_PLATFORM_URL || 'http://127.0.0.1:7301';

export const telegramChats = new Map<string, string>();
export const roomMappings = new Map<string, string>();

let bot: any = null;

export const getBot = () => bot;

export async function initBot() {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
    logger.warn('Telegram Bot Token not provided. Telegram integration disabled.');
    return null;
  }

  try {
    bot = new TelegramBotClient(TELEGRAM_BOT_TOKEN);
    bot.startPolling();

    bot.on('polling_error', (error: any) => {
      logger.warn('Telegram polling error:', error?.message || error);
    });

    bot.on('error', (error: any) => {
      logger.warn('Telegram bot error:', error?.message || error);
    });

    bot.onText(/\/start/, (msg: any) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId,
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

    bot.onText(/\/help/, (msg: any) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId,
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

    bot.onText(/\/join (.+)/, async (msg: any, match: any) => {
      await handleRoomBinding(msg, match);
    });

    bot.onText(/\/bind (.+)/, async (msg: any, match: any) => {
      await handleRoomBinding(msg, match);
    });

    bot.onText(/\/leave/, async (msg: any) => {
      await handleLeaveCommand(msg);
    });

    bot.onText(/\/status/, async (msg: any) => {
      await handleStatusCommand(msg);
    });

    bot.on('message', async (msg: any) => {
      await handleIncomingMessage(msg);
    });

    await loadTelegramBindings();
    return bot;
  } catch (error: any) {
    logger.warn('Failed to initialize Telegram Bot:', error?.message || error);
    bot = null;
    return null;
  }
}

export async function loadTelegramBindings() {
  try {
    const bindings = await TelegramBinding.find({ isActive: true });
    for (const binding of bindings) {
      telegramChats.set(binding.roomId, binding.telegramChatId);
      roomMappings.set(binding.telegramChatId, binding.roomId);
    }
    logger.info(`Loaded ${bindings.length} Telegram bindings`);
  } catch (error: any) {
    logger.error('Error loading Telegram bindings:', error?.message || error);
  }
}

async function handleRoomBinding(msg: any, match: any) {
  const chatId = msg.chat.id;
  const roomId = match?.[1]?.trim();
  if (!roomId) {
    bot.sendMessage(chatId, '❌ Please provide a room ID. Usage: /bind <room-id>');
    return;
  }

  try {
    const existingBinding = await TelegramBinding.findOne({ telegramChatId: chatId.toString(), isActive: true });
    if (existingBinding) {
      bot.sendMessage(chatId,
        `❌ This Telegram chat is already connected to room: ${existingBinding.roomId}\n\n` +
        'Use /leave to disconnect first, then try joining a new room.'
      );
      return;
    }

    let actualRoomId = roomId;
    if (roomId.length <= 10) {
      const room = await Room.findOne({ roomCode: roomId.toUpperCase() });
      if (room) actualRoomId = room.roomId;
    }

    const roomBinding = await TelegramBinding.findOne({ roomId: actualRoomId, isActive: true });
    if (roomBinding) {
      bot.sendMessage(chatId,
        `❌ Room ${roomId} is already connected to another Telegram chat.\n\n` +
        'Each room can only be bound to one Telegram chat at a time.'
      );
      return;
    }

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
    telegramChats.set(actualRoomId, chatId.toString());
    roomMappings.set(chatId.toString(), actualRoomId);

    try {
      await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, {
        roomId: actualRoomId,
        name: `Telegram Room ${actualRoomId}`,
        peerUrl: PLATFORM_URL
      });
    } catch (error: any) {
      logger.warn('Failed to register room with federation:', error?.message || error);
    }

    bot.sendMessage(chatId,
      `✅ Successfully connected to cross-platform room!\n\n` +
      `🏠 Room ID: ${actualRoomId}\n` +
      (roomId !== actualRoomId ? `🔑 Room Code: ${roomId}\n` : '') +
      '💬 Messages in this chat will now be shared with users on other platforms.\n' +
      '📱 Users on Sociality web app and Discord can now chat with you!\n\n' +
      'Commands:\n' +
      '/status - Check connection status\n' +
      '/leave - Disconnect from the room'
    );
  } catch (error: any) {
    logger.error('Error binding room:', error?.message || error);
    if (bot) bot.sendMessage(chatId, `❌ Failed to bind room: ${error?.message || error}`);
  }
}

async function handleLeaveCommand(msg: any) {
  const chatId = msg.chat.id;
  try {
    const binding = await TelegramBinding.findOne({ telegramChatId: chatId.toString(), isActive: true });
    if (!binding) {
      bot.sendMessage(chatId, '❌ This chat is not connected to any room.');
      return;
    }

    const roomId = binding.roomId;
    await (binding as any).deactivate();
    telegramChats.delete(roomId);
    roomMappings.delete(chatId.toString());

    bot.sendMessage(chatId,
      `✅ Successfully disconnected from room ${roomId}.\n\n` +
      'You can join a new room using /join <room_id>'
    );
  } catch (error: any) {
    logger.error('Error leaving room:', error?.message || error);
    if (bot) bot.sendMessage(chatId, `❌ Failed to leave room: ${error?.message || error}`);
  }
}

async function handleStatusCommand(msg: any) {
  const chatId = msg.chat.id;
  try {
    const binding = await TelegramBinding.findOne({ telegramChatId: chatId.toString(), isActive: true });
    let statusMessage = '📊 Connection Status:\n\n';
    statusMessage += `🔗 Chat ID: ${chatId}\n`;
    statusMessage += `🏠 Room ID: ${binding ? binding.roomId : 'Not connected to a room'}\n`;

    if (binding) {
      statusMessage += `📅 Connected since: ${binding.createdAt.toLocaleDateString()}\n`;
      statusMessage += `💬 Messages sent: ${binding.messageCount}\n`;
      statusMessage += `🕐 Last activity: ${binding.lastMessageAt.toLocaleString()}\n`;
    }

    try {
      await axios.get(`${FEDERATION_REGISTRY_URL}/health`);
      statusMessage += '🌐 Federation Registry: ✅ Online\n';
    } catch {
      statusMessage += '🌐 Federation Registry: ❌ Offline\n';
    }

    if (bot) bot.sendMessage(chatId, statusMessage);
  } catch (error: any) {
    logger.error('Error getting status:', error?.message || error);
    if (bot) bot.sendMessage(chatId, `❌ Failed to get status: ${error?.message || error}`);
  }
}

async function handleIncomingMessage(msg: any) {
  if (msg.text && msg.text.startsWith('/')) return;
  if (!msg.text) return;

  const chatId = msg.chat.id;
  try {
const binding = await TelegramBinding.findOne({ telegramChatId: chatId.toString(), isActive: true });
    if (!binding) return;

    const username = msg.from?.username || msg.from?.first_name || 'Unknown User';
    const federatedMessage = {
      id: msg.message_id?.toString() || '',
      text: msg.text,
      from: {
        userId: msg.from?.id?.toString() || 'unknown',
        displayName: username,
        username,
        platform: 'telegram'
      },
      sentAt: new Date((msg.date || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      timestamp: new Date((msg.date || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      roomId: binding.roomId
    };

    await axios.post(`${FEDERATION_REGISTRY_URL}/federation/relay-message`, {
      roomId: binding.roomId,
      message: federatedMessage,
      originatingPlatform: PLATFORM_URL
    });

    binding.messageCount = (binding.messageCount || 0) + 1;
    binding.lastMessageAt = new Date();
    await binding.save();
  } catch (error: any) {
    logger.error('Error relaying Telegram message:', error?.message || error);
  }
}
