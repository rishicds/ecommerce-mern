import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findHeroOptions = async () => {
    await connectDB();
    const brands = ['Oxbar', 'Vice', 'Ghost', 'Kraze', 'Gcore'];
    console.log("Searching for Hero Grid options...");

    for (const b of brands) {
        const p = await Product.findOne({ brand: new RegExp(b, 'i'), 'images.0': { $exists: true } });
        if (p) {
            console.log(`BRAND: ${b} | NAME: ${p.name} | ID: ${p._id} | IMAGE: ${p.images[0].url}`);
        }
    }
    process.exit();
};

findHeroOptions();
