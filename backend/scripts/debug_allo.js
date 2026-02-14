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
    let allItems = [];
    let offset = 0;
    console.log("Fetching all items to find Allo items...");

    while (true) {
        const url = `${BASE_URL}/${MERCHANT_ID}/items?limit=100&offset=${offset}&expand=itemGroup`;
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
            const data = await res.json();
            const items = data.elements || [];
            allItems = allItems.concat(items);
            if (items.length < 100) break;
            offset += 100;
        } catch (e) {
            console.error(e);
            break;
        }
    }

    console.log(`Fetched ${allItems.length} total items.`);

    // Filter for "Allo 500" specifically
    const interest = allItems.filter(i =>
        i.name && i.name.startsWith('Allo 500')
    );

    console.log(`Found ${interest.length} 'Allo 500' items.`);

    interest.forEach(i => {
        console.log(`--------------------------------------------------`);
        console.log(`Name: "${i.name}"`);
        console.log(`ID: ${i.id}`);
        console.log(`Group ID: ${i.itemGroup ? i.itemGroup.id : 'N/A'}`);
    });
};

run();
