import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Cart from "../models/cartModel.js";
import { getIO } from "../socket.js";

// Place order using COD Method
const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user._id;
        const { phone, items, amount, address } = req.body;

        // Basic validation
        if (!phone || !items || !Array.isArray(items) || items.length === 0 || !amount) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const { street, city, state, zip, country } = address;
        if (!street || !city || !state || !zip || !country) {
            return res.status(400).json({ success: false, message: "Complete address is required." });
        }

        // Validate each product exists and requested size/variant is available
        for (let item of items) {
            const product = await Product.findById(item.productId);
                if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
            }
            // Figure out requested size from either `variantSize` or legacy `size` field
            const requestedSize = item.variantSize || item.size || 'default';

            // Prefer validating against `variants` (new schema). Fall back to `sizes` if present.
            const variantSizes = Array.isArray(product.variants) && product.variants.length
                ? product.variants.map(v => v.size)
                : (Array.isArray(product.sizes) ? product.sizes : []);

            if (variantSizes.length > 0 && !variantSizes.includes(requestedSize)) {
                return res.status(400).json({ success: false, message: `Size ${requestedSize} not available for product ${item.name}` });
            }

            // Validate requested quantity against stock
            const requestedQty = Number(item.quantity) || 0;
            if (requestedQty > (product.stockCount || 0)) {
                return res.status(400).json({ success: false, message: `Not enough stock for product ${item.name}. Available: ${product.stockCount || 0}` });
            }

            // Attach snapshot of product image URL to the order item so order reflects the image at booking time
            try {
                item.image = (product.images && product.images.length) ? product.images[0].url : '';
            } catch (err) {
                item.image = '';
            }
            // If no variantSizes are provided on product, accept any size (or 'default')
        }

        // Create new order
        const newOrder = new Order({
            userId,
            phone,
            items,
            amount,
            address,
            status: "Pending",
            paymentMethod: "CashOnDelivery",
            payment: false
        });

        await newOrder.save();
        await User.findByIdAndUpdate(userId, { cartData: {} }, { new: true });
        // Clear server-side cart so user's cart is empty after successful order
        try {
            await Cart.findOneAndUpdate({ userId }, { items: [] }, { new: true, upsert: true });
            const io = getIO();
            if (io) {
                const populated = await Cart.findOne({ userId }).populate('items.productId', 'name images price variants');
                io.to(`user:${userId}`).emit('cartUpdated', populated || { items: [] });
            }
        } catch (e) {
            console.error('Failed to clear user cart after order', e);
        }

        // Decrement stock for each ordered item and emit real-time update
        try {
            const io = getIO();
            for (let item of items) {
                try {
                    const prod = await Product.findById(item.productId);
                    if (!prod) continue;
                    const qty = Number(item.quantity) || 0;
                    const newStock = Math.max(0, (prod.stockCount || 0) - qty);
                    prod.stockCount = newStock;
                    prod.inStock = newStock > 0;
                    await prod.save();
                    if (io) {
                        io.emit('productUpdated', { product: prod });
                    }
                } catch (e) {
                    console.error('Failed updating product stock after order', e);
                }
            }
        } catch (e) {
            console.error('Stock update after order failed', e);
        }

        return res.status(201).json({ success: true, message: "Order placed successfully with Cash on Delivery." });
    } catch (err) {
        console.error("Error placing COD order:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

// Place order using Stripe Method
const placeOrderStripe = async (req, res) => {

}

// All orders data for Admin Panel
const allOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("userId", "name email")
            .populate("items.productId", "images variants name");

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// User Order Data
const userOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find orders by user ID, sorted by most recent first
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("items.productId", "images variants");

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


// Update order status
const orderStatus = async (req, res) => {
    try {
        const { orderId, status, itemId } = req.body;

        // Validate input
        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Order ID and status are required." });
        }

        const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        // If itemId provided, update only that item's status
        if (itemId) {
            // Use positional operator to update nested item
            const updatedOrder = await Order.findOneAndUpdate(
                { _id: orderId, 'items._id': itemId },
                { $set: { 'items.$.status': status } },
                { new: true }
            ).populate("userId", "name email");

            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: "Order or item not found." });
            }

            // Emit order update so admin & user UIs can refresh without manual reload
            try {
                const io = getIO();
                if (io) io.emit('orderUpdated', { order: updatedOrder });
            } catch (e) {
                console.error('Failed emitting orderUpdated (item update)', e);
            }

            return res.status(200).json({ success: true, message: "Order item status updated successfully.", order: updatedOrder });
        }

        // Otherwise update whole order-level status
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate("userId", "name email").populate('items.productId');

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // If order was cancelled, restore stock for each item
        try {
            if (status === 'Cancelled') {
                const io = getIO();
                for (let it of updatedOrder.items) {
                    try {
                        const p = await Product.findById(it.productId._id || it.productId);
                        if (!p) continue;
                        const qty = Number(it.quantity) || 0;
                        p.stockCount = (p.stockCount || 0) + qty;
                        p.inStock = p.stockCount > 0;
                        await p.save();
                        if (io) io.emit('productUpdated', { product: p });
                    } catch (e) {
                        console.error('Failed restoring stock for cancelled order', e);
                    }
                }
            }
        } catch (e) {
            console.error('Error handling stock on order status change', e);
        }

        // Emit order update so admin & user UIs can refresh without manual reload
        try {
            const io = getIO();
            if (io) io.emit('orderUpdated', { order: updatedOrder });
        } catch (e) {
            console.error('Failed emitting orderUpdated (order-level)', e);
        }

        return res.status(200).json({ success: true, message: "Order status updated successfully.", order: updatedOrder });

    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Allow a user to cancel their own order
const cancelOrderByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.body;

        if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        // Only allow owner to cancel their order
        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this order.' });
        }

        // Do not allow cancelling delivered orders or already cancelled
        const curStatus = (order.status || '').toLowerCase();
        if (curStatus === 'delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel a delivered order.' });
        }
        if (curStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
        }

        order.status = 'Cancelled';
        await order.save();

        // restore stock for items
        try {
            const io = getIO();
            for (let it of order.items) {
                try {
                    const p = await Product.findById(it.productId._id || it.productId);
                    if (!p) continue;
                    const qty = Number(it.quantity) || 0;
                    p.stockCount = (p.stockCount || 0) + qty;
                    p.inStock = p.stockCount > 0;
                    await p.save();
                    if (io) io.emit('productUpdated', { product: p });
                } catch (err) {
                    console.error('Failed restoring product stock for user cancel', err);
                }
            }
        } catch (err) {
            console.error('Error restoring stock on user cancel', err);
        }

        // Emit orderUpdated so user/admin UIs refresh
        try {
            const io = getIO();
            if (io) io.emit('orderUpdated', { order });
        } catch (err) {
            console.error('Failed emitting orderUpdated for user cancel', err);
        }

        return res.status(200).json({ success: true, message: 'Order cancelled successfully.', order });
    } catch (error) {
        console.error('Error cancelling order by user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


export { placeOrderCOD, placeOrderStripe, allOrders, userOrders, orderStatus, cancelOrderByUser };