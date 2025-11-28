import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import { getIO } from "../socket.js";

// Utility function for input validation
const validateCartInput = ({ itemId, variantSize, quantity = null }) => {
    if (!itemId || typeof itemId !== 'string') return "'itemId' is invalid or missing";
    if (!variantSize || typeof variantSize !== 'string') return "'variantSize' is invalid or missing";
    if (quantity !== null) {
        if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
            return "'quantity' must be a non-negative integer";
        }
    }
    return null;
};

// Add product to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId, variantSize, quantity = 1 } = req.body;

        const error = validateCartInput({ itemId, variantSize, quantity });
        if (error) return res.status(400).json({ success: false, message: error });

        // Fetch product to get details
        const product = await Product.findById(itemId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find the variant price
        let variantPrice = product.price;
        if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => v.size === variantSize);
            if (variant) {
                variantPrice = variant.price;
            }
        }

        // Find or create cart
        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            cart = new Cart({
                userId,
                items: []
            });
        }

        // Check if item with same variant already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === itemId && item.variantSize === variantSize
        );

        // Ensure we don't exceed available stock
        const existingQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
        const requestedTotal = existingQty + quantity;
        if (requestedTotal > (product.stockCount || 0)) {
            return res.status(400).json({ success: false, message: `Only ${(product.stockCount || 0) - existingQty} more units available for this product` });
        }

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity = requestedTotal;
        } else {
            // Add new item
            cart.items.push({
                productId: itemId,
                name: product.name,
                variantSize,
                quantity,
                price: variantPrice,
                image: product.images[0]?.url || ""
            });
        }

        await cart.save();

        res.status(200).json({ success: true, message: "Added to cart" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update cart (set quantity or remove)
const updateCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId, variantSize, quantity } = req.body;

        const error = validateCartInput({ itemId, variantSize, quantity });
        if (error) return res.status(400).json({ success: false, message: error });

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        if (quantity === 0) {
            // Remove item from cart
            cart.items = cart.items.filter(
                item => !(item.productId.toString() === itemId && item.variantSize === variantSize)
            );
        } else {
            // Update quantity
            const itemIndex = cart.items.findIndex(
                item => item.productId.toString() === itemId && item.variantSize === variantSize
            );

            if (itemIndex > -1) {
                // Check requested quantity against product stock
                const prod = await Product.findById(itemId);
                if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
                if (quantity > (prod.stockCount || 0)) {
                    return res.status(400).json({ success: false, message: `Only ${prod.stockCount || 0} units available for this product` });
                }
                cart.items[itemIndex].quantity = quantity;
            } else {
                return res.status(404).json({ success: false, message: "Item not found in cart" });
            }
        }

        await cart.save();

        try {
            // populate items for client update
            const populated = await Cart.findOne({ userId }).populate('items.productId', 'name images price variants');
            const io = getIO();
            if (io) {
                io.to(`user:${userId}`).emit('cartUpdated', populated);
            }
        } catch (e) {
            console.error('Failed to emit cartUpdated', e);
        }

        res.status(200).json({ success: true, message: "Cart updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Get user cart
const getUserCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId }).populate('items.productId', 'name images');
        
        if (!cart) {
            return res.status(200).json({ success: true, cartData: { items: [] } });
        }

        res.status(200).json({ success: true, cartData: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart };
