import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    size: { type: String, required: true }, // e.g., "10ml", "20ml", "30ml"
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    cloverItemId: { type: String }, // Link variant to specific clover item
    sku: { type: String }
});

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    // External ID from Clover (if synced)
    externalCloverId: { type: String, index: true, sparse: true },
    cloverItemGroupId: { type: String, index: true, sparse: true }, // ID of the item group if this product represents a group
    name: { type: String, required: true },
    // Support multiple categories per product
    categories: { type: [String], default: [] },
    flavour: { type: String, default: "" },
    variants: [variantSchema],
    description: { type: String, required: false },
    // Inventory
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, required: true, default: 0 }, // Number of units available
    images: [
        {
            url: { type: String, required: true },
            public_id: { type: String }
        }
    ],
    price: { type: Number, required: true }, // Base price
    showOnPOS: { type: Boolean, default: true }, // Visibility on Clover POS
    otherFlavours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    bestseller: { type: Boolean, default: false },
    sweetnessLevel: { type: Number, min: 0, max: 10, default: 5 },
    mintLevel: { type: Number, min: 0, max: 10, default: 0 },
    modifierGroups: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Store modifier groups data
    taxRates: { type: [mongoose.Schema.Types.Mixed], default: [] } // Store tax rates data
}, { timestamps: true }); // Auto createdAt and updatedAt

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
