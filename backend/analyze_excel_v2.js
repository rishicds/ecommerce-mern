
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'inventory-export (1).xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // raw: false ensures we get formatted strings, but might hide keys. 
    // Let's use header: 1 to get array of arrays for headers
    const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
    console.log("EXCEL HEADERS:", headers);

    const data = xlsx.utils.sheet_to_json(sheet);

    // Find a row with Item Group ID
    const groupedItem = data.find(r => r['Item Group ID'] || r['Item Group']);
    if (groupedItem) {
        console.log("Sample Grouped Item:", JSON.stringify(groupedItem, null, 2));
    } else {
        console.log("No grouped items found in sample.");
    }

} catch (err) {
    console.error("Error reading excel:", err);
}
