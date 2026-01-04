import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findAlloFlavors = async () => {
    await connectDB();
    const products = await Product.find({ name: { $regex: /Allo Ultra 25k/i } }).limit(10);
    products.forEach(p => {
        console.log(`${p.name} | ID: ${p._id} | Image: ${p.images[0]?.url}`);
    });
    process.exit();
};

findAlloFlavors();
