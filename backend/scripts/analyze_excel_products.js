import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelFile = path.join(__dirname, '..', 'final_products_.xlsx');

try {
    const workbook = XLSX.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Headers:', data[0]);
    console.log('First row:', data[1]);
} catch (error) {
    console.error('Error reading excel file:', error);
}
