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

const fetchOffset = async (offset) => {
    const url = `${BASE_URL}/${MERCHANT_ID}/items?limit=10&offset=${offset}`;
    console.log(`Fetching Offset ${offset}: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log(`  Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`  Body: ${text}`);
            return;
        }

        const data = await response.json();
        const count = data.elements ? data.elements.length : 0;
        console.log(`  Success! Count: ${count}`);
        if (count > 0) {
            console.log(`  First Item ID: ${data.elements[0].id}`);
            console.log(`  First Item Name: ${data.elements[0].name}`);
        }

    } catch (e) {
        console.error("  Fetch error:", e.message);
    }
};

const run = async () => {
    // Probe around the known limit of ~1014
    await fetchOffset(0);
    await fetchOffset(1000);
    await fetchOffset(1010);
    await fetchOffset(1020);

    // Probe deep
    await fetchOffset(1500);
    await fetchOffset(5000);
};

run();
