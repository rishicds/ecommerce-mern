import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "./ShopContex";
import { backendUrl, currency, deliveryFee } from "../config/shopConfig";
import { useNavigate } from "react-router";
import axios from 'axios';
import { initSocket, getSocket } from '../socket';
import { useAuth } from "./AuthContext";

const ShopProvider = ({ children }) => {
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [cartDetails, setCartDetails] = useState([]); // detailed cart items from backend
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [products, setProducts] = useState([]);
    const [discount, setDiscount] = useState(null); // Applied discount code details
    const [mergedOnLogin, setMergedOnLogin] = useState(false);
    const [wishlist, setWishlist] = useState([]); // Array of product IDs in wishlist
    const limit = 10;
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Clear cart when user logs out
    useEffect(() => {
        if (!user) {
            setCartItems({});
            setDiscount(null); // Clear discount when logging out
            setWishlist([]); // Clear wishlist when logging out
        }
    }, [user]);

    // Fetch Products
    const fetchProducts = useCallback(async () => {
        if (!hasMore) return;
        try {
            const res = await axios.get(`${backendUrl}/api/product/list`, {
                params: {
                    lastId: nextCursor,
                    limit
                }
            });
            if (res.data.success) {
                setProducts(prev => [...prev, ...res.data.products]);
                setNextCursor(res.data.nextCursor);
                setHasMore(res.data.hasMore);
            } else {
                toast.error(res.data.message);
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch products");
        }
    }, [nextCursor, hasMore]);

    // Get user cart data from DB and normalize for frontend
    const userCartData = useCallback(async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/cart/get`, { withCredentials: true });
            if (res.data?.success && res.data.cartData) {
                const cart = res.data.cartData;
                const items = Array.isArray(cart.items) ? cart.items : [];

                // Build cart mapping { productId: { variantSize: quantity } }
                const mapping = {};
                const details = items.map((it) => {
                    // productId may be populated object or id string
                    const prodId = (it.productId && it.productId._id) ? it.productId._id : (it.productId || it.product);
                    // Skip items where product was removed and populate yields null
                    if (!prodId) return null;
                    const variantSize = it.variantSize || it.size || 'default';
                    const quantity = it.quantity || 0;
                    if (!mapping[prodId]) mapping[prodId] = {};
                    mapping[prodId][variantSize] = quantity;

                    return {
                        productId: prodId,
                        name: it.name || (it.productId && it.productId.name) || '',
                        variantSize,
                        quantity,
                        price: it.price ?? (it.productId && it.productId.price) ?? 0,
                        image: it.image || (it.productId && it.productId.images && it.productId.images[0]?.url) || ''
                    };
                }).filter(Boolean);

                setCartItems(mapping);
                setCartDetails(details);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }, []);


    useEffect(() => {
        fetchProducts();
        if (user) {
            userCartData();
            fetchWishlist();
        }
    }, [fetchProducts, user, userCartData]);

    // Listen for product changes from backend so product lists update in realtime
    useEffect(() => {
        if (!backendUrl) return;
        const s = initSocket(backendUrl, user?._id);

        const onProductCreated = (payload) => {
            try {
                if (!payload || !payload.product) return;
                setProducts(prev => {
                    const exists = prev.some(p => String(p._id) === String(payload.product._id) || String(p._id) === String(payload.product.productId));
                    if (exists) return prev;
                    return [payload.product, ...prev];
                });
            } catch (e) { console.error('productCreated handler error', e); }
        };

        const onProductUpdated = (payload) => {
            try {
                if (!payload || !payload.product) return;
                setProducts(prev => prev.map(p => (String(p._id) === String(payload.product._id) ? { ...p, ...payload.product } : p)));
                
                // Also update cartDetails if this product is in the cart
                setCartDetails(prev => prev.map(item => {
                    if (String(item.productId) === String(payload.product._id)) {
                        // Update name, price, and image from the updated product
                        const updatedProduct = payload.product;
                        const variantObj = updatedProduct.variants ? updatedProduct.variants.find(v => v.size === item.variantSize) : null;
                        return {
                            ...item,
                            name: updatedProduct.name,
                            price: variantObj ? variantObj.price : updatedProduct.price,
                            image: updatedProduct.images?.[0]?.url || updatedProduct.image?.[0]?.url || item.image
                        };
                    }
                    return item;
                }));
            } catch (e) { console.error('productUpdated handler error', e); }
        };

        const onProductRemoved = (payload) => {
            try {
                if (!payload || !payload.productId) return;
                setProducts(prev => prev.filter(p => p._id !== payload.productId));
            } catch (e) { console.error('productRemoved handler error', e); }
        };

        if (s) {
            s.on('productCreated', onProductCreated);
            s.on('productUpdated', onProductUpdated);
            s.on('productRemoved', onProductRemoved);
            const onCartUpdated = (payload) => {
                try {
                    if (!payload) return;
                    const cart = payload;
                    const items = Array.isArray(cart.items) ? cart.items : [];

                    const mapping = {};
                    const details = items.map((it) => {
                        const prodId = (it.productId && it.productId._id) ? it.productId._id : (it.productId || it.product);
                        if (!prodId) return null;
                        const variantSize = it.variantSize || it.size || 'default';
                        const quantity = it.quantity || 0;
                        if (!mapping[prodId]) mapping[prodId] = {};
                        mapping[prodId][variantSize] = quantity;

                        return {
                            productId: prodId,
                            name: it.name || (it.productId && it.productId.name) || '',
                            variantSize,
                            quantity,
                            price: it.price ?? (it.productId && it.productId.price) ?? 0,
                            image: it.image || (it.productId && it.productId.images && it.productId.images[0]?.url) || ''
                        };
                    }).filter(Boolean);

                    setCartItems(mapping);
                    setCartDetails(details);
                } catch (e) { console.error('onCartUpdated handler error', e); }
            };

            s.on('cartUpdated', onCartUpdated);
        }
        
        return () => {
            try {
                if (s) {
                    s.off('productCreated', onProductCreated);
                    s.off('productUpdated', onProductUpdated);
                    s.off('productRemoved', onProductRemoved);
                    s.off('cartUpdated', onCartUpdated);
                }
            } catch (e) { }
        };
    }, [backendUrl, user]);

    // Merge local guest cart into server cart once when user logs in
    useEffect(() => {
        const mergeLocalCart = async () => {
            try {
                if (!user) return;
                if (mergedOnLogin) return;
                // if no local items, nothing to merge
                const hasLocal = Object.keys(cartItems).length > 0;
                if (!hasLocal) {
                    setMergedOnLogin(true);
                    return;
                }

                // For each productId and variantSize, call backend add with quantity
                for (const productId in cartItems) {
                    const sizes = cartItems[productId];
                    for (const variantSize in sizes) {
                        const quantity = sizes[variantSize];
                        if (!quantity) continue;
                        try {
                            await axios.post(`${backendUrl}/api/cart/add`, { itemId: productId, variantSize, quantity }, { withCredentials: true });
                        } catch (err) {
                            console.error('Failed to merge cart item', productId, variantSize, err?.response?.data || err.message);
                        }
                    }
                }

                // Refresh server cart and local mapping
                await userCartData();
                // mark merged to avoid repeating
                setMergedOnLogin(true);
                // clear local-only cartItems since now server holds merged cart
                setCartItems({});
            } catch (err) {
                console.error('Error merging cart on login', err);
            }
        };

        mergeLocalCart();
    }, [user]);

    const addToCart = useCallback(async (itemId, size) => {
        // Determine product and whether variant selection is required
        const product = products.find(p => p._id === itemId);
        const hasVariants = !!(product && product.variants && product.variants.length);

        if (hasVariants && !size) {
            toast.error('Select Product Size');
            return;
        }

        // Use a default placeholder for products without variants
        const variantSize = size || 'default';

        // Check stock before updating local/cart
        const currentLocalQty = (cartItems[itemId] && cartItems[itemId][variantSize]) || 0;
        const available = product ? (product.stockCount || 0) : Infinity;
        if (currentLocalQty + 1 > available) {
            const remaining = Math.max(0, available - currentLocalQty);
            toast.error(remaining > 0 ? `Only ${remaining} units available` : 'Out of stock');
            return;
        }

        // Optimistically update local cart; if user is logged in, we'll revert on backend failure
        const prevCart = JSON.parse(JSON.stringify(cartItems));
        setCartItems(prev => {
            const updated = { ...prev };
            if (!updated[itemId]) updated[itemId] = {};
            updated[itemId][variantSize] = (updated[itemId][variantSize] || 0) + 1;
            return updated;
        });
        // open mini cart drawer after add
        setShowCartDrawer(true);
        if (user) {
            try {
                await axios.post(
                    `${backendUrl}/api/cart/add`,
                    { itemId, variantSize },
                    { withCredentials: true }
                );
                // refresh server-backed cart details so UI updates immediately
                await userCartData();
            } catch (error) {
                console.error(error);
                // revert optimistic update
                setCartItems(prevCart);
                toast.error(error?.response?.data?.message || error.message);
            }
        }
    }, [user, products, userCartData]);



    const getCartCount = useCallback(() => {
        return Object.values(cartItems).reduce(
            (totalCount, sizes) =>
                totalCount + Object.values(sizes).reduce((sum, count) => sum + count, 0),
            0
        );
    }, [cartItems]);

    const updateQuantity = useCallback(async (itemId, variantSize, quantity) => {
        // Check stock before updating
        const product = products.find(p => p._id === itemId);
        const available = product ? (product.stockCount || 0) : Infinity;
        if (quantity > available) {
            toast.error(available > 0 ? `Only ${available} units available` : 'Out of stock');
            // clamp locally to available amount
            quantity = Math.max(0, available);
        }

        // Update local mapping (optimistic)
        const prevCart = JSON.parse(JSON.stringify(cartItems));
        setCartItems(prev => {
            const updated = { ...prev };
            if (quantity === 0) {
                delete updated[itemId]?.[variantSize];
                if (updated[itemId] && Object.keys(updated[itemId]).length === 0) {
                    delete updated[itemId];
                }
            } else {
                if (!updated[itemId]) updated[itemId] = {};
                updated[itemId][variantSize] = quantity;
            }
            return updated;
        });

        // Update cartDetails for UI (best-effort local update)
        setCartDetails(prev => prev.map(d => d.productId === itemId && d.variantSize === variantSize ? { ...d, quantity } : d));

        if (user) {
            try {
                await axios.put(
                    `${backendUrl}/api/cart/update`,
                    { itemId, variantSize, quantity },
                    { withCredentials: true }
                );
            } catch (error) {
                console.error(error);
                // revert optimistic update
                setCartItems(prevCart);
                toast.error(error?.response?.data?.message || error.message);
            }
        }
    }, [user]);

    const getCartAmount = useCallback(() => {
        // Prefer prices from cartDetails if available (backend stores variant price)
        if (cartDetails && cartDetails.length) {
            return cartDetails.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
        }
        let totalAmount = 0;
        for (const productId in cartItems) {
            const product = products.find(p => p._id === productId);
            if (!product) continue;
            for (const size in cartItems[productId]) {
                const quantity = cartItems[productId][size];
                if (quantity) {
                    // If product has variants, use variant price for the selected size
                    const variant = product.variants && product.variants.length ? product.variants.find(v => v.size === size) : null;
                    const price = variant ? variant.price : product.price;
                    totalAmount += price * quantity;
                }
            }
        }
        return totalAmount;
    }, [cartItems, products, cartDetails]);

    // Apply discount code
    const applyDiscount = useCallback(async (code) => {
        try {
            // Build cart items for validation
            const items = cartDetails.length > 0 
                ? cartDetails.map(d => ({
                    productId: d.productId,
                    variantSize: d.variantSize,
                    quantity: d.quantity
                }))
                : Object.keys(cartItems).flatMap(productId => 
                    Object.keys(cartItems[productId]).map(variantSize => ({
                        productId,
                        variantSize,
                        quantity: cartItems[productId][variantSize]
                    }))
                );

            const response = await axios.post(
                `${backendUrl}/api/discount/validate`,
                { code, cartItems: items }
            );

            if (response.data.success) {
                setDiscount({
                    code: response.data.discountCode.code,
                    discountType: response.data.discountCode.discountType,
                    discountValue: response.data.discountCode.discountValue,
                    totalDiscount: response.data.totalDiscount,
                    eligibleProducts: response.data.eligibleProducts,
                    ineligibleProducts: response.data.ineligibleProducts
                });
                toast.success('Discount code applied successfully!');
                
                // Show warnings for ineligible products
                if (response.data.ineligibleProducts.length > 0) {
                    toast.info(`${response.data.ineligibleProducts.length} product(s) not eligible for this discount`);
                }
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            console.error('Error response:', error?.response?.data);
            toast.error(error?.response?.data?.message || 'Failed to apply discount code');
        }
    }, [cartItems, cartDetails, backendUrl]);

    // Remove discount code
    const removeDiscount = useCallback(() => {
        setDiscount(null);
        toast.info('Discount code removed');
    }, []);

    // Check if product in cart is eligible for discount
    const isProductEligibleForDiscount = useCallback((productId) => {
        if (!discount) return false;
        return discount.eligibleProducts.some(p => String(p.productId) === String(productId));
    }, [discount]);

    // Fetch user wishlist
    const fetchWishlist = useCallback(async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/wishlist/get`, { withCredentials: true });
            if (res.data?.success) {
                const productIds = res.data.wishlist.products.map(item => 
                    item.productId._id || item.productId
                );
                setWishlist(productIds);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }, []);

    // Add to wishlist
    const addToWishlist = useCallback(async (productId) => {
        if (!user) {
            toast.error('Please login to add items to wishlist');
            navigate('/login');
            return;
        }

        try {
            const res = await axios.post(
                `${backendUrl}/api/wishlist/add`,
                { productId },
                { withCredentials: true }
            );
            if (res.data.success) {
                setWishlist(prev => [...prev, productId]);
                toast.success('Added to wishlist');
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [user, navigate]);

    // Remove from wishlist
    const removeFromWishlist = useCallback(async (productId) => {
        try {
            const res = await axios.post(
                `${backendUrl}/api/wishlist/remove`,
                { productId },
                { withCredentials: true }
            );
            if (res.data.success) {
                setWishlist(prev => prev.filter(id => id !== productId));
                toast.success('Removed from wishlist');
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }, []);

    // Check if product is in wishlist
    const isInWishlist = useCallback((productId) => {
        return wishlist.includes(productId);
    }, [wishlist]);

    // Move from wishlist to cart
    const moveToCart = useCallback(async (productId, variantSize = 'default') => {
        try {
            const res = await axios.post(
                `${backendUrl}/api/wishlist/move-to-cart`,
                { productId, variantSize },
                { withCredentials: true }
            );
            if (res.data.success) {
                setWishlist(prev => prev.filter(id => id !== productId));
                await userCartData();
                toast.success('Product moved to cart');
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [userCartData]);

    const contextValue = useMemo(() => ({
        products,
        currency,
        deliveryFee,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        cartItems,
        cartDetails,
        addToCart,
        getCartCount,
        updateQuantity,
        getCartAmount,
        navigate,
        backendUrl,
        setCartItems,
        setCartDetails,
        showCartDrawer,
        setShowCartDrawer,
        discount,
        applyDiscount,
        removeDiscount,
        isProductEligibleForDiscount,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        moveToCart,
        fetchWishlist
    }), [search, showSearch, cartItems, cartDetails, addToCart, getCartCount, updateQuantity, getCartAmount, navigate, products, showCartDrawer, setShowCartDrawer, discount, applyDiscount, removeDiscount, isProductEligibleForDiscount, wishlist, addToWishlist, removeFromWishlist, isInWishlist, moveToCart, fetchWishlist]);

    return (
        <ShopContext.Provider value={contextValue}>
            {children}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
