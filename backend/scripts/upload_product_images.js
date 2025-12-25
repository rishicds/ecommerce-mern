import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import connectCloudinary from '../config/cloudinary.js';
import Product from '../models/productModel.js';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsDir = path.join(__dirname, '../public/products');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper to normalize strings for comparison (aggressive: alpha-numeric only)
const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const uploadImages = async () => {
    console.log('Starting images upload script...');
    await connectDB();
    connectCloudinary();

    if (!fs.existsSync(productsDir)) {
        console.error('Products directory not found:', productsDir);
        process.exit(1);
    }

    const folders = fs.readdirSync(productsDir);
    let processedCount = 0;
    let updatedCount = 0;

    for (const folderName of folders) {
        if (folderName.startsWith('.')) continue; // skip hidden
        const folderPath = path.join(productsDir, folderName);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        console.log(`\nProcessing Folder: "${folderName}"`);

        // 1. Find Product
        let product = await Product.findOne({ name: folderName });

        if (!product) {
            // Heuristic search
            const firstWord = folderName.split(' ')[0];
            const candidates = await Product.find({ name: { $regex: new RegExp(firstWord, 'i') } });

            // Try to find best match among candidates
            product = candidates.find(c => {
                const cName = normalize(c.name);
                const fName = normalize(folderName);
                return cName.includes(fName) || fName.includes(cName);
            });
        }

        if (!product) {
            console.warn(`  [WARN] Product not found for folder "${folderName}"`);
            continue;
        }

        console.log(`  [MATCH] Found Product: "${product.name}" (ID: ${product._id})`);

        const files = fs.readdirSync(folderPath);
        let productUpdated = false;

        for (const file of files) {
            if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;

            // Prepare File Name
            const rawFileName = file.replace(/\.(png|jpg|jpeg|webp)$/i, '');
            // Remove code prefixes like "R26 - ", "S10 - "
            const fileNameNoCode = rawFileName.replace(/^[A-Z0-9]+\s*-\s*/, '');
            const fileNameNormalized = normalize(fileNameNoCode);

            // Find Variant
            const variant = product.variants.find(v => {
                // Prepare DB Variant Name
                // Check 'flavour' first, then 'size'
                let dbName = v.flavour || v.size || '';

                // Remove product name from variant name (e.g. "ABT White Grape")
                const productNameRegex = new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex
                let dbNameClean = dbName.replace(productNameRegex, '');

                // Also remove folder name if it differs slightly
                const folderNameRegex = new RegExp(folderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                dbNameClean = dbNameClean.replace(folderNameRegex, '');

                const dbNameNormalized = normalize(dbNameClean);

                return dbNameNormalized === fileNameNormalized;
            });

            if (variant) {
                if (variant.image && variant.image.includes('cloudinary')) {
                    // console.log(`    [SKIP] "${fileNameNoCode}" already has image.`);
                    // continue; 
                    // Uncomment above to skip existing images
                }

                console.log(`    [UPLOAD] Matching "${rawFileName}" to variant "${variant.size || variant.flavour}"...`);

                try {
                    const result = await cloudinary.uploader.upload(path.join(folderPath, file), {
                        folder: `vapee/products/${folderName}`,
                        public_id: rawFileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
                        use_filename: false,
                        resource_type: 'image'
                    });

                    variant.image = result.secure_url;
                    productUpdated = true;
                    console.log(`      -> Uploaded: ${result.secure_url}`);
                    await delay(200);
                } catch (err) {
                    console.error(`      [ERROR] Upload failed: ${err.message}`);
                }

            } else {
                console.warn(`    [WARN] No match for file "${rawFileName}" (Norm: ${fileNameNormalized})`);
                // console.log(`      Available: ${product.variants.map(v => normalize((v.flavour||v.size||'').replace(new RegExp(product.name, 'i'), ''))).join(', ')}`);
            }
        }

        if (productUpdated) {
            await product.save();
            console.log(`  [SAVE] Updated product "${product.name}"`);
            updatedCount++;
        }
        processedCount++;
    }

    console.log(`\nFinished! Processed ${processedCount} folders. Updated ${updatedCount} products.`);
    process.exit(0);
};

uploadImages();
