import express from 'express';
import { verifyAdmin, verifyUser } from "../middleware/authMiddleware.js";
import { allOrders, orderStatus, placeOrderCOD, placeOrderStripe, userOrders, cancelOrderByUser } from '../controllers/orderController.js';

const orderRoute = express.Router();

// Admin feature
orderRoute.get('/list', verifyAdmin, allOrders);
orderRoute.put('/status', verifyAdmin, orderStatus);

// Allow users to cancel their own order
orderRoute.put('/user/cancel', verifyUser, cancelOrderByUser);

// Payment feature
orderRoute.post('/place-cod', verifyUser, placeOrderCOD);
orderRoute.post('/stripe', placeOrderStripe);

// User feature
orderRoute.get('/userOrders', verifyUser, userOrders);

export default orderRoute;