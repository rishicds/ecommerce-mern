
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checkVariants = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Use regex to find variants for specific potential parent products
        const regex = /Allo Juice|Bazooka|Elfbar|Hi5 Click/i;

        const products = await mongoose.connection.db.collection('products').find({ name: { $regex: regex } }).toArray();

        products.forEach(p => {
            console.log(`\nProduct: "${p.name}"`);
            if (p.variants && p.variants.length > 0) {
                // Show first 5 variants to confirm pattern
                p.variants.slice(0, 5).forEach(v => {
                    console.log(`  - "${v.size || v.flavour}"`);
                });
                if (p.variants.length > 5) console.log(`  ... and ${p.variants.length - 5} more`);
            } else {
                console.log('  No variants found.');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkVariants();
