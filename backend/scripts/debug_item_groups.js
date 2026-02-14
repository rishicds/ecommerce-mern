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

const fetchItemGroups = async () => {
    // Check item groups count
    const url = `${BASE_URL}/${MERCHANT_ID}/item_groups?limit=100`;
    console.log(`Fetching Item Groups: ${url}`);

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const data = await response.json();
        console.log(`Item Groups found: ${data.elements ? data.elements.length : 0}`);

        // Deep probe
        await probeGroupOffset(100);
        await probeGroupOffset(500);

        if (data.elements && data.elements.length > 0) {
            console.log("Sample Group:", JSON.stringify(data.elements[0], null, 2));
            // Check if group has 'items' list in it
            const groupId = data.elements[0].id;
            await checkGroupItems(groupId);
        }

    } catch (e) {
        console.error(e);
    }
};

const probeGroupOffset = async (offset) => {
    const url = `${BASE_URL}/${MERCHANT_ID}/item_groups?limit=1&offset=${offset}`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        const data = await res.json();
        console.log(`Group Offset ${offset}: ${data.elements && data.elements.length > 0 ? 'FOUND' : 'Empty'}`);
    } catch (e) { }
};

const checkGroupItems = async (groupId) => {
    // Correct way: Fetch items with filter itemGroup.id = ... 
    // Clover API V3 often uses specific filter syntax
    // Try: /items?filter=itemGroup.id={groupId}
    // But specific syntax usually requires `itemGroup.id` to be a filterable field.

    // Another attempt: maybe expand=itemGroup? We already did that.

    // Let's try raw fetch first
    const url = `${BASE_URL}/${MERCHANT_ID}/items?filter=itemGroup.id=${groupId}`;
    console.log(`Fetching Items for Group ${groupId}: ${url}`);

    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        if (!res.ok) {
            console.log(`Failed: ${res.status} ${res.statusText}`);
            // If filter fails, we know we can't search this way.
            return;
        }
        const data = await res.json();
        console.log(`Items in group (via filter): ${data.elements ? data.elements.length : 0}`);
        if (data.elements && data.elements.length > 0) {
            data.elements.forEach(e => console.log(` - ${e.name} (${e.id})`));
        }
    } catch (e) { console.error(e); }
};

const run = async () => {
    await fetchItemGroups();
};

run();
