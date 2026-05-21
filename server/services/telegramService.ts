import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './telegram/routes.js';
import { initBot } from './telegram/bot.js';
import { registerWithFederation } from './telegram/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.TELEGRAM_PORT) || 7301;

app.use(cors());
app.use(express.json());
app.use('/', router);

const startTelegramService = async () => {
  initBot().catch(() => {});

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Telegram Service running on http://127.0.0.1:${PORT}`);
    setTimeout(registerWithFederation, 2000);
  });
};

export { app as telegramApp, startTelegramService };
export default app;
