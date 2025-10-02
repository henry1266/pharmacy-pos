import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  quickCreateCustomerSchema,
  customerEntitySchema,
} from '../../schemas/zod/customer';
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common';
import { zodId } from '../../utils/zodUtils';

const c = initContract();

const customerIdParamsSchema = z.object({
  id: zodId,
});

const customerResponseSchema = createApiResponseSchema(customerEntitySchema);
const customerListResponseSchema = createApiResponseSchema(z.array(customerEntitySchema));
const customerDeleteResponseSchema = createApiResponseSchema(z.object({ id: zodId }));
const customerQuickCreateResponseSchema = createApiResponseSchema(z.object({
  customer: customerEntitySchema,
  created: z.boolean(),
}));

export const customersContract = c.router({
  listCustomers: {
    method: 'GET',
    path: '/customers',
    query: customerSearchSchema.optional(),
    responses: {
      200: customerListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List customers',
      description: 'Retrieve customers with optional search criteria',
      tags: ['Customers'],
    },
  },
  getCustomerById: {
    method: 'GET',
    path: '/customers/:id',
    pathParams: customerIdParamsSchema,
    responses: {
      200: customerResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get customer detail',
      tags: ['Customers'],
    },
  },
  createCustomer: {
    method: 'POST',
    path: '/customers',
    body: createCustomerSchema,
    responses: {
      200: customerResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create customer',
      tags: ['Customers'],
    },
  },
  updateCustomer: {
    method: 'PUT',
    path: '/customers/:id',
    pathParams: customerIdParamsSchema,
    body: updateCustomerSchema,
    responses: {
      200: customerResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update customer',
      tags: ['Customers'],
    },
  },
  deleteCustomer: {
    method: 'DELETE',
    path: '/customers/:id',
    pathParams: customerIdParamsSchema,
    responses: {
      200: customerDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete customer',
      tags: ['Customers'],
    },
  },
  quickCreateCustomer: {
    method: 'POST',
    path: '/customers/quick',
    body: quickCreateCustomerSchema,
    responses: {
      200: customerQuickCreateResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Quick create or update customer by ID card',
      tags: ['Customers'],
    },
  },
});

export type CustomersContract = typeof customersContract;
