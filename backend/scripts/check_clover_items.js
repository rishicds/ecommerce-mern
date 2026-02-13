
import dotenv from 'dotenv';
import cloverService from '../services/cloverService.js';

dotenv.config();

console.log("STARTING SCRIPT");

const run = async () => {
    console.log("Starting Clover Item Check...");
    try {
        const items = await cloverService.getProducts();
        console.log(`Fetched ${items.length} items from Clover.`);

        // Search for "Nic Bar" and "Abt" specifically as mentioned by user
        const missingPhrases = ["Nic Bar", "Abt"];

        const foundItems = items.filter(item => {
            const name = (item.name || "").toLowerCase();
            return missingPhrases.some(phrase => name.includes(phrase.toLowerCase()));
        });

        console.log(`Found ${foundItems.length} matching items:`);
        foundItems.forEach(item => {
            console.log(`--------------------------------------------------`);
            console.log(`Name: ${item.name}`);
            console.log(`ID: ${item.id}`);
            console.log(`Hidden: ${item.hidden}`);
            console.log(`Group ID: ${item.itemGroup?.id}`);
            console.log(`Price: ${item.price}`);

            if (item.attributes) {
                console.log('Attributes:', JSON.stringify(item.attributes));
            }
            if (item.modifierGroups) {
                console.log('Modifier Groups:', JSON.stringify(item.modifierGroups));
            }
        });

    } catch (error) {
        console.error("Error executing script:", error);
    }
};

run();
