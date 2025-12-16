
import mongoose from "mongoose";

const itemGroupSchema = new mongoose.Schema({
    cloverGroupId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    attributes: [{ type: String }], // e.g. ["Size", "Color"]
}, { timestamps: true });

const ItemGroup = mongoose.models.ItemGroup || mongoose.model("ItemGroup", itemGroupSchema);

export default ItemGroup;
