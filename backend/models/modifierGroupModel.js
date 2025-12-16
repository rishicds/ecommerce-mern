
import mongoose from "mongoose";

const modifierSchema = new mongoose.Schema({
    id: { type: String }, // Clover Modifier ID
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
});

const modifierGroupSchema = new mongoose.Schema({
    cloverGroupId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    modifiers: [modifierSchema],
    // items: [{ type: String }] // List of item IDs this group applies to?
}, { timestamps: true });

const ModifierGroup = mongoose.models.ModifierGroup || mongoose.model("ModifierGroup", modifierGroupSchema);

export default ModifierGroup;
