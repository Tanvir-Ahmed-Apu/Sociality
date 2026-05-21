import express from "express";
import { verifyFileAccessibility } from "../utils/cloudinary.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/verify", protectRoute, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const verification = await verifyFileAccessibility(url);
    res.json({ success: true, verification });
  } catch (error: any) {
    console.error('File verification error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify file accessibility' });
  }
});

export default router;
