import Joi from "joi";
import { productSchema } from "../validation/productValidation.js";

const testValidation = (payload) => {
    console.log('--- Testing Payload ---');
    console.log(JSON.stringify(payload, null, 2));
    const { error, value } = productSchema.validate(payload, { abortEarly: false });
    if (error) {
        console.error('Validation FAILED:', error.details.map(d => d.message));
    } else {
        console.log('Validation PASSED');
    }
};

// 1. Valid Stringified Array
testValidation({
    productId: "TEST-001",
    name: "Test Product",
    price: 10,
    stockCount: 100,
    variants: JSON.stringify([{ size: "10ml", price: 10, quantity: 10 }])
});

// 2. Invalid Stringified Array (Missing required field in variant)
testValidation({
    productId: "TEST-002",
    name: "Test Product",
    price: 10,
    stockCount: 100,
    variants: JSON.stringify([{ size: "10ml", price: 10 }]) // Missing quantity
});

// 3. Empty Array String
testValidation({
    productId: "TEST-003",
    name: "Test Product",
    price: 10,
    stockCount: 100,
    variants: "[]"
});

// 4. Random String (Should pass Joi.string() unless there is hidden constraints?)
testValidation({
    productId: "TEST-004",
    name: "Test Product",
    price: 10,
    stockCount: 100,
    variants: "some random string"
});

// 5. Actual Array (if parsed)
testValidation({
    productId: "TEST-005",
    name: "Test Product",
    price: 10,
    stockCount: 100,
    variants: [{ size: "10ml", price: 10, quantity: 10 }]
});

testValidation({
    productId: "TEST-006",
    name: "Test Product",
    price: 10,
    stockCount: 100,
    variants: [{ size: "10ml", price: 10, quantity: 10, image: null }]
});
