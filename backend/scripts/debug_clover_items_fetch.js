import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolving .env path explicitly to avoid issues
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

console.log("Loading env from:", envPath);
console.log("CLOVER_ENV:", process.env.CLOVER_ENV);
console.log("CLOVER_MERCHANT_ID:", process.env.CLOVER_MERCHANT_ID ? "Set" : "Missing");

const MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;
const API_TOKEN = process.env.CLOVER_API_TOKEN;
const BASE_URL = process.env.CLOVER_ENV === 'production'
    ? 'https://api.clover.com/v3/merchants'
    : 'https://apisandbox.dev.clover.com/v3/merchants';

const fetchItems = async (expand = '') => {
    const url = `${BASE_URL}/${MERCHANT_ID}/items?limit=10${expand ? `&expand=${expand}` : ''}`;
    console.log(`\nFetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
            return;
        }

        const data = await response.json();
        console.log(`Success! Items found: ${data.elements ? data.elements.length : 0}`);
        if (data.elements && data.elements.length > 0) {
            console.log("First item:", JSON.stringify(data.elements[0], null, 2));
        }

    } catch (e) {
        console.error("Fetch error:", e.message);
    }
};

const run = async () => {
    if (!MERCHANT_ID || !API_TOKEN) {
        console.error("Credentials missing. Exiting.");
        return;
    }

    console.log("--- Test 1: No Expansion ---");
    await fetchItems();

    console.log("\n--- Test 2: Service Expansion ---");
    // categories,tags,itemStock,itemGroup,modifierGroups,taxRates,revenueClass,images,attributes,options,variants
    await fetchItems('categories,tags,itemStock,itemGroup,modifierGroups,taxRates,revenueClass,images,attributes,options,variants');

    console.log("\n--- Test 3: Minimal Expansion ---");
    await fetchItems('categories,itemStock');
};

run();
