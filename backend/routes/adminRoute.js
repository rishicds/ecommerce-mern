import express from 'express';
import rateLimit from "express-rate-limit";
import { adminLogin, adminLogout, getAdminData, syncClover, getModifierGroups, getItemGroups } from "../controllers/adminController.js";
import { verifyAdmin } from '../middleware/authMiddleware.js';

// Rate limiter: max 5 requests per minute per IP
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: "Too many login attempts. Please try again after 1 minute."
})

const adminRouter = express.Router();
adminRouter.post('/login', loginLimiter, adminLogin);
adminRouter.post('/logout', loginLimiter, adminLogout);
adminRouter.get('/dashboard', verifyAdmin, getAdminData);
// Trigger a one-time sync from Clover into local DB (admin only)
adminRouter.post('/sync/clover', verifyAdmin, syncClover);
adminRouter.get('/modifier-groups', verifyAdmin, getModifierGroups);
adminRouter.get('/item-groups', verifyAdmin, getItemGroups);

export default adminRouter;