import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';

const Wishlist = () => {
    const { backendUrl, currency, removeFromWishlist, moveToCart, fetchWishlist } = useShop();
    const { user } = useAuth();
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariants, setSelectedVariants] = useState({});

    useEffect(() => {
        if (user) {
            loadWishlist();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backendUrl}/api/wishlist/get`, { withCredentials: true });
            if (res.data?.success) {
                const products = res.data.wishlist.products
                    .filter(item => item.productId) // Filter out deleted products
                    .map(item => ({
                        _id: item.productId._id,
                        name: item.productId.name,
                        price: item.productId.price,
                        images: item.productId.images,
                        variants: item.productId.variants,
                        stockCount: item.productId.stockCount,
                        addedAt: item.addedAt
                    }));
                setWishlistProducts(products);

                // Initialize selected variants for products with variants
                const initialVariants = {};
                products.forEach(product => {
                    if (product.variants && product.variants.length > 0) {
                        initialVariants[product._id] = product.variants[0].size;
                    }
                });
                setSelectedVariants(initialVariants);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        await removeFromWishlist(productId);
        setWishlistProducts(prev => prev.filter(p => p._id !== productId));
    };

    const handleMoveToCart = async (productId) => {
        const product = wishlistProducts.find(p => p._id === productId);
        const hasVariants = product && product.variants && product.variants.length > 0;
        
        let variantSize = 'default';
        if (hasVariants) {
            variantSize = selectedVariants[productId] || product.variants[0].size;
        }

        await moveToCart(productId, variantSize);
        setWishlistProducts(prev => prev.filter(p => p._id !== productId));
    };

    const handleVariantChange = (productId, size) => {
        setSelectedVariants(prev => ({
            ...prev,
            [productId]: size
        }));
    };

    if (!user) {
        return (
            <div className="border-t pt-14 min-h-[60vh]">
                <div className="text-2xl mb-3">
                    <Title text1={'MY'} text2={'WISHLIST'} />
                </div>
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">Please login to view your wishlist</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="border-t pt-14 min-h-[60vh]">
                <div className="text-2xl mb-3">
                    <Title text1={'MY'} text2={'WISHLIST'} />
                </div>
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t pt-14 min-h-[60vh]">
            <div className="text-2xl mb-3">
                <Title text1={'MY'} text2={'WISHLIST'} />
            </div>

            {wishlistProducts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">Your wishlist is empty</p>
                    <button
                        onClick={() => window.location.href = '/collection'}
                        className="mt-4 bg-black text-white px-8 py-3 text-sm"
                    >
                        CONTINUE SHOPPING
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
                    {wishlistProducts.map((product) => {
                        const hasVariants = product.variants && product.variants.length > 0;
                        const selectedSize = selectedVariants[product._id];
                        const selectedVariant = hasVariants 
                            ? product.variants.find(v => v.size === selectedSize) 
                            : null;
                        const displayPrice = selectedVariant ? selectedVariant.price : product.price;

                        return (
                            <div key={product._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="relative">
                                    <img
                                        src={product.images?.[0]?.url || ''}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => { e.currentTarget.src = ''; }}
                                    />
                                    <button
                                        onClick={() => handleRemove(product._id)}
                                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-all"
                                        title="Remove from wishlist"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-red-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-4">
                                    <h3 className="text-sm font-medium mb-2 line-clamp-2">{product.name}</h3>
                                    <p className="text-lg font-bold mb-3">{currency}{displayPrice}</p>

                                    {hasVariants && (
                                        <div className="mb-3">
                                            <label className="text-xs text-gray-600 mb-1 block">Select Size:</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {product.variants.map((variant) => (
                                                    <button
                                                        key={variant.size}
                                                        onClick={() => handleVariantChange(product._id, variant.size)}
                                                        className={`px-3 py-1 text-xs border ${
                                                            selectedSize === variant.size
                                                                ? 'bg-black text-white border-black'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                        }`}
                                                    >
                                                        {variant.size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleMoveToCart(product._id)}
                                        className="w-full bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                                        disabled={product.stockCount === 0}
                                    >
                                        {product.stockCount === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
