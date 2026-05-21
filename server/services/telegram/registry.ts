import axios from 'axios';
import TelegramBinding from '../../models/telegramBindingModel.js';
import logger from '../../utils/logger.js';

const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || 'http://127.0.0.1:7300';
const PLATFORM_URL = process.env.TELEGRAM_PLATFORM_URL || 'http://127.0.0.1:7301';

export const registerWithFederation = async () => {
  try {
    await axios.post(`${FEDERATION_REGISTRY_URL}/federation/peers`, { name: 'telegram', url: PLATFORM_URL });
    await reRegisterExistingRooms();
    logger.info('Registered Telegram service with federation registry');
  } catch (error: any) {
    logger.warn('Failed to register Telegram with federation registry:', error?.message || error);
  }
};

export const reRegisterExistingRooms = async () => {
  try {
    const bindings = await TelegramBinding.find({});
    for (const binding of bindings) {
      try {
        await axios.post(`${FEDERATION_REGISTRY_URL}/federation/rooms`, { roomId: binding.roomId, name: `Telegram Room ${binding.roomId}`, peerUrl: PLATFORM_URL });
      } catch (error: any) {
        logger.warn(`Failed to re-register room ${binding.roomId}:`, error?.message || error);
      }
    }
  } catch (error: any) {
    logger.warn('Failed to re-register existing Telegram rooms:', error?.message || error);
  }
};
