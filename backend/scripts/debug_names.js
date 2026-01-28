
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';

dotenv.config();

const run = async () => {
    await connectDB();

    const brands = ['Flavour Beast', 'Gcore', 'Level X', 'Allo', 'Elfbar'];

    for (const brand of brands) {
        console.log(`\n--- Searching for ${brand} ---`);
        const products = await Product.find({
            name: { $regex: new RegExp(brand.split(' ')[0], 'i') } // Search by first word
        }).limit(20);

        console.log(`Found ${products.length} potential matches.`);
        products.forEach(p => {
            console.log(`Name: "${p.name}" | Brand: "${p.brand}"`);
            if (p.variants && p.variants.length > 0) {
                console.log(`  Variants: ${p.variants.length} (e.g. ${p.variants[0].size} - ${p.variants[0].flavour})`);
            }
        });
    }

    process.exit();
};

run();
