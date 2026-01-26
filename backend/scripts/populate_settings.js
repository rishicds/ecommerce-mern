import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import Settings from '../models/settingsModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const updateSettings = async () => {
    await connectDB();

    const slides = [
        // Main Banners
        {
            src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550898/vapee/products/Allo%20Ultra%2025k/alloultra25k_juicymango_1767550896083_3jb7oh.png',
            title: 'Allo Ultra 25k',
            subtitle: 'Juicy Mango - Smart Disposable',
            link: '/product/695aaac08d9bcf65193c3e2d',
            slot: 'banner'
        },
        {
            src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767549764/vapee/products/Flavour%20Bease%20e-%20juice%203mg/flavourbeaseejuice3mg_flavourbeaseejuicewildwhitegrape.png',
            title: 'Flavour Beast',
            subtitle: 'Wild White Grape - Premium',
            link: '/product/695aab458d9bcf65193c3f7c',
            slot: 'banner'
        },
        {
            src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550997/vapee/products/Elfbar%20Prime%201800/elfbarprime1800_grape_1767550997648_z688bk.jpg',
            title: 'Elfbar Prime 1800',
            subtitle: 'Grape - Smooth & Rich',
            link: '/product/695aab298d9bcf65193c3f40',
            slot: 'banner'
        },
        // Grid Section
        {
            src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550709/vapee/products/Abt%20Hybrid/abthybrid_whitegrape_1767550708670_cpgyf8.png',
            title: 'Abt Hybrid',
            subtitle: 'White Grape - Hybrid Nic',
            link: '/product/695aa9f88d9bcf65193c3d3d',
            slot: 'grid'
        },
        {
            src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767551439/vapee/products/Sniper/sniper_sniperpeachice_1767551439874_ul3x2.jpg',
            title: 'Sniper',
            subtitle: 'Peach Ice - 2-in-1 Mode',
            link: '/product/695aac718d9bcf65193c4af3',
            slot: 'grid'
        },
        {
            src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767551170/vapee/products/Fog/fog_dragonfruitstrawberryice_1767551170061_chd8uc.png',
            title: 'Fog',
            subtitle: 'Dragon Fruit Strawberry Ice',
            link: '/product/695aab5e8d9bcf65193c40b7',
            slot: 'grid'
        }
    ];

    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings({ hero: { slides } });
    } else {
        settings.hero.slides = slides;
    }

    await settings.save();
    console.log("Database Settings updated successfully with real products!");
    process.exit();
};

updateSettings();
