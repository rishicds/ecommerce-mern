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
                    order.items.forEach((item) => {
                        // Prefer per-item status if present, otherwise fall back to order-level status
                        item.status = item.status || order.status;
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
                if ((updated.status || '').toLowerCase() === 'cancelled') {
                    setOrderData(prev => prev.filter(i => i.orderId !== updated._id));
                } else {
                    // Otherwise, update statuses of items from this order
                    setOrderData(prev => prev.map(item => item.orderId === updated._id ? { ...item, status: item.status || updated.status } : item));
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
            const res = await axios.put(
                `${backendUrl}/api/order/status`,
                { orderId, status: 'Cancelled' },
                { withCredentials: true }
            );

            if (res.data.success) {
                // Mark all items for this order as cancelled in local UI
                setOrderData(prev => prev.map(item => item.orderId === orderId ? { ...item, status: 'Cancelled' } : item));
                toast.success('Order cancelled successfully.');
            } else {
                toast.error(res.data.message || 'Failed to cancel order.');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Something went wrong while cancelling the order.');
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
