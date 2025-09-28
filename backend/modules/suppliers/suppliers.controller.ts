import { Request, Response } from 'express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../utils/logger';
import * as suppliersService from './suppliers.service';
import {
  buildSuccessResponse,
  buildErrorResponse,
  transformSupplierToResponse,
  mapSuppliersToResponse
} from './suppliers.utils';
import type {
  SupplierCreateInput,
  SupplierUpdateInput,
  SupplierQueryInput
} from './suppliers.types';

export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const query = req.query as SupplierQueryInput;
    const suppliers = await suppliersService.listSuppliers(query);
    res.json(buildSuccessResponse('Suppliers retrieved successfully', mapSuppliersToResponse(suppliers)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to list suppliers');
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const supplier = await suppliersService.findSupplierById(req.params.id);
    if (!supplier) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
        .json(buildErrorResponse(ERROR_MESSAGES.SUPPLIER.NOT_FOUND));
      return;
    }

    res.json(buildSuccessResponse('Supplier retrieved successfully', transformSupplierToResponse(supplier)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to retrieve supplier');
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const payload = req.body as SupplierCreateInput;
    const supplier = await suppliersService.createSupplier(payload);
    res.json(buildSuccessResponse('Supplier created successfully', transformSupplierToResponse(supplier)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to create supplier');
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const payload = req.body as SupplierUpdateInput;
    const updated = await suppliersService.updateSupplier(req.params.id, payload);

    if (!updated) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
        .json(buildErrorResponse(ERROR_MESSAGES.SUPPLIER.NOT_FOUND));
      return;
    }

    res.json(buildSuccessResponse('Supplier updated successfully', transformSupplierToResponse(updated)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to update supplier');
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const deleted = await suppliersService.deleteSupplier(req.params.id);
    if (!deleted) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
        .json(buildErrorResponse(ERROR_MESSAGES.SUPPLIER.NOT_FOUND));
      return;
    }

    res.json(buildSuccessResponse('Supplier deleted successfully', null));
  } catch (error) {
    handleControllerError(error, res, 'Failed to delete supplier');
  }
};

function handleControllerError(error: unknown, res: Response, logMessage: string): void {
  if (error instanceof suppliersService.SupplierServiceError) {
    res.status(error.status).json(buildErrorResponse(error.message));
    return;
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`);
  res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(buildErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
}
