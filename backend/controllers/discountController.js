import DiscountCode from '../models/discountModel.js';
import Product from '../models/productModel.js';

// Create a new discount code (Admin only)
const createDiscountCode = async (req, res) => {
    try {
        const { code, discountType, discountValue, applicableProducts, startDate, endDate, status, maxUsage } = req.body;

        // Validate required fields
        if (!code || !discountType || discountValue === undefined) {
            return res.status(400).json({ success: false, message: 'Code, discount type, and discount value are required' });
        }

        // Check if code already exists
        const existingCode = await DiscountCode.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Discount code already exists' });
        }

        // Validate discount value
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return res.status(400).json({ success: false, message: 'Percentage discount must be between 0 and 100' });
        }

        // Validate products if provided
        if (applicableProducts && applicableProducts.length > 0) {
            const validProducts = await Product.find({ _id: { $in: applicableProducts } });
            if (validProducts.length !== applicableProducts.length) {
                return res.status(400).json({ success: false, message: 'Some products are invalid' });
            }
        }

        const discountCode = new DiscountCode({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            applicableProducts: applicableProducts || [],
            startDate: startDate || null,
            endDate: endDate || null,
            status: status || 'active',
            maxUsage: maxUsage || null
        });

        await discountCode.save();

        res.json({ success: true, message: 'Discount code created successfully', discountCode });
    } catch (error) {
        console.error('Error creating discount code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all discount codes (Admin only)
const getAllDiscountCodes = async (req, res) => {
    try {
        const discountCodes = await DiscountCode.find({})
            .populate('applicableProducts', 'name images price')
            .sort({ createdAt: -1 });

        res.json({ success: true, discountCodes });
    } catch (error) {
        console.error('Error fetching discount codes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update discount code (Admin only)
const updateDiscountCode = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // If updating code, check uniqueness
        if (updates.code) {
            const existingCode = await DiscountCode.findOne({ 
                code: updates.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingCode) {
                return res.status(400).json({ success: false, message: 'Discount code already exists' });
            }
            updates.code = updates.code.toUpperCase();
        }

        // Validate percentage
        if (updates.discountType === 'percentage' && updates.discountValue && (updates.discountValue < 0 || updates.discountValue > 100)) {
            return res.status(400).json({ success: false, message: 'Percentage discount must be between 0 and 100' });
        }

        const discountCode = await DiscountCode.findByIdAndUpdate(id, updates, { new: true })
            .populate('applicableProducts', 'name images price');

        if (!discountCode) {
            return res.status(404).json({ success: false, message: 'Discount code not found' });
        }

        res.json({ success: true, message: 'Discount code updated successfully', discountCode });
    } catch (error) {
        console.error('Error updating discount code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete discount code (Admin only)
const deleteDiscountCode = async (req, res) => {
    try {
        const { id } = req.params;

        const discountCode = await DiscountCode.findByIdAndDelete(id);

        if (!discountCode) {
            return res.status(404).json({ success: false, message: 'Discount code not found' });
        }

        res.json({ success: true, message: 'Discount code deleted successfully' });
    } catch (error) {
        console.error('Error deleting discount code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Validate and apply discount code (User side)
const validateDiscountCode = async (req, res) => {
    try {
        const { code, cartItems } = req.body; // cartItems = [{ productId, quantity, variantSize }]

        if (!code) {
            return res.status(400).json({ success: false, message: 'Discount code is required' });
        }

        // Find discount code
        const discountCode = await DiscountCode.findOne({ code: code.toUpperCase() });

        if (!discountCode) {
            return res.status(404).json({ success: false, message: 'Invalid discount code' });
        }

        // Check if active
        if (discountCode.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Discount code is inactive' });
        }

        // Check usage limit
        if (discountCode.maxUsage && discountCode.usageCount >= discountCode.maxUsage) {
            return res.status(400).json({ success: false, message: 'Discount code usage limit reached' });
        }

        // Check date validity
        const now = new Date();
        if (discountCode.startDate && now < new Date(discountCode.startDate)) {
            return res.status(400).json({ success: false, message: 'Discount code not yet active' });
        }
        if (discountCode.endDate && now > new Date(discountCode.endDate)) {
            return res.status(400).json({ success: false, message: 'Discount code has expired' });
        }

        // Calculate discount for eligible products
        const eligibleProducts = [];
        const ineligibleProducts = [];
        let totalDiscount = 0;

        for (const item of cartItems) {
            const productId = item.productId || item._id;
            const isEligible = discountCode.applicableProducts.length === 0 || 
                              discountCode.applicableProducts.some(p => String(p) === String(productId));

            if (isEligible) {
                // Get product details to calculate discount
                const product = await Product.findById(productId);
                if (product) {
                    const variant = product.variants?.find(v => v.size === item.variantSize);
                    const price = variant ? variant.price : product.price;
                    const quantity = item.quantity || 1;
                    const itemTotal = price * quantity;

                    let itemDiscount = 0;
                    if (discountCode.discountType === 'percentage') {
                        itemDiscount = (itemTotal * discountCode.discountValue) / 100;
                    } else {
                        // For flat discount, divide equally among eligible items or apply to each
                        itemDiscount = discountCode.discountValue * quantity;
                    }

                    totalDiscount += itemDiscount;
                    eligibleProducts.push({
                        productId,
                        variantSize: item.variantSize,
                        discount: itemDiscount,
                        originalPrice: itemTotal,
                        finalPrice: itemTotal - itemDiscount
                    });
                }
            } else {
                ineligibleProducts.push({
                    productId,
                    variantSize: item.variantSize,
                    message: 'Not eligible for this discount'
                });
            }
        }

        res.json({
            success: true,
            message: 'Discount code validated successfully',
            discountCode: {
                code: discountCode.code,
                discountType: discountCode.discountType,
                discountValue: discountCode.discountValue
            },
            totalDiscount,
            eligibleProducts,
            ineligibleProducts
        });
    } catch (error) {
        console.error('Error validating discount code:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Increment usage count when order is placed
const incrementUsageCount = async (code) => {
    try {
        await DiscountCode.findOneAndUpdate(
            { code: code.toUpperCase() },
            { $inc: { usageCount: 1 } }
        );
    } catch (error) {
        console.error('Error incrementing usage count:', error);
    }
};

export {
    createDiscountCode,
    getAllDiscountCodes,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
    incrementUsageCount
};
