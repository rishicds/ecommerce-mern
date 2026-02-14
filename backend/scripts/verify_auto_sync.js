
import 'dotenv/config';
import mongoose from 'mongoose';
import { addProduct, updateProduct, removeProduct } from '../controllers/productController.js';
import Product from '../models/productModel.js';
import cloverService from '../services/cloverService.js';

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://admin:password@cluster0.mongodb.net/vapee";

// Mock Res
const res = {
    statusCode: 200,
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        if (data.success) {
            console.log('Controller Response:', JSON.stringify(data, null, 2));
            if (data.cloverSync) console.log('Clover Sync Status:', data.cloverSync);
        } else {
            console.error('Controller Error:', data);
        }
        return this;
    }
};

async function runVerification() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        if (!process.env.CLOVER_API_TOKEN) {
            console.warn('WARNING: No CLOVER_API_TOKEN. Auto-sync will skip.');
        }

        const testProductId = "AUTO_SYNC_TEST_" + Date.now();
        console.log(`--- 1. Testing Add Product (${testProductId}) ---`);

        const addReq = {
            body: {
                productId: testProductId,
                name: "Test Auto Sync Product",
                description: "Temporary test product",
                price: 10.99,
                stockCount: 100,
                categories: ["Test"],
                variants: JSON.stringify([
                    { size: "10ml", flavour: "Mint", price: 10.99, sku: testProductId + "-MINT", quantity: 10 },
                    { size: "10ml", flavour: "Berry", price: 10.99, sku: testProductId + "-BERRY", quantity: 10 }
                ])
            },
            files: [] // No images
        };

        await addProduct(addReq, res);

        // Fetch to check IDs
        let product = await Product.findOne({ productId: testProductId });
        if (product) {
            console.log('Product Created DB:', product._id);
            console.log('Clover Group ID:', product.cloverItemGroupId);
            console.log('Variants Clover IDs:', product.variants.map(v => v.cloverItemId));
        } else {
            console.error('Product not found in DB!');
            process.exit(1);
        }

        console.log(`--- 2. Testing Update Product (${testProductId}) ---`);
        const updateReq = {
            params: { id: product._id.toString() },
            body: {
                productId: testProductId,
                name: "Test Auto Sync Product UPDATED", // Changed Name
                description: "Updated description",
                price: 12.99, // Changed Price
                stockCount: 50,
                categories: ["Test"],
                // Same variants, implies update
                variants: JSON.stringify([
                    { size: "10ml", flavour: "Mint", price: 12.99, sku: testProductId + "-MINT", cloverItemId: product.variants[0].cloverItemId, quantity: 10 },
                    { size: "10ml", flavour: "Berry", price: 12.99, sku: testProductId + "-BERRY", cloverItemId: product.variants[1].cloverItemId, quantity: 10 }
                ])
            },
            files: []
        };

        await updateProduct(updateReq, res);

        product = await Product.findOne({ productId: testProductId });
        console.log('Product Updated DB Name:', product.name);

        console.log('--- 3. Clean up (DB Only) ---');
        // We do not delete from Clover as per user request to not implement delete sync
        // But we delete from DB to keep it clean.
        // Actually, let's call removeProduct but it won't sync delete.

        await Product.deleteOne({ _id: product._id });
        console.log('Test product deleted from DB.');

        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

runVerification();
