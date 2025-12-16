import express from 'express';
import { syncProducts, syncCategories, handleWebhook, getCheckoutSettings } from '../controllers/cloverController.js';

const router = express.Router();

router.post('/sync/products', syncProducts);
router.post('/sync/categories', syncCategories);
router.post('/webhook', handleWebhook);
router.get('/checkout-settings', getCheckoutSettings);

export default router;
