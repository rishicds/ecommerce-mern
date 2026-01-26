import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findProducts = async () => {
    await connectDB();

    console.log("Searching for BC10000 products...");
    const products = await Product.find({
        name: { $regex: /BC10000/i }
    }).limit(10);

    products.forEach(p => {
        console.log(`Product: ${p.name} | ID: ${p._id}`);
    });

    console.log("\nSearching for Sniper Peach Ice...");
    const sniper = await Product.findOne({
        name: { $regex: /Sniper.*Peach.*Ice/i }
    });
    if (sniper) console.log(`Sniper: ${sniper.name} | ID: ${sniper._id}`);

    process.exit();
};

findProducts();
