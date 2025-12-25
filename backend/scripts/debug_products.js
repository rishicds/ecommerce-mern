import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsDir = path.join(__dirname, '../public/products');

const logC = (msg) => {
    console.log(msg);
    fs.appendFileSync(path.join(__dirname, 'debug_output.txt'), msg + '\n');
};

const debug = async () => {
    fs.writeFileSync(path.join(__dirname, 'debug_output.txt'), 'Starting Debug Round 3\n');
    await connectDB();

    const folders = fs.readdirSync(productsDir);

    // We will check a few specific folders that confused us
    const targets = ['Abt Hybrid', 'Allo Ultra 25k', 'Abt Twist'];

    for (const folder of targets) {
        if (!folders.includes(folder)) continue;

        logC(`\n-----------------------------------`);
        logC(`Analyzing Folder: "${folder}"`);

        // Exact match
        let product = await Product.findOne({ name: folder });

        // Try to find the product via candidates if exact match failed
        if (!product) {
            // Heuristic: Try finding a product that starts with the first word of the folder
            const firstWord = folder.split(' ')[0];
            logC(`[MISS] Exact match failed. Searching for "${firstWord}"...`);
            const candidates = await Product.find({ name: { $regex: new RegExp(firstWord, 'i') } });
            logC(`  Found ${candidates.length} candidates.`);

            // Try to find a loose match
            product = candidates.find(c => {
                // Check if names are similar?
                return c.name.toLowerCase().includes(folder.toLowerCase()) ||
                    folder.toLowerCase().includes(c.name.toLowerCase());
            });

            if (product) logC(`  [GUESS] Selected candidate: "${product.name}"`);
        } else {
            logC(`[MATCH] Exact match found! ID: ${product._id}`);
        }

        if (product) {
            const variants = product.variants;
            logC(`  Checking variants for: "${product.name}"`);
            if (variants.length > 0) {
                logC(`  First Variant Raw: ${JSON.stringify(variants[0])}`);
                logC(`  Variant Sizes: ${variants.map(v => v.size).join(', ')}`);
                logC(`  Variant Flavours: ${variants.map(v => v.flavour).join(', ')}`);
            } else {
                logC(`  [WARN] No variants found for this product.`);
            }

            const files = fs.readdirSync(path.join(productsDir, folder));

            // Test matching logic on first few files
            for (const file of files.slice(0, 10)) {
                if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;

                const cleanName = file.replace(/\.(png|jpg|jpeg|webp)$/i, '').trim();
                const nameWithoutCode = cleanName.replace(/^[A-Z0-9]+\s*-\s*/, '');

                const v = variants.find(v => {
                    // Check both flavour and size
                    const dbFlavour = (v.flavour || '').trim().toLowerCase();
                    const dbSize = (v.size || '').trim().toLowerCase();
                    const target = cleanName.toLowerCase();
                    const targetNoCode = nameWithoutCode.toLowerCase();

                    return (dbFlavour && (dbFlavour === target || dbFlavour === targetNoCode)) ||
                        (dbSize && (dbSize === target || dbSize === targetNoCode));
                });

                logC(`    File "${cleanName}" -> Match? ${!!v ? 'YES' : 'NO'}`);
            }
        }
    }

    process.exit(0);
};

debug();
