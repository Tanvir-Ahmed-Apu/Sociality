import TelegramBinding from '../models/TelegramBinding';

// Relay message to Telegram
export async function relayMessageToTelegram(bot: any, roomId: string, message: any, roomToChatMap: Map<string, string>) {
  try {
    // Find Telegram chat bound to this room
    const binding: any = await TelegramBinding.findOne({
      $or: [
        { platformRoomId: roomId },
        { roomId: roomId }
      ]
    });

    let chatId;
    if (!binding) {
      // Check in-memory map as fallback
      chatId = roomToChatMap.get(roomId);
      if (!chatId) {
        console.log(`No Telegram binding found for room ${roomId}`);
        return;
      }
    } else {
      chatId = binding.telegramChatId;
    }

    // Send message with attachments to Telegram
    await sendMessageToTelegram(bot, chatId, message);

    // Update last used timestamp if using database binding
    if (binding) {
      binding.lastUsedAt = new Date();
      await binding.save();
    }

    console.log(`Message relayed to Telegram chat ${chatId} for room ${roomId}`);
  } catch (error: any) {
    console.error('Error relaying message to Telegram:', error.message);
    throw error;
  }
}

// Send message to Telegram with support for attachments
export async function sendMessageToTelegram(bot: any, chatId: string, message: any) {
  const platform = message.from?.platform || 'unknown';
  const displayName = message.from?.displayName || message.from?.username || message.from?.userId || 'Unknown User';
  const platformEmoji = getPlatformEmoji(platform);

  // Create caption for media or text message
  const caption = `${platformEmoji} **${displayName}**${message.text ? `: ${message.text}` : ''}`;

  console.log(`🔍 Telegram Debug - Message data:`, {
    img: message.img,
    file: message.file,
    attachmentType: message.attachmentType,
    fileName: message.fileName,
    text: message.text,
    platform: platform,
    displayName: displayName
  });

  try {
    // Handle image attachments
    if (message.img && message.attachmentType === 'image') {
      console.log(`📸 Attempting to send image to Telegram chat ${chatId}: ${message.img}`);
      console.log(`📸 Caption: ${caption}`);
      try {
        // Send the image with URL - Telegram Bot API supports URLs directly
        const result = await bot.sendPhoto(chatId, message.img, {
          caption: caption,
          parse_mode: 'Markdown'
        });
        console.log(`✅ Successfully sent image to Telegram chat ${chatId}`, result.message_id);
        return;
      } catch (photoError: any) {
        console.error(`❌ Failed to send photo with markdown:`, photoError);
        try {
          // Try without markdown parsing
          const simpleCaption = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}`;
          const result = await bot.sendPhoto(chatId, message.img, {
            caption: simpleCaption
          });
          console.log(`✅ Successfully sent image to Telegram chat ${chatId} (no markdown)`, result.message_id);
          return;
        } catch (photoError2: any) {
          console.error(`❌ Failed to send photo entirely:`, photoError2);
          // Final fallback: send as text message with image URL
          const fallbackText = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}\n\n📸 Image: ${message.img}`;
          await bot.sendMessage(chatId, fallbackText);
          console.log(`✅ Sent image URL as text to Telegram chat ${chatId}`);
          return;
        }
      }
    }

    // Handle file attachments
    if (message.file && message.attachmentType === 'document') {
      console.log(`📎 Attempting to send document to Telegram chat ${chatId}: ${message.file} (${message.fileName})`);

      // Try direct URL method first
      try {
        await bot.sendDocument(chatId, message.file, {
          caption: caption,
          parse_mode: 'Markdown'
        });
        console.log(`✅ Successfully sent document to Telegram chat ${chatId}: ${message.fileName}`);
        return;
      } catch (docError: any) {
        console.error(`❌ Failed to send document with markdown, trying without parse_mode:`, docError.message);

        // Try without markdown parsing
        try {
          await bot.sendDocument(chatId, message.file, {
            caption: `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}`
          });
          console.log(`✅ Successfully sent document to Telegram chat ${chatId} (no markdown): ${message.fileName}`);
          return;
        } catch (docError2: any) {
          console.error(`❌ Failed to send document entirely, sending fallback message:`, docError2.message);

          // Final fallback: send as text with clickable link
          const fallbackText = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}\n\n📎 [${message.fileName || 'File'}](${message.file})`;
          try {
            await bot.sendMessage(chatId, fallbackText, { parse_mode: 'Markdown' });
            console.log(`✅ Sent file link as fallback to Telegram chat ${chatId}`);
          } catch (fallbackError: any) {
            // Ultra fallback without markdown
            const simpleFallback = `${platformEmoji} ${displayName}${message.text ? `: ${message.text}` : ''}\n\nFile: ${message.fileName || 'Unknown'}\nLink: ${message.file}`;
            await bot.sendMessage(chatId, simpleFallback);
            console.log(`✅ Sent simple file fallback to Telegram chat ${chatId}`);
          }
          return;
        }
      }
    }

    // Handle text-only messages
    if (message.text) {
      console.log(`💬 Sending text message to Telegram chat ${chatId}: ${message.text}`);
      await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown'
      });
      console.log(`✅ Successfully sent text message to Telegram chat ${chatId}`);
      return;
    }

    console.log(`⚠️ No content to send to Telegram chat ${chatId} - message:`, message);
  } catch (error: any) {
    console.error(`❌ Error sending message to Telegram chat ${chatId}:`, error.message);
    console.error(`❌ Full error details:`, error);

    // Fallback: try sending as plain text without markdown
    try {
      const fallbackMessage = `${platformEmoji} ${displayName}: ${message.text || '[Attachment]'}`;
      console.log(`🔄 Attempting fallback message to Telegram chat ${chatId}: ${fallbackMessage}`);
      await bot.sendMessage(chatId, fallbackMessage);
      console.log(`✅ Successfully sent fallback message to Telegram chat ${chatId}`);
    } catch (fallbackError: any) {
      console.error(`❌ Fallback message also failed for Telegram chat ${chatId}:`, fallbackError.message);
      console.error(`❌ Fallback error details:`, fallbackError);
      throw fallbackError;
    }
  }
}

// Format message for Telegram display
export function formatMessageForTelegram(message: any) {
  const platform = message.from?.platform || 'unknown';
  const displayName = message.from?.displayName || message.from?.username || message.from?.userId || 'Unknown User';
  const platformEmoji = getPlatformEmoji(platform);

  return `${platformEmoji} **${displayName}**: ${message.text}`;
}

// Get emoji for platform
export function getPlatformEmoji(platform: string) {
  const emojiMap: Record<string, string> = {
    'sociality': '🌐',
    'platform-a': '🌐',
    'discord': '🎮',
    'platform-c': '🎮',
    'telegram': '📱',
    'platform-b': '📱',
    'web': '💻',
    'mobile': '📱'
  };

  return emojiMap[platform] || '💬';
}

// Validate Telegram binding
export async function validateTelegramBinding(bot: any, binding: any) {
  try {
    // Try to get chat info to validate the binding
    const chat = await bot.getChat(binding.telegramChatId);

    if (chat) {
      binding.isValid = true;
      binding.lastValidatedAt = new Date();
      await binding.save();
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`Telegram binding validation failed for chat ${binding.telegramChatId}:`, error.message);

    // Mark binding as invalid
    binding.isValid = false;
    binding.lastValidatedAt = new Date();
    await binding.save();

    return false;
  }
}

// Load all Telegram bindings and validate them
export async function loadAndValidateTelegramBindings(bot: any, chatToRoomMap: Map<string, string>, roomToChatMap: Map<string, string>) {
  try {
    const bindings = await TelegramBinding.find({ isValid: true });

    console.log(`Loading ${bindings.length} Telegram bindings...`);

    for (const binding of bindings) {
      // Add to in-memory maps
      chatToRoomMap.set(binding.telegramChatId, binding.roomId || binding.platformRoomId);
      roomToChatMap.set(binding.roomId || binding.platformRoomId, binding.telegramChatId);

      // Validate binding in background
      validateTelegramBinding(bot, binding).catch((error: any) => {
        console.error(`Background validation failed for binding ${binding._id}:`, error.message);
      });
    }

    console.log(`Loaded ${bindings.length} Telegram bindings into memory`);
  } catch (error: any) {
    console.error('Error loading Telegram bindings:', error.message);
  }
}
