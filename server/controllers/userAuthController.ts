import { Request, Response } from "express";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import logger from "../utils/logger.js";
import suggestionCache from "../utils/cache.js";

const signupUser = async (req: Request, res: Response) => {
	try {
		const { name, password } = req.body;
		const email = (req.body.email || "").trim().toLowerCase();
		const username = (req.body.username || "").trim().toLowerCase();

		if (!name || !email || !username || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const existingUser = await User.findOne({ $or: [{ email }, { username }] });
		if (existingUser) {
			if (existingUser.email === email) {
				return res.status(400).json({ error: "Email is already registered" });
			}
			return res.status(400).json({ error: "Username is already taken" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			name: name.trim(),
			email,
			username,
			password: hashedPassword,
			isProfileComplete: true
		});
		await newUser.save();
		suggestionCache.clear();

		const sessionPath = (req.query.session as string) || '';
		const token = generateTokenAndSetCookie(newUser._id, res, sessionPath);

		return res.status(201).json({
			_id: newUser._id,
			name: newUser.name,
			email: newUser.email,
			username: newUser.username,
			bio: newUser.bio,
			profilePic: newUser.profilePic,
			coverPic: newUser.coverPic,
			location: newUser.location || "",
			website: newUser.website || "",
			isProfileComplete: true,
			sessionPath,
			token
		});
	} catch (err: any) {
		logger.error("Error in signupUser", err);
		return res.status(500).json({ error: err.message });
	}
};

const loginUser = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}

		const identifier = (username || "").trim().toLowerCase();
		const user = await User.findOne({
			$or: [
				{ username: identifier },
				{ email: identifier }
			]
		});

		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		if (user.isFrozen) {
			user.isFrozen = false;
			await user.save();
		}

		if (!user.isProfileComplete && !user.isGoogleUser && user.name && user.username && user.email) {
			await User.findByIdAndUpdate(user._id, { isProfileComplete: true });
			user.isProfileComplete = true;
		}

		const sessionPath = (req.query.session as string) || '';
		const token = generateTokenAndSetCookie(user._id, res, sessionPath);
		suggestionCache.clear();

		return res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
			coverPic: user.coverPic,
			location: user.location || "",
			website: user.website || "",
			isProfileComplete: user.isProfileComplete ?? true,
			sessionPath,
			token
		});
	} catch (error: any) {
		logger.error("Error in loginUser", error);
		return res.status(500).json({ error: error.message });
	}
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