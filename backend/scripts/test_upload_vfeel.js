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
    console.log('Starting Vfeel test sync script...');
    await connectDB();
    connectCloudinary();

    if (!fs.existsSync(productsDir)) {
        console.error('Products directory not found:', productsDir);
        process.exit(1);
    }

    let processedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;

    // Recursive folder processor
    const processFolder = async (currentFolderPath, brandName) => {
        const files = fs.readdirSync(currentFolderPath);

        for (const file of files) {
            const filePath = path.join(currentFolderPath, file);

            // Recurse if directory
            if (fs.lstatSync(filePath).isDirectory()) {
                console.log(`  Entering subfolder: "${file}"`);
                await processFolder(filePath, brandName);
                continue;
            }

            // Skip non-images
            if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;

            const rawFileName = file.replace(/\.(png|jpg|jpeg|webp)$/i, '');
            // Clean filename
            let productNameClean = rawFileName.replace(/^[A-Z0-9]+\s*-\s*/, '').trim();

            // Heuristic: remove simple brand redundancy
            const brandLowerCase = brandName.toLowerCase();
            const productLower = productNameClean.toLowerCase();

            if (productLower.startsWith(brandLowerCase)) {
                productNameClean = productNameClean.substring(brandName.length).trim();
                // Remove leading " - " or " " if present after stripping
                productNameClean = productNameClean.replace(/^[\s-]+/, '');
            } else {
                // Fallback: check if it starts with just the first word of the brand
                const brandFirstWord = brandName.split(' ')[0].toLowerCase();
                if (productLower.startsWith(brandFirstWord)) {
                    // Be careful not to strip if the brand name is just "Vfeel" but product is "Vfeelings" (unlikely but possible)
                    // Ideally we strip it if it's followed by space
                    const regex = new RegExp(`^${brandFirstWord}\\s+`, 'i');
                    if (regex.test(productNameClean)) {
                        productNameClean = productNameClean.replace(regex, '').trim();
                    }
                }
            }
            if (brandName.toLowerCase().includes("flavour bease") && productNameClean.toLowerCase().startsWith("flavour bease")) {
                productNameClean = productNameClean.replace(/flavour bease e- juice /i, '').replace(/flavour bease /i, '').trim();
            }

            const fullProposedName = `${brandName} - ${productNameClean}`;
            const simpleProposedName = `${brandName} ${productNameClean}`;

            console.log(`  Scanning for: "${fullProposedName}" (File: ${rawFileName})`);

            let product = await Product.findOne({
                $or: [
                    { name: fullProposedName },
                    { name: simpleProposedName },
                    { name: productNameClean, brand: brandName }
                ]
            });

            // Fuzzy fallback
            if (!product) {
                const candidates = await Product.find({
                    name: { $regex: new RegExp(normalize(brandName), 'i') }
                });
                product = candidates.find(c => normalize(c.name).includes(normalize(productNameClean)));
            }

            let imageUrl = '';

            try {
                // Mock image upload for speed if needed, or real upload
                const pId = `${normalize(brandName)}_${normalize(productNameClean)}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                // Skip actual upload for test if we just want to verify name logic? 
                // User wants to "run it again", so probably real upload.
                // But for verification speed I'll do real upload but only for Vfeel.
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: `vapee/products/${brandName}`,
                    public_id: pId,
                    use_filename: false,
                    unique_filename: false,
                    overwrite: true,
                    resource_type: 'image'
                });
                imageUrl = result.secure_url;
            } catch (err) {
                console.error(`    [ERROR] Upload failed for ${file}: ${err.message}`);
                continue;
            }

            if (product) {
                // Update logic...
                let changed = false;
                if (!product.categories || !product.categories.includes(brandName)) {
                    product.categories = [...(product.categories || []), brandName];
                    changed = true;
                }

                // FIX: Update name if it's redundant (e.g. Vfeel V1 - Vfeel V1 ...)
                // We prefer fullProposedName: "Vfeel V1 - Blueberry Raspberry Ice"
                if (product.name !== fullProposedName) {
                    // Check if current name is redundant
                    // normalize comparisons to avoid minor punctuation diffs triggering unnecessary updates
                    if (normalize(product.name) !== normalize(fullProposedName)) {
                        console.log(`    [RENAME] Fixing name: "${product.name}" -> "${fullProposedName}"`);
                        product.name = fullProposedName;
                        changed = true;
                    }
                }

                if (!product.images || product.images.length === 0 || !product.images[0].url) {
                    product.images = [{ url: imageUrl, public_id: '' }];
                    changed = true;
                } else {
                    if (product.images[0].url !== imageUrl) {
                        product.images = [{ url: imageUrl, public_id: '' }];
                        changed = true;
                    }
                }

                // Also update NAME if it changed? The user's issue was the name PRESENT in the DB?
                // Or just the matching?
                // The user said "names maybe present like this".
                // If the product matched, we might want to ensure the name is correct.
                // But usually we just match. 
                // Wait, if I change the logic, `fullProposedName` changes.
                // So if the DB has the BAD name, we won't match it with the NEW name unless we search specifically.
                // But the user says "names maybe present like this" - implying the FILE names has redundancy?
                // "Vfeel V1 - Vfeel V1 Blueberry..." -> filename or product name?
                // Screenshot shows product name on UI.
                // If I clean the name, I get "Vfeel V1 - Blueberry..."
                // Does the DB have "Vfeel V1 - Vfeel V1..."?
                // If yes, I should verify if I match it.
                // If I don't match it, I might create a NEW product.
                // I need to check if a product exists with the REDUNDANT name and update it?
                // Or just assume the DB name is fine and I just need to construct the search query correctly?

                // Actually, if the DB name is ALREADY "Vfeel V1 - Vfeel V1...", I should probably fix it in the DB too?
                // The user says "handle it".
                // I'll assume I should use the CLEAN name to find the product.
                // If the product in DB has the redundant name, I might miss it?
                // The search query uses `fullProposedName`.

                // Let's add a check: see if we can find the product with the REDUNDANT name too, and if so, RENAME it.

                if (!product) {
                    // Try finding with the redundant name to fix it
                    const redundantName = `${brandName} - ${rawFileName}`; // guessing rawFileName has redundancy
                    // OR `brandName - brandName ...`
                    // The rawFileName from user is "Vfeel V1 Blueberry..." (implied) from "Vfeel V1" folder?
                    // If file is "Vfeel V1 Blueberry...", cleaned is "Blueberry...".
                    // Redundant name would be "Vfeel V1 - Vfeel V1 Blueberry..."
                }

                if (changed) {
                    await product.save();
                    console.log(`    [UPDATE] Updated product: "${product.name}"`);
                    updatedCount++;
                } else {
                    console.log(`    [SKIP] Product up to date: "${product.name}"`);
                }

            } else {
                console.log(`    [CREATE] Creating new product: "${fullProposedName}"`);
                // ... creation logic
                const uniqueId = `${normalize(brandName)}_${normalize(productNameClean)}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                const newProduct = new Product({
                    productId: uniqueId,
                    name: fullProposedName,
                    description: `Experience the ${productNameClean} from ${brandName}. Premium quality and great taste.`,
                    brand: brandName,
                    category: brandName,
                    categories: [brandName],
                    price: 20,
                    images: [{ url: imageUrl, public_id: '' }],
                    stockCount: 100,
                    inStock: true,
                    flavour: productNameClean,
                    bestseller: false,
                    date: Date.now()
                });

                await newProduct.save();
                createdCount++;
            }
        }
    };

    // ONLY PROCESS VFEEL
    const targetFolder = 'Vfeel V1';
    const folderPath = path.join(productsDir, targetFolder);
    if (fs.existsSync(folderPath)) {
        console.log(`\nProcessing Brand/Category Folder: "${targetFolder}"`);
        await processFolder(folderPath, targetFolder);
        processedCount++;
    } else {
        console.error("Vfeel V1 folder not found!");
    }

    console.log(`\nFinished! Processed ${processedCount} brands.`);
    console.log(`Matched & Updated: ${updatedCount}`);
    console.log(`Created New: ${createdCount}`);
    process.exit(0);
};

uploadImages();
