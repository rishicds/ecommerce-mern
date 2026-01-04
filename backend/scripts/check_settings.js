import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Settings from '../models/settingsModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const checkSettings = async () => {
    await connectDB();
    const settings = await Settings.findOne();
    if (settings) {
        console.log("Current Hero Slides:");
        console.log(JSON.stringify(settings.hero.slides, null, 2));
    } else {
        console.log("No settings found in DB.");
    }
    process.exit();
};

checkSettings();
