import express from 'express';
import cors from 'cors';
import router from './discord/routes.js';
import { initBot } from './discord/bot.js';
import { registerWithFederation } from './discord/registry.js';

const app = express();
const PORT = Number(process.env.DISCORD_PORT) || 7302;

app.use(cors());
app.use(express.json());
app.use('/', router);

const startDiscordService = async () => {
  // initialize bot (non-blocking)
  initBot().catch(() => {});

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Discord Service running on http://127.0.0.1:${PORT}`);
    setTimeout(registerWithFederation, 2000);
  });
};

export { app as discordApp, startDiscordService };
export default app;
