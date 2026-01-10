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
    console.log('Starting enhanced product sync script (Recursive)...');
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
            const brandFirstWord = brandName.split(' ')[0].toLowerCase();
            if (productNameClean.toLowerCase().startsWith(brandFirstWord)) {
                // e.g. "Flavour Beast - Flavour Beast Bomb" -> "Bomb"
                // But take care not to strip valid parts if they are distinct
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
                const pId = `${normalize(brandName)}_${normalize(productNameClean)}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
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
                let changed = false;
                if (!product.images || product.images.length === 0 || !product.images[0].url) {
                    product.images = [{ url: imageUrl, public_id: '' }];
                    changed = true;
                } else {
                    // For Rivo Bar and others, we usually only want one main image per synced product
                    // If you want to keep multiple, you'd check for similarity, 
                    // but most users want the latest sync to define the product image.
                    if (product.images[0].url !== imageUrl) {
                        product.images = [{ url: imageUrl, public_id: '' }];
                        changed = true;
                    }
                }

                if (!product.brand || product.brand !== brandName) {
                    product.brand = brandName;
                    changed = true;
                }
                if (!product.categories || !product.categories.includes(brandName)) {
                    product.categories = [...(product.categories || []), brandName];
                    changed = true;
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

    const folders = fs.readdirSync(productsDir);

    for (const folderName of folders) {
        if (folderName.startsWith('.')) continue; // skip hidden
        const folderPath = path.join(productsDir, folderName);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        console.log(`\nProcessing Brand/Category Folder: "${folderName}"`);
        await processFolder(folderPath, folderName);
        processedCount++;
    }

    console.log(`\nFinished! Processed ${processedCount} brands.`);
    console.log(`Matched & Updated: ${updatedCount}`);
    console.log(`Created New: ${createdCount}`);
    process.exit(0);
};

uploadImages();
