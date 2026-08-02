import { Request, Response } from "express";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import logger from "../utils/logger.js";
import suggestionCache from "../utils/cache.js";

const signupUser = async (req: Request, res: Response) => {
	return res.status(400).json({ error: "Manual account creation is disabled. Please sign in with Google." });
};

const loginUser = async (req: Request, res: Response) => {
	return res.status(400).json({ error: "Manual password login is disabled. Please sign in with Google." });
};

const logoutUser = (req: Request, res: Response) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.cookie("jwt-sociality", "", { maxAge: 1 });

		const sessionPath = (req.query.session as string) || '';
		if (sessionPath) {
			const cookieName = `jwt-sociality${sessionPath.replace(/\//g, '-')}`;
			res.cookie(cookieName, "", { maxAge: 1 });
		}

		return res.status(200).json({ message: "User logged out successfully" });
	} catch (err: any) {
		logger.error("Error in logoutUser", err);
		return res.status(500).json({ error: err.message });
	}
};

export { signupUser, loginUser, logoutUser };