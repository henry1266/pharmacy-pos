import { Router } from 'express';
import { initServer } from '@ts-rest/express';
import { customersContract } from '@pharmacy-pos/shared/api/contracts';
import type { ServerInferRequest } from '@ts-rest/core';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import * as customersService from './customers.service';
import { CustomerServiceError } from './customers.service';
import { transformCustomerToResponse } from './customers.utils';
import logger from '../../utils/logger';

const server = initServer();

type ListCustomersRequest = ServerInferRequest<typeof customersContract['listCustomers']>;
type GetCustomerRequest = ServerInferRequest<typeof customersContract['getCustomerById']>;
type CreateCustomerRequest = ServerInferRequest<typeof customersContract['createCustomer']>;
type UpdateCustomerRequest = ServerInferRequest<typeof customersContract['updateCustomer']>;
type DeleteCustomerRequest = ServerInferRequest<typeof customersContract['deleteCustomer']>;
type QuickCreateCustomerRequest = ServerInferRequest<typeof customersContract['quickCreateCustomer']>;

type KnownErrorStatus = 400 | 404 | 409 | 500;

function toApiCustomer(customer: unknown) {
  return transformCustomerToResponse(customer as any);
}

function successResponse(status: number, data: unknown, message: string) {
  return {
    status,
    body: {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  } as any;
}

function errorResponse(status: KnownErrorStatus, message: string) {
  return {
    status,
    body: {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
  } as any;
}

function mapServiceStatus(status: number): KnownErrorStatus {
  if (status === 404) return 404;
  if (status === 400) return 400;
  if (status === 409) return 409;
  return 500;
}

const implementation = server.router(customersContract, {
  listCustomers: async (_req: ListCustomersRequest) => {
    try {
      const customers = await customersService.listCustomers();
      const data = customersService.mapCustomersToResponse(customers);
      return successResponse(200, data, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      return handleError(err, 'Failed to list customers');
    }
  },
  getCustomerById: async ({ params }: GetCustomerRequest) => {
    try {
      const customer = await customersService.findCustomerById(params.id);
      if (!customer) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }
      return successResponse(200, toApiCustomer(customer), SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      return handleError(err, 'Failed to get customer');
    }
  },
  createCustomer: async ({ body }: CreateCustomerRequest) => {
    try {
      const customer = await customersService.createCustomer(body);
      return successResponse(200, toApiCustomer(customer), SUCCESS_MESSAGES.GENERIC.CREATED);
    } catch (err) {
      return handleError(err, 'Failed to create customer');
    }
  },
  updateCustomer: async ({ params, body }: UpdateCustomerRequest) => {
    try {
      const updated = await customersService.updateCustomer(params.id, body);
      if (!updated) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }
      return successResponse(200, toApiCustomer(updated), SUCCESS_MESSAGES.GENERIC.UPDATED);
    } catch (err) {
      return handleError(err, 'Failed to update customer');
    }
  },
  deleteCustomer: async ({ params }: DeleteCustomerRequest) => {
    try {
      const deleted = await customersService.deleteCustomer(params.id);
      if (!deleted) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }
      return successResponse(200, { id: params.id }, SUCCESS_MESSAGES.GENERIC.DELETED);
    } catch (err) {
      return handleError(err, 'Failed to delete customer');
    }
  },
  quickCreateCustomer: async ({ body }: QuickCreateCustomerRequest) => {
    try {
      const result = await customersService.upsertCustomerByIdCard(body);
      const message = result.created ? SUCCESS_MESSAGES.GENERIC.CREATED : SUCCESS_MESSAGES.GENERIC.UPDATED;
      return successResponse(200, {
        customer: toApiCustomer(result.customer),
        created: result.created,
      }, message);
    } catch (err) {
      return handleError(err, 'Failed to upsert customer');
    }
  },
});

function handleError(error: unknown, logMessage: string) {
  if (error instanceof CustomerServiceError) {
    return errorResponse(mapServiceStatus(error.status), error.message);
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`);
  return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
}

const router: Router = Router();

router.get('/', async (req, res) => {
  const result = await implementation.listCustomers({ query: req.query } as ListCustomersRequest);
  res.status(result.status).json(result.body);
});

router.post('/quick', async (req, res) => {
  const result = await implementation.quickCreateCustomer({ body: req.body } as QuickCreateCustomerRequest);
  res.status(result.status).json(result.body);
});

router.get('/:id', async (req, res) => {
  const result = await implementation.getCustomerById({ params: req.params } as GetCustomerRequest);
  res.status(result.status).json(result.body);
});

router.post('/', async (req, res) => {
  const result = await implementation.createCustomer({ body: req.body } as CreateCustomerRequest);
  res.status(result.status).json(result.body);
});

router.put('/:id', async (req, res) => {
  const result = await implementation.updateCustomer({ params: req.params, body: req.body } as UpdateCustomerRequest);
  res.status(result.status).json(result.body);
});

router.delete('/:id', async (req, res) => {
  const result = await implementation.deleteCustomer({ params: req.params } as DeleteCustomerRequest);
  res.status(result.status).json(result.body);
});

export default router;
