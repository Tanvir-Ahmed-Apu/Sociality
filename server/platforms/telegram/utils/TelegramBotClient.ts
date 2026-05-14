import EventEmitter from 'events';

export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    type: string;
    title?: string;
  };
  date: number;
  text?: string;
  caption?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

export class TelegramBotClient extends EventEmitter {
  private token: string;
  private baseUrl: string;
  private polling: boolean = false;
  private lastUpdateId: number = 0;
  private textHandlers: Array<{ regex: RegExp; handler: (msg: TelegramMessage, match: RegExpExecArray | null) => void }> = [];

  constructor(token: string) {
    super();
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  private async request(method: string, body: any = {}) {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API Error: ${data.description}`);
    }
    return data.result;
  }

  async sendMessage(chatId: string | number, text: string, options: any = {}) {
    return this.request('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  async sendPhoto(chatId: string | number, photo: string, options: any = {}) {
    return this.request('sendPhoto', {
      chat_id: chatId,
      photo,
      ...options,
    });
  }

  async sendDocument(chatId: string | number, document: string, options: any = {}) {
    return this.request('sendDocument', {
      chat_id: chatId,
      document,
      ...options,
    });
  }

  async getChat(chatId: string | number) {
    return this.request('getChat', {
      chat_id: chatId,
    });
  }

  async getUserProfilePhotos(userId: string | number, options: any = {}) {
    return this.request('getUserProfilePhotos', {
      user_id: userId,
      ...options,
    });
  }

  async getFile(fileId: string) {
    return this.request('getFile', {
      file_id: fileId,
    });
  }

  async getFileLink(fileId: string) {
    const file = await this.getFile(fileId);
    return `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;
  }

  onText(regex: RegExp, handler: (msg: TelegramMessage, match: RegExpExecArray | null) => void) {
    this.textHandlers.push({ regex, handler });
  }

  startPolling() {
    if (this.polling) return;
    this.polling = true;
    this.poll();
  }

  stopPolling() {
    this.polling = false;
  }

  private async poll() {
    while (this.polling) {
      try {
        const updates = await this.request('getUpdates', {
          offset: this.lastUpdateId + 1,
          timeout: 30,
        });

        for (const update of updates) {
          this.lastUpdateId = update.update_id;
          this.handleUpdate(update);
        }
      } catch (error: any) {
        this.emit('polling_error', error);
        this.emit('error', error);
        // Wait a bit before retrying on error
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private handleUpdate(update: TelegramUpdate) {
    const message = update.message || update.edited_message || update.channel_post || update.edited_channel_post;
    if (!message) return;

    this.emit('message', message);

    if (message.text) {
      for (const { regex, handler } of this.textHandlers) {
        const match = regex.exec(message.text);
        if (match) {
          handler(message, match);
        }
      }
    }
  }
}

export default TelegramBotClient;
