import { Request, Response, NextFunction } from "express";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

interface DecodedToken {
	userId: string;
}

const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Check for session-specific cookie first, then fallback to default
		const sessionPath = (req.query.session as string) || '';
		const cookieName = sessionPath ? `jwt-sociality${sessionPath.replace(/\//g, '-')}` : 'jwt-sociality';

		let token = req.cookies[cookieName] || req.cookies.jwt || req.cookies['jwt-sociality'];

		if (!token) {
			return res.status(401).json({ message: "Unauthorized - No token provided" });
		}

		// Validate token format
		if (typeof token !== 'string' || token.split('.').length !== 3) {
			return res.status(401).json({ message: "Unauthorized - Invalid token format" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as DecodedToken;

		const user = await User.findById(decoded.userId).select("-password");

		// Check if user exists after finding by ID
		if (!user) {
			// If user not found (e.g., deleted after token issuance), return unauthorized
			logger.error(`❌ Error in protectRoute: User not found for decoded userId ${decoded.userId}`);
			return res.status(401).json({ message: "Unauthorized - User not found" });
		}

		req.user = user;
		next();
	} catch (err: any) {
		logger.error("❌ Error in protectRoute:", err.message);
		if (err.name === 'JsonWebTokenError') {
			return res.status(401).json({ message: "Unauthorized - Invalid token" });
		} else if (err.name === 'TokenExpiredError') {
			return res.status(401).json({ message: "Unauthorized - Token expired" });
		}
		res.status(500).json({ message: err.message });
	}
};

export default protectRoute;
