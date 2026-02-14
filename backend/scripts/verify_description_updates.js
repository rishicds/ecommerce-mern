import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const verifyUpdates = async () => {
    try {
        const productsToCheck = [
            'Royal Honey',
            'Belmont Select Regular',
            'Arsenal Grinder 55 MM'
        ];

        console.log('--- Verifying Updates ---');

        for (const name of productsToCheck) {
            const product = await Product.findOne({ name });
            if (product) {
                console.log(`\nProduct: ${product.name}`);
                console.log(`Description: ${product.description ? product.description.substring(0, 100) + '...' : 'N/A'}`);
            } else {
                console.log(`\nProduct not found: ${name}`);
            }
        }

    } catch (error) {
        console.error('Error verifying updates:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

const run = async () => {
    await connectDB();
    await verifyUpdates();
};

run();
