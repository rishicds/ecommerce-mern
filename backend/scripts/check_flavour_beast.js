import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';
dotenv.config();

const checkProducts = async () => {
    await connectDB();
    const products = await Product.find({
        $or: [
            { name: { $regex: 'Flavour Beast', $options: 'i' } },
            { brand: { $regex: 'Flavour Beast', $options: 'i' } }
        ]
    }).limit(20);

    console.log('Found Products:', products.map(p => ({
        name: p.name,
        brand: p.brand,
        variants: p.variants.map(v => v.flavour || v.size)
    })));
    process.exit();
};

checkProducts();
