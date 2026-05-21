import express from 'express';
import axios from 'axios';
import DiscordBinding from '../../models/discordBindingModel.js';
import { discordChannels, roomMappings, getClient } from './bot.js';
import logger from '../../utils/logger.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const client = getClient();
  res.json({ status: 'ok', platform: 'discord', timestamp: new Date().toISOString(), botActive: client !== null && (client as any)?.isReady?.(), connectedChannels: discordChannels.size });
});

router.post('/connect-room', async (req, res) => {
  try {
    const { roomId, channelId } = req.body;
    if (!roomId || !channelId) return res.status(400).json({ success: false, error: 'Room ID and Channel ID are required' });

    discordChannels.set(roomId, channelId);
    roomMappings.set(channelId, roomId);

    const client = getClient();
    if (client && (client as any).isReady && (client as any).isReady()) {
      try {
        const channel = await (client as any).channels.fetch(channelId);
        if (channel && channel.isTextBased && channel.isTextBased()) {
          await channel.send(`Connected to cross-platform room ${roomId}`);
        }
      } catch (err: any) {
        logger.warn('Failed to send confirmation to Discord channel:', err?.message || err);
      }
    }

    res.json({ success: true, message: 'Discord channel connected to room', roomId, channelId });
  } catch (err: any) {
    logger.error('Error connecting Discord channel to room:', err);
    res.status(500).json({ success: false, error: 'Failed to connect channel to room', message: err?.message || err });
  }
});

router.post('/api/cross-platform/relay', async (req, res) => {
  try {
    const { roomId, message } = req.body;
    if (!roomId || !message) return res.status(400).json({ success: false, error: 'Room ID and message are required' });

    const binding = await DiscordBinding.findByRoomId(roomId);
    let channelId = binding ? binding.discordChannelId : discordChannels.get(roomId);
    if (!channelId) return res.status(404).json({ success: false, error: 'No Discord channel connected to this room' });

    const client = getClient();
    if (!client || !(client as any).isReady || !(client as any).isReady()) return res.status(503).json({ success: false, error: 'Discord bot not available' });

    const channel = await (client as any).channels.fetch(channelId);
    if (!channel || !channel.isTextBased || !channel.isTextBased()) {
      if (binding) { binding.isValid = false; await binding.save(); }
      return res.status(404).json({ success: false, error: 'Discord channel not found or not text-based' });
    }

    if (message.from?.platform === 'discord') return res.json({ success: true, message: 'Message originated from Discord, skipping relay' });

    const platformEmoji = message.from?.platform === 'sociality' ? '🌐' : message.from?.platform === 'telegram' ? '📱' : '🎮';
    const displayName = message.from?.displayName || message.from?.username || 'Unknown User';

    if (message.img && message.attachmentType === 'image') {
      const content = `${platformEmoji} **${displayName}**${message.text ? `: ${message.text}` : ''}`;
      try {
        await channel.send({ embeds: [{ description: content, image: { url: message.img }, color: 0x00ff00 }] } as any);
      } catch (embedError) {
        logger.error('Failed to send image embed to Discord:', embedError);
        await channel.send(`${content}\n\n📸 Image: ${message.img}`);
      }
    } else if (message.file && message.attachmentType === 'document') {
      const content = `${platformEmoji} **${displayName}**${message.text ? `: ${message.text}` : ''}`;
      try {
        const response = await axios.get(message.file, { responseType: 'stream', timeout: 60000 });
        const { AttachmentBuilder } = await import('discord.js');
        const attachment = new AttachmentBuilder(response.data, { name: message.fileName || 'file' });
        await channel.send({ content, files: [attachment] } as any);
      } catch (fileError) {
        logger.error('Failed to send file to Discord:', fileError);
        await channel.send({ embeds: [{ description: `${content}\n[Download File](${message.file})`, color: 0xffa500 }] } as any);
      }
    } else if (message.text) {
      const formatted = `${platformEmoji} **${displayName}** (${message.from?.platform || 'unknown'}):\n${message.text}`;
      await channel.send(formatted);
    }

    res.json({ success: true, message: 'Message relayed to Discord' });
  } catch (err: any) {
    logger.error('Error relaying message to Discord:', err);
    res.status(500).json({ success: false, error: 'Failed to relay message to Discord', message: err?.message || err });
  }
});

router.get('/rooms', (req, res) => {
  try {
    const rooms = Array.from(discordChannels.entries()).map(([roomId, channelId]) => ({ roomId, channelId, platform: 'discord' }));
    res.json({ success: true, rooms });
  } catch (err: any) {
    logger.error('Error fetching Discord rooms:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms', message: err?.message || err });
  }
});

router.post('/send-message', async (req, res) => {
  try {
    const { channelId, message } = req.body;
    if (!channelId || !message) return res.status(400).json({ success: false, error: 'Channel ID and message are required' });

    const client = getClient();
    if (!client || !(client as any).isReady || !(client as any).isReady()) return res.status(503).json({ success: false, error: 'Discord bot not available' });

    const channel = await (client as any).channels.fetch(channelId);
    if (!channel || !channel.isTextBased || !channel.isTextBased()) return res.status(404).json({ success: false, error: 'Discord channel not found or not text-based' });

    await channel.send(message);
    res.json({ success: true, message: 'Message sent to Discord channel' });
  } catch (err: any) {
    logger.error('Error sending message to Discord:', err);
    res.status(500).json({ success: false, error: 'Failed to send message to Discord', message: err?.message || err });
  }
});

export default router;
