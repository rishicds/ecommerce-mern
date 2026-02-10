import React, { useState } from "react";
import { useShop } from "../context/ShopContex";
import Title from "./Title";

const CartTotal = () => {
    const { currency, applyDiscount, discount, removeDiscount, getCartSummary } = useShop();
    const [discountCode, setDiscountCode] = useState('');
    const [applying, setApplying] = useState(false);

    const { subtotal, b5g1Discount, couponDiscount, shippingFee } = getCartSummary();
    const subtotalAfterDiscounts = Math.max(0, subtotal - b5g1Discount - couponDiscount);
    const taxes = subtotalAfterDiscounts * 0.06; // 6% estimated taxes
    const total = subtotalAfterDiscounts + shippingFee + taxes;

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

                {b5g1Discount > 0 && (
                    <>
                        <hr className="border-gray-300" />
                        <div className="flex justify-between text-green-600">
                            <p>Buy 5 Get 1 Free</p>
                            <p>-{currency}{b5g1Discount.toFixed(2)}</p>
                        </div>
                    </>
                )}

                {couponDiscount > 0 && (
                    <>
                        <hr className="border-gray-300" />
                        <div className="flex justify-between text-green-600">
                            <p>Discount</p>
                            <p>-{currency}{couponDiscount.toFixed(2)}</p>
                        </div>
                    </>
                )}

                <hr className="border-gray-300" />
                <div className="flex justify-between">
                    <p>Shipping Fee</p>
                    <p>{shippingFee === 0 ? 'Free' : `${currency}${shippingFee.toFixed(2)}`}</p>
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