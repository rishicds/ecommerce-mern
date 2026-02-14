import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_DIR = path.join(__dirname, '../public/products');

const FOLDERS = {
    'Flavour Beast e-juice Classic': 'Flavour Beast Juice',
    'Flavour Beast e-juice Craving': 'Flavour Beast Cravin Juice',
    'Flavour Beast e-juice Unleashed': 'Flavour Beast Unleashed Juice',
    'Flavour Beast e-juice Flavourless': 'Flavour Beast Flavourless Juice'
};

const processFolder = (folderName, newPrefix) => {
    const dirPath = path.join(PRODUCTS_DIR, folderName);

    if (!fs.existsSync(dirPath)) {
        console.log(`Folder not found: ${folderName}`);
        return;
    }

    const files = fs.readdirSync(dirPath);
    let count = 0;

    files.forEach(file => {
        // Target specifically "Flavour Beast e-juice"
        if (file.endsWith('.png') && file.includes('Flavour Beast e-juice')) {
            const newName = file.replace('Flavour Beast e-juice', newPrefix);

            if (newName !== file) {
                const oldPath = path.join(dirPath, file);
                const newPath = path.join(dirPath, newName);
                try {
                    fs.renameSync(oldPath, newPath);
                    console.log(`Renamed: ${file} -> ${newName}`);
                    count++;
                } catch (err) {
                    console.error(`Error renaming ${file}:`, err);
                }
            }
        }
    });
    console.log(`Finished ${folderName}: ${count} files renamed.`);
};

console.log('Starting file renaming...');
Object.entries(FOLDERS).forEach(([folder, prefix]) => processFolder(folder, prefix));
console.log('Done.');
