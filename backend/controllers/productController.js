import { v2 as cloudinary } from 'cloudinary';
import xlsx from 'xlsx';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import User from '../models/userModel.js';
import Cart from '../models/cartModel.js';
import { productSchema } from "../validation/productValidation.js";
import { getIO } from '../socket.js';
import cloverService from '../services/cloverService.js';
import ModifierGroup from '../models/modifierGroupModel.js';
import ItemGroup from '../models/itemGroupModel.js';

// Helper function to generate detailed description based on product information
const generateDescription = (productData) => {
    const name = productData.name || 'This product';
    const flavour = productData.flavour || 'unique flavor';
    const categories = productData.categories && productData.categories.length > 0
        ? productData.categories.join(', ')
        : 'vaping';

    // Calculate total pods/units based on variants
    let podInfo = '';
    if (productData.variants && productData.variants.length > 0) {
        const sizes = productData.variants.map(v => v.size).join(', ');
        podInfo = ` Available in multiple sizes: ${sizes}.`;
    }

    // Sweetness and mint level information
    let flavorProfile = '';
    if (productData.sweetnessLevel !== undefined && productData.sweetnessLevel !== null) {
        flavorProfile += ` With a sweetness level of ${productData.sweetnessLevel}/10`;
    }
    if (productData.mintLevel !== undefined && productData.mintLevel !== null && productData.mintLevel > 0) {
        flavorProfile += ` and a refreshing mint level of ${productData.mintLevel}/10`;
    }
    if (flavorProfile) {
        flavorProfile += ', this product delivers a perfectly balanced taste experience.';
    }

    // Build the description
    let description = `${name} is an exceptional ${categories} product that delivers an outstanding vaping experience. `;

    if (flavour) {
        description += `This premium vape features the exquisite flavor of ${flavour}, carefully crafted to provide a satisfying and authentic taste with every puff. `;
    }

    if (podInfo) {
        description += podInfo;
    }

    if (flavorProfile) {
        description += ` ${flavorProfile}`;
    }

    description += ` Designed with the adult user in mind, this product adheres to all specifications and regulatory guidelines set by governing authorities. `;
    description += `Each unit is manufactured to the highest quality standards, ensuring consistency, safety, and satisfaction. `;
    description += `The sleek and convenient design makes it perfect for on-the-go use, while the premium ingredients guarantee a smooth and enjoyable vaping experience. `;

    if (productData.bestseller) {
        description += `This bestselling product has become a favorite among our customers for its exceptional quality and remarkable flavor profile. `;
    }

    description += `Please note: This product is intended exclusively for adult users aged 21 and over. By purchasing this product, you confirm that you meet the legal age requirements in your jurisdiction. `;
    description += `Always use responsibly and in accordance with local laws and regulations.`;

    return description;
};

// Function to add product
const addProduct = async (req, res) => {
    try {
        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel } = req.body;

        // Parse variants and otherFlavours if sent as string
        let parsedVariants = variants
            ? (typeof variants === "string" ? JSON.parse(variants) : variants)
            : [];

        // Validate input using Joi (Note: Joi might complain about variants structure if we changed it, but let's assume it allows objects)
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants: parsedVariants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel },
            { abortEarly: false }
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map((err) => err.message),
            });
        }

        const parsedOtherFlavours = value.otherFlavours
            ? (typeof value.otherFlavours === "string" ? JSON.parse(value.otherFlavours) : value.otherFlavours)
            : [];

        const parsedCategories = value.categories
            ? (typeof value.categories === 'string' ? JSON.parse(value.categories) : value.categories)
            : [];

        // Process uploaded images (req.files is array from upload.any())
        // Main images: image1, image2, image3, image4
        // Variant images: variant_image_${index}

        const files = req.files || [];
        const mainImages = [];
        const variantImageMap = {}; // index -> file

        files.forEach(f => {
            if (f.fieldname.startsWith('image')) {
                // image1 -> index 0
                const idx = parseInt(f.fieldname.replace('image', '')) - 1;
                if (idx >= 0) mainImages[idx] = f;
            } else if (f.fieldname.startsWith('variant_image_')) {
                const idx = parseInt(f.fieldname.replace('variant_image_', ''));
                if (!isNaN(idx)) variantImageMap[idx] = f;
            }
        });

        // Upload main images
        const imagesResults = [];
        for (const image of mainImages) {
            if (image) {
                try {
                    const result = await cloudinary.uploader.upload(image.path, { resource_type: "image", folder: "products" });
                    imagesResults.push({
                        url: result.secure_url.toString(),
                        public_id: result.public_id.toString(),
                    });
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed for file:', image.path, uploadErr);
                }
            }
        }

        if (imagesResults.length === 0) {
            // It's possible to create without main image if variant images exist, but usually we want main image.
            // Let's warn but allow? Or strict? Previous code was strict.
            // return res.status(400).json({ success: false, message: "At least one main image is required" });
        }

        // Upload variant images and assign to parsedVariants
        for (let i = 0; i < parsedVariants.length; i++) {
            if (variantImageMap[i]) {
                try {
                    const result = await cloudinary.uploader.upload(variantImageMap[i].path, { resource_type: "image", folder: "products/variants" });
                    parsedVariants[i].image = result.secure_url.toString();
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed for variant file:', variantImageMap[i].path, uploadErr);
                }
            }
        }

        // Auto-generate description if empty
        let finalDescription = value.description;
        if (!finalDescription || finalDescription.trim() === '') {
            finalDescription = generateDescription({
                name: value.name,
                flavour: value.flavour,
                categories: parsedCategories,
                variants: parsedVariants,
                sweetnessLevel: value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : 5,
                mintLevel: value.mintLevel !== undefined ? Number(value.mintLevel) : 0,
                bestseller: value.bestseller
            });
        }

        const product = new Product({
            productId: value.productId,
            name: value.name,
            description: finalDescription,
            price: Number(value.price),
            images: imagesResults,
            categories: parsedCategories,
            flavour: value.flavour || "",
            variants: parsedVariants,
            stockCount: Number(value.stockCount),
            inStock: value.inStock === undefined ? (Number(value.stockCount) > 0) : Boolean(value.inStock),
            showOnPOS: value.showOnPOS === undefined ? true : Boolean(value.showOnPOS),
            otherFlavours: parsedOtherFlavours,
            bestseller: value.bestseller,
            sweetnessLevel: value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : 5,
            mintLevel: value.mintLevel !== undefined ? Number(value.mintLevel) : 0,
        });

        await product.save();

        // Emit product created
        try {
            const io = getIO();
            if (io) io.emit('productCreated', { product });
        } catch (e) {
            console.error('Failed to emit productCreated socket event:', e);
        }

        // --- AUTO-SYNC TO CLOVER ---
        let cloverSync = { status: 'skipped', message: '' };
        try {
            if (cloverService.isConfigured()) {
                console.log(`[Auto-Sync] Creating product "${product.name}" in Clover...`);

                if (product.variants && product.variants.length > 0) {
                    // 1. Create Item Group
                    const group = await cloverService.createItemGroup(product.name);
                    if (group && group.id) {
                        console.log(`[Auto-Sync] Created Item Group: ${group.id}`);
                        product.cloverItemGroupId = group.id;

                        // 2. Create Variants as Items linked to Group
                        for (let i = 0; i < product.variants.length; i++) {
                            const v = product.variants[i];
                            const variantName = `${product.name} ${v.flavour || ''} ${v.size || ''}`.trim();
                            const variantSku = v.sku || `${product.productId}-${i + 1}`;

                            const cloverItem = await cloverService.createProductInClover({
                                name: variantName,
                                price: v.price || product.price,
                                sku: variantSku,
                                showOnPOS: product.showOnPOS
                            }, group.id);

                            if (cloverItem && cloverItem.id) {
                                product.variants[i].cloverItemId = cloverItem.id;
                                // Sync Stock
                                if (v.quantity !== undefined) {
                                    await cloverService.updateInventory(cloverItem.id, v.quantity);
                                }
                            }
                        }
                        await product.save(); // Save Clover IDs
                        cloverSync = { status: 'success', message: 'Synced to Clover' };
                    }
                } else {
                    // Standalone Item
                    const cloverItem = await cloverService.createProductInClover({
                        name: product.name,
                        price: product.price,
                        sku: product.productId,
                        showOnPOS: product.showOnPOS
                    });

                    if (cloverItem && cloverItem.id) {
                        console.log(`[Auto-Sync] Created Standalone Item: ${cloverItem.id}`);
                        product.externalCloverId = cloverItem.id;
                        // Sync Stock
                        if (product.stockCount !== undefined) {
                            await cloverService.updateInventory(cloverItem.id, product.stockCount);
                        }
                        await product.save();
                        cloverSync = { status: 'success', message: 'Synced to Clover' };
                    }
                }
            }
        } catch (syncErr) {
            console.error('[Auto-Sync] Failed to sync new product to Clover:', syncErr.message);
            cloverSync = { status: 'failed', message: syncErr.message };
            // Don't fail the request, just log and return status
        }

        res.json({ success: true, message: "Product added successfully", cloverSync });
    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to list products with pagination
const listProducts = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        let query = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { categories: searchRegex },
                    { productId: searchRegex }
                ]
            };
        }

        const products = await Product.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNumber);

        res.status(200).json({
            success: true,
            products,
            currentPage: pageNumber,
            totalPages,
            totalProducts,
            hasMore: pageNumber < totalPages
        });
    } catch (error) {
        console.error("List Products Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function for remove product
const removeProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!id || id.length !== 24) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Find and delete the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Delete each image from Cloudinary
        await Promise.all(
            product.images.map(async (img) => {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                }
            })
        )
        await product.deleteOne();

        // Remove references to this product from all user carts so deleted products don't remain in carts
        try {
            await Cart.updateMany({}, { $pull: { items: { productId: product._id } } });
        } catch (cartErr) {
            console.error('Failed to remove product references from carts:', cartErr);
        }

        try {
            const io = getIO();
            if (io) {
                io.emit('productRemoved', { productId: product._id.toString() });
            }
        } catch (e) { console.error('Failed to emit productRemoved:', e); }

        // Best-effort: remove from Clover by externalCloverId or SKU/productId if configured
        /*
        // Auto-sync disabled per user request
        try {
            if (cloverService.isConfigured()) {
                const clId = product.externalCloverId || product.productId || undefined;
                if (clId) await cloverService.deleteProductInClover(clId).catch(() => null);
            }
        } catch (err) {
            console.error('Failed to delete product from Clover:', err.message || err);
        }
        */

        res.status(200).json({ success: true, message: "Product removed successfully" });

    } catch (error) {
        console.error("Remove Product Error:", error);
        res.status(500).json({ success: false, message: "Failed to remove product. Please try again later." });
    }
};

// Function for single product info
const singleProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format (MongoDB ObjectId length is 24 characters)
        if (!id || id.length !== 24) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, product });

    } catch (error) {
        console.error("Single Product Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
};

// Update product by id (supports replacing specific images)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length !== 24) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel } = req.body;

        console.log('[DEBUG] addProduct variants type:', typeof variants);
        console.log('[DEBUG] addProduct variants value:', variants);

        // Validate core fields (images optional on update)
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel },
            { abortEarly: false }
        );

        if (error) {
            return res.status(400).json({ success: false, message: "Validation failed", errors: error.details.map((err) => err.message) });
        }

        // Parse arrays if strings
        const parsedVariants = value.variants
            ? (typeof value.variants === "string" ? JSON.parse(value.variants) : value.variants)
            : [];

        const parsedCategories = value.categories
            ? (typeof value.categories === 'string' ? JSON.parse(value.categories) : value.categories)
            : [];

        const parsedOtherFlavours = value.otherFlavours
            ? (typeof value.otherFlavours === 'string' ? JSON.parse(value.otherFlavours) : value.otherFlavours)
            : [];

        // Handle uploaded images (main and variants)
        const files = req.files || [];
        const variantImageMap = {};
        const mainImages = {}; // idx -> file

        files.forEach(f => {
            if (f.fieldname.startsWith('image')) {
                const idx = parseInt(f.fieldname.replace('image', '')) - 1;
                if (idx >= 0) mainImages[idx] = f;
            } else if (f.fieldname.startsWith('variant_image_')) {
                const idx = parseInt(f.fieldname.replace('variant_image_', ''));
                if (!isNaN(idx)) variantImageMap[idx] = f;
            }
        });

        // Update main images
        for (const idx in mainImages) {
            const file = mainImages[idx];
            if (file) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, { resource_type: "image", folder: "products" });
                    if (product.images[idx] && product.images[idx].public_id) {
                        try { await cloudinary.uploader.destroy(product.images[idx].public_id); } catch (e) { }
                    }
                    product.images[idx] = {
                        url: result.secure_url.toString(),
                        public_id: result.public_id.toString()
                    };
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed during update for file:', file.path, uploadErr);
                }
            }
        }

        // Update variant images
        for (let i = 0; i < parsedVariants.length; i++) {
            if (variantImageMap[i]) {
                try {
                    const result = await cloudinary.uploader.upload(variantImageMap[i].path, { resource_type: "image", folder: "products/variants" });
                    parsedVariants[i].image = result.secure_url.toString();
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed for variant file:', variantImageMap[i].path, uploadErr);
                }
            }
        }

        // Clean up product.images if some indices are empty, keep existing ones
        product.productId = value.productId;
        product.name = value.name;

        // Auto-generate description if empty
        let finalDescription = value.description;
        if (!finalDescription || finalDescription.trim() === '') {
            finalDescription = generateDescription({
                name: value.name,
                flavour: value.flavour,
                categories: parsedCategories,
                variants: parsedVariants,
                sweetnessLevel: value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : product.sweetnessLevel,
                mintLevel: value.mintLevel !== undefined ? Number(value.mintLevel) : product.mintLevel,
                bestseller: value.bestseller
            });
        }
        product.description = finalDescription;

        product.price = Number(value.price);
        product.categories = parsedCategories;
        product.flavour = value.flavour || "";
        product.variants = parsedVariants;
        // detect previous stock to notify waitlist users when stock moves 0 -> >0
        const prevStock = product.stockCount || 0;
        const newStock = Number(value.stockCount);
        product.stockCount = newStock;
        product.inStock = value.inStock === undefined ? (newStock > 0) : Boolean(value.inStock);
        product.showOnPOS = value.showOnPOS === undefined ? product.showOnPOS : Boolean(value.showOnPOS);
        product.otherFlavours = parsedOtherFlavours;
        product.bestseller = value.bestseller;
        product.sweetnessLevel = value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : product.sweetnessLevel;
        product.mintLevel = value.mintLevel !== undefined ? Number(value.mintLevel) : product.mintLevel;

        if (prevStock === 0 && newStock > 0) {
            try {
                // ... (existing waitlist logic) ...
                // find users who are waiting for this product
                const key = product._id.toString();
                const waitingUsers = await User.find({ [`notifications_waitlist.${key}`]: true });
                for (const u of waitingUsers) {
                    // ... (existing notification logic) ...
                    u.notifications = u.notifications || [];
                    // Deduplicate: skip if there is already an unread notification for this product
                    const alreadyUnread = (u.notifications || []).some(n => n.productId && n.productId.toString() === key && !n.read);
                    if (!alreadyUnread) {
                        // push notification subdoc
                        u.notifications.push({ productId: product._id, message: `${product.name} is back in stock` });
                        const newNotif = u.notifications[u.notifications.length - 1];

                        // remove from waitlist map
                        if (u.notifications_waitlist && u.notifications_waitlist.delete) {
                            try { u.notifications_waitlist.delete(key); } catch (e) { /* ignore */ }
                        } else if (u.notifications_waitlist && u.notifications_waitlist[key]) {
                            delete u.notifications_waitlist[key];
                        }

                        await u.save();

                        // emit to that user's socket room (if connected)
                        try {
                            const io = getIO();
                            if (io) {
                                const payload = {
                                    _id: newNotif._id,
                                    productId: product._id,
                                    message: newNotif.message,
                                    read: newNotif.read || false,
                                    createdAt: newNotif.createdAt || new Date(),
                                    product: {
                                        name: product.name,
                                        thumbnail: (product.images && product.images.length) ? product.images[0].url : undefined
                                    }
                                };
                                io.to(`user:${u._id.toString()}`).emit('notification', payload);
                            }
                        } catch (emitErr) {
                            console.error('Failed to emit notification socket event:', emitErr);
                        }
                    } else {
                        // even if already unread, remove waitlist entry so user won't be re-notified
                        if (u.notifications_waitlist && u.notifications_waitlist.delete) {
                            try { u.notifications_waitlist.delete(key); } catch (e) { /* ignore */ }
                        } else if (u.notifications_waitlist && u.notifications_waitlist[key]) {
                            delete u.notifications_waitlist[key];
                        }
                        await u.save();
                    }
                }
            } catch (notifErr) {
                console.error('Failed to notify waitlist users:', notifErr);
            }
        }

        await product.save();

        // --- AUTO-SYNC TO CLOVER (UPDATE) ---
        try {
            if (cloverService.isConfigured()) {
                console.log(`[Auto-Sync] Updating product "${product.name}" in Clover...`);

                if (product.cloverItemGroupId) {
                    // It's a Grouped Product
                    // 1. Update Group Name
                    try {
                        await cloverService.updateItemGroup(product.cloverItemGroupId, product.name);
                    } catch (grpErr) {
                        console.warn(`[Auto-Sync] Update Group Name failed (continuing to variants): ${grpErr.message}`);
                    }

                    // 2. Sync Variants
                    // We need to iterate current variants and sync each
                    for (let i = 0; i < product.variants.length; i++) {
                        const v = product.variants[i];
                        const variantName = `${product.name} ${v.flavour || ''} ${v.size || ''}`.trim();
                        const variantSku = v.sku || `${product.productId}-${i + 1}`;

                        if (v.cloverItemId) {
                            // Update existing item
                            // NOTE: Clover forbids changing name of item in a group via API.
                            // We only sync Price/SKU/ShowOnPOS. Group Name update should cascade for the prefix.
                            try {
                                await cloverService.updateProductInClover(v.cloverItemId, {
                                    // name: variantName, // CANNOT UPDATE NAME
                                    price: v.price || product.price,
                                    sku: variantSku,
                                    showOnPOS: product.showOnPOS
                                }, product.cloverItemGroupId);
                            } catch (itemErr) {
                                console.warn(`[Auto-Sync] Failed to update existing variant item ${v.cloverItemId} in Group: ${itemErr.message}`);
                            }
                            // Sync Stock
                            if (v.quantity !== undefined) {
                                await cloverService.updateInventory(v.cloverItemId, v.quantity);
                            }
                        } else {
                            // Create new variant item in Clover
                            const cloverItem = await cloverService.createProductInClover({
                                name: variantName,
                                price: v.price || product.price,
                                sku: variantSku,
                                showOnPOS: product.showOnPOS
                            }, product.cloverItemGroupId);

                            if (cloverItem && cloverItem.id) {
                                product.variants[i].cloverItemId = cloverItem.id;
                                if (v.quantity !== undefined) {
                                    await cloverService.updateInventory(cloverItem.id, v.quantity);
                                }
                            }
                        }
                    }
                    await product.save(); // Save new IDs if any

                } else if (product.variants && product.variants.length > 0) {
                    // Has variants but NO Group ID? Maybe it was a standalone that got variants added?
                    // Or sync failed previously.
                    // Promote to Group
                    const group = await cloverService.createItemGroup(product.name);
                    if (group && group.id) {
                        console.log(`[Auto-Sync] Created New Item Group for Update: ${group.id}`);
                        product.cloverItemGroupId = group.id;

                        // If there was an externalCloverId (from standalone), can we reuse it?
                        // We might want to "convert" the standalone item to a variant or delete it and create fresh variants.
                        // Safest is to treat current variants as truth.
                        // If externalCloverId exists and matches one variant, use it. Else, maybe keep it as one variant?
                        // For simplicity: Create/Update variants as new items generally, unless we can map.

                        // Let's just create variants. If externalCloverId exists, we could try to update it to be the first variant.

                        for (let i = 0; i < product.variants.length; i++) {
                            const v = product.variants[i];
                            const variantName = `${product.name} ${v.flavour || ''} ${v.size || ''}`.trim();
                            const variantSku = v.sku || `${product.productId}-${i + 1}`;

                            // If this variant happens to preserve the old Id?
                            let itemId = v.cloverItemId;
                            if (!itemId && i === 0 && product.externalCloverId) {
                                itemId = product.externalCloverId; // Reuse the old standalone ID for 1st variant
                            }

                            if (itemId) {
                                try {
                                    await cloverService.updateProductInClover(itemId, {
                                        name: variantName,
                                        price: v.price || product.price,
                                        sku: variantSku,
                                        showOnPOS: product.showOnPOS
                                    }, group.id);
                                    product.variants[i].cloverItemId = itemId;
                                } catch (itemErr) {
                                    if (itemErr.message && itemErr.message.includes("Existing item cannot be added to item group")) {
                                        console.warn(`[Auto-Sync] Item ${itemId} already in group or cannot be added. Retrying without group id...`);
                                        try {
                                            await cloverService.updateProductInClover(itemId, {
                                                name: variantName,
                                                price: v.price || product.price,
                                                sku: variantSku,
                                                showOnPOS: product.showOnPOS
                                            });
                                            product.variants[i].cloverItemId = itemId;
                                        } catch (retryErr) {
                                            console.warn(`[Auto-Sync] Failed to update variant item ${itemId} without group: ${retryErr.message}`);
                                        }
                                    } else {
                                        console.warn(`[Auto-Sync] Failed to update variant item ${itemId} into new Group: ${itemErr.message}`);
                                    }
                                }
                            } else {
                                const cloverItem = await cloverService.createProductInClover({
                                    name: variantName,
                                    price: v.price || product.price,
                                    sku: variantSku,
                                    showOnPOS: product.showOnPOS
                                }, group.id);
                                if (cloverItem && cloverItem.id) {
                                    product.variants[i].cloverItemId = cloverItem.id;
                                }
                            }
                        }
                        product.externalCloverId = undefined; // Clear standalone ID since we are now grouped
                        await product.save();
                    }

                } else {
                    // Standalone Product
                    const clId = product.externalCloverId || product.productId;
                    // If we have an external ID, update it
                    if (product.externalCloverId) {
                        await cloverService.updateProductInClover(product.externalCloverId, {
                            name: product.name,
                            price: product.price,
                            sku: product.productId,
                            showOnPOS: product.showOnPOS
                        });
                        if (product.stockCount !== undefined) {
                            await cloverService.updateInventory(product.externalCloverId, product.stockCount);
                        }
                    } else {
                        // Create if not exists (rare for update, but possible if sync failed on create)
                        const cloverItem = await cloverService.createProductInClover({
                            name: product.name,
                            price: product.price,
                            sku: product.productId,
                            showOnPOS: product.showOnPOS
                        });
                        if (cloverItem && cloverItem.id) {
                            product.externalCloverId = cloverItem.id;
                            if (product.stockCount !== undefined) {
                                await cloverService.updateInventory(cloverItem.id, product.stockCount);
                            }
                            await product.save();
                        }
                    }
                }
            }
        } catch (syncErr) {
            console.error('[Auto-Sync] Failed to sync updated product to Clover:', syncErr.message);
        }

        // Emit product update via Socket.IO so clients can refresh UI live
        try {
            const io = getIO();
            if (io) {
                io.emit('productUpdated', {
                    product: {
                        _id: product._id.toString(),
                        productId: product.productId,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        categories: product.categories,
                        flavour: product.flavour,
                        variants: product.variants,
                        stockCount: product.stockCount,
                        inStock: product.inStock,
                        showOnPOS: product.showOnPOS,
                        bestseller: product.bestseller,
                        sweetnessLevel: product.sweetnessLevel,
                        mintLevel: product.mintLevel,
                        description: product.description
                    }
                });
            }
        } catch (e) {
            console.error('Failed to emit socket productUpdated:', e);
        }

        res.status(200).json({ success: true, message: "Product updated successfully" });
    }
    catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ success: false, message: "Failed to update product" });
    }
};

const downloadTemplate = async (req, res) => {
    try {
        const headers = [
            ["Sr. Number", "Product Name", "Brand Name", "Flavour", "Price ( In CAD $ )", "Puff Count", "Container Capacity in ml", "Nicotine Strength", "Intense or Smooth", "Sweetness Level", "Mint Level", "Best Seller", "Group Id", "Item Id", "Category", "Image URL 1", "Image URL 2", "Image URL 3", "Image URL 4", "Variant Flavour", "Variant Image URL"]
        ];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(headers);
        xlsx.utils.book_append_sheet(wb, ws, "Template");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error("Download Template Error:", error);
        res.status(500).json({ success: false, message: "Failed to download template" });
    }
};

const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: "Excel sheet is empty" });
        }

        const operations = [];
        let successCount = 0;

        for (const row of data) {
            const productId = row['Group Id'] || row['Product Id']; // Support both for backward compatibility or transition
            const name = row['Product Name'];
            const price = row['Price ( In CAD $ )'];

            // Skip if mandatory fields missing
            if (!productId || !name || price === undefined) continue;

            const brand = row['Brand Name'] || '';
            const flavour = row['Flavour'] || '';
            const puffCount = row['Puff Count'] || '';
            const containerCapacity = row['Container Capacity in ml'] || '';
            const nicotine = row['Nicotine Strength'] || '';
            const intenseSmooth = row['Intense or Smooth'] || '';
            const sweetnessLevel = row['Sweetness Level'] !== undefined ? Number(row['Sweetness Level']) : 5;
            const mintLevel = row['Mint Level'] !== undefined ? Number(row['Mint Level']) : 0;
            const bestseller = row['Best Seller'] === 'Yes' || row['Best Seller'] === true;

            // New column fields
            const variantFlavour = row['Variant Flavour'] || '';
            const variantImage = row['Variant Image URL'] || '';

            let description = `Brand: ${brand}\nPuff Count: ${puffCount}\nNicotine: ${nicotine}\nType: ${intenseSmooth}`;
            if (row['Sr. Number']) description = `Sr No: ${row['Sr. Number']}\n` + description;

            // Variants logic
            // Since rows might be duplicates for same product but different variant, we need to merge logic?
            // Actually bulkWrite can be tricky with merging arrays.
            // Simplified: we rely on existing logic which overwrites, OR we need a smarter aggregator.
            // For now, let's assume one row = one variant, but if we process multiple rows for same product, we should ideally merge.
            // However, with MongoDB bulkWrite 'updateOne', last one wins if we blindly set variants.
            // To properly support multi-row import for same product:
            // 1. Group rows by productId
            // 2. Build variant array from those rows
            // 3. Create one operation per product

        }

        // Let's refactor to group by productId first
        const productsMap = {};

        for (const row of data) {
            const pid = row['Group Id'] || row['Product Id'];
            if (!pid) continue;

            if (!productsMap[pid]) {
                productsMap[pid] = {
                    productId: String(pid),
                    name: String(row['Product Name'] || ''),
                    price: Number(row['Price ( In CAD $ )'] || 0),
                    // ... other fields ...
                    brand: row['Brand Name'] || '',
                    flavour: row['Flavour'] || '',
                    puffCount: row['Puff Count'] || '',
                    categories: row['Category'] ? String(row['Category']).split(',').map(c => c.trim()) : [],
                    images: [
                        row['Image URL 1'],
                        row['Image URL 2'],
                        row['Image URL 3'],
                        row['Image URL 4']
                    ].filter(url => url && typeof url === 'string' && url.trim().length > 0)
                        .map(url => ({ url: url.trim(), public_id: null })),
                    variants: [],
                    variantFlavour: row['Variant Flavour'] || '',
                    variantImage: row['Variant Image URL'] || '',
                    sweetnessLevel: row['Sweetness Level'] !== undefined ? Number(row['Sweetness Level']) : 5,
                    mintLevel: row['Mint Level'] !== undefined ? Number(row['Mint Level']) : 0,
                    bestseller: row['Best Seller'] === 'Yes' || row['Best Seller'] === true,
                    descriptionLines: {
                        brand: row['Brand Name'],
                        puff: row['Puff Count'],
                        nicotine: row['Nicotine Strength'],
                        type: row['Intense or Smooth'],
                        sr: row['Sr. Number']
                    }
                };
            }

            // Add variant
            const containerCapacity = row['Container Capacity in ml'] || 'Default';
            const vPrice = Number(row['Price ( In CAD $ )']); // or variant price if column existed, but using main price
            const vFlavor = row['Variant Flavour'] || '';
            const vImage = row['Variant Image URL'] || '';

            const vItemId = row['Item Id'] || ''; // NEW: Capture Item Id if present

            productsMap[pid].variants.push({
                size: String(containerCapacity),
                flavour: String(vFlavor),
                price: vPrice,
                quantity: 0,
                image: String(vImage),
                sku: vItemId // Store Item Id as sku or a temporary field? Let's use sku for now as it maps well
            });
        }

        for (const pid in productsMap) {
            const p = productsMap[pid];
            const d = p.descriptionLines;
            let description = `Brand: ${d.brand || ''}\nPuff Count: ${d.puff || ''}\nNicotine: ${d.nicotine || ''}\nType: ${d.type || ''}`;
            if (d.sr) description = `Sr No: ${d.sr}\n` + description;

            operations.push({
                updateOne: {
                    filter: { productId: p.productId },
                    update: {
                        $set: {
                            name: p.name,
                            price: p.price,
                            description: description,
                            categories: p.categories,
                            flavour: p.flavour,
                            variants: p.variants,
                            sweetnessLevel: p.sweetnessLevel,
                            mintLevel: p.mintLevel,
                            bestseller: p.bestseller,
                            ...(p.images.length > 0 && { images: p.images })
                        },
                        $setOnInsert: {
                            stockCount: 0,
                            inStock: false,
                            ...(p.images.length === 0 && { images: [] }),
                            showOnPOS: true,
                            otherFlavours: []
                        }
                    },
                    upsert: true
                }
            });
            successCount++;
        }

        if (operations.length > 0) {
            await Product.bulkWrite(operations);
        }

        res.json({ success: true, message: `${successCount} products processed successfully` });

    } catch (error) {
        console.error("Import Products Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const exportProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });

        const data = [];

        products.forEach((p, index) => {
            // Flatten categories
            const categoryStr = (p.categories || []).join(', ');

            // Extract description fields
            const descLines = (p.description || '').split('\n');
            const getVal = (key) => {
                const line = descLines.find(l => l.startsWith(key + ':'));
                return line ? line.split(':')[1].trim() : '';
            };

            const brand = getVal('Brand') || '';
            const puffCount = getVal('Puff Count') || '';
            const nicotine = getVal('Nicotine') || '';
            const type = getVal('Type') || ''; // Intense or Smooth
            // Sr No logic: We might want to keep the original index or just increment. 
            // Since we are expanding rows, maybe we just use the loop index + item index or just p.productId?
            const srNo = getVal('Sr No') || (index + 1);

            // If products have variants, create a row for each variant
            if (p.variants && p.variants.length > 0) {
                p.variants.forEach(v => {
                    data.push({
                        "Sr. Number": srNo,
                        "Product Name": p.name,
                        "Brand Name": brand,
                        "Flavour": p.flavour,
                        "Price ( In CAD $ )": v.price || p.price, // Use variant price
                        "Puff Count": puffCount,
                        "Container Capacity in ml": v.size, // Variant size
                        "Nicotine Strength": nicotine,
                        "Intense or Smooth": type,
                        "Sweetness Level": p.sweetnessLevel,
                        "Mint Level": p.mintLevel,
                        "Best Seller": p.bestseller ? 'Yes' : 'No',
                        "Group Id": p.productId,
                        "Item Id": v.sku || v._id || '', // Use SKU or _id
                        "Category": categoryStr,
                        "Image URL 1": p.images && p.images[0] ? p.images[0].url : '',
                        "Image URL 2": p.images && p.images[1] ? p.images[1].url : '',
                        "Image URL 3": p.images && p.images[2] ? p.images[2].url : '',
                        "Image URL 4": p.images && p.images[3] ? p.images[3].url : '',
                        "Variant Flavour": v.flavour || '',
                        "Variant Image URL": v.image || ''
                    });
                });
            } else {
                // No variants, single row
                data.push({
                    "Sr. Number": srNo,
                    "Product Name": p.name,
                    "Brand Name": brand,
                    "Flavour": p.flavour,
                    "Price ( In CAD $ )": p.price,
                    "Puff Count": puffCount,
                    "Container Capacity in ml": "",
                    "Nicotine Strength": nicotine,
                    "Intense or Smooth": type,
                    "Sweetness Level": p.sweetnessLevel,
                    "Mint Level": p.mintLevel,
                    "Best Seller": p.bestseller ? 'Yes' : 'No',
                    "Group Id": p.productId,
                    "Item Id": "",
                    "Category": categoryStr,
                    "Image URL 1": p.images && p.images[0] ? p.images[0].url : '',
                    "Image URL 2": p.images && p.images[1] ? p.images[1].url : '',
                    "Image URL 3": p.images && p.images[2] ? p.images[2].url : '',
                    "Image URL 4": p.images && p.images[3] ? p.images[3].url : '',
                    "Variant Flavour": "",
                    "Variant Image URL": ""
                });
            }
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);

        xlsx.utils.book_append_sheet(wb, ws, "Products");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_export.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error("Export Products Error:", error);
        res.status(500).json({ success: false, message: "Failed to export products" });
    }
};

const deleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No product IDs provided" });
        }

        // Find products to delete to clean up images
        const products = await Product.find({ _id: { $in: ids } });

        for (const product of products) {
            // Delete images from Cloudinary
            if (product.images && product.images.length > 0) {
                await Promise.all(
                    product.images.map(async (img) => {
                        if (img.public_id) {
                            await cloudinary.uploader.destroy(img.public_id);
                        }
                    })
                );
            }

            // Remove from carts
            try {
                await Cart.updateMany({}, { $pull: { items: { productId: product._id } } });
            } catch (cartErr) {
                console.error('Failed to remove product references from carts:', cartErr);
            }

            // Best-effort: remove from Clover
            /*
            // Auto-sync disabled per user request
            try {
                if (cloverService.isConfigured()) {
                    const clId = product.externalCloverId || product.productId || undefined;
                    if (clId) await cloverService.deleteProductInClover(clId).catch(() => null);
                }
            } catch (err) {
                console.error('Failed to delete product from Clover:', err.message || err);
            }
            */
        }

        await Product.deleteMany({ _id: { $in: ids } });

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                // For bulk delete, maybe just emit a refresh signal or multiple productRemoved
                // Let's emit multiple productRemoved for simplicity or a new bulk event
                // Emitting multiple might be spammy but safe for now
                ids.forEach(id => io.emit('productRemoved', { productId: id }));
            }
        } catch (e) { console.error('Failed to emit productRemoved:', e); }

        res.status(200).json({ success: true, message: "Products deleted successfully" });
    } catch (error) {
        console.error("Delete Products Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete products" });
    }
};

const clearDatabase = async (req, res) => {
    try {
        await Product.deleteMany({});
        await Category.deleteMany({});
        await ModifierGroup.deleteMany({});
        await ItemGroup.deleteMany({});
        // Also clear cart items, because they reference products that no longer exist
        await Cart.updateMany({}, { $set: { items: [], amount: 0 } });

        res.status(200).json({ success: true, message: "Database cleared successfully (Products, Categories & Carts)" });
    } catch (error) {
        console.error("Clear Database Error:", error);
        res.status(500).json({ success: false, message: "Failed to clear database" });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct, deleteProducts, downloadTemplate, importProducts, exportProducts, clearDatabase };