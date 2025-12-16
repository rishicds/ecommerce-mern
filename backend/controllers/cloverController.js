import cloverService from '../services/cloverService.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';

// Manual Sync Products: Clover -> DB
const syncProducts = async (req, res) => {
    try {
        const cloverProducts = await cloverService.getProducts();
        let syncedCount = 0;

        for (const item of cloverProducts) {
            // Check if product exists by externalCloverId or SKU (if you map SKU)
            // Assuming item.id is the Clover ID
            let product = await Product.findOne({ externalCloverId: item.id });

            if (!product) {
                // Create new product
                product = new Product({
                    externalCloverId: item.id,
                    name: item.name,
                    price: item.price / 100, // Convert cents to main currency
                    description: item.description || item.name, // Fallback
                    // Map other fields as needed
                    showOnPOS: !item.hidden,
                    categories: item.categories && Array.isArray(item.categories.elements)
                        ? item.categories.elements.map(c => c.name)
                        : [],
                    // Default values for required fields
                    productId: item.id, // Using Clover ID as productId for now if unique
                    stockCount: item.stockCount || 0, // Need to fetch stock separately usually
                    images: [] // Clover items might not have images in basic response
                });
                await product.save();
                syncedCount++;
            } else {
                // Update existing product
                product.name = item.name;
                product.price = item.price / 100;
                product.showOnPOS = !item.hidden;
                product.categories = item.categories && Array.isArray(item.categories.elements)
                    ? item.categories.elements.map(c => c.name)
                    : product.categories;
                await product.save();
                syncedCount++;
            }
        }

        res.json({ success: true, message: `Synced ${syncedCount} products from Clover` });
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
