import { Router } from 'express';
import { initServer } from '@ts-rest/express';
import { suppliersContract } from '@pharmacy-pos/shared/api/contracts';
import type { ServerInferRequest } from '@ts-rest/core';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import * as suppliersService from './suppliers.service';
import { SupplierServiceError } from './suppliers.service';
import { transformSupplierToResponse } from './suppliers.utils';
import logger from '../../utils/logger';

const server = initServer();

type ListSuppliersRequest = ServerInferRequest<typeof suppliersContract['listSuppliers']>;
type GetSupplierRequest = ServerInferRequest<typeof suppliersContract['getSupplierById']>;
type CreateSupplierRequest = ServerInferRequest<typeof suppliersContract['createSupplier']>;
type UpdateSupplierRequest = ServerInferRequest<typeof suppliersContract['updateSupplier']>;
type DeleteSupplierRequest = ServerInferRequest<typeof suppliersContract['deleteSupplier']>;

type KnownErrorStatus = 400 | 404 | 409 | 500;

function toApiSupplier(supplier: unknown) {
  return transformSupplierToResponse(supplier as any);
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

const implementation = server.router(suppliersContract, {
  listSuppliers: async ({ query }: ListSuppliersRequest) => {
    try {
      const suppliers = await suppliersService.listSuppliers(query ?? {});
      const data = suppliers.map((supplier) => toApiSupplier(supplier));
      return successResponse(200, data, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      return handleError(err, 'Failed to list suppliers');
    }
  },
  getSupplierById: async ({ params }: GetSupplierRequest) => {
    try {
      const supplier = await suppliersService.findSupplierById(params.id);
      if (!supplier) {
        return errorResponse(404, ERROR_MESSAGES.SUPPLIER.NOT_FOUND);
      }
      return successResponse(200, toApiSupplier(supplier), SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      return handleError(err, 'Failed to get supplier');
    }
  },
  createSupplier: async ({ body }: CreateSupplierRequest) => {
    try {
      const supplier = await suppliersService.createSupplier(body);
      return successResponse(200, toApiSupplier(supplier), SUCCESS_MESSAGES.GENERIC.CREATED);
    } catch (err) {
      return handleError(err, 'Failed to create supplier');
    }
  },
  updateSupplier: async ({ params, body }: UpdateSupplierRequest) => {
    try {
      const updated = await suppliersService.updateSupplier(params.id, body);
      if (!updated) {
        return errorResponse(404, ERROR_MESSAGES.SUPPLIER.NOT_FOUND);
      }
      return successResponse(200, toApiSupplier(updated), SUCCESS_MESSAGES.GENERIC.UPDATED);
    } catch (err) {
      return handleError(err, 'Failed to update supplier');
    }
  },
  deleteSupplier: async ({ params }: DeleteSupplierRequest) => {
    try {
      const deleted = await suppliersService.deleteSupplier(params.id);
      if (!deleted) {
        return errorResponse(404, ERROR_MESSAGES.SUPPLIER.NOT_FOUND);
      }
      return successResponse(200, { id: params.id }, SUCCESS_MESSAGES.GENERIC.DELETED);
    } catch (err) {
      return handleError(err, 'Failed to delete supplier');
    }
  },
});

function handleError(error: unknown, logMessage: string) {
  if (error instanceof SupplierServiceError) {
    return errorResponse(mapServiceStatus(error.status), error.message);
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`);
  return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
}

const router: Router = Router();

router.get('/', async (req, res) => {
  const result = await implementation.listSuppliers({ query: req.query } as ListSuppliersRequest);
  res.status(result.status).json(result.body);
});

router.get('/:id', async (req, res) => {
  const result = await implementation.getSupplierById({ params: req.params } as GetSupplierRequest);
  res.status(result.status).json(result.body);
});

router.post('/', async (req, res) => {
  const result = await implementation.createSupplier({ body: req.body } as CreateSupplierRequest);
  res.status(result.status).json(result.body);
});

router.put('/:id', async (req, res) => {
  const result = await implementation.updateSupplier({ params: req.params, body: req.body } as UpdateSupplierRequest);
  res.status(result.status).json(result.body);
});

router.delete('/:id', async (req, res) => {
  const result = await implementation.deleteSupplier({ params: req.params } as DeleteSupplierRequest);
  res.status(result.status).json(result.body);
});

export default router;
