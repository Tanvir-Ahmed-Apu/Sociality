import express from "express";
import CrossPlatformMessage from "../models/crossPlatformMessageModel.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.put("/:messageId/star", protectRoute, async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const message = await CrossPlatformMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    message.isStarred = !message.isStarred;
    await message.save();

    res.json({ success: true, isStarred: message.isStarred });
  } catch (error: any) {
    console.error('Error toggling star for cross-platform message:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle star' });
  }
});

export default router;
