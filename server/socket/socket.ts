import { Server } from "socket.io";
import http from "http";
import express from "express";
import { handleConnection } from "./handlers/connectionHandler.js";
import { handleMessages } from "./handlers/messageHandler.js";
import { handleRooms } from "./handlers/roomHandler.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.NODE_ENV === "production" 
			? false 
			: [
				"http://localhost:7100", 
				"http://localhost:7101",
				/^https:\/\/.*\.ngrok\.io$/,
				process.env.FRONTEND_URL
			].filter(Boolean),
		methods: ["GET", "POST"],
		credentials: true,
	},
	pingTimeout: 60000,
	pingInterval: 25000,
	transports: ['websocket', 'polling'],
	allowUpgrades: true,
	maxHttpBufferSize: 5e6,
	connectTimeout: 30000,
});

io.on("connection", (socket) => {
	handleConnection(io, socket);
	handleMessages(io, socket);
	handleRooms(io, socket);
});

app.set('io', io);

// Re-export state helpers and emitters for compatibility with existing imports
export { getRecipientSocketId } from "./state.js";
export { sendMessageToUser, broadcastPostUpdate } from "./emitters.js";
export { io, server, app };
