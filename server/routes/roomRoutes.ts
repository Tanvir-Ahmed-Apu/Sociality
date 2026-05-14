import express from "express";
import {
	getChatRoomSuggestions,
} from "../controllers/roomController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Add route for chat room suggestions
router.get("/chat-suggestions", protectRoute, getChatRoomSuggestions);

export default router;
