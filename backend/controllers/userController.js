import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import { getIO } from '../socket.js';

const createToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Route for user login
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User doesn't exist" });
        }

        // Compare password
        const isMatchedPassword = await bcrypt.compare(password, user.password);
        if (!isMatchedPassword) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Issue JWT token
        const token = createToken(user._id);

        // Send via HTTP-only cookie
        res.cookie("user_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return res.status(200).json({ success: true, user: user._id, message: "Successfully LoggedIn" });

    } catch (error) {
        console.error("User Login error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};


// Route for user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check for existing user
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        const user = await newUser.save();

        // Generate token
        const token = createToken(user._id);

        // Send via HTTP-only cookie
        res.cookie("user_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });


        return res.status(200).json({ success: true, user: user._id, message: "Registration Success" });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
};

const getUserData = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    return res.status(200).json({
        success: true,
        message: "User is authenticated",
        user: { 
            _id: req.user._id, 
            name: req.user.name, 
            email: req.user.email,
            phone: req.user.phone || '',
            address: req.user.address || {},
            createdAt: req.user.createdAt
        },
    });
};

const userLogout = (req, res) => {
    res.clearCookie("user_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, phone, address } = req.body;

        // Input validation
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email' });
        }

        // Check if email is being changed and if it already exists
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                name, 
                email, 
                phone: phone || '', 
                address: address || {} 
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
};

// Add product to user's waitlist
const addToWaitlist = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;
        if (!productId || productId.length !== 24) return res.status(400).json({ success: false, message: 'Invalid product id' });

        const product = await Product.findById(productId).select('name');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // ensure map exists
        user.notifications_waitlist = user.notifications_waitlist || new Map();
        // Save as true to indicate waiting
        user.notifications_waitlist.set(productId, true);
        await user.save();

        return res.status(200).json({ success: true, message: 'Added to waitlist' });
    } catch (error) {
        console.error('addToWaitlist error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get current user's notifications and unread count
const getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notifications');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Clone and reverse to newest first
        const notifications = (user.notifications || []).slice().reverse();
        const unreadCount = notifications.filter(n => !n.read).length;

        // Collect productIds referenced in notifications
        const productIds = [...new Set(notifications.filter(n => n.productId).map(n => n.productId.toString()))];
        let productsMap = {};
        if (productIds.length > 0) {
            const products = await Product.find({ _id: { $in: productIds } }).select('name images');
            productsMap = products.reduce((acc, p) => {
                acc[p._id.toString()] = { name: p.name, thumbnail: (p.images && p.images[0]) ? p.images[0].url : null };
                return acc;
            }, {});
        }

        // Attach product info to each notification object for the client
        const enriched = notifications.map(n => {
            const out = {
                _id: n._id,
                productId: n.productId,
                message: n.message,
                read: n.read,
                createdAt: n.createdAt,
                product: n.productId ? productsMap[n.productId.toString()] || null : null
            };
            return out;
        });

        return res.status(200).json({ success: true, notifications: enriched, unreadCount });
    } catch (error) {
        console.error('getNotifications error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark single notification as read
const markNotificationRead = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { id } = req.params; // notification id
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const notif = user.notifications.id(id);
        if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

        notif.read = true;
        await user.save();

        try {
            const io = getIO();
            if (io) {
                const unreadCount = (user.notifications || []).filter(n => !n.read).length;
                io.to(`user:${user._id}`).emit('notificationsUpdated', { unreadCount });
            }
        } catch (e) { console.error('emit.notificationsUpdated error', e); }

        return res.status(200).json({ success: true, message: 'Marked read' });
    } catch (error) {
        console.error('markNotificationRead error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check if current user has productId in their waitlist
const checkWaitlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notifications_waitlist');
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ success: false, message: 'Missing productId' });
        const isWaiting = !!(user && user.notifications_waitlist && (user.notifications_waitlist.get ? user.notifications_waitlist.get(productId) : user.notifications_waitlist[productId]));
        return res.status(200).json({ success: true, waiting: isWaiting });
    } catch (error) {
        console.error('checkWaitlist error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a single notification by id
const deleteNotification = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { id } = req.params;
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const notif = user.notifications.id(id);
        if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
        notif.remove();
        await user.save();
        try {
            const io = getIO();
            if (io) {
                const unreadCount = (user.notifications || []).filter(n => !n.read).length;
                io.to(`user:${user._id}`).emit('notificationsUpdated', { unreadCount });
            }
        } catch (e) { console.error('emit.notificationsUpdated error', e); }

        return res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('deleteNotification error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete all read notifications for current user
const deleteReadNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.notifications = (user.notifications || []).filter(n => !n.read);
        await user.save();
        try {
            const io = getIO();
            if (io) {
                const unreadCount = (user.notifications || []).filter(n => !n.read).length;
                io.to(`user:${user._id}`).emit('notificationsUpdated', { unreadCount });
            }
        } catch (e) { console.error('emit.notificationsUpdated error', e); }

        return res.status(200).json({ success: true, message: 'Read notifications cleared' });
    } catch (error) {
        console.error('deleteReadNotifications error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Clear all notifications for current user
const clearAllNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.notifications = [];
        await user.save();
        try {
            const io = getIO();
            if (io) {
                io.to(`user:${user._id}`).emit('notificationsUpdated', { unreadCount: 0, notifications: [] });
            }
        } catch (e) { console.error('emit.notificationsUpdated error', e); }

        return res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error('clearAllNotifications error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export { 
    userLogin, 
    registerUser, 
    getUserData, 
    userLogout, 
    updateProfile, 
    addToWaitlist, 
    getNotifications, 
    markNotificationRead, 
    checkWaitlist, 
    deleteNotification, 
    deleteReadNotifications, 
    clearAllNotifications 
};