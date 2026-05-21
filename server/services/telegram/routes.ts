import express from 'express';
import axios from 'axios';
import TelegramBinding from '../../models/telegramBindingModel.js';
import { getBot, telegramChats } from './bot.js';
import logger from '../../utils/logger.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const bot = getBot();
  res.json({
    status: 'ok',
    platform: 'telegram',
    timestamp: new Date().toISOString(),
    botActive: bot !== null,
    connectedChats: telegramChats.size
  });
});

router.post('/connect-room', async (req, res) => {
  try {
    const { roomId, chatId } = req.body;
    if (!roomId || !chatId) return res.status(400).json({ success: false, error: 'Room ID and Chat ID are required' });

    telegramChats.set(roomId, chatId);
    const bot = getBot();
    if (bot) {
      try {
        await bot.sendMessage(chatId,
          `🎉 Successfully connected to cross-platform room!

` +
          `🏠 Room ID: ${roomId}
` +
          `💬 You can now chat with users from other platforms.`
        );
      } catch (error: any) {
        logger.warn('Failed to send confirmation to Telegram:', error?.message || error);
      }
    }

    res.json({ success: true, message: 'Telegram chat connected to room', roomId, chatId });
  } catch (error: any) {
    logger.error('Error connecting Telegram chat to room:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to connect chat to room', message: error?.message || error });
  }
});

router.post('/api/cross-platform/relay', async (req, res) => {
  try {
    const { roomId, message } = req.body;
    if (!roomId || !message) return res.status(400).json({ success: false, error: 'Room ID and message are required' });

    const binding = await TelegramBinding.findOne({ roomId, isActive: true });
    if (!binding) return res.status(404).json({ success: false, error: 'No Telegram chat connected to this room' });

    const bot = getBot();
    if (!bot) return res.status(503).json({ success: false, error: 'Telegram bot not available' });
    if (message.from?.platform === 'telegram') return res.json({ success: true, message: 'Skipped - message originated from Telegram' });

    const platformEmoji = message.from?.platform === 'sociality' ? '🌐' : message.from?.platform === 'discord' ? '🎮' : '📱';
    const displayName = message.from?.displayName || message.from?.username || 'Unknown User';
    const chatId = binding.telegramChatId;

    if (message.img && message.attachmentType === 'image') {
      const caption = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}`;
      try {
        await bot.sendPhoto(chatId, message.img, { caption, parse_mode: 'Markdown' });
      } catch (error: any) {
        logger.error('Failed to send photo with markdown:', error?.message || error);
        const simpleCaption = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}`;
        try {
          await bot.sendPhoto(chatId, message.img, { caption: simpleCaption });
        } catch (innerError: any) {
          logger.error('Failed to send photo entirely:', innerError?.message || innerError);
          await bot.sendMessage(chatId, `${simpleCaption}

📸 Image: ${message.img}`);
        }
      }
    } else if (message.file && message.attachmentType === 'document') {
      const caption = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}`;
      try {
        await bot.sendDocument(chatId, message.file, { caption, parse_mode: 'Markdown' });
      } catch {
        try {
          const response = await axios.get(message.file, { responseType: 'stream', timeout: 60000 });
          await bot.sendDocument(chatId, response.data, { caption, parse_mode: 'Markdown' });
        } catch (fileError: any) {
          logger.error('Failed to send file after all attempts:', fileError?.message || fileError);
          const fallbackText = `${caption}

📎 **${message.fileName || 'File'}**
🔗 ${message.file}`;
          try {
            await bot.sendMessage(chatId, fallbackText, { parse_mode: 'Markdown', disable_web_page_preview: false });
          } catch (fallbackError: any) {
            logger.error('Even fallback message failed:', fallbackError?.message || fallbackError);
            await bot.sendMessage(chatId, `${displayName}: ${message.text || '[File attachment]'}

File: ${message.fileName || 'Unknown'}
Link: ${message.file}`);
          }
        }
      }
    } else if (message.text) {
      await bot.sendMessage(chatId, `${platformEmoji} ${displayName}:
${message.text}`);
    }

    res.json({ success: true, message: 'Message relayed to Telegram' });
  } catch (error: any) {
    logger.error('Error relaying message to Telegram:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to relay message to Telegram', message: error?.message || error });
  }
});

router.get('/rooms', (req, res) => {
  try {
    const rooms = Array.from(telegramChats.entries()).map(([roomId, chatId]) => ({ roomId, chatId, platform: 'telegram' }));
    res.json({ success: true, rooms });
  } catch (error: any) {
    logger.error('Error fetching Telegram rooms:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms', message: error?.message || error });
  }
});

export default router;
