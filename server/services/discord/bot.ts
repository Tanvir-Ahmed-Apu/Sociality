import { Client, IntentsBitField, SlashCommandBuilder, REST } from 'discord.js';

import axios from 'axios';
import DiscordBinding from '../../models/discordBindingModel.js';
import logger from '../../utils/logger.js';

export const discordChannels = new Map<string, string>(); // Map roomId -> channelId
export const roomMappings = new Map<string, string>(); // Map channelId -> roomId

let client: Client | null = null;
let DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://127.0.0.1:7300';
const PLATFORM_URL = process.env.DISCORD_PLATFORM_URL || 'http://127.0.0.1:7302';

export const getClient = () => client;

export async function initBot() {
  if (!DISCORD_BOT_TOKEN) {
    logger.warn('Discord Bot Token not provided. Discord integration disabled.');
    return null;
  }

  try {
    client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages
      ]
    });

    client.once('ready', async () => {
      logger.info(`Discord client ready: ${client?.user?.tag}`);
      await registerSlashCommands();
      await loadDiscordBindings();
    });

    client.on('interactionCreate', async (interaction: any) => {
      try {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'join') {
          await handleJoinCommand(interaction);
        } else if (commandName === 'leave') {
          await handleLeaveCommand(interaction);
        } else if (commandName === 'status') {
          await handleStatusCommand(interaction);
        }
      } catch (err: any) {
        logger.error('Error handling interaction:', err);
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: `An error occurred: ${err.message || err}` });
          } else {
            await interaction.reply({ content: `An error occurred: ${err.message || err}`, ephemeral: true });
          }
        } catch {}
      }
    });

    client.on('messageCreate', async (message) => {
      try {
        if (message.author.bot || !message.content) return;

        const channelId = message.channel.id;
        const binding = await (DiscordBinding as any).findByChannelId(channelId);
        let roomId: string | undefined | null = null;

        if (binding) roomId = binding.roomId;
        else roomId = roomMappings.get(channelId);
        if (!roomId) return;

        const federatedMessage = {
          from: {
            userId: message.author.id,
            displayName: (message.member && message.member.displayName) || message.author.username,
            platform: 'discord'
          },
          text: message.content,
          sentAt: new Date()
        };

        try {
          await axios.post(`${FEDERATION_REGISTRY_URL}/federation/relay-message`, {
            roomId,
            message: federatedMessage,
            originatingPlatform: PLATFORM_URL
          });

          if (binding) await binding.updateLastMessage();
        } catch (err: any) {
          logger.warn('Failed to relay Discord message:', err.message || err);
        }
      } catch (err: any) {
        logger.error('Error handling Discord message:', err);
      }
    });

    await client.login(DISCORD_BOT_TOKEN).catch((error: any) => {
      logger.warn('Failed to login to Discord:', error?.message || error);
      client = null;
    });

    return client;
  } catch (err: any) {
    logger.warn('Failed to initialize Discord Bot:', err?.message || err);
    client = null;
    return null;
  }
}

async function registerSlashCommands() {
  if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
    logger.warn('Discord Client ID or Bot Token missing. Slash commands not registered.');
    return;
  }

  const commands = [
    new SlashCommandBuilder().setName('join').setDescription('Join a cross-platform room').addStringOption(opt => opt.setName('roomid').setDescription('The room ID to join').setRequired(true)),
    new SlashCommandBuilder().setName('leave').setDescription('Leave the current cross-platform room'),
    new SlashCommandBuilder().setName('status').setDescription('Check the current room connection status')
  ];

  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
  try {
    await rest.put(`/applications/${DISCORD_CLIENT_ID}/commands` as any, { body: commands });
    logger.info('Registered Discord slash commands');
  } catch (err: any) {
    logger.error('Error registering Discord slash commands:', err);
  }
}

export async function loadDiscordBindings() {
  try {
    const bindings = await DiscordBinding.find({ isActive: true, isValid: true });
    for (const binding of bindings) {
      discordChannels.set(binding.roomId, binding.discordChannelId);
      roomMappings.set(binding.discordChannelId, binding.roomId);

      if (client && client.isReady()) {
        (binding as any).validateBinding(client).catch((e: any) => logger.error('Background validation failed:', e?.message || e));
      }
    }
    logger.info(`Loaded ${bindings.length} Discord bindings`);
  } catch (err: any) {
    logger.error('Error loading Discord bindings:', err?.message || err);
  }
}

export async function handleJoinCommand(interaction: any) {
  try {
    await interaction.deferReply();
    const roomIdInput = interaction.options.getString('roomid');
    const channelId = interaction.channel.id;
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const displayName = interaction.user.displayName || username;

    let actualRoomId = roomIdInput;
    if (roomIdInput.length <= 10) {
      const Room = (await import('../../models/roomModel.js')).default;
      const room = await Room.findOne({ roomCode: roomIdInput.toUpperCase() });
      if (room) actualRoomId = room.roomId;
    }

    const existingBinding = await (DiscordBinding as any).findByChannelId(channelId);
    if (existingBinding) {
      await interaction.editReply({ content: `This channel is already connected to room: ${existingBinding.roomId}`, ephemeral: true });
      return;
    }

    const roomBinding = await (DiscordBinding as any).findByRoomId(actualRoomId);
    if (roomBinding) {
      await interaction.editReply({ content: `Room ${roomIdInput} is already connected`, ephemeral: true });
      return;
    }

    const binding = new DiscordBinding({
      roomId: actualRoomId,
      discordChannelId: channelId,
      discordGuildId: interaction.guild?.id,
      discordChannelName: interaction.channel.name,
      discordGuildName: interaction.guild?.name,
      createdBy: { discordUserId: userId, discordUsername: username, discordDisplayName: displayName }
    });

    await binding.save();
    discordChannels.set(actualRoomId, channelId);
    roomMappings.set(channelId, actualRoomId);

    try {
      await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, { roomId: actualRoomId, name: `Discord Room ${actualRoomId}`, peerUrl: PLATFORM_URL });
    } catch (e: any) {
      logger.warn('Failed to register room with federation registry:', e?.message || e);
    }

    await interaction.editReply({ content: `Connected to room ${actualRoomId}` });
  } catch (err: any) {
    logger.error('Error handling Discord /join command:', err);
    try { await interaction.editReply({ content: `Failed to join room: ${err.message || err}`, ephemeral: true }); } catch {}
  }
}

export async function handleLeaveCommand(interaction: any) {
  try {
    await interaction.deferReply();
    const channelId = interaction.channel.id;
    const binding = await (DiscordBinding as any).findByChannelId(channelId);
    if (!binding) {
      await interaction.editReply({ content: `This channel is not connected to any room.`, ephemeral: true });
      return;
    }

    binding.isActive = false;
    await binding.save();
    discordChannels.delete(binding.roomId);
    roomMappings.delete(channelId);

    await interaction.editReply({ content: `Disconnected from room ${binding.roomId}` });
  } catch (err: any) {
    logger.error('Error handling Discord /leave command:', err);
    try { await interaction.editReply({ content: `Failed to leave room: ${err.message || err}`, ephemeral: true }); } catch {}
  }
}

export async function handleStatusCommand(interaction: any) {
  try {
    await interaction.deferReply();
    const channelId = interaction.channel.id;
    const binding = await (DiscordBinding as any).findByChannelId(channelId);
    if (binding) {
      await interaction.editReply({ content: `Connected to room ${binding.roomId} since ${binding.createdAt.toLocaleDateString()}` });
    } else {
      await interaction.editReply({ content: `Not connected to any room` });
    }
  } catch (err: any) {
    logger.error('Error handling Discord /status command:', err);
    try { await interaction.editReply({ content: `Failed to get status: ${err.message || err}`, ephemeral: true }); } catch {}
  }
}
