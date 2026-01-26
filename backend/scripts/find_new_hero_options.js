import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findNewHeroProducts = async () => {
    await connectDB();

    console.log("Searching for high-quality products for Hero...");

    // Search for Allo Ultra 25k
    const allo = await Product.findOne({ name: { $regex: /Allo Ultra 25k/i } });
    if (allo) {
        console.log(`FOUND ALLO: ${allo.name} | ID: ${allo._id} | Image: ${allo.images[0]?.url}`);
    }

    // Search for Oxbar
    const oxbar = await Product.findOne({ name: { $regex: /Oxbar/i } });
    if (oxbar) {
        console.log(`FOUND OXBAR: ${oxbar.name} | ID: ${oxbar._id} | Image: ${oxbar.images[0]?.url}`);
    }

    // Search for Gcore
    const gcore = await Product.findOne({ name: { $regex: /Gcore/i } });
    if (gcore) {
        console.log(`FOUND GCORE: ${gcore.name} | ID: ${gcore._id} | Image: ${gcore.images[0]?.url}`);
    }

    process.exit();
};

findNewHeroProducts();
