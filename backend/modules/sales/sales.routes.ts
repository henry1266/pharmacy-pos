import express from 'express';
import * as salesController from './sales.controller';
import { validateSale } from './middlewares/validateSale';
import { validateObjectId } from './middlewares/validateObjectId';
import { validateSaleQuery } from './middlewares/validateSaleQuery';

const router: express.Router = express.Router();

// Sales routes (API docs generated from openapi/openapi.json)

// List sales with optional wildcard/search query
router.get('/', validateSaleQuery(), salesController.getAllSales);

// Today's sales
router.get('/today', salesController.getTodaySales);

// Create a sale
router.post('/', validateSale('create'), salesController.createSale);

// Get sale by ID
router.get('/:id', validateObjectId(), salesController.getSaleById);

// Update a sale
router.put('/:id', validateObjectId(), validateSale('update'), salesController.updateSale);

// Delete a sale
router.delete('/:id', validateObjectId(), salesController.deleteSale);

export default router;

