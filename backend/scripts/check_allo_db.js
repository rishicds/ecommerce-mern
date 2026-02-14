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

    // Find all products with "Allo 500" in name
    const products = await Product.find({ name: { $regex: 'Allo 500', $options: 'i' } });

    console.log(`Found ${products.length} Products matching 'Allo 500'.`);

    products.forEach(p => {
        console.log(`\nProduct: "${p.name}"`);
        console.log(`  ID: ${p._id}`);
        console.log(`  Clover Group ID: ${p.cloverItemGroupId}`);
        console.log(`  Reference ID: ${p.productId}`); // Could be group ID or smart_group_...
        console.log(`  Variants: ${p.variants.length}`);
        // Log a few variants
        p.variants.slice(0, 3).forEach(v => console.log(`    - ${v.flavour} (Stock: ${v.quantity})`));
        if (p.variants.length > 3) console.log(`    ... and ${p.variants.length - 3} more`);
    });

    process.exit();
};

run();
