import express from 'express';
import { addProduct, listProducts, removeProduct, singleProduct, updateProduct, deleteProducts, downloadTemplate, importProducts, exportProducts, clearDatabase } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import multer from 'multer';
import { verifyAdmin } from '../middleware/authMiddleware.js';


// Specific multer for excel import (memory storage to access buffer)
const uploadImport = multer({ storage: multer.memoryStorage() });

const productRouter = express.Router();

productRouter.post(
    '/add', verifyAdmin,
    upload.any(),
    addProduct
);

productRouter.get('/template', verifyAdmin, downloadTemplate);
productRouter.get('/export', verifyAdmin, exportProducts);
productRouter.post('/import', verifyAdmin, uploadImport.single('file'), importProducts);

productRouter.get('/list', listProducts);
productRouter.delete('/remove/:id', verifyAdmin, removeProduct);
productRouter.post('/delete-many', verifyAdmin, deleteProducts);
productRouter.delete('/clear-database', verifyAdmin, clearDatabase);
productRouter.get('/single/:id', singleProduct);
productRouter.put(
    '/update/:id', verifyAdmin,
    upload.any(),
    updateProduct
);

// Error handling middleware for Multer
productRouter.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
    next();
})

export default productRouter;