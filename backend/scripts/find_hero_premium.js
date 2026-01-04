import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findPremiumHero = async () => {
    await connectDB();

    const brands = ['Ghost', 'Kraze', 'Oxbar', 'Vice', 'Level X'];

    for (const b of brands) {
        const p = await Product.findOne({ brand: new RegExp(b, 'i'), 'images.0': { $exists: true } });
        if (p) {
            console.log(`${b}: ${p.name} | ID: ${p._id} | Image: ${p.images[0].url}`);
        }
    }
    process.exit();
};

findPremiumHero();
