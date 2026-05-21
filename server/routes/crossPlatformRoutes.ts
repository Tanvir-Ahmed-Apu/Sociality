import express from "express";
import crossPlatformUtilRoutes from "./crossPlatformUtilRoutes.js";
import crossPlatformRoomRoutes from "./crossPlatformRoomRoutes.js";
import crossPlatformRoomMessageRoutes from "./crossPlatformRoomMessageRoutes.js";
import crossPlatformMessageAdminRoutes from "./crossPlatformMessageAdminRoutes.js";
import crossPlatformRelayRoutes from "./crossPlatformRelayRoutes.js";
import crossPlatformBindingRoutes from "./crossPlatformBindingRoutes.js";
import { registerWithFederation } from "../services/crossPlatformHelpers.js";

const router = express.Router();

router.use("/files", crossPlatformUtilRoutes);
router.use("/rooms", crossPlatformRoomRoutes);
router.use("/rooms/:roomId/messages", crossPlatformRoomMessageRoutes);
router.use("/messages", crossPlatformMessageAdminRoutes);
router.use("/relay", crossPlatformRelayRoutes);
router.use("/", crossPlatformBindingRoutes);

registerWithFederation();

export default router;
