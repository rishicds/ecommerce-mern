
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';

dotenv.config();

const run = async () => {
    await connectDB();
    console.log("Connected to DB");

    // Search for Allo products
    const products = await Product.find({
        $or: [
            { name: /Allo/i },
            { brand: /Allo/i }
        ]
    });

    console.log(`Found ${products.length} products matching 'Allo'`);
    products.forEach(p => {
        console.log(`\nProduct: "${p.name}" (Brand: ${p.brand})`);
        console.log(`ID: ${p._id}`);
        // console.log(`Variants Count: ${p.variants.length}`);
        // if (p.variants.length > 0) {
        //     console.log("Sample Variants:");
        //     p.variants.slice(0, 3).forEach(v => {
        //         console.log(` - ${v.flavour || 'No Flavour'} / ${v.size || 'No Size'}`);
        //     });
        // }
    });

    process.exit();
};

run();
