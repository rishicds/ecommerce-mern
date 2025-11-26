import mongoose from 'mongoose';

const NavItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  href: { type: String, required: true }
}, { _id: false });

const SlideSchema = new mongoose.Schema({
  src: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  slot: { type: String, enum: ['banner', 'grid'], default: 'banner' }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  navbar: { type: [NavItemSchema], default: [] },
  hero: {
    slides: { type: [SlideSchema], default: [] }
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', SettingsSchema);
export default Settings;
