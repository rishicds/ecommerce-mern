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

const searchItem = async (query) => {
    // Search using filter=name LIKE ... if possible, or usually just fetch all and filter but we want to check if API can find it
    console.log(`\nSearching for "${query}"...`);

    // Clover API doesn't support "LIKE" easily on name for all fields, but has a search endpoint or filter
    // Let's try to fetch all again but count strictly matching names
    // Actually, let's use the 'search' endpoint if available (v3/merchants/mId/items?filter=name STARTS WITH ...)
    // filter=name starts with "Nic Bar"

    // Correct Clover syntax: filter=name STARTS_WITH 'Value'
    const url = `${BASE_URL}/${MERCHANT_ID}/items?filter=name STARTS_WITH '${query}'&limit=100`;
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log(`Error: ${response.status}`);
            const text = await response.text();
            console.log(text);
            return;
        }

        const data = await response.json();
        console.log(`Found: ${data.elements ? data.elements.length : 0}`);
        if (data.elements && data.elements.length > 0) {
            data.elements.forEach(e => console.log(`  - ${e.name} (${e.id})`));
        }

    } catch (e) {
        console.error(e);
    }
};

const run = async () => {
    await searchItem("Nic Bar");
    await searchItem("Abt");
    await searchItem("Elfbar"); // Another common one
};

run();
