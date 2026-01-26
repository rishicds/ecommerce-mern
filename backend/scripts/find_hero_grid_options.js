import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findHeroOptions = async () => {
    await connectDB();

    const options = [
        { name: 'Oxbar' },
        { name: 'Vice' },
        { name: 'Ghost' },
        { name: 'Kraze' }
    ];

    for (const opt of options) {
        const p = await Product.findOne({ name: { $regex: new RegExp(opt.name, 'i') }, 'images.0': { $exists: true } });
        if (p) {
            console.log(`FOUND ${opt.name}: ${p.name} | ID: ${p._id} | Image: ${p.images[0]?.url}`);
        }
    }

    process.exit();
};

findHeroOptions();
