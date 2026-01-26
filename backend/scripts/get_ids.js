import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const findProducts = async () => {
    await connectDB();

    const searchTerms = [
        { brand: 'Allo Ultra 25k', flavour: 'Grape Ice' },
        { brand: 'Elfbar BC10000', flavour: 'Blue Razz Ice' },
        { brand: 'Sniper', flavour: 'Peach Ice' },
        { brand: 'Gcore 30ml', flavour: 'Blue Razz' },
        { brand: 'Sniper', flavour: 'Watermelon Ice' },
        { brand: 'Gcore 30ml', flavour: 'Mint' }
    ];

    console.log("Searching for products...");

    for (const term of searchTerms) {
        // Try exact match first
        let products = await Product.find({
            $and: [
                { brand: { $regex: new RegExp(term.brand, 'i') } },
                { name: { $regex: new RegExp(term.flavour, 'i') } }
            ]
        }).limit(1);

        if (products.length > 0) {
            console.log(`FOUND: ${term.brand} - ${term.flavour} => ID: ${products[0]._id}`);
        } else {
            // Fallback: search just by broad name regex
            products = await Product.find({
                name: { $regex: new RegExp(term.flavour, 'i') }
            }).limit(1);
            if (products.length > 0) {
                console.log(`FOUND (Loose): ${term.flavour} => ID: ${products[0]._id} (Name: ${products[0].name})`);
            } else {
                console.log(`NOT FOUND: ${term.brand} - ${term.flavour}`);
            }
        }
    }

    process.exit();
};

findProducts();
