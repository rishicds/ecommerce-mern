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

// Mapping folder names to potential Database Product/Brand Names
const BRAND_ALIASES = {
    'Allo Ultra 25k': ['Allo 25K', 'Allo 25k', 'Allo 25K White Peach Razz'], // Specific target
    'Flavour Beast e-juice 20mg': ['Flavour Beast Juice', 'Flavour Beast Cravin Juice 20 Mg'],
    'Flavour Beast e-juice 3mg': ['Flavour Beast Freebase 3mg Juice'],
    'Gcore 30ml': ['Gcore Juices 30 Ml 20 Mg', 'Gcore Juice 30 ML 10 MG', 'Gcore Juice 60 Ml (20mg)'],
    'Level X G2 2+10': ['Level X G2', 'Level X G2 Ultra'],
    'Level X G2 Ultra': ['Level X G2 Ultra'],
    'Abt Twist': ['Abt Twist'],
    'Abt Hybrid': ['ABT'], // Explicit
    'Allo e juice': ['Allo Juice', 'Allo E-Juice'],
    'Allo e - juice': ['Allo Juice', 'Allo E-Juice'],
    'Allo e - juice 20 mg': ['Allo Juice', 'Allo E-Juice'],
    'Allo 500': ['Allo 500 - Allo 500', 'Allo 500'],
    'Gcore': ['Gcore Juices 30 Ml 20 Mg', 'Gcore Juice 30 ML 10 MG', 'Gcore Juice 60 Ml (20mg)']
};

// Helper to normalize strings for comparison (aggressive: alpha-numeric only)
const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Helper: Rank parent candidates based on similarity to the brand/folder name
const rankParents = (targetName, parents) => {
    const target = normalize(targetName);
    return parents.sort((a, b) => {
        const nameA = normalize(a.name);
        // const brandA = normalize(a.brand || '');
        const nameB = normalize(b.name);
        // const brandB = normalize(b.brand || '');

        // 1. Exact match preference (of name or brand)
        if (nameA === target) return -1;
        if (nameB === target) return 1;

        // 2. Starts with preference
        const startA = nameA.startsWith(target) || target.startsWith(nameA);
        const startB = nameB.startsWith(target) || target.startsWith(nameB);
        if (startA && !startB) return -1;
        if (!startA && startB) return 1;

        // 3. Length match (closer length is usually better if tokens match)
        return Math.abs(nameA.length - target.length) - Math.abs(nameB.length - target.length);
    });
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
    const missingProducts = [];

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

            // aggressive suffix cleaning for "Family", "20mg", "U500 HIT" etc.
            productNameClean = productNameClean
                .replace(/\s*-\s*Family\s*\)?$/i, '')
                .replace(/\s*\d+mg\s*/gi, '')
                .replace(/\s*U\d+\s*(HIT)?\s*/gi, '')
                .replace(/\s*HIT\s*/gi, '')
                .replace(/\s*E-LIQUID\s*/gi, '')
                .trim();
            if (productNameClean.toLowerCase().startsWith("flavour beast e-juice")) {
                productNameClean = productNameClean.replace(/flavour beast e-juice\s*/i, '').trim();
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

            // Try to find in variants if main product not found
            if (!product) {
                // Find all products that might be the parent (same brand)
                // Relaxed search: Try full brand name, OR just the first word
                const brandFirstWord = brandName.split(' ')[0];
                const searchConditions = [
                    { brand: brandName },
                    { brand: { $regex: new RegExp(normalize(brandName), 'i') } },
                    { brand: { $regex: new RegExp('^' + normalize(brandFirstWord), 'i') } }, // Match strictly starting with first word
                    { name: { $regex: new RegExp('^' + normalize(brandFirstWord), 'i') } }   // Match product NAME starting with first word
                ];

                // Add explicit alias searches
                if (BRAND_ALIASES[brandName]) {
                    BRAND_ALIASES[brandName].forEach(alias => {
                        searchConditions.push({ name: { $regex: new RegExp(alias, 'i') } });
                        searchConditions.push({ brand: { $regex: new RegExp(alias, 'i') } });
                    });
                }

                const parents = await Product.find({ $or: searchConditions });

                // Sort parents by relevance to the actual folder name (Brand Name)
                // This prevents "Allo Ultra 25k" from matching "Allo Sync Pods" just because it was found first
                rankParents(brandName, parents);

                let variantFound = false;

                for (const parent of parents) {
                    // Check if this parent is an explicit allowed alias
                    let isAliasMatch = false;
                    if (BRAND_ALIASES[brandName]) {
                        // Check if parent name fuzzy matches any alias
                        const pNameCheck = normalize(parent.name);
                        isAliasMatch = BRAND_ALIASES[brandName].some(alias => pNameCheck.includes(normalize(alias)));
                    }

                    // Safety Check: Ensure the parent name is actually similar to the brand/folder name
                    // This prevents "Allo Ultra 25k" (Brand) from matching "Allo Sync Pods" (Parent)
                    // just because they share the "Allo" prefix.
                    const pNameNorm = normalize(parent.name);
                    const bNameNorm = normalize(brandName);

                    // Simple check: If both have >1 words, and the non-brand parts are completely different.
                    // E.g. "Allo Sync" vs "Allo Ultra"
                    // Extract common prefix (Brand usually)
                    // If the remaining suffix is completely different, skip.

                    // Heuristic: If folder name has specific keywords (like "Ultra", "25k", "Sync") 
                    // that are MISSING from the parent name, skip.
                    // But we must be careful. "Allo 25k" parent vs "Allo Ultra 25k" folder. "Ultra" is missing.
                    // But "Allo Sync Pods" vs "Allo Ultra 25k". "Sync" and "Pods" are in parent but not folder.

                    // Strategy: If ParentName has words that are NOT in BrandName, AND BrandName has words not in ParentName,
                    // it suggests they are sibling product lines, not parent-child.
                    // Exception: "Allo" (Parent) vs "Allo Ultra" (Child) -> Words in Child not in Parent is OK.
                    // But Words in Parent NOT in Child is suspicious if Parent is supposed to be the generic container.
                    // "Allo Sync Pods" (Parent) vs "Allo Ultra" (Folder). "Sync", "Pods" extra in Parent. Bad.

                    const pWords = parent.name.toLowerCase().split(/\s+/).map(normalize).filter(w => w.length > 2);
                    const bWords = brandName.toLowerCase().split(/\s+/).map(normalize).filter(w => w.length > 2);

                    const pUnique = pWords.filter(w => !bWords.includes(w));
                    // If parent has significant words that the folder doesn't have, it's likely a different product line
                    // e.g. Parent "Allo Sync Pods" has "sync", "pods". Folder "Allo Ultra 25k" doesn't.
                    // This implies "Allo Sync Pods" is TOO specific to be the parent of "Allo Ultra 25k".
                    if (pUnique.length > 0) {
                        // Allow "Vape", "Disposable", "Device" maybe? For now strict.
                        // But wait, "Allo 25k White Peach" -> "Allo 25k" folder. "White", "Peach" unique. 
                        // But we search for PARENT. 
                        // "Allo Ultra 25k" folder.
                        // "Allo Sync Pods" parent. "sync", "pods" unique. Skip.
                        // "Allo 2500" parent. "2500" unique. Skip.
                        // "Allo" parent. Unique = 0. OK.
                    }

                    // Let's implement a relaxed version:
                    // If parent has specific distinguishing keywords (Sync, Pods, 2500, 1500) that are NOT in brand name, SKIP.
                    const distinguishingKeywords = ['sync', 'pods', 'ultra', '25k', '2500', '1500', '4500', '5000', '10000', 'standard', 'hybrid', 'twist'];
                    const hasConflict = pUnique.some(w => distinguishingKeywords.includes(w));

                    if (hasConflict && !isAliasMatch) {
                        // console.log(`Skipping parent "${parent.name}" for "${brandName}" due to keyword conflict.`);
                        continue;
                    }

                    if (!parent.variants || parent.variants.length === 0) continue;

                    const variantMatch = parent.variants.find(v => {
                        const vFlavour = normalize(v.flavour || '');
                        const vSize = normalize(v.size || '');
                        const pName = normalize(productNameClean);

                        // Check if variant flavour/size matches the product name
                        return (vFlavour && pName.includes(vFlavour)) ||
                            (vSize && pName.includes(vSize)) ||
                            (vFlavour && vFlavour.includes(pName)) ||
                            (vSize && vSize.includes(pName)); // Reverse check for size too
                    });

                    if (variantMatch) {
                        // CHECK IF IMAGE ALREADY EXISTS
                        if (variantMatch.image && variantMatch.image.includes('cloudinary')) {
                            console.log(`    [SKIP] Variant already has image: "${variantMatch.flavour || variantMatch.size}"`);
                            if (!variantFound) variantFound = true; // Mark as found so we don't treat it as missing
                            break;
                        }

                        console.log(`    [MATCH VARIANT] Found in "${parent.name}" -> Variant: ${variantMatch.flavour || variantMatch.size}`);

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

                        variantMatch.image = imageUrl;
                        await parent.save();
                        console.log(`    [UPDATE VARIANT] Updated image for variant in "${parent.name}"`);
                        updatedCount++;
                        variantFound = true;
                        break; // Stop looking after first match
                    }
                }

                if (!variantFound) {
                    console.log(`    [MISSING] Product/Variant not found for: "${fullProposedName}"`);
                    missingProducts.push({
                        file: rawFileName,
                        proposedName: fullProposedName,
                        folder: brandName
                    });
                }
            } else {
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

                let changed = false;
                if (!product.images || product.images.length === 0 || !product.images[0].url) {
                    product.images = [{ url: imageUrl, public_id: '' }];
                    changed = true;
                } else {
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

                if (product.name !== fullProposedName) {
                    if (normalize(product.name) !== normalize(fullProposedName)) {
                        console.log(`    [RENAME] Fixing name: "${product.name}" -> "${fullProposedName}"`);
                        product.name = fullProposedName;
                        changed = true;
                    }
                }

                if (changed) {
                    await product.save();
                    console.log(`    [UPDATE] Updated product: "${product.name}"`);
                    updatedCount++;
                } else {
                    console.log(`    [SKIP] Product up to date: "${product.name}"`);
                }
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

    if (missingProducts.length > 0) {
        console.log(`\n----------------------------------------`);
        console.log(`MISSING PRODUCTS (${missingProducts.length})`);
        console.log(`----------------------------------------`);
        missingProducts.forEach(p => {
            console.log(`- Folder: ${p.folder} | File: ${p.file} | Proposed: ${p.proposedName}`);
        });
    } else {
        console.log(`\nNo missing products!`);
    }

    process.exit(0);
};

uploadImages();
