import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // optional external Clover order id for sync
    externalCloverId: { type: String, index: true, sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phone: { type: String, required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: { type: String, required: true },
            variantSize: { type: String, required: true }, // e.g., "10ml", "20ml"
            image: { type: String },
            status: {
                type: String,
                enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
                default: "Pending"
            },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    amount: { type: Number, required: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Pending"
    },
    paymentMethod: {
        type: String,
        enum: ["CashOnDelivery", "Stripe", "Clover"],
        required: true
    },
    payment: { type: Boolean, required: true, default: false },
    discountCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
