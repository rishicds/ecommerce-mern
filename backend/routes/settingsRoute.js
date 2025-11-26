import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: fetch site settings
router.get('/', getSettings);

// Admin: update site settings
router.put('/', verifyAdmin, updateSettings);

export default router;
