import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const checkProductStructure = async () => {
    await connectDB();

    // Check Elfbar BC10000 products
    console.log("Checking Elfbar BC10000 products...");
    const products = await Product.find({
        name: { $regex: /Elfbar BC10000/i }
    }).limit(5);

    products.forEach(p => {
        console.log(`\nName: ${p.name}`);
        console.log(`ID: ${p._id}`);
        console.log(`Brand: ${p.brand}`);
        console.log(`Variants Count: ${p.variants ? p.variants.length : 0}`);
        if (p.variants && p.variants.length > 0) {
            console.log(`Sample Variant:`, p.variants[0]);
        }
    });

    process.exit();
};

checkProductStructure();
