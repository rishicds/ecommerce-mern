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

const fetchCount = async (description, params = '') => {
    // Note: Clover doesn't have a direct /count endpoint for items publically documented everywhere,
    // but sometimes passing limit=1 and checking total is the way, or just fetching loops.
    // However, we will try to fetch with limit=1 and see if we can find a total count in response?
    // If not, we'll try to use a large limit or offset probing.

    // Actually, let's just use the loop method for a quick 'head' check or check specific known offsets.

    const url = `${BASE_URL}/${MERCHANT_ID}/items?limit=1${params}`;
    console.log(`\n--- ${description} ---\nURL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log(`Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        // Check if there's a specific 'href' which might indicate total? No.
        // Clover sometimes returns 'elements' array.

        console.log(`Found elements: ${data.elements ? data.elements.length : 0}`);

        // Let's try to probe deeper if we suspect more.
        // But first, let's see if we get ANY results for hidden/deleted.
        if (data.elements && data.elements.length > 0) {
            console.log("Sample ID:", data.elements[0].id);
        }
    } catch (e) {
        console.error("Fetch error:", e.message);
    }
};

const probeOffset = async (description, offset, params = '') => {
    const url = `${BASE_URL}/${MERCHANT_ID}/items?limit=1&offset=${offset}${params}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const data = await response.json();
        const found = data.elements && data.elements.length > 0;
        console.log(`${description} (Offset ${offset}): ${found ? 'FOUND' : 'Empty'}`);
        return found;
    } catch (e) {
        console.log(`${description} (Offset ${offset}): Error ${e.message}`);
    }
};

const run = async () => {
    // 1. Standard (already checked, appears to be ~1014)
    // await fetchCount("Standard Fetch");

    // 2. No expansions (lightweight)
    await probeOffset("No Expansions", 1000);
    await probeOffset("No Expansions", 1020);
    await probeOffset("No Expansions", 2000);

    // 3. Hidden items
    console.log("\nChecking Hidden Items...");
    // filter=hidden=true
    // Clover syntax often: filter=hidden is true
    await probeOffset("Hidden Items", 0, '&filter=hidden=true');
    await probeOffset("Hidden Items", 100, '&filter=hidden=true');
    await probeOffset("Hidden Items", 1000, '&filter=hidden=true');

    // 4. Deleted items (if supported on this endpoint)
    // It seems /items endpoints don't usually show deleted unless queried specifically? 
    // Or maybe they are just gone.
    // Let's try to query without any filters? (default is usually all active)

    // 5. Modified time? Maybe we can find items modified recently?
    // Let's stick to the hidden check first.
};

run();
