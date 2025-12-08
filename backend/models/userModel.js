import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipcode: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    cartData: { type: Object, default: {} },
    // Map of productId -> true for products user asked to be notified about
    notifications_waitlist: { type: Map, of: Boolean, default: {} },
    // Notifications sent to user
    notifications: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
}, { minimize: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
