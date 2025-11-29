import axios from "axios";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { initSocket } from '../socket';
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

const List = () => {
    const [products, setProducts] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef(null);
    const limit = 10;
    const currency = "$";

    const fetchProducts = useCallback(async () => {
        if (!hasMore || loading) return;
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/list`, {
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
        } finally {
            setLoading(false);
        }
    }, [nextCursor, hasMore, loading]);

    const removeProduct = async (id) => {
        try {
            const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/product/remove/${id}`, {
                withCredentials: true
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setProducts(prev => prev.filter(p => p._id !== id));
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Initialize socket for admin and listen for product updates
    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        const socket = initSocket(backendUrl);
        if (!socket) return;

        const onProductUpdated = (payload) => {
            try {
                const prod = payload?.product;
                if (!prod) return;
                const updatedId = (prod._id || prod.id || '').toString();
                setProducts(prev => prev.map(p => {
                    if ((p._id || '').toString() === updatedId) {
                        // merge updated fields (stockCount, inStock, price, images, name, etc.)
                        return { ...p, ...prod };
                    }
                    return p;
                }));
            } catch (e) {
                console.error('Error handling productUpdated on admin list', e);
            }
        };

        socket.on('productUpdated', onProductUpdated);

        return () => {
            try { socket.off('productUpdated', onProductUpdated); } catch (e) {}
        };
    }, []);

    const lastProductRef = useCallback((node) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchProducts();
            }
        });

        if (node) observer.current.observe(node);
    }, [fetchProducts, hasMore, loading]);

    return (
        <>
            <p className="mb-2">All Products List</p>
            <div className="flex flex-col gap-3">
                {/* Header for medium+ screens */}
                <div className="hidden md:grid grid-cols-[0.5fr_2.5fr_1fr_1fr_1fr_1fr_1fr_160px] items-center py-3 px-3 border border-gray-200 bg-gray-50 text-sm rounded-sm">
                    <div className="pl-1"></div>
                    <b className="pl-2">Name</b>
                    <b className="text-center">Price</b>
                    <b>Category</b>
                    <b className="text-center">In Stock</b>
                    <b className="text-center">Stock Count</b>
                    <b className="text-center">Show on POS</b>
                    <b className="text-center">Actions</b>
                </div>

                {products.map((product, index) => {
                    const isLast = index === products.length - 1;
                    const thumb = (product.images && product.images[0] && (product.images[0].secure_url || product.images[0].url)) || product.image || '';
                    return (
                        <div
                            key={product._id}
                            ref={isLast ? lastProductRef : null}
                            className={`grid grid-cols-[0.5fr_2.5fr_1fr_1fr_1fr_1fr_1fr_160px] items-center gap-3 py-3 px-3 border border-gray-200 text-sm rounded-sm hover:shadow-sm transition-shadow even:bg-white odd:bg-gray-50`}
                        >
                            <div className="pl-1">
                                <input type="checkbox" />
                            </div>

                            {/* Name + thumbnail (responsive) */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                    {thumb ? (
                                        <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{product.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{(product.categories || []).join(', ')}</p>
                                </div>
                            </div>

                            <p className="font-medium text-center">{currency + (product.price ?? 0)}</p>
                            <p className="hidden md:block">{(product.categories || []).join(', ') || ''}</p>
                            <p className="text-center">{product.inStock ? 'Yes' : 'No'}</p>
                            <p className="text-center">{product.stockCount ?? 0}</p>
                            <p className="text-center">{product.showOnPOS ? 'Yes' : 'No'}</p>

                            <div className="flex items-center justify-end gap-2 mr-1">
                                <button
                                    onClick={() => navigate(`/add/${product._id}`)}
                                    className="px-2 py-1 bg-white border border-blue-100 text-blue-700 rounded-sm text-sm hover:bg-blue-50 flex items-center gap-2"
                                    aria-label={`Edit product ${product.name}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6 6L21 11l-6-6-6 6z"/></svg>
                                    <span className="hidden sm:inline">Edit</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const tId = toast.info(
                                            (
                                                <div className="flex flex-col text-sm">
                                                    <div className="mb-3">Delete <strong>{product.name}</strong>? This action cannot be undone.</div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => toast.dismiss(tId)}
                                                            className="px-3 py-1 border rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={async () => { toast.dismiss(tId); await removeProduct(product._id); }}
                                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ),
                                            { autoClose: false, closeOnClick: false }
                                        );
                                    }}
                                    className="px-2 py-1 bg-white border border-red-100 text-red-700 rounded-sm text-sm hover:bg-red-50 flex items-center gap-2"
                                    aria-label={`Delete product ${product.name}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && <p className="text-center mt-4">Loading...</p>}
            {!loading && products.length === 0 && <p className="text-center mt-4">No products found.</p>}
        </>
    );
};

export default List;
