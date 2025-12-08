import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Cart from '../models/cartModel.js';
import { productSchema } from "../validation/productValidation.js";
import { getIO } from '../socket.js';
import cloverService from '../services/cloverService.js';

// Function to add product
const addProduct = async (req, res) => {
    try {
        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller } = req.body;

        // Validate input using Joi
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller },
            { abortEarly: false }
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map((err) => err.message),
            });
        }

        // Parse variants and otherFlavours if sent as string
        const parsedVariants = value.variants
            ? (typeof value.variants === "string" ? JSON.parse(value.variants) : value.variants)
            : [];

        const parsedOtherFlavours = value.otherFlavours
            ? (typeof value.otherFlavours === "string" ? JSON.parse(value.otherFlavours) : value.otherFlavours)
            : [];

        // Process uploaded images
        const image1 = req?.files?.image1?.[0];
        const image2 = req?.files?.image2?.[0];
        const image3 = req?.files?.image3?.[0];
        const image4 = req?.files?.image4?.[0];

        const images = [image1, image2, image3, image4].filter((img) => img !== undefined);

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        // Upload images to Cloudinary with per-image error handling + debug logs
        const imagesResults = [];
        for (const image of images) {
            try {
                console.log('Uploading image to Cloudinary, path:', image.path);
                const result = await cloudinary.uploader.upload(image.path, { resource_type: "image", folder: "products" });
                imagesResults.push({
                    url: result.secure_url.toString(),
                    public_id: result.public_id.toString(),
                });
            } catch (uploadErr) {
                // Masked env values for debugging
                const mask = (s) => (typeof s === 'string' && s.length > 6) ? s.slice(0, 3) + '...' + s.slice(-3) : s;
                console.error('Cloudinary upload failed for file:', image.path);
                console.error('Upload error full:', uploadErr);
                console.error('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME : 'missing');
                console.error('CLOUDINARY_API_KEY:', mask(process.env.CLOUDINARY_API_KEY));
                console.error('CLOUDINARY_API_SECRET:', mask(process.env.CLOUDINARY_API_SECRET));

                // Return helpful error for frontend
                return res.status(500).json({
                    success: false,
                    message: `Cloudinary upload error: ${uploadErr.message || 'unknown error'}`,
                    details: uploadErr && uploadErr.http_code ? { http_code: uploadErr.http_code, error: uploadErr } : undefined
                });
            }
        }

        // Construct and save product
        // Ensure categories is an array
        const parsedCategories = value.categories
            ? (typeof value.categories === 'string' ? JSON.parse(value.categories) : value.categories)
            : [];

        const product = new Product({
            productId: value.productId,
            name: value.name,
            description: value.description,
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
        });

        await product.save();

        // Best-effort: create item in Clover to keep POS in sync
        try {
            if (cloverService.isConfigured()) {
                const created = await cloverService.createProductInClover(product);
                // If clover returned an id, persist it for future updates/deletes
                const cloverId = created && (created.id || created.itemId || created._id || created.externalId);
                if (cloverId) {
                    product.externalCloverId = String(cloverId);
                    await product.save();
                    console.log('Stored externalCloverId on product:', product.externalCloverId);
                } else {
                    console.log('Clover createItem result (no id):', created);
                }
            }
        } catch (clErr) {
            console.error('Failed to push new product to Clover:', clErr.message || clErr);
        }

        // Emit product created so clients can update lists in realtime
        try {
            const io = getIO();
            if (io) {
                io.emit('productCreated', {
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
                        bestseller: product.bestseller
                    }
                });
            }
        } catch (e) {
            console.error('Failed to emit productCreated socket event:', e);
        }

        // Send success response
        res.json({ success: true, message: "Product added successfully" });
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
        try {
            if (cloverService.isConfigured()) {
                const clId = product.externalCloverId || product.productId || undefined;
                if (clId) await cloverService.deleteProductInClover(clId).catch(() => null);
            }
        } catch (err) {
            console.error('Failed to delete product from Clover:', err.message || err);
        }

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

        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller } = req.body;

        // Validate core fields (images optional on update)
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller },
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

        // Handle uploaded images: replace the corresponding image slot if new file provided
        const image1 = req?.files?.image1?.[0];
        const image2 = req?.files?.image2?.[0];
        const image3 = req?.files?.image3?.[0];
        const image4 = req?.files?.image4?.[0];

        const newFiles = [image1, image2, image3, image4];

        for (let i = 0; i < newFiles.length; i++) {
            const file = newFiles[i];
            if (file) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, { resource_type: "image", folder: "products" });
                    // If slot exists, remove old image from cloudinary
                    if (product.images && product.images[i] && product.images[i].public_id) {
                        try {
                            await cloudinary.uploader.destroy(product.images[i].public_id);
                        } catch (err) {
                            console.error('Failed to destroy old image:', err);
                        }
                    }
                    // Replace or append
                    product.images[i] = {
                        url: result.secure_url.toString(),
                        public_id: result.public_id.toString()
                    };
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed during update for file:', file.path, uploadErr);
                    return res.status(500).json({ success: false, message: `Cloudinary upload error: ${uploadErr.message || 'unknown error'}` });
                }
            }
        }

        // Clean up product.images if some indices are empty, keep existing ones
        product.productId = value.productId;
        product.name = value.name;
        product.description = value.description;
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

        // If product was previously out of stock and now restocked, notify waitlist
        if (prevStock === 0 && newStock > 0) {
            try {
                // find users who are waiting for this product
                const key = product._id.toString();
                const waitingUsers = await User.find({ [`notifications_waitlist.${key}`]: true });
                for (const u of waitingUsers) {
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

        // Emit product update via Socket.IO so clients can refresh UI live
        // Best-effort: update item on Clover
        try {
            if (cloverService.isConfigured()) {
                const clId = product.externalCloverId || product.productId || product._id.toString();
                const updated = await cloverService.updateProductInClover(clId, product).catch(() => null);
                // If no external id was present but update returned an id, save it
                const returnedId = updated && (updated.id || updated.itemId || updated._id || updated.externalId);
                if (!product.externalCloverId && returnedId) {
                    product.externalCloverId = String(returnedId);
                    await product.save();
                }
            }
        } catch (clErr) {
            console.error('Failed to update product on Clover:', clErr.message || clErr);
        }
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
                        bestseller: product.bestseller
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
            try {
                if (cloverService.isConfigured()) {
                    const clId = product.externalCloverId || product.productId || undefined;
                    if (clId) await cloverService.deleteProductInClover(clId).catch(() => null);
                }
            } catch (err) {
                console.error('Failed to delete product from Clover:', err.message || err);
            }
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

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct, deleteProducts };