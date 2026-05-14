import express from "express";
import multer from "multer";
import os from "os";
import {
	createPost,
	deletePost,
	getPost,
	updatePost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getForYouPosts,
	getFollowingPosts,
	getUserPosts,
	getUserReplies,
	getUserReposts,
	repostPost,
	replyToComment,
	likeUnlikeComment,
	deleteComment,
	getTrendingPostsHandler,
	markPostNotInterested,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";

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
		fileSize: 10 * 1024 * 1024 // 10MB limit
	},
	fileFilter: function (req, file, cb) {
		// Accept images only
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed!'), false);
		}
	}
});

const router = express.Router();



// Specific routes MUST come before generic /:id routes
router.get("/feed", protectRoute, getFeedPosts); // Legacy route - redirects to for-you
router.get("/for-you", protectRoute, getForYouPosts); // For You feed - all posts with trending algorithm
router.get("/following", protectRoute, getFollowingPosts); // New Following feed
router.get("/trending", getTrendingPostsHandler); // Add route for trending posts


router.get("/user/:username", getUserPosts);
router.get("/user/:username/replies", getUserReplies); // Add route for user replies
router.get("/user/:username/reposts", getUserReposts); // Add route for user reposts

// POST routes
router.post("/create", protectRoute, createPost);

router.post("/not-interested/:postId", protectRoute, markPostNotInterested); // Must be before /:id routes
router.post("/like/:id", protectRoute, likeUnlikePost); // Change to POST for like
router.put("/reply/:id", protectRoute, upload.fields([{ name: 'img', maxCount: 1 }]), replyToPost); // PUT for reply to match frontend
router.post("/repost/:id", protectRoute, repostPost); // Change to POST for repost

// PUT routes
router.put("/comment/like/:postId/:commentId", protectRoute, likeUnlikeComment);
router.put("/reply/:postId/comment/:commentId", protectRoute, replyToComment);
router.put("/:id", protectRoute, updatePost); // Add update post route

// DELETE routes
router.delete("/comment/:postId/:commentId", protectRoute, deleteComment);
router.delete("/:id", protectRoute, deletePost);

// Generic /:id route MUST be last
router.get("/:id", getPost);

export default router;
