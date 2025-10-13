import { Router } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import type { ServerInferRequest } from '@ts-rest/core';
import { suppliersContract } from '@pharmacy-pos/shared/api/contracts';
import { API_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
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

type SuccessMessage = typeof SUCCESS_MESSAGES.GENERIC[keyof typeof SUCCESS_MESSAGES.GENERIC];

type SuccessBody<TData> = {
  success: true;
  message: SuccessMessage | string;
  data: TData;
  timestamp: string;
};

type ErrorBody = {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
};

type KnownErrorStatus = 400 | 404 | 500;

const mapServiceStatus = (status: number): KnownErrorStatus => {
  if (status === API_CONSTANTS.HTTP_STATUS.NOT_FOUND || status === 404) {
    return API_CONSTANTS.HTTP_STATUS.NOT_FOUND as KnownErrorStatus;
  }
  if (status === API_CONSTANTS.HTTP_STATUS.BAD_REQUEST || status === 400) {
    return API_CONSTANTS.HTTP_STATUS.BAD_REQUEST as KnownErrorStatus;
  }
  return API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR as KnownErrorStatus;
};

function successResponse<TStatus extends number, TData>(
  status: TStatus,
  data: TData,
  message: SuccessMessage | string,
): { status: TStatus; body: SuccessBody<TData>; } {
  return {
    status,
    body: {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  };
}

function errorResponse<TStatus extends KnownErrorStatus>(
  status: TStatus,
  message: string,
): { status: TStatus; body: ErrorBody; } {
  return {
    status,
    body: {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
  };
}

const toApiSupplier = (record: unknown) => transformSupplierToResponse(record as any);

const implementation = server.router(suppliersContract, {
  listSuppliers: async ({ query }: ListSuppliersRequest) => {
    try {
      const suppliers = await suppliersService.listSuppliers(query ?? {});
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        mapSuppliersToResponse(suppliers),
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      );
    } catch (error) {
      logger.error(`Failed to list suppliers: ${error instanceof Error ? error.message : String(error)}`);
      return errorResponse(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },
  getSupplierById: async ({ params }: GetSupplierRequest) => {
    try {
      const supplier = await suppliersService.findSupplierById(params.id);
      if (!supplier) {
        return errorResponse(API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SUPPLIER.NOT_FOUND);
      }

      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        toApiSupplier(supplier),
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      );
    } catch (error) {
      if (error instanceof SupplierServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }

      logger.error(`Failed to get supplier: ${error instanceof Error ? error.message : String(error)}`);
      return errorResponse(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },
  createSupplier: async ({ body }: CreateSupplierRequest) => {
    try {
      const supplier = await suppliersService.createSupplier(body);
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        toApiSupplier(supplier),
        SUCCESS_MESSAGES.GENERIC.CREATED ?? 'Created',
      );
    } catch (error) {
      if (error instanceof SupplierServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }

      logger.error(`Failed to create supplier: ${error instanceof Error ? error.message : String(error)}`);
      return errorResponse(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },
  updateSupplier: async ({ params, body }: UpdateSupplierRequest) => {
    try {
      const updated = await suppliersService.updateSupplier(params.id, body);
      if (!updated) {
        return errorResponse(API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SUPPLIER.NOT_FOUND);
      }

      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        toApiSupplier(updated),
        SUCCESS_MESSAGES.GENERIC.UPDATED ?? 'Updated',
      );
    } catch (error) {
      if (error instanceof SupplierServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }

      logger.error(`Failed to update supplier: ${error instanceof Error ? error.message : String(error)}`);
      return errorResponse(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },
  deleteSupplier: async ({ params }: DeleteSupplierRequest) => {
    try {
      const deleted = await suppliersService.deleteSupplier(params.id);
      if (!deleted) {
        return errorResponse(API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SUPPLIER.NOT_FOUND);
      }

      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        { id: params.id },
        SUCCESS_MESSAGES.GENERIC.DELETED ?? 'Deleted',
      );
    } catch (error) {
      if (error instanceof SupplierServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }

      logger.error(`Failed to delete supplier: ${error instanceof Error ? error.message : String(error)}`);
      return errorResponse(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },
});

const router: Router = Router();

createExpressEndpoints(suppliersContract, implementation, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    pathParamStatus: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
  }),
});

export default router;


