import express from 'express';
import {
    createDiscountCode,
    getAllDiscountCodes,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode
} from '../controllers/discountController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const discountRoute = express.Router();

// Admin routes
discountRoute.post('/create', verifyAdmin, createDiscountCode);
discountRoute.get('/list', verifyAdmin, getAllDiscountCodes);
discountRoute.put('/update/:id', verifyAdmin, updateDiscountCode);
discountRoute.delete('/delete/:id', verifyAdmin, deleteDiscountCode);

// User route
discountRoute.post('/validate', validateDiscountCode);

export default discountRoute;
