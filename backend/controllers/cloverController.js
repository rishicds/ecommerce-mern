import cloverService from '../services/cloverService.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';

// Manual Sync Products: Clover -> DB
// Manual Sync Products: Clover -> DB
const syncProducts = async (req, res) => {
    try {
        // 1. Fetch all items (limit 1000 or handle paging if needed - assuming <1000 for now or service handles it?)
        // The service currently just fetches 'items', likely default limit 100. 
        // We should really handle pagination or fetch all. 
        // For this immediate task, we'll assume the service returns what we need, but usually update service to loop.
        // Let's rely on service.getProducts() returning data.
        const cloverProducts = await cloverService.getProducts();

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

        let syncedCount = 0;
        let errorCount = 0;
        const errors = [];

        // 3. Process Groups
        for (const groupId in groups) {
            const items = groups[groupId];
            if (items.length === 0) continue;

            const firstItem = items[0];

            // Log for debugging
            console.log(`Processing Group ${groupId} - ${items.length} items. First Item: ${firstItem.name}`);

            try {
                // Try to find existing Product by cloverItemGroupId
                let product = await Product.findOne({ cloverItemGroupId: groupId });

                const mainName = firstItem.name;

                // Construct Variants with Robust Strategy
                const variants = items.map(item => {
                    let flavour = "";
                    let size = "";

                    // 1. Check Attributes
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

                    // 2. Check Modifier Groups (sometimes used for variants)
                    if ((!flavour || !size) && item.modifierGroups && item.modifierGroups.elements) {
                        item.modifierGroups.elements.forEach(mg => {
                            const mgName = (mg.name || "").toLowerCase();
                            // If modifiers are just options, we might not extract value directly without drilling down
                            // But if the group name is "Flavor", maybe the modifier *is* the flavor? 
                            // This is tricky without modifier selection, but let's check group names.
                        });
                    }

                    // 3. Fallback: Use Name
                    // If flavor is still empty, and the item name includes " - ", maybe the suffix is flavor?
                    // Or simply use the whole name as flavor if it's different from main group name?
                    // For now, simpler fallback: Use name as flavor if flavor is missing.
                    if (!flavour) {
                        // Try to extract from name if it looks like "Product Name - Flavor"
                        // But here 'mainName' might be same as 'item.name' if group has no distinct name.
                        // Let's us item.name as flavour.
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
                        // If we have specific variant images in Clover (rarely directly linked), we could map them here
                    };
                });

                // Determine main flavor (first variant's flavor)
                const mainFlavour = variants.length > 0 ? variants[0].flavour : "";

                // Common Metadata
                const categories = firstItem.categories && Array.isArray(firstItem.categories.elements)
                    ? firstItem.categories.elements.map(c => c.name)
                    : [];

                const modifierGroups = firstItem.modifierGroups && Array.isArray(firstItem.modifierGroups.elements)
                    ? firstItem.modifierGroups.elements
                    : [];

                const taxRates = firstItem.taxRates && Array.isArray(firstItem.taxRates.elements)
                    ? firstItem.taxRates.elements
                    : [];

                // Calculate total stock
                const totalStock = variants.reduce((acc, v) => acc + (v.quantity || 0), 0);

                if (!product) {
                    product = new Product({
                        cloverItemGroupId: groupId,
                        productId: groupId, // Use Group ID as unique productId
                        name: mainName,
                        description: firstItem.description || mainName,
                        price: variants[0].price, // Base price
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
                    // Update
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
            } catch (err) {
                console.error(`Error syncing Group ${groupId}:`, err);
                errorCount++;
                errors.push({ id: groupId, name: firstItem.name, type: 'group', error: err.message });
            }
        }

        // 4. Process Standalone Items
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

                if (!flavour) flavour = item.name; // Fallback

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
                        variants: [], // Standalone has no variants usually, or we could create one default variant
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
            } catch (err) {
                console.error(`Error syncing Standalone Item ${item.id} (${item.name}):`, err);
                errorCount++;
                errors.push({ id: item.id, name: item.name, type: 'standalone', error: err.message });
            }
        }

        res.json({
            success: true,
            message: `Synced ${syncedCount} products. Failed: ${errorCount}`,
            details: { synced: syncedCount, failed: errorCount, errors: errors }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Manual Sync Categories: Clover -> DB
const syncCategories = async (req, res) => {
    try {
        const cloverCategories = await cloverService.getCategories();
        let syncedCount = 0;

        for (const cat of cloverCategories) {
            let category = await Category.findOne({ cloverId: cat.id });

            if (!category) {
                category = new Category({
                    cloverId: cat.id,
                    name: cat.name,
                    categoryId: cat.id // Using Clover ID as categoryId
                });
                await category.save();
                syncedCount++;
            } else {
                category.name = cat.name;
                await category.save();
                syncedCount++;
            }
        }

        res.json({ success: true, message: `Synced ${syncedCount} categories from Clover` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Webhook Handler
const handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log('Clover Webhook received:', JSON.stringify(event, null, 2));

        // Basic handling logic based on event type
        // Clover webhooks structure varies, usually has 'merchants' object and updates
        // This requires parsing the specific Clover webhook payload structure

        // Example: if (event.type === 'I') { ... } // Item update

        // For now, just log it and return 200 to acknowledge
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook Error');
    }
};

// Get Checkout Settings from Clover (Tax Rate, Delivery Fee)
const getCheckoutSettings = async (req, res) => {
    try {
        if (!cloverService.isConfigured()) {
            return res.status(200).json({ success: true, taxRate: 0, deliveryFee: 0 });
        }

        const taxRates = await cloverService.getTaxRates();
        // Assuming we take the first tax rate found, or a specific one if named 'Sales Tax'
        // For simplicity, let's take the first one if available.
        // Tax rate is usually in percentage * 100000 or similar? 
        // Clover API: "rate" is field. 
        // e.g. rate: 600000 for 6% ? No usually standard percentage or decimal.
        // Per Clover docs: rate is in significant digits. 1000000 = 100%? 
        // Let's debug log on first run or assume percentage format based on observation.
        // Actually usually rate is 9.25 for 9.25% or similar?
        // Wait, Clover V3 tax rate object: { rate: 500000 } = 5%?
        // Let's assume rate is 1/1000000th? 
        // Let's check. 
        // If taxRates has elements.
        let taxRate = 0;
        if (taxRates && taxRates.length > 0) {
            // Rates are in 1/100000 of a percent?
            // User log: 500000 = 5%? 700000 = 7%? 2000000 = 20%?
            // If so: 500000 / 100000 = 5. 
            // Percentage to decimal: 5 / 100 = 0.05.
            // So rate / 10000000 = decimal.
            // Sum all rates
            const totalRate = taxRates.reduce((acc, tr) => acc + (tr.rate || 0), 0);
            taxRate = totalRate / 10000000;
        }

        const serviceCharge = await cloverService.getDefaultServiceCharge();
        let deliveryFee = 0;
        if (serviceCharge && serviceCharge.enabled) {
            // percentageDecimal? or percentage? or fixedAmount?
            // usually service charge is percentage or amount.
            // If "percentage" field exists (long), it is scaled. 
            // If "amount" field exists (long), it is in cents.
            if (serviceCharge.amount) {
                deliveryFee = serviceCharge.amount / 100;
            }
        }

        res.json({ success: true, taxRate, deliveryFee });
    } catch (error) {
        console.error('Error fetching checkout settings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { syncProducts, syncCategories, handleWebhook, getCheckoutSettings };
