import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyFailing = async () => {
    await connectDB();

    const targets = [
        { name: 'Wild White Grape' },
        { name: 'Sniper Peach Ice' }
    ];

    for (const t of targets) {
        const p = await Product.findOne({ name: { $regex: new RegExp(t.name, 'i') } });
        if (p) {
            console.log(`Product: ${p.name}`);
            console.log(`Images:`, p.images.map(img => img.url));
        }
    }

    process.exit();
};

verifyFailing();
