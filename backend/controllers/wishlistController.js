import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";

// Add product to wishlist
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ userId });
        
        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                products: []
            });
        }

        // Check if product already in wishlist
        const existingProduct = wishlist.products.find(
            item => item.productId.toString() === productId
        );

        if (existingProduct) {
            return res.status(400).json({ success: false, message: "Product already in wishlist" });
        }

        // Add product to wishlist
        wishlist.products.push({ productId });
        await wishlist.save();

        res.status(200).json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        // Remove product from wishlist
        wishlist.products = wishlist.products.filter(
            item => item.productId.toString() !== productId
        );

        await wishlist.save();

        res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's wishlist
const getUserWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: 'products.productId',
                select: 'name price images variants stockCount'
            });

        if (!wishlist) {
            return res.status(200).json({ 
                success: true, 
                wishlist: { userId, products: [] } 
            });
        }

        // Filter out any products that may have been deleted
        const validProducts = wishlist.products.filter(item => item.productId);

        res.status(200).json({ 
            success: true, 
            wishlist: {
                ...wishlist.toObject(),
                products: validProducts
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Move product from wishlist to cart
const moveToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, variantSize = 'default' } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find the variant price
        let variantPrice = product.price;
        if (product.variants && product.variants.length > 0 && variantSize !== 'default') {
            const variant = product.variants.find(v => v.size === variantSize);
            if (variant) {
                variantPrice = variant.price;
            }
        }

        // Add to cart
        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            cart = new Cart({
                userId,
                items: []
            });
        }

        // Check if item with same variant already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId && item.variantSize === variantSize
        );

        if (existingItemIndex > -1) {
            // Increment quantity
            cart.items[existingItemIndex].quantity += 1;
        } else {
            // Add new item
            cart.items.push({
                productId: productId,
                name: product.name,
                variantSize,
                quantity: 1,
                price: variantPrice,
                image: product.images[0]?.url || ""
            });
        }

        await cart.save();

        // Remove from wishlist
        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(
                item => item.productId.toString() !== productId
            );
            await wishlist.save();
        }

        res.status(200).json({ 
            success: true, 
            message: "Product moved to cart",
            cart
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addToWishlist, removeFromWishlist, getUserWishlist, moveToCart };
