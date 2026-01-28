
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';

dotenv.config();

const run = async () => {
    await connectDB();
    console.log("Connected to DB");

    const products = await Product.find({
        $or: [
            { name: /ABT/i },
            { brand: /ABT/i }
        ]
    });

    console.log(`Found ${products.length} products matching 'ABT'`);
    products.forEach(p => {
        console.log(`\nProduct: ${p.name}`);
        console.log(`Brand: ${p.brand}`);
        console.log(`ID: ${p._id}`);
        console.log(`Variants Count: ${p.variants.length}`);
        if (p.variants.length > 0) {
            console.log("Sample Variants:");
            p.variants.slice(0, 5).forEach(v => {
                console.log(` - Size: "${v.size}", Flavour: "${v.flavour}", Image: "${v.image || 'None'}"`);
            });
        }
    });

    process.exit();
};

run();
