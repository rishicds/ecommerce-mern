import axios from "axios";
import React, { useEffect, useState } from "react";
import { initSocket } from '../socket';
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

const List = () => {
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const limit = 10;
    const currency = "$";

    const fetchProducts = async (currentPage, searchQuery = search) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/list`, {
                params: {
                    page: currentPage,
                    limit,
                    search: searchQuery
                }
            });
            if (res.data.success) {
                setProducts(res.data.products);
                setTotalPages(res.data.totalPages);
                setSelectedProducts([]); // Reset selection on refresh
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const removeProduct = async (id) => {
        try {
            const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/product/remove/${id}`, {
                withCredentials: true
            });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchProducts(page); // Refresh current page
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const deleteSelected = async () => {
        if (selectedProducts.length === 0) return;

        const tId = toast.info(
            (
                <div className="flex flex-col text-sm">
                    <div className="mb-3">Delete <strong>{selectedProducts.length}</strong> products? This action cannot be undone.</div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(tId)}
                            className="px-3 py-1 border rounded text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                toast.dismiss(tId);
                                try {
                                    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/product/delete-many`, { ids: selectedProducts }, { withCredentials: true });
                                    if (res.data.success) {
                                        toast.success(res.data.message);
                                        fetchProducts(page);
                                    } else {
                                        toast.error(res.data.message);
                                    }
                                } catch (err) {
                                    console.error(err);
                                    toast.error('Failed to delete products');
                                }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ),
            { autoClose: false, closeOnClick: false }
        );
    };

    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts(page);
    }, [page]);

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
            try { socket.off('productUpdated', onProductUpdated); } catch (e) { }
        };
    }, []);

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts(1, search);
    };

    const toggleProduct = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map(p => p._id));
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/template`, {
                responseType: 'blob',
                withCredentials: true
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Failed to download template');
        }
    };

    const handleImportClick = () => {
        document.getElementById('import-input').click();
    };

    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const tId = toast.loading("Importing products...");

        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/product/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            if (res.data.success) {
                toast.update(tId, { render: res.data.message, type: "success", isLoading: false, autoClose: 3000 });
                fetchProducts(1); // Refresh list
            } else {
                toast.update(tId, { render: res.data.message, type: "error", isLoading: false, autoClose: 3000 });
            }
        } catch (error) {
            console.error('Import error:', error);
            const msg = error.response?.data?.message || 'Failed to import products';
            toast.update(tId, { render: msg, type: "error", isLoading: false, autoClose: 3000 });
        }
        // clear input
        e.target.value = null;
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <p className="text-xl">All Products List</p>
                <div className="flex gap-2 w-full sm:w-auto">
                    <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-3 py-2 border rounded w-full sm:w-64"
                        />
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded">Search</button>
                    </form>
                    {selectedProducts.length > 0 && (
                        <button
                            onClick={deleteSelected}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                        >
                            Delete ({selectedProducts.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                    Download Template
                </button>
                <button
                    onClick={handleImportClick}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                    Import from Excel
                </button>
                <input
                    type="file"
                    id="import-input"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleImportFile}
                />
            </div>

            <div className="flex flex-col gap-3">
                {/* Header for medium+ screens */}
                <div className="hidden md:grid grid-cols-[0.5fr_2.5fr_1fr_1fr_1fr_1fr_1fr_160px] items-center py-3 px-3 border border-gray-200 bg-gray-50 text-sm rounded-sm">
                    <div className="pl-1">
                        <input
                            type="checkbox"
                            checked={products.length > 0 && selectedProducts.length === products.length}
                            onChange={toggleAll}
                        />
                    </div>
                    <b className="pl-2">Name</b>
                    <b className="text-center">Price</b>
                    <b>Category</b>
                    <b className="text-center">In Stock</b>
                    <b className="text-center">Stock Count</b>
                    <b className="text-center">Show on POS</b>
                    <b className="text-center">Actions</b>
                </div>

                {products.map((product) => {
                    const thumb = (product.images && product.images[0] && (product.images[0].secure_url || product.images[0].url)) || product.image || '';
                    return (
                        <div
                            key={product._id}
                            className={`grid grid-cols-[0.5fr_2.5fr_1fr_1fr_1fr_1fr_1fr_160px] items-center gap-3 py-3 px-3 border border-gray-200 text-sm rounded-sm hover:shadow-sm transition-shadow even:bg-white odd:bg-gray-50`}
                        >
                            <div className="pl-1">
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.includes(product._id)}
                                    onChange={() => toggleProduct(product._id)}
                                />
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6 6L21 11l-6-6-6 6z" /></svg>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && <p className="text-center mt-4">Loading...</p>}
            {!loading && products.length === 0 && <p className="text-center mt-4">No products found.</p>}

            {/* Pagination Controls */}
            {!loading && products.length > 0 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={handlePrev}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
};

export default List;
