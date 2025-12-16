import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import cloverService from '../services/cloverService.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import Category from '../models/categoryModel.js';

// Upsert a clover item into local Product collection
async function upsertCloverItem(item) {
    // Clover item shapes vary. Attempt to extract sku -> productId mapping
    const sku = item.sku || item.code || undefined;
    const externalId = item.id || item.externalId || item.itemId || undefined;
    const name = item.name || item.title || '';
    const price = (item.price != null) ? (Number(item.price) / 100) : (item.priceFloat || 0);
    const description = item.description || item.shortDescription || '';
    const categories = (item.categories && item.categories.elements)
        ? item.categories.elements.map(c => c.name).filter(Boolean)
        : (item.shortDescription ? item.shortDescription.split(',').map(c => c.trim()).filter(Boolean) : []);

    // Find by sku mapped to productId first, then by name
    let existing = null;
    if (externalId) existing = await Product.findOne({ externalCloverId: String(externalId) });
    if (!existing && sku) existing = await Product.findOne({ productId: sku });
    if (!existing) existing = await Product.findOne({ name });

    const doc = {
        productId: sku || (existing && existing.productId) || `clover_${externalId || Date.now()}`,
        name,
        description,
        price: Number(price || 0),
        categories,
        images: (item.images && Array.isArray(item.images) && item.images.length) ? item.images.map(i => ({ url: i.url || i })) : (existing ? existing.images : []),
        stockCount: (item.itemStock && item.itemStock.quantity != null)
            ? Number(item.itemStock.quantity)
            : ((item.quantity != null) ? Number(item.quantity) : (existing ? existing.stockCount : 0)),
        inStock: (item.itemStock && item.itemStock.quantity != null)
            ? (Number(item.itemStock.quantity) > 0)
            : ((item.quantity != null) ? (Number(item.quantity) > 0) : (existing ? existing.inStock : true)),
        showOnPOS: true
    };

    if (existing) {
        Object.assign(existing, doc);
        if (externalId) existing.externalCloverId = String(externalId);
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        if (externalId) doc.externalCloverId = String(externalId);
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
        for (const it of (order.items || [])) {
            // Try to find our local product by externalCloverId or by sku/productId
            let mappedProduct = null;
            try {
                if (it.itemId || it.id) {
                    mappedProduct = await Product.findOne({ externalCloverId: String(it.itemId || it.id) });
                }
                if (!mappedProduct && (it.sku || it.code)) {
                    mappedProduct = await Product.findOne({ productId: String(it.sku || it.code) });
                }
            } catch (e) {
                // ignore mapping errors - we can still store minimal order items
                console.error('Error finding local product for order item:', e.message || e);
            }

            items.push({
                productId: mappedProduct ? mappedProduct._id : undefined,
                name: it.name || it.title || 'Unknown',
                variantSize: it.variant || it.size || 'default',
                image: (it.image && it.image.url) ? it.image.url : '',
                status: 'Pending',
                quantity: Number(it.quantity || it.qty || 1) || 1,
                price: Number((it.price != null ? it.price : (it.priceFloat || 0))) / 100
            });
        }

        const amount = Number(order.total != null ? order.total : (order.amount || 0)) / 100;
        const address = {
            street: (order.address && order.address.street) || 'N/A',
            city: (order.address && order.address.city) || 'N/A',
            state: (order.address && order.address.state) || 'N/A',
            zip: (order.address && order.address.postalCode) || 'N/A',
            country: (order.address && order.address.country) || 'N/A'
        };

        // See if order with same external id exists
        let existing = null;
        if (order.id) existing = await Order.findOne({ 'externalCloverId': order.id });

        if (existing) {
            existing.phone = phone;
            existing.items = items;
            existing.amount = amount;
            existing.address = address;
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

        const report = { items: { created: 0, updated: 0, errors: 0 }, orders: { created: 0, updated: 0, errors: 0 }, categories: { created: 0, updated: 0, errors: 0 } };
        const mode = (req.body && req.body.mode) || (req.query && req.query.mode) || 'both'; // 'pull' | 'push' | 'both'
        const invokedBy = (req.user && req.user.email) || 'unknown';
        console.log(`[admin] ${invokedBy} initiated Clover sync. mode=${mode}`);

        // Pull phase: fetch items
        if (mode !== 'push') {
            // Fetch items
            try {
                const items = await cloverService.getProducts();
                if (Array.isArray(items)) {
                    for (const it of items) {
                        try {
                            const r = await upsertCloverItem(it);
                            if (r.action === 'created') report.items.created++;
                            else if (r.action === 'updated') report.items.updated++;
                        } catch (e) {
                            console.error('Item upsert error:', e);
                            report.items.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch items error:', e.message || e);
            }

            // Fetch categories
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

            // Fetch orders
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
        if (mode !== 'pull') {
            const localPushReport = { created: 0, updated: 0, errors: 0 };
            try {
                const locals = await Product.find({});
                for (const lp of locals) {
                    try {
                        let cloverId = lp.externalCloverId;
                        let updateSuccess = false;

                        // 1. If we have an ID, try to update.
                        if (cloverId) {
                            try {
                                await cloverService.updateProductInClover(cloverId, lp);
                                localPushReport.updated++;
                                updateSuccess = true;
                            } catch (e) {
                                // If error is NOT "Not Found", it's a real error.
                                if (!e.message.includes('Not Found')) {
                                    throw e;
                                }
                                // If "Not Found", the item was deleted from Clover.
                                // User wants to delete it from Mongo as well.
                                await Product.deleteOne({ _id: lp._id });
                                console.log(`Deleted local product ${lp.name} (${lp._id}) because it was not found in Clover.`);
                                // We are done with this item, continue to next
                                continue;
                            }
                        }

                        if (!updateSuccess) {
                            // 2. Try to find by SKU
                            const bySku = await cloverService.getProductBySku(lp.productId);

                            if (bySku && bySku.id) {
                                // Found by SKU, update it and save ID
                                await cloverService.updateProductInClover(bySku.id, lp);
                                lp.externalCloverId = String(bySku.id);
                                await lp.save();
                                localPushReport.updated++;
                            } else {
                                // 3. Not found by ID (or ID invalid) and not found by SKU. Create it.
                                const created = await cloverService.createProductInClover(lp);
                                if (created && (created.id || created.itemId || created.item)) {
                                    lp.externalCloverId = String(created.id || created.itemId || created.item);
                                    await lp.save();
                                    localPushReport.created++;
                                } else {
                                    localPushReport.errors++;
                                }
                            }
                        }

                        // Sync categories
                        if (lp.externalCloverId) {
                            await syncLocalCategoriesToClover(lp.externalCloverId, lp.categories);
                        }
                    } catch (err) {
                        console.error('Error pushing local product to Clover', lp._id, err.message || err);
                        localPushReport.errors++;
                    }
                }
            } catch (e) {
                console.error('Failed to fetch local products for push:', e.message || e);
            }
            report.pushToClover = localPushReport;
        }

        return res.status(200).json({ success: true, message: 'Clover sync finished', report });
    } catch (err) {
        console.error('Sync Clover failed:', err);
        return res.status(500).json({ success: false, message: 'Sync failed', error: err.message });
    }
}

export { adminLogin, getAdminData, adminLogout, syncClover };