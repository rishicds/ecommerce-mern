import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findHeroOptionsBroad = async () => {
    await connectDB();
    const terms = ['Oxbar', 'Vice', 'Ghost', 'Kraze', 'Gcore', 'Pop'];
    console.log("Searching for Hero Grid options (Broad)...");

    for (const term of terms) {
        const p = await Product.findOne({ name: new RegExp(term, 'i'), 'images.0': { $exists: true } });
        if (p) {
            console.log(`TERM: ${term} | NAME: ${p.name} | ID: ${p._id} | IMAGE: ${p.images[0].url}`);
        }
    }
    process.exit();
};

findHeroOptionsBroad();
