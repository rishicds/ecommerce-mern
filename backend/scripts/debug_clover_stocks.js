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

const fetchStockCount = async () => {
    // Check key endpoint modification times or total stock records?
    const url = `${BASE_URL}/${MERCHANT_ID}/item_stocks?limit=1`;
    console.log(`Fetching Stock: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        // Sometimes stocks are many more than items?
        // But usually 1:1 unless there are multiple stocks per item (uncommon for simple setups)
        console.log("Stock Elements found in 1 page:", data.elements ? data.elements.length : 0);

        // Let's try to probe offset 2000 for stocks
        await probeStockOffset(2000);

    } catch (e) {
        console.error("Fetch error:", e.message);
    }
};

const probeStockOffset = async (offset) => {
    const url = `${BASE_URL}/${MERCHANT_ID}/item_stocks?limit=1&offset=${offset}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const data = await response.json();
        if (data.elements && data.elements.length > 0) {
            console.log(`Stock Offset ${offset}: FOUND`);
        } else {
            console.log(`Stock Offset ${offset}: Empty`);
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}


const run = async () => {
    await fetchStockCount();
};

run();
