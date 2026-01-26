import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyHeroImages = async () => {
    await connectDB();

    const ids = [
        '695aab338d9bcf65193c3f59', // Bussin Banana
        '695aab458d9bcf65193c3f7c', // Wild White Grape
        '695aab298d9bcf65193c3f40', // Elfbar Prime Grape
        '695aa9f88d9bcf65193c3d3d', // Abt White Grape
        '695aac718d9bcf65193c4af3', // Sniper Peach Ice
        '695aa9d98d9bcf65193c3cca'  // Abt Blueberry Ice
    ];

    console.log("Verifying Hero product images...");

    for (const id of ids) {
        const p = await Product.findById(id);
        if (p) {
            console.log(`Product: ${p.name}`);
            console.log(`Images:`, p.images.map(img => img.url));
        } else {
            console.log(`ID NOT FOUND: ${id}`);
        }
    }

    process.exit();
};

verifyHeroImages();
