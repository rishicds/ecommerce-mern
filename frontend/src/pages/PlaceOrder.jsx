import React, { useState } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/frontend_assets/assets';
import { toast } from 'react-toastify';
import { useShop } from '../context/ShopContex';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function PlaceOrder() {
    const {user} = useAuth();    
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const {
        products,
        currency,
        deliveryFee,
        cartItems,
        cartDetails,
        getCartAmount,
        navigate,
        backendUrl,
        setCartItems
    } = useShop();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: ""
    });

    const onChangeHandler = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let orderItems = [];

            if (cartDetails && cartDetails.length) {
                // Use backend-provided cart details (contain variant price)
                orderItems = cartDetails.map(d => ({
                    productId: d.productId,
                    name: d.name,
                    variantSize: d.variantSize || d.size || 'default',
                    quantity: d.quantity,
                    price: d.price
                }));
            } else {
                for (const productId in cartItems) {
                    for (const size in cartItems[productId]) {
                        const quantity = cartItems[productId][size];
                        if (quantity > 0) {
                            const product = products.find(p => p._id === productId);
                            if (product) {
                                orderItems.push({
                                    productId: product._id,
                                    name: product.name,
                                    variantSize: size,
                                    quantity,
                                    price: product.price
                                });
                            }
                        }
                    }
                }
            }

            const orderPayload = {
                phone: formData.phone,
                items: orderItems,
                amount: getCartAmount() + deliveryFee,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zipcode,
                    country: formData.country
                }
            };

            switch (paymentMethod) {
                case 'cod':
                    {
                        const res = await axios.post(`${backendUrl}/api/order/place-cod`, orderPayload, {
                            withCredentials: true
                        });

                        if (res.data.success) {
                            setCartItems({});
                            navigate("/orders");
                            toast.success(res.data.message);
                        } else {
                            toast.error(res.data.message || "Order failed.");
                        }
                        break;
                    }
                default:
                    toast.error("Please select a valid payment method.");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={onSubmitHandler}
            className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t-2 border-gray-300'
        >
            {/* Left Side */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
                <div className='text-xl sm:text-2xl py-3'>
                    <Title text1='DELIVERY' text2='INFORMATION' />
                </div>
                {/* <div className='flex gap-3'>
                    <input required name='firstName' value={formData.firstName} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='First name' type="text" />
                    <input required name='lastName' value={formData.lastName} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Last name' type="text" />
                </div> */}
                <input required name='name' value={user?.name || ''} readOnly onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Name' type="name" />
                <input required name='email' value={user?.email || ""} readOnly onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Email address' type="email" />
                <input required name='street' value={formData.street} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Street' type="text" />
                <div className='flex gap-3'>
                    <input required name='city' value={formData.city} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='City' type="text" />
                    <input required name='state' value={formData.state} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='State' type="text" />
                </div>
                <div className='flex gap-3'>
                    <input required name='zipcode' value={formData.zipcode} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Zipcode' type="number" />
                    <input required name='country' value={formData.country} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Country' type="text" />
                </div>
                <input required name='phone' value={formData.phone} onChange={onChangeHandler} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' placeholder='Phone number' type="number" />
            </div>

            {/* Right Side */}
            <div className='mt-8'>
                    <div className='mt-8 w-full sm:w-[420px]'>
                        <div className='bg-white p-4 border rounded'>
                            <h3 className='text-lg font-medium mb-4'>Your Order</h3>

                            <div className='space-y-3'>
                                {(cartDetails && cartDetails.length ? cartDetails : Object.keys(cartItems).flatMap(pid => {
                                    const sizes = cartItems[pid] || {};
                                    return Object.keys(sizes).map(size => ({ productId: pid, variantSize: size, quantity: sizes[size] }));
                                })).map((it, idx) => {
                                    const pid = it.productId || it.productId;
                                    const size = (it.variantSize && it.variantSize !== 'default') ? it.variantSize : (it.size && it.size !== 'default' ? it.size : '');
                                    const quantity = it.quantity || 0;
                                    const product = products.find(p => p._id === pid) || {};
                                    const image = it.image || product.images?.[0]?.url || '';
                                    const name = it.name || product.name || '';
                                    const price = it.price ?? product.price ?? 0;

                                    return (
                                        <div key={`${pid}-${size}-${idx}`} className='flex items-center gap-3'>
                                            <img src={image} className='w-16 h-16 object-cover' />
                                            <div className='flex-1'>
                                                <div className='text-sm font-medium'>{name}</div>
                                                <div className='text-xs text-gray-500'>{size}</div>
                                                <div className='text-sm mt-1'>{currency}{(price * quantity).toFixed(2)}</div>
                                            </div>
                                            <div className='text-sm text-gray-700'>{quantity} x</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className='mt-4'>
                                <div className='flex justify-between text-sm'>
                                    <div>Subtotal</div>
                                    <div>{currency}{getCartAmount().toFixed(2)}</div>
                                </div>
                                <div className='flex justify-between text-sm mt-2'>
                                    <div>Shipping</div>
                                    <div>{currency}{deliveryFee.toFixed(2)}</div>
                                </div>
                                <div className='flex justify-between text-sm mt-2'>
                                    <div>Estimated taxes</div>
                                    <div>{currency}{(getCartAmount() * 0.06).toFixed(2)}</div>
                                </div>
                                <hr className='my-3' />
                                <div className='flex justify-between text-base font-semibold'>
                                    <div>Total</div>
                                    <div>{currency}{(getCartAmount() + deliveryFee + (getCartAmount() * 0.06)).toFixed(2)}</div>
                                </div>
                            </div>

                            <div className='mt-4'>
                                <input placeholder='Discount code or gift card' className='w-full border p-2 text-sm' />
                                <div className='flex gap-2 mt-3'>
                                    <button type='button' onClick={() => navigate('/cart')} className='w-1/2 border py-2'>Go to cart</button>
                                    <button type='submit' disabled={loading} className='w-1/2 bg-black text-white py-2'>{loading ? 'Placing Order...' : 'Checkout'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </form>
    );
}

export default PlaceOrder;
