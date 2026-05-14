import DiscordBinding from '../models/DiscordBinding';

// Relay message to Discord
async function relayMessageToDiscord(client, roomId, message, roomToChannelMap) {
  try {
    // Find Discord channel bound to this room
    const binding = await DiscordBinding.findOne({
      $or: [
        { platformRoomId: roomId },
        { roomId: roomId }
      ]
    });

    let channel;
    if (!binding) {
      // Check in-memory map as fallback
      const channelId = roomToChannelMap.get(roomId);
      if (!channelId) {
        console.log(`No Discord binding found for room ${roomId}`);
        return;
      }
      channel = await client.channels.fetch(channelId);
    } else {
      channel = await client.channels.fetch(binding.discordChannelId);
    }

    if (!channel) {
      console.log(`Discord channel not found for room ${roomId}`);
      return;
    }

    // Send message with attachments to Discord
    await sendMessageToDiscord(channel, message);

    // Update last used timestamp if using database binding
    if (binding) {
      binding.lastUsedAt = new Date();
      await binding.save();
    }

    console.log(`📨 Message relayed to Discord channel ${channel.id} for room ${roomId} from ${message.from?.platform || 'unknown'}`);
  } catch (error: any) {
    console.error('❌ Error relaying message to Discord:', error.message);
    throw error;
  }
}

// Send message to Discord with support for attachments
async function sendMessageToDiscord(channel, message) {
  const platform = message.from?.platform || 'unknown';
  const displayName = message.from?.displayName || message.from?.username || message.from?.userId || 'Unknown User';
  const platformEmoji = getPlatformEmoji(platform);

  // Create content for the message
  const content = `${platformEmoji} **${displayName}**${message.text ? `: ${message.text}` : ''}`;

  console.log(`🔍 Discord Debug - Message data:`, {
    img: message.img,
    file: message.file,
    attachmentType: message.attachmentType,
    fileName: message.fileName,
    text: message.text,
    platform: platform,
    displayName: displayName
  });

  try {
    // Prepare message options
    const messageOptions: any = {
      content: content
    };

    // Handle attachments - Discord embeds work best for images
    if ((message.img && message.attachmentType === 'image') || (message.file && message.attachmentType === 'document')) {

      if (message.img && message.attachmentType === 'image') {
        console.log(`📸 Attempting to send image to Discord channel ${channel.id}: ${message.img}`);
        console.log(`📸 Content: ${content}`);

        // For images, use Discord embeds which display images beautifully
        messageOptions.embeds = [{
          description: content,
          image: {
            url: message.img
          },
          color: 0x00ff00 // Green color for Sociality messages
        }];

        // Clear content since we're using embed description
        messageOptions.content = '';
        console.log(`✅ Image embed prepared for Discord channel ${channel.id}`);
      }

      if (message.file && message.attachmentType === 'document') {
        console.log(`📎 Attempting to send file to Discord channel ${channel.id}: ${message.file} (${message.fileName})`);
        // For files, send the URL in the message content with a nice format
        messageOptions.content = `${content}\n\n📎 **${message.fileName || 'File'}**\n${message.file}`;
        console.log(`✅ File URL added to Discord message content: ${message.fileName}`);
      }
    }

    // Send the message
    console.log(`📤 Sending message to Discord channel ${channel.id} with options:`, {
      hasContent: !!messageOptions.content,
      hasFiles: !!messageOptions.files,
      fileCount: messageOptions.files?.length || 0
    });
    await channel.send(messageOptions);
    console.log(`✅ Successfully sent message to Discord channel ${channel.id}`);

  } catch (error: any) {
    console.error(`❌ Error sending message to Discord channel ${channel.id}:`, error.message);
    console.error(`❌ Full error details:`, error);

    // Fallback: try sending as plain text without attachments
    try {
      const fallbackMessage = `${platformEmoji} **${displayName}**: ${message.text || '[Attachment]'}`;
      console.log(`🔄 Attempting fallback message to Discord channel ${channel.id}: ${fallbackMessage}`);
      await channel.send(fallbackMessage);
      console.log(`✅ Successfully sent fallback message to Discord channel ${channel.id}`);
    } catch (fallbackError: any) {
      console.error(`❌ Fallback message also failed for Discord channel ${channel.id}:`, fallbackError.message);
      console.error(`❌ Fallback error details:`, fallbackError);
      throw fallbackError;
    }
  }
}

// Format message for Discord display
function formatMessageForDiscord(message) {
  const platform = message.from?.platform || 'unknown';
  const displayName = message.from?.displayName || message.from?.username || message.from?.userId || 'Unknown User';
  const platformEmoji = getPlatformEmoji(platform);

  return `${platformEmoji} **${displayName}**: ${message.text}`;
}

// Get emoji for platform
function getPlatformEmoji(platform) {
  const emojiMap = {
    'sociality': '🌐',
    'platform-a': '🌐',
    'telegram': '📱',
    'platform-b': '📱',
    'discord': '🎮',
    'platform-c': '🎮',
    'web': '💻',
    'mobile': '📱'
  };

  return emojiMap[platform] || '💬';
}

// Validate Discord binding
async function validateDiscordBinding(client, binding) {
  try {
    // Try to fetch channel to validate the binding
    const channel = await client.channels.fetch(binding.discordChannelId);

    if (channel) {
      binding.isValid = true;
      binding.lastValidatedAt = new Date();
      await binding.save();
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`Discord binding validation failed for channel ${binding.discordChannelId}:`, error.message);

    // Mark binding as invalid
    binding.isValid = false;
    binding.lastValidatedAt = new Date();
    await binding.save();

    return false;
  }
}

// Load all Discord bindings and validate them
async function loadAndValidateDiscordBindings(client, channelToRoomMap, roomToChannelMap) {
  try {
    const bindings = await DiscordBinding.find({ isValid: true });

    console.log(`Loading ${bindings.length} Discord bindings...`);

    for (const binding of bindings) {
      // Add to in-memory maps
      const roomId = binding.roomId || binding.platformRoomId;
      channelToRoomMap.set(binding.discordChannelId, roomId);
      roomToChannelMap.set(roomId, binding.discordChannelId);

      // Validate binding in background
      validateDiscordBinding(client, binding).catch(error => {
        console.error(`Background validation failed for binding ${binding._id}:`, error.message);
      });
    }

    console.log(`Loaded ${bindings.length} Discord bindings into memory`);
  } catch (error: any) {
    console.error('Error loading Discord bindings:', error.message);
  }
}

export {
  relayMessageToDiscord,
  sendMessageToDiscord,
  formatMessageForDiscord,
  getPlatformEmoji,
  validateDiscordBinding,
  loadAndValidateDiscordBindings
};
