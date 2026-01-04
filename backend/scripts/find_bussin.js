import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findBussin = async () => {
    await connectDB();
    const product = await Product.findOne({ name: { $regex: /Bussin.*Banana/i } });
    if (product) {
        console.log(`FOUND: ${product.name} | ID: ${product._id} | Image: ${product.images[0]?.url}`);
    } else {
        console.log("NOT FOUND");
    }
    process.exit();
};

findBussin();
