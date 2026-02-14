
import 'dotenv/config';
import mongoose from 'mongoose';
import { syncProducts } from '../controllers/cloverController.js';

// dotenv.config(); // Removed redundant call

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

    console.log("--- Starting Sync Verification ---");

    const req = {};
    const res = {
        json: (data) => {
            console.log("Controller Response (JSON):");
            console.log(JSON.stringify(data, null, 2));
        },
        status: (code) => {
            console.log(`Controller Status Set: ${code}`);
            return res; // chainable
        },
        send: (data) => {
            console.log("Controller Response (Send):", data);
        }
    };

    try {
        await syncProducts(req, res);
    } catch (error) {
        console.error("Unexpected Error during verification:", error);
    }

    console.log("--- Sync Verification Finished ---");
    process.exit(0);
};

run();
