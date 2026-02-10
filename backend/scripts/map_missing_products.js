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

// Helper to normalize strings
const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Levenshtein distance
const levenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
};

// Clean flavor from file name
const cleanFileName = (fileName, folderName) => {
    let clean = fileName;
    clean = clean
        .replace(/\s*-?\s*\d+\s*grams\s*/gi, '')
        .replace(/\s*-?\s*\d+\s*mg\s*/gi, '')
        .replace(/\s*U\d+\s*/gi, '')
        .replace(/\s*-?\s*Family\s*$/i, '')
        .replace(/\s*HIT\s*/gi, '')
        .replace(/\s*-?\s*copy\s*$/i, '')
        .replace(/\s*-?\s*Photoroom\s*$/i, '')
        .replace(/\s*\.(png|jpg|jpeg|webp)$/i, '')
        .trim();

    const brandPrefixes = [
        'Flavour Beast e-juice', 'Flavour Bease e- juice', 'Flavour Beast e- juice',
        'FlavourBeast', 'Flavour beast mode max 2', 'Mode max 2', 'Sniper',
        'G9-', 'R26 -', 'prime', 'Onek Air', 'Prime Whip Cream Charger',
        'Elfbar', 'Elf Bar', 'Allo', 'Bazooka', 'Hi5 Click', 'Hi5'
    ];

    for (const prefix of brandPrefixes) {
        if (clean.toLowerCase().startsWith(prefix.toLowerCase())) {
            clean = clean.substring(prefix.length).replace(/^[\s-_]+/, '').trim();
        }
    }

    clean = clean.replace(/^-+/, '').replace(/-+/g, ' ').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
    return clean;
};

// Precise configurations
const FOLDER_CONFIG = {
    'Abt Hybrid': { products: ['ABT'], variantPrefixes: ['ABT'] },
    'Abt Twist': { products: ['Abt Twist'], variantPrefixes: ['Abt Twist'] },
    'Allo 500': { products: ['Allo 500'], variantPrefixes: ['Allo 500'] },
    'Allo Ultra 25k': { products: ['Allo 25K White Peach Razz', 'Allo 25K'], variantPrefixes: ['Allo 25K', 'Allo Ultra'] },
    'Allo e - juice 20 mg': { products: ['Allo Juice'], variantPrefixes: ['Allo Juice', 'Allo'] },
    'Bazooka X3': { products: ['Bazooka'], variantPrefixes: ['Bazooka'] },
    'Elfbar AF 12000': { products: ['Elfbar 12k Pink Lemon'], variantPrefixes: ['Elfbar 12k', 'Elfbar'] },
    'Elfbar BC10000': { products: ['Elfbar BC10000'], variantPrefixes: ['Elfbar BC10000', 'Elfbar'] },
    'Elfbar GH20000': { products: ['Elfbar Gh20000'], variantPrefixes: ['Elfbar Gh20000', 'Elfbar'] },
    'Elfbar Moonlight 70k': { products: ['Elfbar Moonlight 70k'], variantPrefixes: ['Elfbar Moonlight 70k', 'Elfbar'] },
    'Elfbar Prime 1800': { products: ['ElfBar 1800 Watermelon Ice'], variantPrefixes: ['ElfBar 1800', 'Elfbar'] },
    'Flavour Beast e-juice 20mg': { products: ['Flavour Beast Cravin Juice 20 Mg', 'Flavour Beast Juice', 'Flavour Beast Unleashed Juice'], variantPrefixes: ['Flavour Beast', 'FB', 'Unleashed'] },
    'Flavour Beast e-juice 3mg': { products: ['Flavour Beast Freebase 3mg Juice'], variantPrefixes: ['Flavour Beast', 'FB'] },
    'Flavour Beast X Twelve Monki e- juice': { products: ['Flavour Beast Juice', 'Flavour Beast Sippin Juice'], variantPrefixes: ['Flavour Beast', 'Twelve Monki'] },
    'Fog': { products: ['Fog Pro X', 'Fog 16 Series'], variantPrefixes: ['Fog', 'Fog Pro X', 'Fog 16 Series'] },
    'Gcore 30ml': { products: ['Gcore Juices 30 Ml 20 Mg', 'Gcore Juice 30 ML 10 MG'], variantPrefixes: ['Gcore', 'G9'] },
    'Hi5 Click': { products: ['Hi5 Click'], variantPrefixes: ['Hi5 Click', 'Hi5'] },
    'Hydra': { products: ['Flavour Beast Hydra 18k'], variantPrefixes: ['Flavour Beast Hydra 18k', 'Hydra', 'Flavour Beast'] },
    'Ice Nic': { products: ['Ice Nic'], variantPrefixes: ['Ice Nic'] },
    'Level X G2 2+10': { products: ['Level X G2'], variantPrefixes: ['Level X G2', 'Level X'] },
    'Level X G2 Ultra': { products: ['Level X G2 Ultra'], variantPrefixes: ['Level X G2 Ultra', 'Level X G2', 'Level X'] },
    'Mode Max 2': { products: ['Flavour Beast Mode Max 2'], variantPrefixes: ['Flavour Beast Mode Max 2', 'Mode Max 2', 'Mode Max', 'Flavour Beast'] },
    'OneK Air': { products: ['Onek Air 1000 Puffs'], variantPrefixes: ['Onek Air 1000 Puffs', 'Onek Air'] },
    'Prime Whip Cream Charger': { products: ['Prime Whip Cream Charger'], variantPrefixes: ['Prime Whip Cream Charger', 'Prime'] },
    'Rivo Bar': { products: ['Rivo Bar'], variantPrefixes: ['Rivo Bar', 'Rivo'] },
    'Sniper': { products: ['Sniper'], variantPrefixes: ['Sniper'] },
    'Twist Bar +': { products: ['Twist Bar +'], variantPrefixes: ['Twist Bar +', 'Twist'] },
    'Vfeel V1': { products: ['Vfeel V1'], variantPrefixes: ['Vfeel V1', 'Vfeel'] }
};

// Special mappings
const SPECIAL_MAPPINGS = {
    'Blueberry Ice': ['Bluberry Ice'],
    'Classic Tobacco': ['Clkassic Tobbaco'],
    'Fizzy RT ( Root Beer )': ['Fizzy Rout beer'],
    'C D (Canada Dry)': ['Canada Dry', 'CD'],
    'RB ( Root Beer )': ['Route Beer', 'Root Beer', 'RB', 'Rootbeet Fizz'],
    'SK ( Skittles)': ['Skittles', 'SK'],
    'GB': ['Gummie Bear', 'GB'],
    'We Grape': ['White Grape'],
    'We Peach': ['White Peach'],
    'We Peach Ice': ['White Peach Ice'],
    'We Fizz': ['White Fizz'],
    'We Wild Grape': ['White Wild Grape', 'Wild White Grape'],
    'Spearmint': ['Spearmint Ice'],
    'Blue Razz': ['Blue Razz Ice'],
    'Mango Dragonfruit': ['Mango Dragon Fruit'],
    'Kiwi Passionfruit Guava Ice': ['Kiwi Passion Fruit Guava'],
    'Strawberry Ice H Ice': ['Strawberry Ice', 'H-Ice'],
    'Peach Berry Ice': ['Peach Ice', 'Cherry Ice', 'Peach Berry'],
    'LEMON': ['Sweet Lemonade'],
    'Mexican-Mango': ['Mexican Mango'],
    'prime Charger 2000': ['Blueberry Blast'],
};

// Recursively strip any matching prefix until no change
const extractFlavorFromVariant = (variantName, prefixes) => {
    let flavor = variantName;
    let changed = true;
    while (changed) {
        changed = false;
        for (const prefix of prefixes) {
            if (flavor.toLowerCase().startsWith(prefix.toLowerCase())) {
                const newFlavor = flavor.substring(prefix.length).trim();
                if (newFlavor !== flavor) {
                    flavor = newFlavor;
                    changed = true;
                }
            }
        }
    }
    return flavor;
};

const uploadMissingProducts = async () => {
    console.log('Starting COMPLETE variant image mapping script...');

    await connectDB();
    connectCloudinary();

    if (!fs.existsSync(productsDir)) {
        process.exit(1);
    }

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const notFoundVariants = [];

    for (const [folderName, config] of Object.entries(FOLDER_CONFIG)) {
        const folderPath = path.join(productsDir, folderName);
        if (!fs.existsSync(folderPath)) {
            console.log(`[SKIP] Folder not found: ${folderName}`);
            continue;
        }

        console.log(`\n========== Processing Folder: ${folderName} ==========`);

        let parentProducts = await Product.find({ name: { $in: config.products } });

        if (parentProducts.length === 0) {
            // try fuzzy match for parent product name if exact failed
            const regex = new RegExp(config.products[0].split(' ')[0], 'i');
            parentProducts = await Product.find({ name: { $regex: regex } });
        }

        if (parentProducts.length === 0) {
            console.log(`[WARN] No parent products found for folder: ${folderName}`);
            continue;
        }

        const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));

        for (const file of files) {
            processedCount++;
            const filePath = path.join(folderPath, file);
            const rawFileName = file.replace(/\.(png|jpg|jpeg|webp)$/i, '');

            const fileFlavor = cleanFileName(rawFileName, folderName);
            const normalizedFileFlavor = normalize(fileFlavor);

            console.log(`\n[${processedCount}] File: "${rawFileName}" -> Flavor: "${fileFlavor}"`);

            const alternateNames = SPECIAL_MAPPINGS[fileFlavor] || SPECIAL_MAPPINGS[rawFileName] || [];
            const allSearchTerms = [fileFlavor, ...alternateNames];

            let matchedProduct = null;
            let matchedVariant = null;
            let matchedVariantIndex = -1;
            let bestDistance = Infinity;

            for (const product of parentProducts) {
                if (!product.variants) continue;

                for (let i = 0; i < product.variants.length; i++) {
                    const variant = product.variants[i];
                    const variantName = variant.size || variant.flavour || '';

                    const variantFlavor = extractFlavorFromVariant(variantName, config.variantPrefixes);

                    const variantParts = variantFlavor.includes('/') ? variantFlavor.split('/').map(p => p.trim()) : [variantFlavor];

                    for (const vPart of variantParts) {
                        const normalizedVariantFlavor = normalize(vPart);

                        for (const searchTerm of allSearchTerms) {
                            const normalizedSearch = normalize(searchTerm);

                            if (normalizedVariantFlavor === normalizedSearch) {
                                matchedProduct = product; matchedVariant = variant; matchedVariantIndex = i; bestDistance = 0; break;
                            }
                            if (normalizedVariantFlavor.includes(normalizedSearch) || normalizedSearch.includes(normalizedVariantFlavor)) {
                                const dist = Math.abs(normalizedVariantFlavor.length - normalizedSearch.length);
                                if (dist < bestDistance) {
                                    bestDistance = dist; matchedProduct = product; matchedVariant = variant; matchedVariantIndex = i;
                                }
                            }
                            const dist = levenshtein(normalizedVariantFlavor, normalizedSearch);
                            const threshold = Math.min(3, Math.floor(normalizedSearch.length / 3));
                            if (dist <= threshold && dist < bestDistance) {
                                bestDistance = dist; matchedProduct = product; matchedVariant = variant; matchedVariantIndex = i;
                            }
                        }
                        if (bestDistance === 0) break;
                    }
                    if (bestDistance === 0) break;
                }
                if (bestDistance === 0) break;
            }

            if (!matchedVariant) {
                console.log(`    [NOT FOUND] No matching variant`);
                notFoundVariants.push({ folder: folderName, file: rawFileName, flavor: fileFlavor });
                skippedCount++;
                continue;
            }

            console.log(`    [FOUND] Matched: "${matchedVariant.size || matchedVariant.flavour}" (Distance: ${bestDistance})`);

            let imageUrl = '';
            try {
                const pId = `${normalize(folderName)}_${normalizedFileFlavor}_${Date.now()}`;
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: `vapee/products/${folderName}`,
                    public_id: pId,
                    use_filename: false,
                    unique_filename: false,
                    overwrite: true,
                    resource_type: 'image'
                });
                imageUrl = result.secure_url;
            } catch (err) {
                console.error(`    [ERROR] Upload failed: ${err.message}`);
                errors.push({ folder: folderName, file: rawFileName, error: err.message });
                continue;
            }

            matchedProduct.variants[matchedVariantIndex].image = imageUrl;
            await matchedProduct.save();
            console.log(`    [UPDATED] Variant image set`);
            updatedCount++;
        }
    }

    console.log('\nSUMMARY');
    console.log(`Total files processed: ${processedCount}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Variants not found: ${notFoundVariants.length}`);
    console.log(`Errors: ${errors.length}`);
    process.exit(0);
};

uploadMissingProducts();
