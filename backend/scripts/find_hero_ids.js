import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findHeroProducts = async () => {
    await connectDB();

    const targets = [
        { brand: 'Flavour Beast', flavour: 'Bussin Banana' },
        { brand: 'Flavour Beast', flavour: 'Wild White Grape' },
        { brand: 'Elfbar Prime 1800', flavour: 'Grape' },
        { brand: 'Level X G2 Ultra', flavour: 'White Grape' },
        { brand: 'Abt Hybrid', flavour: 'Blueberry Ice' }
    ];

    console.log("Searching for Hero products...");

    for (const target of targets) {
        const product = await Product.findOne({
            $and: [
                { name: { $regex: new RegExp(target.brand, 'i') } },
                { name: { $regex: new RegExp(target.flavour, 'i') } }
            ]
        });

        if (product) {
            console.log(`FOUND: ${target.brand} - ${target.flavour} | ID: ${product._id} | Image: ${product.images[0]?.url}`);
        } else {
            // loose search
            const loose = await Product.findOne({
                name: { $regex: new RegExp(target.flavour, 'i') }
            });
            if (loose) {
                console.log(`FOUND (Loose): ${target.flavour} | ID: ${loose._id} | Image: ${loose.images[0]?.url}`);
            } else {
                console.log(`NOT FOUND: ${target.brand} - ${target.flavour}`);
            }
        }
    }

    process.exit();
};

findHeroProducts();
