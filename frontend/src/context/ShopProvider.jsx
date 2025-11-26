import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "./ShopContex";
import { backendUrl, currency, deliveryFee } from "../config/shopConfig";
import { useNavigate } from "react-router";
import axios from 'axios';
import { useAuth } from "./AuthContext";

const ShopProvider = ({ children }) => {
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [cartDetails, setCartDetails] = useState([]); // detailed cart items from backend
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [products, setProducts] = useState([]);
    const [mergedOnLogin, setMergedOnLogin] = useState(false);
    const limit = 10;
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Clear cart when user logs out
    useEffect(() => {
        if (!user) {
            setCartItems({});
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
        }
    }, [fetchProducts, user, userCartData]);

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
        // Update local mapping
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
        setShowCartDrawer
    }), [search, showSearch, cartItems, addToCart, getCartCount, updateQuantity, getCartAmount, navigate, products]);

    return (
        <ShopContext.Provider value={contextValue}>
            {children}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
