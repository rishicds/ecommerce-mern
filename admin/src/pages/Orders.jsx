import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/admin_assets/assets.js";
import { initSocket } from '../socket.js';

const Orders = () => {
    const currency = "$";
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const limit = 10;

    // Fetch orders for admin with pagination
    const fetchOrders = async (currentPage, searchQuery = search) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/list`, {
                params: {
                    page: currentPage,
                    limit,
                    search: searchQuery
                },
                withCredentials: true,
            });
            if (res.data.success) {
                setOrders(res.data.orders);
                setTotalPages(res.data.totalPages);
            } else {
                toast.error(res.data.message || "Failed to fetch orders.");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    // Handle order status update
    const statusHandler = async (newStatus, orderId) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/order/status`,
                { orderId, status: newStatus },
                { withCredentials: true }
            );

            if (res.data.success) {
                // Update order status in state
                setOrders((prev) =>
                    prev.map((order) =>
                        order._id === orderId ? { ...order, status: newStatus } : order
                    )
                );
                toast.success("Order status updated successfully.");
            } else {
                toast.error(res.data.message || "Failed to update order status.");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Something went wrong while updating the order status.");
        }
    };

    // Handle individual order item status update
    const itemStatusHandler = async (newStatus, orderId, itemId) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/order/status`,
                { orderId, itemId, status: newStatus },
                { withCredentials: true }
            );

            if (res.data.success) {
                // Update the specific item status in state
                setOrders(prev => prev.map(order => {
                    if (order._id !== orderId) return order;
                    return {
                        ...order,
                        items: order.items.map(item => item._id === itemId ? { ...item, status: newStatus } : item)
                    };
                }));
                toast.success('Order item status updated successfully.');
            } else {
                toast.error(res.data.message || 'Failed to update item status.');
            }
        } catch (error) {
            console.error('Error updating item status:', error);
            toast.error('Something went wrong while updating the item status.');
        }
    };

    useEffect(() => {
        fetchOrders(page);
    }, [page]);

    // Setup socket listener for live order updates
    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        const socket = initSocket(backendUrl);
        if (!socket) return;

        const onOrderUpdated = (payload) => {
            try {
                const updated = payload?.order;
                if (!updated) return;
                setOrders(prev => prev.map(o => (o._id === updated._id ? { ...o, ...updated } : o)));
            } catch (e) {
                console.error('Error handling orderUpdated payload', e);
            }
        };

        socket.on('orderUpdated', onOrderUpdated);

        return () => {
            try { socket.off('orderUpdated', onOrderUpdated); } catch (e) { }
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
        fetchOrders(1, search);
    };

    if (loading) return <p className="p-4 text-center text-gray-500">Loading orders...</p>;
    if (!orders.length && !search) return <p className="p-4 text-center text-gray-500">No orders found.</p>;

    return (
        <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-2xl font-semibold">Orders</h3>
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 border rounded w-full sm:w-64"
                    />
                    <button type="submit" className="px-4 py-2 bg-black text-white rounded">Search</button>
                </form>
            </div>

            {!orders.length && search && <p className="p-4 text-center text-gray-500">No orders found matching "{search}".</p>}

            <div className="space-y-4">
                {orders.map((order) => (
                    <article
                        key={order._id}
                        className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 md:p-6 rounded-lg grid grid-cols-1 sm:grid-cols-[48px_1fr_180px] lg:grid-cols-[48px_1fr_220px_120px] gap-4 items-start text-base text-gray-800"
                    >
                        <div className="flex items-start">
                            <img className="w-16 h-16 sm:w-20 sm:h-20" src={assets.parcel_icon} alt="Parcel Icon" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11zM6 20a6 6 0 0112 0" /></svg>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-lg font-bold truncate">{order.userId?.name || 'Guest'}</p>
                                            <p className="text-base text-gray-600 truncate">Order #<span className="font-semibold">{order._id}</span></p>

                                            <div className="mt-2 text-sm text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base md:text-lg text-gray-800 font-semibold">Phone:</span>
                                                    <a className="text-blue-700 font-bold md:text-lg hover:underline" href={`tel:${order.phone}`}>{order.phone || '—'}</a>
                                                </div>

                                                <div className="mt-3">
                                                    <span className="text-base md:text-lg text-gray-800 font-semibold">Address:</span>
                                                    <address className="not-italic mt-1 text-gray-700 text-sm md:text-base">
                                                        <div className="text-gray-700">{order.address?.street || '-'}</div>
                                                        <div className="text-gray-700">{[order.address?.city, order.address?.state].filter(Boolean).join(', ')} {order.address?.zip || ''}</div>
                                                        <div className="text-gray-700">{order.address?.country || ''}</div>
                                                    </address>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <p className={`px-2 py-0.5 rounded-full text-sm ${order.payment ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{order.payment ? 'Paid' : 'Pending'}</p>
                                    {/* Order-level status badge (e.g., Cancelled) */}
                                    <p className={`px-2 py-0.5 rounded-full text-sm ${order.status === 'Cancelled' ? 'bg-red-50 text-red-700' : order.status === 'Delivered' ? 'bg-green-50 text-green-700' : order.status === 'Processing' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-700'}`}>{order.status || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {order.items.map((item, index) => (
                                    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0" key={item._id || index}>
                                        <div className="min-w-0 flex items-center gap-3">
                                            <img
                                                src={item.image || item.productId?.images?.[0]?.url || assets.parcel_icon}
                                                alt={item.name}
                                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover border rounded"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-base truncate">{item.name} <span className="text-sm text-gray-500">x {item.quantity}</span></p>
                                                <p className="text-sm text-gray-500">{item.variantSize || item.size || ''}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Styled select with custom arrow */}
                                            <div className="relative">
                                                <select
                                                    value={item.status || "Pending"}
                                                    onChange={(e) => itemStatusHandler(e.target.value, order._id, item._id)}
                                                    className="block w-48 appearance-none p-2 pl-3 pr-8 border border-gray-200 rounded-md bg-white text-sm hover:shadow-sm transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                                                >
                                                    {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {/* Status badge with stronger contrast and icon */}
                                            {(() => {
                                                const s = (item.status || 'Pending');
                                                const base = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold';
                                                let color = 'bg-yellow-50 text-yellow-800';
                                                let icon = (
                                                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                                                );
                                                if (s === 'Delivered') {
                                                    color = 'bg-green-50 text-green-800';
                                                    icon = (<svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>);
                                                } else if (s === 'Shipped') {
                                                    color = 'bg-blue-50 text-blue-800';
                                                    icon = (<svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 6h10l4 4v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /></svg>);
                                                } else if (s === 'Processing') {
                                                    color = 'bg-indigo-50 text-indigo-800';
                                                    icon = (<svg className="w-4 h-4 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" /></svg>);
                                                } else if (s === 'Cancelled') {
                                                    color = 'bg-red-50 text-red-800';
                                                    icon = (<svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>);
                                                }
                                                return (
                                                    <span className={`${base} ${color} ring-0`}>{icon}<span className="capitalize">{s}</span></span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <p className="text-sm text-gray-600">Items: <span className="font-semibold text-lg">{order.items.length}</span></p>
                            <p className="mt-2 text-sm text-gray-600">Method: <span className="font-semibold text-base">{order.paymentMethod}</span></p>
                            <p className="mt-2 text-sm text-gray-600">Date: <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span></p>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-3xl font-extrabold">{currency} {Number(order.amount).toFixed(2)}</p>
                            </div>
                            {/* Cancel option removed for admin to prevent accidental cancellations */}
                        </div>

                    </article>
                ))}
            </div>

            {/* Pagination Controls */}
            {!loading && orders.length > 0 && (
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
        </div>
    );
};

export default Orders;
