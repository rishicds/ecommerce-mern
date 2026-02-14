import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Product from '../models/productModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    // Find "Allo 500" Legacy Product
    const p = await Product.findOne({ cloverItemGroupId: 'clover_group_94DD0FGBDCQ5J' });

    if (p) {
        console.log(JSON.stringify(p.toObject(), null, 2));
    } else {
        console.log("Legacy Product Not Found by cloverItemGroupId");
        // Try name
        const p2 = await Product.findOne({ name: "Allo 500" });
        if (p2) console.log(JSON.stringify(p2.toObject(), null, 2));
    }

    process.exit();
};

run();
