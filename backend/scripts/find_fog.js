import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findFogOptions = async () => {
    await connectDB();
    console.log("Searching for Fog products...");

    const products = await Product.find({
        $or: [
            { name: { $regex: /Fog/i } },
            { brand: { $regex: /Fog/i } }
        ],
        'images.0': { $exists: true }
    }).limit(10);

    products.forEach(p => {
        console.log(`NAME: ${p.name} | ID: ${p._id} | IMAGE: ${p.images[0].url}`);
    });

    process.exit();
};

findFogOptions();
