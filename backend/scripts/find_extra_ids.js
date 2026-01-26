import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findExtraIds = async () => {
    await connectDB();

    const targets = [
        'Elfbar BC10000 - Blue-Razz-Ice',
        'Elfbar AF 12000 - Tangy Blue Razz',
        'Sniper - Sniper Watermelon Ice',
        'Gcore 30ml - Refreshing Mint'
    ];

    for (const t of targets) {
        const p = await Product.findOne({ name: { $regex: new RegExp(t, 'i') } });
        if (p) {
            console.log(`FOUND: ${p.name} | ID: ${p._id} | Image: ${p.images[0]?.url}`);
        } else {
            // Loose search
            const loose = await Product.findOne({ name: { $regex: new RegExp(t.split(' - ')[1] || t, 'i') } });
            if (loose) console.log(`LOOSE FOUND: ${loose.name} | ID: ${loose._id} | Image: ${loose.images[0]?.url}`);
        }
    }
    process.exit();
};

findExtraIds();
