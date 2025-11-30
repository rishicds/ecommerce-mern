import React, { useState } from "react";
import { useShop } from "../context/ShopContex";
import Title from "./Title";

const CartTotal = () => {
    const { currency, deliveryFee, getCartAmount, applyDiscount, discount, removeDiscount } = useShop();
    const [discountCode, setDiscountCode] = useState('');
    const [applying, setApplying] = useState(false);

    const subtotal = getCartAmount();
    const discountAmount = discount?.totalDiscount || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxes = afterDiscount * 0.06; // 6% estimated taxes (post-discount)
    const total = afterDiscount + deliveryFee + taxes;

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setApplying(true);
        await applyDiscount(discountCode);
        setApplying(false);
    };

    const handleRemoveDiscount = () => {
        removeDiscount();
        setDiscountCode('');
    };

    return (
        <div className="w-full">
            <div className="text-2xl">
                <Title text1="CART" text2="TOTAL" />
            </div>

            {/* Discount Code Input */}
            {!discount && (
                <div className="mt-4 mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            placeholder="Enter discount code"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm uppercase"
                        />
                        <button
                            onClick={handleApplyDiscount}
                            disabled={applying || !discountCode.trim()}
                            className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                            {applying ? 'Applying...' : 'Apply'}
                        </button>
                    </div>
                </div>
            )}

            {/* Show Applied Discount */}
            {discount && (
                <div className="mt-4 mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm font-semibold text-green-800">
                                Code: {discount.code}
                            </p>
                            <p className="text-xs text-green-600">
                                {discount.discountType === 'percentage' 
                                    ? `${discount.discountValue}% off` 
                                    : `₹${discount.discountValue} off`}
                            </p>
                        </div>
                        <button
                            onClick={handleRemoveDiscount}
                            className="text-red-600 text-sm hover:underline"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 mt-2 text-sm">
                <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>{currency}{subtotal.toFixed(2)}</p>
                </div>
                
                {discount && discountAmount > 0 && (
                    <>
                        <hr className="border-gray-300" />
                        <div className="flex justify-between text-green-600">
                            <p>Discount</p>
                            <p>-{currency}{discountAmount.toFixed(2)}</p>
                        </div>
                    </>
                )}
                
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                    <p>Shipping Fee</p>
                    <p>{currency}{deliveryFee.toFixed(2)}</p>
                </div>

                <div className="flex justify-between text-sm mt-2">
                    <div>Estimated taxes</div>
                    <div>{currency}{taxes.toFixed(2)}</div>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                    <b>Total</b>
                    <b>{currency}{total.toFixed(2)}</b>
                </div>
            </div>
        </div>
    );
};

export default CartTotal;