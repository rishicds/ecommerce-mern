
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
    const data = xlsx.utils.sheet_to_json(sheet); // Get all data to inspect relationships

    console.log("Headers:", Object.keys(data[0] || {}));
    console.log("First 3 rows:", data.slice(0, 3));

    // Check for grouping indicators
    console.log("\nPossible grouping columns analysis:");
    const sample = data.slice(0, 5);
    sample.forEach(row => {
        console.log(`Name: ${row['Name']}, Item Group: ${row['Item Group'] || 'N/A'}, Price: ${row['Price']}, Stock: ${row['Quantity']}`);
    });

} catch (err) {
    console.error("Error reading excel:", err);
}
