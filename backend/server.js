import express from 'express'
import { createServer } from 'http';
import { initSocket } from './socket.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import adminRouter from './routes/adminRoute.js';
import cartRoute from './routes/cartRoute.js';
import orderRoute from './routes/orderRoute.js';
import categoryRoute from './routes/categoryRoute.js';
import settingsRoute from './routes/settingsRoute.js';
import cloverRoute from './routes/cloverRoute.js';
import discountRoute from './routes/discountRoute.js';

// App Config
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.ADMIN_URL,
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://127.0.0.1:5173'
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(cookieParser())
connectDB();
connectCloudinary();

// API endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/admin', adminRouter);
app.use('/api/category', categoryRoute);
app.use('/api/cart/', cartRoute);
app.use('/api/order', orderRoute);
app.use('/api/settings', settingsRoute);
app.use('/api/clover', cloverRoute);
app.use('/api/discount', discountRoute);

// create http server and attach socket.io
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});