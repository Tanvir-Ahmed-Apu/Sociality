import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import TelegramBinding from "../models/telegramBindingModel.js";

const router = express.Router();

router.get("/rooms/:roomId/telegram", async (req, res) => {
  try {
    const { roomId } = req.params;
    const binding = await (TelegramBinding as any).findByRoomId(roomId);

    if (!binding) {
      return res.json({ success: true, bound: false, message: 'No Telegram chat bound to this room' });
    }

    res.json({
      success: true,
      bound: true,
      binding: {
        telegramChatId: binding.telegramChatId,
        telegramChatType: binding.telegramChatType,
        telegramChatTitle: binding.telegramChatTitle,
        createdAt: binding.createdAt,
        messageCount: binding.messageCount,
        lastMessageAt: binding.lastMessageAt,
        createdBy: binding.createdBy
      }
    });
  } catch (error: any) {
    console.error('Error getting Telegram binding:', error);
    res.status(500).json({ success: false, error: 'Failed to get Telegram binding', message: error.message });
  }
});

router.get("/telegram/bindings", protectRoute, async (req, res) => {
  try {
    const bindings = await TelegramBinding.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      bindings: bindings.map(binding => ({
        roomId: binding.roomId,
        telegramChatId: binding.telegramChatId,
        telegramChatType: binding.telegramChatType,
        telegramChatTitle: binding.telegramChatTitle,
        createdAt: binding.createdAt,
        messageCount: binding.messageCount,
        lastMessageAt: binding.lastMessageAt,
        createdBy: binding.createdBy
      }))
    });
  } catch (error: any) {
    console.error('Error getting Telegram bindings:', error);
    res.status(500).json({ success: false, error: 'Failed to get Telegram bindings', message: error.message });
  }
});

export default router;
