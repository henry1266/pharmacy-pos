import { Router } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import type { ServerInferRequest } from '@ts-rest/core';
import { supplierAccountMappingsContract } from '@pharmacy-pos/shared/api/contracts';
import { API_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { createValidationErrorHandler } from '../common/tsRest';
import logger from '../../utils/logger';
import {
  listSupplierAccountMappings,
  getSupplierAccountMappingBySupplier,
  getSupplierAccountMappingById,
  createSupplierAccountMapping,
  updateSupplierAccountMapping,
  deleteSupplierAccountMapping,
  SupplierAccountMappingsServiceError,
} from './supplierAccountMappings.service';

type ListMappingsRequest = ServerInferRequest<typeof supplierAccountMappingsContract['listMappings']>;
type GetMappingBySupplierRequest = ServerInferRequest<typeof supplierAccountMappingsContract['getMappingBySupplier']>;
type GetMappingByIdRequest = ServerInferRequest<typeof supplierAccountMappingsContract['getMappingById']>;
type CreateMappingRequest = ServerInferRequest<typeof supplierAccountMappingsContract['createMapping']>;
type UpdateMappingRequest = ServerInferRequest<typeof supplierAccountMappingsContract['updateMapping']>;
type DeleteMappingRequest = ServerInferRequest<typeof supplierAccountMappingsContract['deleteMapping']>;

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

const successResponse = <TStatus extends number, TData>(
  status: TStatus,
  data: TData,
  message: SuccessMessage | string,
): { status: TStatus; body: SuccessBody<TData> } => ({
  status,
  body: {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  },
});

const errorResponse = <TStatus extends KnownErrorStatus>(
  status: TStatus,
  message: string,
): { status: TStatus; body: ErrorBody } => ({
  status,
  body: {
    success: false,
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
  },
});

const mapServiceStatus = (status: number): KnownErrorStatus => {
  if (status === API_CONSTANTS.HTTP_STATUS.NOT_FOUND || status === 404) {
    return API_CONSTANTS.HTTP_STATUS.NOT_FOUND as KnownErrorStatus;
  }
  if (status === API_CONSTANTS.HTTP_STATUS.BAD_REQUEST || status === 400) {
    return API_CONSTANTS.HTTP_STATUS.BAD_REQUEST as KnownErrorStatus;
  }
  return API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR as KnownErrorStatus;
};

const implementation = server.router(supplierAccountMappingsContract, {
  listMappings: async ({ query }: ListMappingsRequest) => {
    try {
      const mappings = await listSupplierAccountMappings(query ?? {});
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        mappings,
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      );
    } catch (error) {
      if (error instanceof SupplierAccountMappingsServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }
      logger.error(`Failed to list supplier account mappings: ${String(error)}`);
      return errorResponse(
        API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      );
    }
  },
  getMappingBySupplier: async ({ params, query }: GetMappingBySupplierRequest) => {
    try {
      const mapping = await getSupplierAccountMappingBySupplier(params.supplierId, query ?? {});
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        mapping,
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      );
    } catch (error) {
      if (error instanceof SupplierAccountMappingsServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }
      logger.error(`Failed to get supplier account mapping by supplier: ${String(error)}`);
      return errorResponse(
        API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      );
    }
  },
  getMappingById: async ({ params }: GetMappingByIdRequest) => {
    try {
      const mapping = await getSupplierAccountMappingById(params.id);
      if (!mapping) {
        return errorResponse(API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }

      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        mapping,
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      );
    } catch (error) {
      if (error instanceof SupplierAccountMappingsServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }
      logger.error(`Failed to get supplier account mapping: ${String(error)}`);
      return errorResponse(
        API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      );
    }
  },
  createMapping: async ({ body }: CreateMappingRequest) => {
    try {
      const created = await createSupplierAccountMapping(body);
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.CREATED,
        created,
        SUCCESS_MESSAGES.GENERIC.CREATED ?? 'Created',
      );
    } catch (error) {
      if (error instanceof SupplierAccountMappingsServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }
      logger.error(`Failed to create supplier account mapping: ${String(error)}`);
      return errorResponse(
        API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      );
    }
  },
  updateMapping: async ({ params, body }: UpdateMappingRequest) => {
    try {
      const updated = await updateSupplierAccountMapping(params.id, body);
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        updated,
        SUCCESS_MESSAGES.GENERIC.UPDATED ?? 'Updated',
      );
    } catch (error) {
      if (error instanceof SupplierAccountMappingsServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }
      logger.error(`Failed to update supplier account mapping: ${String(error)}`);
      return errorResponse(
        API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      );
    }
  },
  deleteMapping: async ({ params }: DeleteMappingRequest) => {
    try {
      await deleteSupplierAccountMapping(params.id);
      return successResponse(
        API_CONSTANTS.HTTP_STATUS.OK,
        null,
        SUCCESS_MESSAGES.GENERIC.DELETED ?? 'Deleted',
      );
    } catch (error) {
      if (error instanceof SupplierAccountMappingsServiceError) {
        return errorResponse(mapServiceStatus(error.status), error.message);
      }
      logger.error(`Failed to delete supplier account mapping: ${String(error)}`);
      return errorResponse(
        API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      );
    }
  },
});

const router: Router = Router();

createExpressEndpoints(supplierAccountMappingsContract, implementation, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    pathParamStatus: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
  }),
});

export default router;
