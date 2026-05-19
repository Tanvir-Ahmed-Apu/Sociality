import { FaGlobe, FaTelegram, FaDiscord, FaUsers } from 'react-icons/fa';

export const PLATFORMS: any = {
  sociality: { icon: FaGlobe, color: "#00B374", label: "Sociality" },
  telegram: { icon: FaTelegram, color: "#0088cc", label: "Telegram" },
  discord: { icon: FaDiscord, color: "#5865F2", label: "Discord" },
  default: { icon: FaUsers, color: "gray.500", label: "Other" }
};
