import express from 'express';
import passport from '../config/passport.js';
import generateTokenAndSetCookie from '../utils/helpers/generateTokenAndSetCookie.js';

const router = express.Router();

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account', // Force account selection
        accessType: 'offline'
    })
);

// Google OAuth popup route (for popup-based authentication)
router.get('/google/popup',
    passport.authenticate('google-popup' as any, {
        scope: ['profile', 'email'],
        prompt: 'select_account', // Force account selection
        accessType: 'offline'
    })
);

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth?error=oauth_failed'
    }),
    async (req: any, res: any) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:7100';
        try {
            // Generate unique session path
            const sessionPath = `/session-${Date.now()}`;
            
            // Generate JWT token and set cookie with session path
            generateTokenAndSetCookie(req.user._id, res, sessionPath);

            if (!req.user.isProfileComplete) {
                res.redirect(`${frontendUrl}/?oauth=success&setup=required&session=${sessionPath}`);
            } else {
                res.redirect(`${frontendUrl}/?oauth=success&session=${sessionPath}`);
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${frontendUrl}/auth?error=oauth_callback_failed`);
        }
    }
);

// Google OAuth popup callback route
router.get('/google/popup/callback',
    passport.authenticate('google-popup' as any, {
        failureRedirect: '/oauth-popup-callback?error=oauth_failed'
    }),
    async (req: any, res: any) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:7100';
        const tabId = req.query.state || ''; // Using state as a placeholder for tabId if passed through OAuth state

        try {
            // Generate unique session path
            const sessionPath = `/session-${Date.now()}`;

            // Generate JWT token and set cookie with session path
            generateTokenAndSetCookie(req.user._id, res, sessionPath);

            if (!req.user.isProfileComplete) {
                const redirectUrl = `${frontendUrl}/oauth-popup-callback?oauth=success&setup=required&session=${sessionPath}${tabId ? `&tabId=${tabId}` : ''}`;
                res.redirect(redirectUrl);
            } else {
                const redirectUrl = `${frontendUrl}/oauth-popup-callback?oauth=success&session=${sessionPath}${tabId ? `&tabId=${tabId}` : ''}`;
                res.redirect(redirectUrl);
            }
        } catch (error) {
            console.error('OAuth popup callback error:', error);
            res.redirect(`${frontendUrl}/oauth-popup-callback?error=oauth_callback_failed`);
        }
    }
);

// OAuth success endpoint for frontend to get user data
router.get('/oauth/user', async (req: any, res: any) => {
    try {
        // Get session path from query parameter
        const sessionPath = (req.query.session as string) || '';
        const cookieName = sessionPath ? `jwt-sociality${sessionPath.replace(/\//g, '-')}` : 'jwt-sociality';
        const token = req.cookies[cookieName] || req.cookies.jwt || req.cookies['jwt-sociality'];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token and get user (reuse existing JWT verification logic)
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET as string) as any;
        const user = await import('../models/userModel.js');
        const userData = await user.default.findById(decoded.userId).select('-password');

        if (!userData) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.status(200).json({
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            username: userData.username,
            bio: userData.bio,
            profilePic: userData.profilePic,
            isGoogleUser: userData.isGoogleUser,
            isProfileComplete: userData.isProfileComplete,
            sessionPath: sessionPath // Include session path in response
        });
    } catch (error) {
        console.error('OAuth user fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

export default router;
