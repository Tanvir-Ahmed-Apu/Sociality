import express from "express";
import multer from "multer";
import os from "os";
import protectRoute from "../middlewares/protectRoute.js";
import { getMessages, sendMessage, getConversations, deleteMessage, toggleStarMessage } from "../controllers/messageController.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// Use OS temp directory for cross-platform compatibility
		cb(null, os.tmpdir())
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 50 * 1024 * 1024 // 50MB limit for messages (larger than posts)
	},
	fileFilter: function (req, file, cb) {
		// Accept all file types for messages
		cb(null, true);
	}
});

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/", protectRoute, upload.fields([
	{ name: 'img', maxCount: 1 },
	{ name: 'file', maxCount: 1 },
	{ name: 'voice', maxCount: 1 },
	{ name: 'gif', maxCount: 1 }
]), sendMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.put("/:messageId/star", protectRoute, toggleStarMessage);

export default router;
