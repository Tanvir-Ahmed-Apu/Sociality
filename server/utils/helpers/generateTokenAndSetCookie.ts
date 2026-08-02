import jwt from "jsonwebtoken";


const generateTokenAndSetCookie = (userId: any, res: any) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string || 'default_secret', {
        expiresIn: "30d",
    });

    // Fixed cookie name for the JWT token
    const cookieName = 'jwt-sociality';

    res.cookie(cookieName, token, {
        httpOnly: true, 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
       
        sameSite: "lax", 
        secure: process.env.NODE_ENV === "production",
        path: '/',
    });

    return token;
};

export default generateTokenAndSetCookie;