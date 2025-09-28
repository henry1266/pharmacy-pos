import express from 'express';
import * as suppliersController from './suppliers.controller';
import { validateSupplierPayload } from './middlewares/validateSupplierPayload';
import { validateSupplierQuery } from './middlewares/validateSupplierQuery';
import { validateObjectId } from './middlewares/validateObjectId';

const router: express.Router = express.Router();

/**
 * @openapi
 * /suppliers:
 *   get:
 *     summary: List suppliers
 *     tags: [Suppliers]
 *   post:
 *     summary: Create a supplier
 *     tags: [Suppliers]
 */
router.get('/', validateSupplierQuery(), suppliersController.listSuppliers);
router.post('/', validateSupplierPayload('create'), suppliersController.createSupplier);

/**
 * @openapi
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *   put:
 *     summary: Update a supplier
 *     tags: [Suppliers]
 *   delete:
 *     summary: Delete a supplier
 *     tags: [Suppliers]
 */
router.get('/:id', validateObjectId(), suppliersController.getSupplierById);
router.put('/:id', validateObjectId(), validateSupplierPayload('update'), suppliersController.updateSupplier);
router.delete('/:id', validateObjectId(), suppliersController.deleteSupplier);

export default router;
