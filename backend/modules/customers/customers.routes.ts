
import express from 'express';
import * as customersController from './customers.controller';
import { validateCustomerPayload } from './middlewares/validateCustomerPayload';
import { validateCustomerQuery } from './middlewares/validateCustomerQuery';
import { validateObjectId } from './middlewares/validateObjectId';

const router: express.Router = express.Router();

// Customer routes (documentation driven by openapi/openapi.json)
router.get('/', validateCustomerQuery(), customersController.listCustomers);
router.get('/:id', validateObjectId(), customersController.getCustomerById);
router.post('/', validateCustomerPayload('create'), customersController.createCustomer);
router.put('/:id', validateObjectId(), validateCustomerPayload('update'), customersController.updateCustomer);
router.delete('/:id', validateObjectId(), customersController.deleteCustomer);

export default router;
