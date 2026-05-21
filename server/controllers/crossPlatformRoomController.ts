import { Request, Response } from "express";
import CrossPlatformRoomService from "../services/crossPlatformRoomService.js";
import { CreateRoomRequest, UpdateRoomNameRequest, UpdateRoomPhotoRequest } from "../types/crossPlatformRoom.js";

interface AuthRequest extends Request {
  user?: { _id: string; username: string };
}

export class CrossPlatformRoomController {
  /**
   * POST / - Create a new cross-platform room
   */
  async createRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const data: CreateRoomRequest = req.body;

      const room = await CrossPlatformRoomService.createRoom(userId, data);

      res.status(201).json({ success: true, room });
    } catch (error: any) {
      console.error('Error creating cross-platform room:', error);
      res.status(error.message.includes('required') ? 400 : 500).json({
        success: false,
        error: 'Failed to create cross-platform room',
        message: error.message
      });
    }
  }

  /**
   * GET / - Get all rooms for authenticated user
   */
  async getUserRooms(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const rooms = await CrossPlatformRoomService.getUserRooms(userId);

      res.json({ success: true, rooms });
    } catch (error: any) {
      console.error('Error fetching cross-platform rooms:', error);
      res.status(error.message.includes('Authentication') ? 401 : 500).json({
        success: false,
        error: 'Failed to fetch cross-platform rooms',
        message: error.message
      });
    }
  }

  /**
   * POST /:roomId/join - Join an existing room
   */
  async joinRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = req.user?._id;
      const username = req.user?.username;

      const result = await CrossPlatformRoomService.joinRoom(roomId, userId, username);

      res.json({
        success: true,
        message: 'Successfully joined cross-platform room',
        room: result
      });
    } catch (error: any) {
      console.error('Error joining cross-platform room:', error);
      const statusCode = error.message.includes('Authentication')
        ? 401
        : error.message.includes('not found')
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Failed to join cross-platform room',
        message: error.message
      });
    }
  }

  /**
   * GET /:roomId/details - Get detailed room information
   */
  async getRoomDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = req.user?._id;

      const room = await CrossPlatformRoomService.getRoomDetails(roomId, userId);

      res.json({ success: true, room });
    } catch (error: any) {
      console.error('Error fetching room details:', error);
      const statusCode = error.message.includes('Authentication')
        ? 401
        : error.message.includes('not found')
          ? 404
          : error.message.includes('must be a member')
            ? 403
            : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Failed to fetch room details',
        message: error.message
      });
    }
  }

  /**
   * GET /:roomId/participants - Get all participants (Sociality + cross-platform)
   */
  async getRoomParticipants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = req.user?._id;

      const result = await CrossPlatformRoomService.getRoomParticipants(roomId, userId);

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Error fetching room participants:', error);
      const statusCode = error.message.includes('Authentication')
        ? 401
        : error.message.includes('not found')
          ? 404
          : error.message.includes('must be a member')
            ? 403
            : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Failed to fetch room participants',
        message: error.message
      });
    }
  }

  /**
   * PUT /:roomId/name - Update room name
   */
  async updateRoomName(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = req.user?._id;
      const data: UpdateRoomNameRequest = req.body;

      const name = await CrossPlatformRoomService.updateRoomName(roomId, userId, data.name);

      res.json({
        success: true,
        name,
        message: 'Room name updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating room name:', error);
      const statusCode = error.message.includes('Authentication')
        ? 401
        : error.message.includes('not found')
          ? 404
          : error.message.includes('must be a member')
            ? 403
            : 400;
      res.status(statusCode).json({
        success: false,
        error: 'Failed to update room name',
        message: error.message
      });
    }
  }

  /**
   * PUT /:roomId/photo - Update room photo
   */
  async updateRoomPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = req.user?._id;
      const data: UpdateRoomPhotoRequest = req.body;

      const groupPhoto = await CrossPlatformRoomService.updateRoomPhoto(roomId, userId, data.photo);

      res.json({
        success: true,
        groupPhoto,
        message: 'Room photo updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating room photo:', error);
      const statusCode = error.message.includes('Authentication')
        ? 401
        : error.message.includes('not found')
          ? 404
          : error.message.includes('must be a member')
            ? 403
            : 400;
      res.status(statusCode).json({
        success: false,
        error: 'Failed to update room photo',
        message: error.message
      });
    }
  }

  /**
   * DELETE /:roomId - Delete a room
   */
  async deleteRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const userId = req.user?._id;

      await CrossPlatformRoomService.deleteRoom(roomId, userId);

      res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting cross-platform room:', error);
      const statusCode = error.message.includes('Authentication')
        ? 401
        : error.message.includes('not found')
          ? 404
          : error.message.includes('must be a member')
            ? 403
            : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete room',
        message: error.message
      });
    }
  }

  /**
   * POST /:roomId/backfill-profile-pics - Backfill missing profile pictures
   */
  async backfillProfilePictures(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      const result = await CrossPlatformRoomService.backfillProfilePictures(roomId);

      res.json({
        success: true,
        message: `Updated ${result.updated} messages with profile pictures`,
        totalProcessed: result.total,
        updated: result.updated
      });
    } catch (error: any) {
      console.error('Error backfilling profile pictures:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to backfill profile pictures',
        message: error.message
      });
    }
  }
}

export default new CrossPlatformRoomController();
