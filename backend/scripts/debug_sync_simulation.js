
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cloverService from '../services/cloverService.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

dotenv.config();

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for Debugging");
    } catch (err) {
        console.error("DB Connection Error:", err);
        process.exit(1);
    }
};

const syncProductsDebug = async () => {
    await connectDB();

    try {
        console.log("Fetching products from Clover...");
        const cloverProducts = await cloverService.getProducts();
        console.log(`Fetched ${cloverProducts.length} items from Clover.`);

        // 2. Group items by itemGroup.id
        const groups = {}; // groupId -> [items]
        const standalone = [];

        cloverProducts.forEach(item => {
            if (item.itemGroup && item.itemGroup.id) {
                if (!groups[item.itemGroup.id]) {
                    groups[item.itemGroup.id] = [];
                }
                groups[item.itemGroup.id].push(item);
            } else {
                standalone.push(item);
            }
        });

        console.log(`Identified ${Object.keys(groups).length} Groups and ${standalone.length} Standalone items.`);

        let syncedCount = 0;
        let errorCount = 0;

        // 3. Process Groups
        console.log("--- Processing Groups ---");
        for (const groupId in groups) {
            const items = groups[groupId];
            if (items.length === 0) continue;

            const firstItem = items[0];
            const mainName = firstItem.name;

            try {
                // Try to find existing Product by cloverItemGroupId
                let product = await Product.findOne({ cloverItemGroupId: groupId });

                // Construct Variants
                const variants = items.map(item => {
                    let flavour = "";
                    let size = "";

                    if (item.attributes && item.attributes.elements) {
                        item.attributes.elements.forEach(attr => {
                            const attrName = (attr.name || "").toLowerCase();
                            if (attrName.includes("flavour") || attrName.includes("flavor")) {
                                flavour = attr.value;
                            } else if (attrName.includes("size") || attrName.includes("capacity")) {
                                size = attr.value;
                            }
                        });
                    }

                    if (!flavour) {
                        flavour = item.name;
                    }

                    if (!size) {
                        size = item.name;
                    }

                    return {
                        size: size,
                        flavour: flavour,
                        price: item.price / 100,
                        quantity: item.itemStock ? item.itemStock.quantity : 0,
                        cloverItemId: item.id,
                        sku: item.sku || "",
                        showOnPOS: !item.hidden,
                    };
                });

                const mainFlavour = variants.length > 0 ? variants[0].flavour : "";

                const categories = firstItem.categories && Array.isArray(firstItem.categories.elements)
                    ? firstItem.categories.elements.map(c => c.name)
                    : [];

                const modifierGroups = firstItem.modifierGroups && Array.isArray(firstItem.modifierGroups.elements)
                    ? firstItem.modifierGroups.elements
                    : [];

                const taxRates = firstItem.taxRates && Array.isArray(firstItem.taxRates.elements)
                    ? firstItem.taxRates.elements
                    : [];

                const totalStock = variants.reduce((acc, v) => acc + (v.quantity || 0), 0);

                if (!product) {
                    product = new Product({
                        cloverItemGroupId: groupId,
                        productId: groupId,
                        name: mainName,
                        description: firstItem.description || mainName,
                        price: variants[0].price,
                        variants: variants,
                        categories: categories,
                        flavour: mainFlavour,
                        stockCount: totalStock,
                        inStock: totalStock > 0,
                        showOnPOS: !firstItem.hidden,
                        modifierGroups: modifierGroups,
                        taxRates: taxRates,
                        images: []
                    });
                } else {
                    product.name = mainName;
                    product.variants = variants;
                    product.categories = categories;
                    product.flavour = mainFlavour;
                    product.stockCount = totalStock;
                    product.inStock = totalStock > 0;
                    product.modifierGroups = modifierGroups;
                    product.taxRates = taxRates;
                    product.price = variants[0].price;
                }

                await product.save();
                syncedCount++;
                // process.stdout.write('.');

            } catch (err) {
                console.error(`\nFAILED to sync Group ${groupId} (${mainName}):`, err.message);
                if (err.code === 11000) {
                    console.error("Duplicate Key Error Details:", JSON.stringify(err.keyValue));
                }
                errorCount++;
            }
        }

        // 4. Process Standalone Items
        console.log("\n--- Processing Standalone Items ---");
        for (const item of standalone) {
            try {
                let product = await Product.findOne({ externalCloverId: item.id });
                const stock = item.itemStock ? item.itemStock.quantity : 0;

                let flavour = "";
                let size = "";

                if (item.attributes && item.attributes.elements) {
                    item.attributes.elements.forEach(attr => {
                        const attrName = (attr.name || "").toLowerCase();
                        if (attrName.includes("flavour") || attrName.includes("flavor")) {
                            flavour = attr.value;
                        } else if (attrName.includes("size")) {
                            size = attr.value;
                        }
                    });
                }

                if (!flavour) flavour = item.name;

                const modifierGroups = item.modifierGroups && Array.isArray(item.modifierGroups.elements)
                    ? item.modifierGroups.elements
                    : [];

                const taxRates = item.taxRates && Array.isArray(item.taxRates.elements)
                    ? item.taxRates.elements
                    : [];

                if (!product) {
                    product = new Product({
                        externalCloverId: item.id,
                        productId: item.id,
                        name: item.name,
                        price: item.price / 100,
                        description: item.description || item.name,
                        stockCount: stock,
                        inStock: stock > 0,
                        showOnPOS: !item.hidden,
                        categories: item.categories && Array.isArray(item.categories.elements)
                            ? item.categories.elements.map(c => c.name)
                            : [],
                        modifierGroups: modifierGroups,
                        taxRates: taxRates,
                        flavour: flavour,
                        variants: [],
                        images: []
                    });
                } else {
                    product.name = item.name;
                    product.price = item.price / 100;
                    product.stockCount = stock;
                    product.showOnPOS = !item.hidden;
                    product.modifierGroups = modifierGroups;
                    product.taxRates = taxRates;
                    product.flavour = flavour;
                    product.categories = item.categories && Array.isArray(item.categories.elements)
                        ? item.categories.elements.map(c => c.name)
                        : product.categories;
                }
                await product.save();
                syncedCount++;
                // process.stdout.write('.');
            } catch (err) {
                console.error(`\nFAILED to sync Standalone Item ${item.id} (${item.name}):`, err.message);
                if (err.code === 11000) {
                    console.error("Duplicate Key Error Details:", JSON.stringify(err.keyValue));
                }
                errorCount++;
            }
        }

        console.log(`\nSync Completed. Success: ${syncedCount}, Errors: ${errorCount}`);
        process.exit(0);

    } catch (error) {
        console.error("Global Sync Error:", error);
        process.exit(1);
    }
};

syncProductsDebug();
