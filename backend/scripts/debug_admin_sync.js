import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Resolving .env path explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

console.log("Environment loaded.");
console.log("CLOVER_MERCHANT_ID:", process.env.CLOVER_MERCHANT_ID);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("DB Connection Error:", err);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    // Dynamic import to ensure env is loaded first
    const { syncClover } = await import('../controllers/adminController.js?update=' + Date.now());

    console.log("--- Starting Admin Sync Debug ---");

    const req = {
        body: { mode: 'pull' },
        user: { email: 'debug@script.local' }
    };

    const res = {
        status: function (code) {
            console.log(`[Response Status] ${code}`);
            return this;
        },
        json: function (data) {
            console.log("[Response JSON]");
            console.log(JSON.stringify(data, null, 2));
            return this;
        }
    };

    try {
        await syncClover(req, res);
    } catch (e) {
        console.error("CRITICAL ERROR in syncClover call:", e);
    }

    console.log("Exiting...");
    process.exit(0);
};

run();
