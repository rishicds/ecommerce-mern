import express from 'express';
import { addToWishlist, removeFromWishlist, getUserWishlist, moveToCart } from '../controllers/wishlistController.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const wishlistRoute = express.Router();

wishlistRoute.post('/add', verifyUser, addToWishlist);           // POST: { productId }
wishlistRoute.post('/remove', verifyUser, removeFromWishlist);   // POST: { productId }
wishlistRoute.get('/get', verifyUser, getUserWishlist);          // GET: /wishlist/get
wishlistRoute.post('/move-to-cart', verifyUser, moveToCart);     // POST: { productId, variantSize }

export default wishlistRoute;
