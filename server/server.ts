import path from "path";
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url'; // Import necessary function

// Explicitly load .env using import.meta.url for reliable path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Define __dirname based on current file location
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

process.on('uncaughtException', (err: any) => {
	console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
	console.error(err.name, err.message, err.stack);
	process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
	console.error('UNHANDLED REJECTION! 💥 Shutting down...');
	console.error(err.name, err.message, err.stack);
	process.exit(1);
});


// Import other modules after environment variables are loaded
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; // Import notification routes
import authRoutes from "./routes/authRoutes.js"; // Import OAuth routes
import federationRoutes from "./routes/federationRoutes.js"; // Import federation routes
import crossPlatformRoutes from "./routes/crossPlatformRoutes.js"; // Import cross-platform routes
import roomRoutes from "./routes/roomRoutes.js"; // Import room routes

import passport from "./config/passport.js"; // Import passport configuration

import { v2 as cloudinary } from "cloudinary";
import { app, server } from "./socket/socket.js";
import logger from "./utils/logger.js";
import axios from "axios";

// Import cross-platform services
import { startFederationRegistry } from "./services/federationRegistry.js";
import { startTelegramService } from "./services/telegramService.js";
import { startDiscordService } from "./services/discordService.js";


console.log("🚀 Starting backend server...");
console.log("📅 Connecting to MongoDB...");
await connectDB();
console.log("✅ MongoDB Connected");


const PORT = Number(process.env.PORT) || 5000;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CORS configuration
const corsOptions = {
	origin: process.env.NODE_ENV === "production"
		? false
		: ["http://localhost:7100", "http://localhost:7101", "http://localhost:7300", "http://localhost:7301", "http://localhost:7302", "http://127.0.0.1:7100", "http://127.0.0.1:7101", "http://127.0.0.1:7300", "http://127.0.0.1:7301", "http://127.0.0.1:7302"],
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" })); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser());

// Session middleware for OAuth with MongoDB store
app.use(session({
	secret: process.env.SESSION_SECRET || 'fallback-secret-key',
	resave: false,
	saveUninitialized: false,
	store: MongoStore.create({
		mongoUrl: process.env.MONGO_URI,
		touchAfter: 24 * 3600, // lazy session update
		collectionName: 'sessions'
	}),
	cookie: {
		secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
		maxAge: 24 * 60 * 60 * 1000 // 24 hours
	}
}));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	logger.error("Unhandled error:", err);
	res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes); // Mount notification routes
app.use("/api/auth", authRoutes); // Mount OAuth routes
app.use("/api/federation", federationRoutes); // Mount federation routes
app.use("/api/cross-platform", crossPlatformRoutes); // Mount cross-platform routes
app.use("/api/rooms", roomRoutes); // Mount room routes

// Health check endpoint for federation registry
app.get("/health", (req: express.Request, res: express.Response) => {
	res.json({
		status: 'ok',
		platform: 'sociality',
		timestamp: new Date().toISOString(),
		federationEnabled: process.env.FEDERATION_ENABLED === 'true'
	});
});



// http://localhost:5000 => backend, http://localhost:7100 => frontend

if (process.env.NODE_ENV === "production") {
	const frontendDistPath = path.join(__dirname, "../../client/dist"); // Correct path to frontend build
	app.use(express.static(frontendDistPath));

	// react app
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(frontendDistPath, "index.html")); // Serve index.html from correct path
	});
}

server.listen(PORT, '0.0.0.0', () => {
	console.log(`📡 Server running on http://localhost:${PORT}`);

	// Start cross-platform services (enabled by default)

	// Start federation registry
	setTimeout(() => {
		startFederationRegistry();
	}, 1000);

	// Start Telegram service
	setTimeout(() => {
		startTelegramService();
	}, 2000);

	// Start Discord service
	setTimeout(() => {
		startDiscordService();
	}, 3000);


	// Register with federation registry
	setTimeout(registerWithFederation, 4000); // Wait for federation registry to start
});

// Function to register with federation registry
async function registerWithFederation() {
	try {
		const federationRegistryUrl = 'http://127.0.0.1:7300';
		const platformUrl = 'http://127.0.0.1:5000';
		const platformName = 'sociality';

		await axios.post(`${federationRegistryUrl}/federation/peers`, {
			name: platformName,
			url: platformUrl
		});


		// Re-register all existing rooms after peer registration
		await reRegisterExistingRooms(federationRegistryUrl, platformUrl);
	} catch (error) {
	}
}

// Re-register all existing rooms with federation registry
async function reRegisterExistingRooms(federationRegistryUrl, platformUrl) {
	try {
		// Import Room model dynamically to avoid circular dependencies
		const { default: Room } = await import('./models/roomModel.js');
		const rooms = await (Room as any).find({});


		for (const room of rooms) {
			try {
				// Backfill roomCode if missing
				if (!room.roomCode) {
					const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
					let code = '';
					for (let i = 0; i < 8; i++) {
						code += chars.charAt(Math.floor(Math.random() * chars.length));
					}
					room.roomCode = code;
					await room.save();
					console.log(`Generated roomCode ${code} for room ${room.roomId}`);
				}

				await axios.post(`${federationRegistryUrl}/federation/rooms`, {
					roomId: room.roomId,
					roomCode: room.roomCode,
					name: room.name || `Sociality Room ${room.roomId}`,
					peerUrl: platformUrl
				});
			} catch (error) {
			}
		}

	} catch (error) {
	}
}


