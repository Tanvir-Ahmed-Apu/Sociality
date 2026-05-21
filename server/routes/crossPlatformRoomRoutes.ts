import express, { Request, Response } from "express";
import protectRoute from "../middlewares/protectRoute.js";
import CrossPlatformRoomController from "../controllers/crossPlatformRoomController.js";

const router = express.Router();

// Create a new cross-platform room
router.post("/", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.createRoom(req as any, res));

// Get all rooms for the authenticated user
router.get("/", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.getUserRooms(req as any, res));

// Join an existing room by room ID or room code
router.post("/:roomId/join", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.joinRoom(req as any, res));

// Get detailed information about a specific room
router.get("/:roomId/details", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.getRoomDetails(req as any, res));

// Get all participants in a room (Sociality + cross-platform)
router.get("/:roomId/participants", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.getRoomParticipants(req as any, res));

// Update room name
router.put("/:roomId/name", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.updateRoomName(req as any, res));

// Update room photo
router.put("/:roomId/photo", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.updateRoomPhoto(req as any, res));

// Delete a room
router.delete("/:roomId", protectRoute, (req: Request, res: Response) => CrossPlatformRoomController.deleteRoom(req as any, res));

// Backfill missing profile pictures for cross-platform messages
router.post("/:roomId/backfill-profile-pics", protectRoute, (req: Request, res: Response) =>
  CrossPlatformRoomController.backfillProfilePictures(req as any, res)
);

export default router;
