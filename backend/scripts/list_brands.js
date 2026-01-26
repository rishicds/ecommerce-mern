import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const listBrands = async () => {
    await connectDB();
    const brands = await Product.distinct('brand');
    console.log("Brands available:", brands);

    // List some products from popular brands
    const gcore = await Product.findOne({ brand: /Gcore/i, 'images.0': { $exists: true } });
    if (gcore) console.log(`GCORE: ${gcore.name} | ID: ${gcore._id} | Image: ${gcore.images[0].url}`);

    const elf = await Product.findOne({ brand: /Elfbar/i, 'images.0': { $exists: true } });
    if (elf) console.log(`ELFBAR: ${elf.name} | ID: ${elf._id} | Image: ${elf.images[0].url}`);

    const snip = await Product.findOne({ brand: /Sniper/i, 'images.0': { $exists: true } });
    if (snip) console.log(`SNIPER: ${snip.name} | ID: ${snip._id} | Image: ${snip.images[0].url}`);

    process.exit();
};

listBrands();
