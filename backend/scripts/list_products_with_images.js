import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const listAllBrandsWithImages = async () => {
    await connectDB();
    const products = await Product.find({ 'images.0': { $exists: true } }).limit(20);
    console.log("Sample products with images:");
    products.forEach(p => {
        console.log(`BRAND: ${p.brand} | NAME: ${p.name} | ID: ${p._id} | IMAGE: ${p.images[0].url}`);
    });
    process.exit();
};

listAllBrandsWithImages();
