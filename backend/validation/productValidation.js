import Joi from "joi";

const variantSchema = Joi.object({
    size: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().min(0).required(),
    flavour: Joi.string().allow('', null).optional(),
    sku: Joi.string().allow('', null).optional(),
    image: Joi.string().allow('', null).optional(),
    cloverItemId: Joi.string().allow('', null).optional()
}).unknown(true);

export const productSchema = Joi.object({
    productId: Joi.string().required(),
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).optional().allow(''),
    price: Joi.number().positive().required(),
    // allow multiple categories (array) or single category string
    categories: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
    ).optional(),
    flavour: Joi.string().allow("").optional(),
    variants: Joi.alternatives()
        .try(
            Joi.array().items(variantSchema),
            Joi.string() // if stringified from frontend
        )
        .optional(),
    // Inventory fields
    inStock: Joi.boolean().truthy("true").falsy("false").default(true),
    stockCount: Joi.number().integer().min(0).required(),
    showOnPOS: Joi.boolean().truthy("true").falsy("false").default(true),
    otherFlavours: Joi.alternatives()
        .try(
            Joi.array().items(Joi.string()),
            Joi.string()
        )
        .optional(),
    bestseller: Joi.boolean().truthy("true").falsy("false").default(false),
    sweetnessLevel: Joi.number().integer().min(0).max(10).default(5),
    mintLevel: Joi.number().integer().min(0).max(10).default(0),
});
