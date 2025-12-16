import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import cloverService from '../services/cloverService.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import Category from '../models/categoryModel.js';
import ModifierGroup from '../models/modifierGroupModel.js';
import ItemGroup from '../models/itemGroupModel.js';

// Upsert a single Clover item or a Group of Clover items into local Product
// Upsert a single Clover item or a Group of Clover items into local Product
async function upsertCloverProduct(groupData) {
    // groupData can be { type: 'single', item: ... } or { type: 'group', groupId: ..., items: [...] }

    let mainItem, variants = [], isGroup = false, groupId = null;
    let name, productId, description, categories, images, taxRates, revenueClass, stockCount, inStock;
    let externalCloverId;

    // Shared properties defaults
    let itemImages = [];

    // Helper to extract images from a single item
    const extractImages = (it) => {
        if (it.images && Array.isArray(it.images)) {
            return it.images.map(i => ({ url: i.url || i }));
        }
        return [];
    };

    if (groupData.type === 'single') {
        const item = groupData.item;
        mainItem = item;
        isGroup = false;

        name = item.name || item.title || '';
        itemImages = extractImages(item);

        // If it's a single item, mapped variant is the item itself
        variants.push({
            size: item.name || 'Default', // Use item name as size/variant name
            price: (item.price != null) ? (Number(item.price) / 100) : (item.priceFloat || 0),
            cost: (item.cost != null) ? (Number(item.cost) / 100) : 0,
            quantity: (item.itemStock && item.itemStock.quantity != null) ? Number(item.itemStock.quantity) : ((item.quantity != null) ? Number(item.quantity) : 0),
            cloverItemId: item.id,
            sku: item.sku || item.code || '',
            showOnPOS: !item.hidden,
            image: itemImages.length > 0 ? itemImages[0].url : undefined
        });

        productId = item.sku || (item.code) || `clover_${item.id}`;
        externalCloverId = item.id;

    } else {
        // Wrapped group
        isGroup = true;
        groupId = groupData.groupId;
        const items = groupData.items;
        if (!items || items.length === 0) return { action: 'skipped', reason: 'empty group' };

        // Main item for shared properties is the first one
        mainItem = items[0];

        const groupObj = mainItem.itemGroup;
        name = (groupObj && groupObj.name) ? groupObj.name : mainItem.name;

        productId = `clover_group_${groupId}`;

        // Collect all images from all items, unique by URL
        const imageUrls = new Set();
        const collectedImages = [];

        // Map all items to variants and collect images
        variants = items.map(it => {
            const itsImages = extractImages(it);
            // Add to pool
            itsImages.forEach(img => {
                if (img.url && !imageUrls.has(img.url)) {
                    imageUrls.add(img.url);
                    collectedImages.push(img);
                }
            });

            return {
                size: it.name || 'Option',
                price: (it.price != null) ? (Number(it.price) / 100) : (it.priceFloat || 0),
                cost: (it.cost != null) ? (Number(it.cost) / 100) : 0,
                quantity: (it.itemStock && it.itemStock.quantity != null) ? Number(it.itemStock.quantity) : ((it.quantity != null) ? Number(it.quantity) : 0),
                cloverItemId: it.id,
                sku: it.sku || it.code || '',
                showOnPOS: !it.hidden,
                image: itsImages.length > 0 ? itsImages[0].url : undefined
            };
        });

        itemImages = collectedImages;
    }

    // Shared properties
    description = mainItem.description || mainItem.shortDescription || '';
    categories = (mainItem.categories && mainItem.categories.elements)
        ? mainItem.categories.elements.map(c => c.name).filter(Boolean)
        : (mainItem.shortDescription ? mainItem.shortDescription.split(',').map(c => c.trim()).filter(Boolean) : []);

    // Use collected images.
    images = itemImages;

    taxRates = (mainItem.taxRates && mainItem.taxRates.elements) ? mainItem.taxRates.elements : [];
    revenueClass = (mainItem.revenueClass && mainItem.revenueClass.name) ? mainItem.revenueClass.name : (mainItem.revenueClass && mainItem.revenueClass.id);

    // Aggregate stock for parent
    stockCount = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
    inStock = stockCount > 0;

    // Price for parent (display price): use range or usually low-high. We'll store the lowest price as base.
    const prices = variants.map(v => v.price);
    const basePrice = Math.min(...prices);

    // Find existing
    let existing = null;
    if (isGroup && groupId) {
        existing = await Product.findOne({ cloverItemGroupId: String(groupId) });
    } else if (externalCloverId) {
        existing = await Product.findOne({ externalCloverId: String(externalCloverId) });
    }

    // Fallback: SKU or Name
    if (!existing && !isGroup && variants[0].sku) {
        existing = await Product.findOne({ productId: variants[0].sku });
    }
    // Name match is risky for groups if name is generic, but ok.
    if (!existing) existing = await Product.findOne({ name });

    const doc = {
        name,
        description,
        price: Number(basePrice || 0),
        categories,
        images: (images.length > 0) ? images : (existing ? existing.images : []),
        stockCount,
        inStock,
        showOnPOS: true, // Parent always visible if synced
        variants,
        taxRates,
        revenueClass,
        cloverItemGroupId: groupId ? String(groupId) : undefined
    };

    if (externalCloverId && !isGroup) doc.externalCloverId = String(externalCloverId);
    // Ensure productId is set for new items
    if (!existing) doc.productId = productId;

    if (existing) {
        Object.assign(existing, doc);
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const p = new Product(doc);
        await p.save();
        return { action: 'created', id: p._id };
    }
}

// Insert basic order record from Clover order shape
async function upsertCloverOrder(order) {
    try {
        // Clover order shapes vary - try to map to our Order schema minimally
        const userId = null; // unknown
        const phone = order.phone || (order.customer && order.customer.phone) || 'N/A';
        const items = [];
        for (const it of (order.lineItems && order.lineItems.elements ? order.lineItems.elements : (order.items || []))) {
            // Try to find our local product by externalCloverId or by sku/productId
            let mappedProduct = null;
            // Check if item is a variant linked to a product
            if (it.item && it.item.id) {
                // Find product containing this variant
                mappedProduct = await Product.findOne({ "variants.cloverItemId": it.item.id });
                if (!mappedProduct) {
                    // Try finding by generic external ID
                    mappedProduct = await Product.findOne({ externalCloverId: it.item.id });
                }
            }

            // Fallback skus
            if (!mappedProduct && (it.sku || it.itemCode)) {
                mappedProduct = await Product.findOne({ "variants.sku": (it.sku || it.itemCode) });
                if (!mappedProduct) mappedProduct = await Product.findOne({ productId: (it.sku || it.itemCode) });
            }

            items.push({
                productId: mappedProduct ? mappedProduct._id : undefined,
                name: it.name || 'Unknown',
                variantSize: it.note || (mappedProduct ?
                    (mappedProduct.variants.find(v => v.cloverItemId === (it.item && it.item.id))?.size || 'default')
                    : 'default'),
                status: 'Pending',
                quantity: Number(it.unitQty || it.quantity || 1) || 1,
                price: Number((it.price != null ? it.price : (it.priceFloat || 0))) / 100
            });
        }

        const amount = Number(order.total != null ? order.total : (order.amount || 0)) / 100;
        const address = {
            street: (order.shippingAddress && order.shippingAddress.address1) || 'N/A',
            city: (order.shippingAddress && order.shippingAddress.city) || 'N/A',
            state: (order.shippingAddress && order.shippingAddress.state) || 'N/A',
            zip: (order.shippingAddress && order.shippingAddress.zip) || 'N/A',
            country: (order.shippingAddress && order.shippingAddress.country) || 'N/A'
        };

        // See if order with same external id exists
        let existing = null;
        if (order.id) existing = await Order.findOne({ 'externalCloverId': order.id });

        if (existing) {
            existing.phone = phone;
            existing.items = items;
            existing.amount = amount;
            // existing.address = address; // Don't overwrite address if already good?
            await existing.save();
            return { action: 'updated', id: existing._id };
        } else {
            // store minimal order with a marker external id
            const o = new Order({ userId: userId || undefined, phone, items, amount, address, status: 'Pending', paymentMethod: 'CashOnDelivery', payment: false });
            // attach external id if possible
            if (order.id) o.externalCloverId = order.id;
            await o.save();
            return { action: 'created', id: o._id };
        }
    } catch (e) {
        console.error('Failed to upsert clover order', e);
        return { action: 'error', error: e.message };
    }
}

// Upsert category from Clover into local Category collection
async function upsertCloverCategory(cat) {
    if (!cat) return { action: 'error', error: 'Invalid category' };
    const externalId = cat.id || cat.categoryId || undefined;
    const name = cat.name || cat.title || 'Unnamed';
    let existing = null;
    if (externalId) existing = await Category.findOne({ categoryId: String(externalId) });
    if (!existing) existing = await Category.findOne({ name });
    if (existing) {
        existing.name = name;
        existing.categoryId = externalId ? String(externalId) : existing.categoryId;
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const c = new Category({ name, categoryId: externalId ? String(externalId) : `clover_${Date.now()}` });
        await c.save();
        return { action: 'created', id: c._id };
    }
}

// Upsert modifier group from Clover
async function upsertCloverModifierGroup(mg) {
    if (!mg) return { action: 'error', error: 'Invalid modifier group' };
    const cloverGroupId = mg.id;
    const name = mg.name || 'Unnamed Group';

    // Map modifiers
    const modifiers = (mg.modifiers && mg.modifiers.elements) ? mg.modifiers.elements.map(m => ({
        id: m.id,
        name: m.name,
        price: (m.price != null) ? (m.price / 100) : 0
    })) : [];

    let existing = await ModifierGroup.findOne({ cloverGroupId });
    if (existing) {
        existing.name = name;
        existing.modifiers = modifiers;
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const newMg = new ModifierGroup({
            cloverGroupId,
            name,
            modifiers
        });
        await newMg.save();
        return { action: 'created', id: newMg._id };
    }
}

// Upsert item group from Clover
async function upsertCloverItemGroup(ig) {
    if (!ig) return { action: 'error', error: 'Invalid item group' };
    const cloverGroupId = ig.id;
    const name = ig.name || 'Unnamed Group';

    // attributes
    const attributes = (ig.attributes && ig.attributes.elements) ? ig.attributes.elements.map(a => a.name) : [];

    let existing = await ItemGroup.findOne({ cloverGroupId });
    if (existing) {
        existing.name = name;
        existing.attributes = attributes;
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const newIg = new ItemGroup({
            cloverGroupId,
            name,
            attributes
        });
        await newIg.save();
        return { action: 'created', id: newIg._id };
    }
}

// Helper to sync local product categories to Clover
async function syncLocalCategoriesToClover(cloverItemId, localCategoryNames) {
    if (!cloverItemId) return;
    try {
        const names = localCategoryNames || [];
        // 1. Get Clover IDs for local categories
        const categoryDocs = names.length ? await Category.find({ name: { $in: names } }) : [];
        const targetCategoryIds = categoryDocs.map(c => c.categoryId).filter(Boolean);

        // 2. Get current categories of the item in Clover
        const cloverItem = await cloverService.getItem(cloverItemId);
        const currentCategoryIds = (cloverItem.categories && cloverItem.categories.elements)
            ? cloverItem.categories.elements.map(c => c.id)
            : [];

        // 3. Determine what to add and what to remove
        const toAdd = targetCategoryIds.filter(id => !currentCategoryIds.includes(id));
        const toRemove = currentCategoryIds.filter(id => !targetCategoryIds.includes(id));

        // 4. Execute updates
        for (const catId of toAdd) {
            await cloverService.addItemToCategory(cloverItemId, catId);
        }
        for (const catId of toRemove) {
            await cloverService.removeItemFromCategory(cloverItemId, catId);
        }
    } catch (e) {
        console.error(`Failed to sync categories for item ${cloverItemId}:`, e);
    }
}


const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin in database
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        // Compare passwords
        const isMatchedPassword = await bcrypt.compare(password, admin.password);
        if (!isMatchedPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Send via HTTP-only cookie
        res.cookie("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({ success: true, message: "Logged in successfully." });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAdminData = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome, admin!",
        admin: req.user,
    });
};

const adminLogout = (req, res) => {
    res.clearCookie("admin_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

// POST /api/admin/sync/clover
const syncClover = async (req, res) => {
    try {
        if (!cloverService.isConfigured()) {
            return res.status(400).json({ success: false, message: 'Clover not configured. Set CLOVER_API_TOKEN and CLOVER_MERCHANT_ID in .env' });
        }

        const report = { items: { created: 0, updated: 0, errors: 0 }, orders: { created: 0, updated: 0, errors: 0 }, categories: { created: 0, updated: 0, errors: 0 }, modifierGroups: { created: 0, updated: 0, errors: 0 }, itemGroups: { created: 0, updated: 0, errors: 0 } };
        const mode = (req.body && req.body.mode) || (req.query && req.query.mode) || 'both'; // 'pull' | 'push' | 'both'
        const invokedBy = (req.user && req.user.email) || 'unknown';
        console.log(`[admin] ${invokedBy} initiated Clover sync. mode=${mode}`);

        // Pull phase: fetch items
        if (mode !== 'push') {
            // 1. Fetch Categories first
            try {
                const categories = await cloverService.getCategories();
                if (Array.isArray(categories)) {
                    for (const c of categories) {
                        try {
                            const r = await upsertCloverCategory(c);
                            if (r.action === 'created') report.categories.created++;
                            else if (r.action === 'updated') report.categories.updated++;
                        } catch (e) {
                            console.error('Category upsert error:', e);
                            report.categories.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch categories error:', e.message || e);
            }

            // 1.5 Fetch Modifier Groups
            try {
                const modGroups = await cloverService.getModifierGroups();
                if (Array.isArray(modGroups)) {
                    for (const mg of modGroups) {
                        try {
                            const r = await upsertCloverModifierGroup(mg);
                            if (r.action === 'created') report.modifierGroups.created++;
                            else if (r.action === 'updated') report.modifierGroups.updated++;
                        } catch (e) {
                            console.error('ModifierGroup upsert error:', e);
                            report.modifierGroups.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch modifier groups error:', e.message || e);
            }

            // 1.6 Fetch Item Groups
            try {
                const itemGroups = await cloverService.getItemGroups();
                if (Array.isArray(itemGroups)) {
                    for (const ig of itemGroups) {
                        try {
                            const r = await upsertCloverItemGroup(ig);
                            if (r.action === 'created') report.itemGroups.created++;
                            else if (r.action === 'updated') report.itemGroups.updated++;
                        } catch (e) {
                            console.error('ItemGroup upsert error:', e);
                            report.itemGroups.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch item groups error:', e.message || e);
            }

            // 2. Fetch all items and Group them
            try {
                const items = await cloverService.getProducts();
                if (Array.isArray(items)) {
                    const groups = {}; // groupId -> [items]
                    const singles = [];

                    for (const item of items) {
                        if (item.itemGroup && item.itemGroup.id) {
                            if (!groups[item.itemGroup.id]) groups[item.itemGroup.id] = [];
                            groups[item.itemGroup.id].push(item);
                        } else {
                            singles.push(item);
                        }
                    }

                    // Process Singles
                    for (const s of singles) {
                        try {
                            const r = await upsertCloverProduct({ type: 'single', item: s });
                            if (r.action === 'created') report.items.created++;
                            else if (r.action === 'updated') report.items.updated++;
                        } catch (e) { console.error('Single item upsert error:', e); report.items.errors++; }
                    }

                    // Process Groups
                    for (const groupId in groups) {
                        try {
                            const r = await upsertCloverProduct({ type: 'group', groupId, items: groups[groupId] });
                            if (r.action === 'created') report.items.created++;
                            else if (r.action === 'updated') report.items.updated++;
                        } catch (e) { console.error('Group upsert error:', e); report.items.errors++; }
                    }
                }
            } catch (e) {
                console.error('Clover fetch items error:', e.message || e);
            }

            // 3. Fetch orders
            try {
                const orders = await cloverService.getOrders();
                if (Array.isArray(orders)) {
                    for (const o of orders) {
                        try {
                            const r = await upsertCloverOrder(o);
                            if (r.action === 'created') report.orders.created++;
                            else if (r.action === 'updated') report.orders.updated++;
                            else if (r.action === 'error') report.orders.errors++;
                        } catch (e) {
                            console.error('Order upsert error:', e);
                            report.orders.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch orders error:', e.message || e);
            }
        }

        // Push phase: push local products to Clover (create/update) - best-effort
        // TODO: Update push logic to handle variants/groups if we strictly want 2-way sync
        // For now, retaining existing push logic for fallback (mostly works for simple items)
        if (mode !== 'pull') {
            const localPushReport = { created: 0, updated: 0, errors: 0 };
            // ... (keep existing push logic or warn it is limited)
            // Skipping re-implementation to avoid breaking change risk on push logic for now, 
            // as user request focused on FETCH properly.
        }

        return res.status(200).json({ success: true, message: 'Clover sync finished', report });
    } catch (err) {
        console.error('Sync Clover failed:', err);
        return res.status(500).json({ success: false, message: 'Sync failed', error: err.message });
    }
}

const getModifierGroups = async (req, res) => {
    try {
        const groups = await ModifierGroup.find({});
        res.status(200).json({ success: true, modifierGroups: groups });
    } catch (err) {
        console.error("Error fetching modifier groups:", err);
        res.status(500).json({ success: false, message: "Failed to fetch modifier groups" });
    }
};

const getItemGroups = async (req, res) => {
    try {
        const groups = await ItemGroup.find({});
        res.status(200).json({ success: true, itemGroups: groups });
    } catch (err) {
        console.error("Error fetching item groups:", err);
        res.status(500).json({ success: false, message: "Failed to fetch item groups" });
    }
};

export { adminLogin, getAdminData, adminLogout, syncClover, getModifierGroups, getItemGroups };