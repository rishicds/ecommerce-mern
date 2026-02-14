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

const fetchCategories = async () => {
    const url = `${BASE_URL}/${MERCHANT_ID}/categories?limit=100`;
    console.log(`Fetching Categories: ${url}`);

    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        const data = await response.json();
        console.log(`Categories found: ${data.elements ? data.elements.length : 0}`);

        const uniqueItems = new Set();

        if (data.elements) {
            for (const cat of data.elements) {
                console.log(`Checking Category: ${cat.name} (${cat.id})`);
                const catItems = await getCategoryItems(cat.id);
                catItems.forEach(i => uniqueItems.add(i.id));
                console.log(`  > Found ${catItems.length} items. Total Unique so far: ${uniqueItems.size}`);
            }
        }

        console.log(`\nFINAL COUNT via Categories: ${uniqueItems.size}`);

    } catch (e) { console.error(e); }
};

const getCategoryItems = async (catId) => {
    let all = [];
    let offset = 0;
    while (true) {
        const url = `${BASE_URL}/${MERCHANT_ID}/categories/${catId}/items?limit=100&offset=${offset}`;
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
            const data = await res.json();
            const items = data.elements || [];
            all = all.concat(items);
            if (items.length < 100) break;
            offset += 100;
        } catch (e) { break; }
    }
    return all;
};

const run = async () => {
    await fetchCategories();
};

run();
