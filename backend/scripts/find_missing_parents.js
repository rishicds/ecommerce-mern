
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const findParents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const searchTerms = [
            'Allo',
            'Bazooka',
            'Elfbar',
            'Hi5',
            'Click'
        ];

        const regex = new RegExp(searchTerms.join('|'), 'i');
        const products = await mongoose.connection.db.collection('products').find({ name: { $regex: regex } }).toArray();

        console.log('--- Found Products ---');
        products.forEach(p => {
            console.log(p.name);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

findParents();
