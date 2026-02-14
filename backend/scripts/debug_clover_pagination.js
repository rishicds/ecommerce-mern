import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;
const API_TOKEN = process.env.CLOVER_API_TOKEN;
const BASE_URL = process.env.CLOVER_ENV === 'production'
    ? 'https://api.clover.com/v3/merchants'
    : 'https://apisandbox.dev.clover.com/v3/merchants';

const run = async () => {
    if (!MERCHANT_ID || !API_TOKEN) {
        console.error("Credentials missing.");
        return;
    }

    console.log("--- Checking Pagination Metadata ---");
    // Fetch 1 item to see metadata
    const url = `${BASE_URL}/${MERCHANT_ID}/items?limit=1`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);

        // Log all headers to find pagination info
        console.log("Headers:");
        response.headers.forEach((val, key) => {
            console.log(`${key}: ${val}`);
        });

        const data = await response.json();
        console.log("\nTop-level keys in response:", Object.keys(data));

        if (data.elements) {
            console.log(`Elements length: ${data.elements.length}`);
        }

        // Check for specific clover list metadata
        if (data.href) console.log(`href: ${data.href}`);
        if (typeof data.count !== 'undefined') console.log(`count: ${data.count}`); // Sometimes specific APIs returns count

        // Also sometimes it's in a different format?
        console.log("Full Response Snapshot (minus elements details):");
        const snapshot = { ...data };
        if (snapshot.elements) snapshot.elements = `[Array of ${snapshot.elements.length}]`;
        console.log(JSON.stringify(snapshot, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
    }
};

run();
