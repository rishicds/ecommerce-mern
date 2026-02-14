import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const excelFile = path.join(__dirname, '..', 'final_products_.xlsx');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const updateDescriptions = async () => {
    try {
        const workbook = XLSX.readFile(excelFile);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Helper to get cell value
        const getCellValue = (row, col) => {
            const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
            const cell = sheet[cellAddress];
            return cell ? cell.v : undefined;
        };

        // Find header row and column indices
        const range = XLSX.utils.decode_range(sheet['!ref']);
        let nameCol = -1;
        let descCol = -1;
        let headerRow = -1;

        // Search for headers in the first few rows
        for (let r = range.s.r; r <= Math.min(range.e.r, 5); r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const val = getCellValue(r, c);
                if (typeof val === 'string') {
                    if (val.trim().toLowerCase() === 'product name') nameCol = c;
                    if (val.trim().toLowerCase() === 'product description') descCol = c;
                }
            }
            if (nameCol !== -1 && descCol !== -1) {
                headerRow = r;
                break;
            }
        }

        if (nameCol === -1 || descCol === -1) {
            console.error('Could not find "Product Name" or "product description" columns');
            return;
        }

        console.log(`Found headers at row ${headerRow}: Name column ${nameCol}, Description column ${descCol}`);

        let updatedCount = 0;
        let missedCount = 0;
        let skippedCount = 0;

        // Iterate through rows
        for (let r = headerRow + 1; r <= range.e.r; r++) {
            const name = getCellValue(r, nameCol);
            const description = getCellValue(r, descCol);

            if (!name || !description || typeof description !== 'string' || description.trim() === '') {
                skippedCount++;
                continue;
            }

            const trimmedName = name.trim();
            const trimmedDesc = description.trim();

            // Find product by name
            const product = await Product.findOne({ name: trimmedName });

            if (product) {
                if (product.description !== trimmedDesc) {
                    product.description = trimmedDesc;
                    await product.save();
                    console.log(`✓ Updated: ${trimmedName}`);
                    updatedCount++;
                } else {
                    console.log(`- Skipped (matches): ${trimmedName}`);
                    skippedCount++;
                }
            } else {
                console.log(`! Product not found: ${trimmedName}`);
                missedCount++;
            }
        }

        console.log('\n--- Summary ---');
        console.log(`Updated: ${updatedCount}`);
        console.log(`Product Not Found in DB: ${missedCount}`);
        console.log(`Skipped (empty desc or already matches): ${skippedCount}`);

    } catch (error) {
        console.error('Error updating descriptions:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

const run = async () => {
    console.log('Starting description update from Excel...');
    await connectDB();
    await updateDescriptions();
};

run();
