import axios from 'axios';
import DiscordBinding from '../../models/discordBindingModel.js';
import logger from '../../utils/logger.js';

const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://127.0.0.1:7300';
const PLATFORM_URL = process.env.DISCORD_PLATFORM_URL || 'http://127.0.0.1:7302';

export const registerWithFederation = async () => {
  try {
    await axios.post(`${FEDERATION_REGISTRY_URL}/federation/peers`, { name: 'discord', url: PLATFORM_URL });
    await reRegisterExistingRooms();
    logger.info('Registered Discord service with federation registry');
  } catch (err: any) {
    logger.warn('Failed to register Discord with federation registry:', err?.message || err);
  }
};

export const reRegisterExistingRooms = async () => {
  try {
    const bindings = await DiscordBinding.find({});
    for (const b of bindings) {
      try {
        await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, { roomId: b.roomId, name: `Discord Room ${b.roomId}`, peerUrl: PLATFORM_URL });
      } catch (err: any) {
        logger.warn(`Failed to re-register room ${b.roomId}:`, err?.message || err);
      }
    }
  } catch (err: any) {
    logger.warn('Failed to re-register existing Discord rooms:', err?.message || err);
  }
};
