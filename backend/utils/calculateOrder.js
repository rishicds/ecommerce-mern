
/**
 * Calculate order totals including B5G1 and Free Shipping rules
 * @param {Array} items - Array of { price, quantity } objects
 * @param {Object} options - { discountAmount: number, deliveryFee: number, taxRate: number }
 * @returns {Object} { subtotal, b5g1Discount, finalSubtotal, shippingFee, tax, total }
 */
export const calculateOrderTotal = (items, options = {}) => {
    let subtotal = 0;
    let totalQuantity = 0;
    let minPrice = Infinity;
    let b5g1Discount = 0;

    // Calculate initial subtotal and find cheapest item
    items.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;

        if (qty > 0) {
            subtotal += price * qty;
            totalQuantity += qty;

            // Track minimum individual unit price for B5G1
            if (price < minPrice) {
                minPrice = price;
            }
        }
    });

    if (totalQuantity === 0) minPrice = 0;

    // Apply Buy 5 Get 1 Free (Cheapest Item Free)
    // NOTE: Interpreted as "If total cart quantity >= 5, deduct price of ONE cheapest unit"
    if (totalQuantity >= 5 && minPrice !== Infinity) {
        b5g1Discount = minPrice;
    }

    const subtotalAfterB5G1 = Math.max(0, subtotal - b5g1Discount);

    // Apply Coupon Discount (passed in options)
    const couponDiscount = options.discountAmount || 0;
    const subtotalAfterAllDiscounts = Math.max(0, subtotalAfterB5G1 - couponDiscount);

    // Shipping Fee Logic
    // Default delivery fee passed in options or fallback to 10 (example default, should come from config)
    let shippingFee = options.deliveryFee !== undefined ? options.deliveryFee : 10;

    // Free Shipping if Order Value > 125
    // Using subtotalAfterB5G1 (value of goods) to determine eligibility? 
    // Usually thresholds are based on "Subtotal" (before or after item discounts).
    // Let's use subtotalAfterB5G1 to be safe/standard.
    if (subtotalAfterB5G1 > 125) {
        shippingFee = 0;
    }

    // Tax Calculation
    const taxRate = options.taxRate || 0;
    const tax = subtotalAfterAllDiscounts * taxRate;

    const total = subtotalAfterAllDiscounts + shippingFee + tax;

    return {
        subtotal,
        b5g1Discount,
        couponDiscount,
        subtotalAfterDiscounts: subtotalAfterAllDiscounts,
        shippingFee,
        tax,
        total
    };
};
