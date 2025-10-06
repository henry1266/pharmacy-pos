import { Router } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import type { ServerInferRequest, ServerInferResponseBody } from '@ts-rest/core';
import { suppliersContract } from '@pharmacy-pos/shared/api/contracts';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../utils/logger';
import * as suppliersService from './suppliers.service';
import { SupplierServiceError } from './suppliers.service';
import { mapSuppliersToResponse, transformSupplierToResponse } from './suppliers.utils';
import { createValidationErrorHandler } from '../common/tsRest';

type ListSuppliersRequest = ServerInferRequest<typeof suppliersContract['listSuppliers']>;
type GetSupplierRequest = ServerInferRequest<typeof suppliersContract['getSupplierById']>;
type CreateSupplierRequest = ServerInferRequest<typeof suppliersContract['createSupplier']>;
type UpdateSupplierRequest = ServerInferRequest<typeof suppliersContract['updateSupplier']>;
type DeleteSupplierRequest = ServerInferRequest<typeof suppliersContract['deleteSupplier']>;

const server = initServer();

const implementation = server.router(suppliersContract, {
  listSuppliers: async ({ query }: ListSuppliersRequest) => {
    try {
      const suppliers = await suppliersService.listSuppliers(query ?? {});
      const body: ServerInferResponseBody<typeof suppliersContract['listSuppliers'], 200> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
        data: mapSuppliersToResponse(suppliers),
        timestamp: new Date().toISOString(),
      };
      return { status: 200, body } as const;
    } catch (error) {
      logger.error(`Failed to list suppliers: ${error instanceof Error ? error.message : String(error)}`);
      const body: ServerInferResponseBody<typeof suppliersContract['listSuppliers'], 500> = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      return { status: 500, body } as const;
    }
  },
  getSupplierById: async ({ params }: GetSupplierRequest) => {
    try {
      const supplier = await suppliersService.findSupplierById(params.id);
      if (!supplier) {
        const body: ServerInferResponseBody<typeof suppliersContract['getSupplierById'], 404> = {
          success: false,
          message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        };
        return { status: 404 as const, body };
      }
      const body: ServerInferResponseBody<typeof suppliersContract['getSupplierById'], 200> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
        data: transformSupplierToResponse(supplier),
        timestamp: new Date().toISOString(),
      };
      return { status: 200, body } as const;
    } catch (error) {
      if (error instanceof SupplierServiceError && error.status === 404) {
        const body: ServerInferResponseBody<typeof suppliersContract['getSupplierById'], 404> = {
          success: false,
          message: error.message,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        };
        return { status: 404 as const, body };
      }
      logger.error(`Failed to get supplier: ${error instanceof Error ? error.message : String(error)}`);
      const body: ServerInferResponseBody<typeof suppliersContract['getSupplierById'], 500> = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      return { status: 500 as const, body };
    }
  },
  createSupplier: async ({ body }: CreateSupplierRequest) => {
    try {
      const supplier = await suppliersService.createSupplier(body);
      const responseBody: ServerInferResponseBody<typeof suppliersContract['createSupplier'], 200> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.CREATED,
        data: transformSupplierToResponse(supplier),
        timestamp: new Date().toISOString(),
      };
      return { status: 200, body: responseBody } as const;
    } catch (error) {
      if (error instanceof SupplierServiceError) {
        if (error.status === 400) {
          const errorBody: ServerInferResponseBody<typeof suppliersContract['createSupplier'], 400> = {
            success: false,
            message: error.message,
            statusCode: 400,
            timestamp: new Date().toISOString(),
          };
          return { status: 400 as const, body: errorBody };
        }

      }
      logger.error(`Failed to create supplier: ${error instanceof Error ? error.message : String(error)}`);
      const errorBody: ServerInferResponseBody<typeof suppliersContract['createSupplier'], 500> = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      return { status: 500 as const, body: errorBody };
    }
  },
  updateSupplier: async ({ params, body }: UpdateSupplierRequest) => {
    try {
      const updated = await suppliersService.updateSupplier(params.id, body);
      if (!updated) {
        const errorBody: ServerInferResponseBody<typeof suppliersContract['updateSupplier'], 404> = {
          success: false,
          message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        };
        return { status: 404 as const, body: errorBody };
      }
      const responseBody: ServerInferResponseBody<typeof suppliersContract['updateSupplier'], 200> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.UPDATED,
        data: transformSupplierToResponse(updated),
        timestamp: new Date().toISOString(),
      };
      return { status: 200, body: responseBody } as const;
    } catch (error) {
      if (error instanceof SupplierServiceError) {
        if (error.status === 400) {
          const errorBody: ServerInferResponseBody<typeof suppliersContract['updateSupplier'], 400> = {
            success: false,
            message: error.message,
            statusCode: 400,
            timestamp: new Date().toISOString(),
          };
          return { status: 400 as const, body: errorBody };
        }

        if (error.status === 404) {
          const errorBody: ServerInferResponseBody<typeof suppliersContract['updateSupplier'], 404> = {
            success: false,
            message: error.message,
            statusCode: 404,
            timestamp: new Date().toISOString(),
          };
          return { status: 404 as const, body: errorBody };
        }

      }
      logger.error(`Failed to update supplier: ${error instanceof Error ? error.message : String(error)}`);
      const errorBody: ServerInferResponseBody<typeof suppliersContract['updateSupplier'], 500> = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      return { status: 500 as const, body: errorBody };
    }
  },
  deleteSupplier: async ({ params }: DeleteSupplierRequest) => {
    try {
      const deleted = await suppliersService.deleteSupplier(params.id);
      if (!deleted) {
        const errorBody: ServerInferResponseBody<typeof suppliersContract['deleteSupplier'], 404> = {
          success: false,
          message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        };
        return { status: 404 as const, body: errorBody };
      }
      const responseBody: ServerInferResponseBody<typeof suppliersContract['deleteSupplier'], 200> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.DELETED,
        data: { id: params.id },
        timestamp: new Date().toISOString(),
      };
      return { status: 200, body: responseBody } as const;
    } catch (error) {
      if (error instanceof SupplierServiceError && error.status === 404) {
        const errorBody: ServerInferResponseBody<typeof suppliersContract['deleteSupplier'], 404> = {
          success: false,
          message: error.message,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        };
        return { status: 404 as const, body: errorBody };
      }
      logger.error(`Failed to delete supplier: ${error instanceof Error ? error.message : String(error)}`);
      const errorBody: ServerInferResponseBody<typeof suppliersContract['deleteSupplier'], 500> = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      return { status: 500 as const, body: errorBody };
    }
  },
});

const router: Router = Router();

createExpressEndpoints(suppliersContract, implementation, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: 400,
    pathParamStatus: 404,
  }),
});

export default router;


