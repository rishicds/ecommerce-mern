import React from 'react';
import { useShop } from '../context/ShopContex';
import CartTotal from './CartTotal';
import { assets } from '../assets/frontend_assets/assets';

const CartDrawer = () => {
    const { cartDetails, cartItems, products, currency, updateQuantity, showCartDrawer, setShowCartDrawer, navigate, getCartAmount, discount, isProductEligibleForDiscount } = useShop();

    if (!showCartDrawer) return null;

    const items = (cartDetails && cartDetails.length) ? cartDetails : Object.keys(cartItems).flatMap(pid => {
        const sizes = cartItems[pid] || {};
        return Object.keys(sizes).map(size => ({ productId: pid, variantSize: size, quantity: sizes[size] }));
    });

    return (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-lg z-50 overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">SHOPPING CART</h3>
                <button onClick={() => setShowCartDrawer(false)} className="text-gray-600">✕</button>
            </div>

            <div className="p-4 space-y-4">
                {items.length === 0 ? (
                    <div className="text-center text-gray-500">Your cart is empty</div>
                ) : (
                    items.map((it, idx) => {
                        const pid = (it.productId && it.productId._id) ? it.productId._id : (it.productId || it._id || it.product);
                        const variantSize = it.variantSize || it.size || it.variantSize;
                        const quantity = it.quantity || it.qty || 0;
                        const product = products.find(p => p._id === pid) || {};
                        const image = it.image || product.images?.[0]?.url || '';
                        const name = it.name || product.name || '';
                        // Prefer explicit price from cartDetails; otherwise use variant price if available, else base product price
                        const variantObj = product.variants ? product.variants.find(v => v.size === variantSize) : null;
                        // Normalize price safely — avoid mixing nullish and logical operators without parentheses
                        const basePrice = it.price ?? (variantObj ? variantObj.price : (product.price ?? 0));
                        const price = Number(basePrice || 0);
                        const lineTotal = price * (Number(quantity) || 0);
                        const isEligible = discount ? isProductEligibleForDiscount(pid) : null;

                        return (
                            <div key={`${pid}-${variantSize}-${idx}`} className="flex items-center gap-3">
                                <img src={image} className="w-14 h-14 object-cover" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{name}</div>
                                    <div className="text-xs text-gray-500">{variantSize && variantSize !== 'default' ? variantSize : ''}</div>
                                    {/* Show discount eligibility */}
                                    {discount && isEligible !== null && (
                                        <div className='mt-1'>
                                            {isEligible ? (
                                                <span className='text-xs text-green-600'>✓ Discount applied</span>
                                            ) : (
                                                <span className='text-xs text-orange-600'>⚠ Not eligible</span>
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-2">
                                        <button onClick={() => updateQuantity(pid, variantSize, Math.max(0, quantity - 1))} className="px-2 py-1 border">-</button>
                                        <div className="px-3">{quantity}</div>
                                        <button onClick={() => updateQuantity(pid, variantSize, quantity + 1)} className="px-2 py-1 border">+</button>
                                    </div>
                                </div>
                                <div className="text-sm font-medium">{currency}{lineTotal.toFixed(2)}</div>
                            </div>
                        );
                    })
                )}

                <div className="mt-6">
                    <CartTotal />
                </div>

                <div className="flex flex-col gap-3 mt-4">
                    <button onClick={() => { setShowCartDrawer(false); navigate('/cart'); }} className="px-4 py-3 border">Go To Cart Page</button>
                    <button onClick={() => { setShowCartDrawer(false); navigate('/place-order'); }} className="px-4 py-3 bg-red-600 text-white">Checkout</button>
                </div>
            </div>
        </div>
    );
};

export default CartDrawer;
