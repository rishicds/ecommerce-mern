
import 'dotenv/config'; // Load env before other imports
import mongoose from 'mongoose';
import { syncClover } from '../controllers/adminController.js';
import cloverService from '../services/cloverService.js';

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://admin:password@cluster0.mongodb.net/vapee";

// Mock Express Req/Res
const req = {
    user: { email: 'verification_script@test.com' },
    body: { mode: 'pull' }
};

const res = {
    statusCode: 200,
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        console.log('Controller Response (JSON):');
        console.log(JSON.stringify(data, null, 2));
        return this;
    },
    cookie: function () { },
    clearCookie: function () { }
};

async function runVerification() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('--- Starting Admin Sync Verification ---');

        // Ensure Clover Service acts as configured
        if (!process.env.CLOVER_API_TOKEN || !process.env.CLOVER_MERCHANT_ID) {
            console.error('Missing Clover Credentials in .env');
            process.exit(1);
        }

        await syncClover(req, res);

        console.log('--- Sync Verification Finished ---');
        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

runVerification();
