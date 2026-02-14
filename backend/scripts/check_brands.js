
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';

dotenv.config();

const queries = [
    { name: 'Flavour Beast', regex: 'Flavour Beast' },
    { name: 'Fog', regex: 'Fog' },
    { name: 'Elfbar AF', regex: 'Elfbar.*12000' },
    { name: 'Twist', regex: 'Twist' }
];

const checkBrands = async () => {
    await connectDB();
    console.log('Connected to DB');

    for (const q of queries) {
        console.log(`\nChecking: ${q.name}`);
        const products = await Product.find({ name: { $regex: new RegExp(q.regex, 'i') } }).limit(20);
        if (products.length === 0) {
            console.log(`  No products found for regex "${q.regex}"`);
        } else {
            products.forEach(p => {
                console.log(`  Found: "${p.name}" (Brand: "${p.brand}")`);
            });
        }
    }
    process.exit();
};

checkBrands();
