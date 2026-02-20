import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const verifyAdmin = (req, res, next) => {
    let token = req.cookies && req.cookies.admin_token;
    // fallback to Authorization header: Bearer <token>
    if (!token && req.headers && req.headers.authorization) {
        const parts = String(req.headers.authorization).split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1];
    }
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export const verifyUser = async (req, res, next) => {
    try {
        let token = req.cookies.user_token;
        // fallback to Authorization header: Bearer <token>
        if (!token && req.headers && req.headers.authorization) {
            const parts = String(req.headers.authorization).split(' ');
            if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1];
        }
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}