import React, { useCallback, useEffect, useState } from 'react';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { initSocket } from '../socket';

function Orders() {
    const { backendUrl, currency } = useShop();
    const { user } = useAuth();
    const [orderData, setOrderData] = useState([]);

    const loadOrderData = useCallback(async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/order/userOrders`, { withCredentials: true });
            if (res.data.success) {
                let allOrdersItem = [];
                res.data.orders.forEach((order) => {
                    // If entire order is cancelled, skip its items
                    const orderStatus = (order.status || '').toString().toLowerCase();
                    const orderCancelled = orderStatus === 'cancelled' || orderStatus === 'canceled';
                    order.items.forEach((item) => {
                        // Prefer per-item status if present, otherwise fall back to order-level status
                        item.status = item.status || order.status;
                        // Skip cancelled items or items whose parent order is cancelled
                        const itemStatus = (item.status || '').toString().toLowerCase();
                        if (orderCancelled || itemStatus === 'cancelled' || itemStatus === 'canceled') return;
                        item.payment = order.payment;
                        item.paymentMethod = order.paymentMethod;
                        // keep a reference to the parent order id so UI can show it
                        item.orderId = order._id;
                        item.date = order.createdAt;
                        allOrdersItem.push(item);
                    });
                });
                setOrderData(allOrdersItem.reverse());
            } else {
                console.log(res.data.message);
            }
        } catch (error) {
            console.error("Error loading order data:", error);
        }
    }, [backendUrl]);

    useEffect(() => {
        if (user) {
            loadOrderData();
        }
    }, [user, loadOrderData]);

    // Listen for order updates via socket and update UI in real time
    useEffect(() => {
        if (!user) return;
        const url = backendUrl || '';
        const socket = initSocket(url, user?._id);
        if (!socket) return;

        const onOrderUpdated = (payload) => {
            try {
                const updated = payload?.order;
                if (!updated) return;
                // If entire order was cancelled, remove its items from the user orders list
                const uStatus = (updated.status || '').toString().toLowerCase();
                if (uStatus === 'cancelled' || uStatus === 'canceled') {
                    setOrderData(prev => prev.filter(i => i.orderId?.toString() !== updated._id?.toString()));
                } else {
                    // Otherwise, update statuses of items from this order
                    setOrderData(prev => prev.map(item => item.orderId?.toString() === updated._id?.toString() ? { ...item, status: item.status || updated.status } : item));
                }
            } catch (e) {
                console.error('Error handling orderUpdated on user orders page', e);
            }
        };

        socket.on('orderUpdated', onOrderUpdated);

        return () => {
            try { socket.off('orderUpdated', onOrderUpdated); } catch (e) {}
        };
    }, [user]);

    // Cancel entire order (user action)
    const cancelOrder = async (orderId) => {
        if (!orderId) return;
        try {
            console.log('Attempting cancelOrder for:', orderId);
            const res = await axios.put(
                `${backendUrl}/api/order/user/cancel`,
                { orderId },
                { withCredentials: true }
            );

            if (res.data.success) {
                // remove items for this order from local UI (socket will also emit)
                setOrderData(prev => prev.filter(item => item.orderId?.toString() !== orderId?.toString()));
                // refresh from server to ensure consistent state
                if (typeof loadOrderData === 'function') await loadOrderData();
                toast.success('Order cancelled successfully.');
            } else {
                toast.error(res.data.message || 'Failed to cancel order.');
            }
        } catch (error) {
            console.error('Error cancelling order:', error, error.response ? error.response.data : null);
            const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Something went wrong while cancelling the order.';
            toast.error(serverMsg);
            // If server says the order is already cancelled, remove it from local UI (socket may have been missed)
            try {
                const low = (serverMsg || '').toString().toLowerCase();
                if (low.includes('already cancelled') || low.includes('already canceled') || error?.response?.status === 400) {
                    setOrderData(prev => prev.filter(item => item.orderId?.toString() !== orderId?.toString()));
                    // refresh list to be safe and ensure consistent state
                    if (typeof loadOrderData === 'function') {
                        await loadOrderData();
                    }
                }
            } catch (e) {
                console.error('Error handling cancel error UI update', e);
            }
        }
    };

    return (
        <div className='border-t-2 border-gray-300 pt-16'>
            <div className='text-2xl'>
                <Title text1='MY' text2='ORDERS' />
            </div>
            <div>
                {orderData?.map((product, index) => (
                    <div key={index} className='py-4 border-y border-gray-300 text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div className='flex items-start gap-6 text-sm'>
                            <img
                                className='w-20 sm:w-24 md:w-28 object-cover border border-gray-200 bg-gray-50'
                                src={product.image || product.productId?.images?.[0]?.url || '/no-image.svg'}
                                alt={product.name}
                            />
                            <div>
                                <p className='text-lg sm:text-xl font-semibold'>{product.name}</p>
                                <p className='text-sm text-gray-500 mt-2'>Order ID: <span title={product.orderId} className='break-all'>{product.orderId ? product.orderId.toString() : ''}</span></p>
                                <div className='flex items-center gap-4 mt-2 text-lg text-gray-700'>
                                    <p className='font-medium'>{currency}{product.price.toFixed(2)}</p>
                                    <p className=''>Quantity: <span className='font-medium'>{product.quantity}</span></p>
                                    {(() => {
                                        const size = (product.variantSize && product.variantSize !== 'default')
                                            ? product.variantSize
                                            : (product.productId?.variants && product.productId.variants.length > 0
                                                ? product.productId.variants[0].size
                                                : (product.size && product.size !== 'default' ? product.size : ''));
                                        return size ? <p className=''>Size: {size}</p> : null;
                                    })()}
                                </div>
                                <p className='mt-2'>Date: <span className='text-gray-600 text-sm'>{new Date(product.date).toLocaleDateString()}</span></p>
                            </div>
                        </div>
                        <div className='flex justify-between md:w-1/2'>
                            <div className='flex items-center gap-3'>
                                {(() => {
                                    const s = (product.status || '').toLowerCase();
                                    const color = s === 'shipped' || s === 'delivered' ? 'bg-green-500' : s === 'processing' ? 'bg-yellow-400' : s === 'pending' ? 'bg-gray-400' : s === 'cancelled' ? 'bg-red-500' : 'bg-gray-400';
                                    return <p className={`min-w-3 h-3 rounded-full ${color}`}></p>;
                                })()}
                                <p className='text-base md:text-lg font-medium'>{product.status}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <button className='border border-gray-300 px-4 py-2 text-base font-medium rounded-sm cursor-pointer'>
                                    Track Order
                                </button>
                                {/* Show cancel button only when order is not cancelled or delivered */}
                                {(() => {
                                    const s = (product.status || '').toLowerCase();
                                    if (s !== 'cancelled' && s !== 'delivered') {
                                        return (
                                            <button
                                                onClick={() => cancelOrder(product.orderId)}
                                                className='border border-red-300 px-4 py-2 text-base font-medium rounded-sm text-red-700 hover:bg-red-50'
                                            >
                                                Cancel
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Orders;
