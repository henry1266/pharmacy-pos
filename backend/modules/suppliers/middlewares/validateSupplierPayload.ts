import { Request, Response, NextFunction } from 'express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import logger from '../../../utils/logger';
import { buildErrorResponse } from '../suppliers.utils';

export function validateSupplierPayload(mode: 'create' | 'update') {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const supplierSchemas: any = await import('@pharmacy-pos/shared/schemas/zod/supplier');
      const schema = mode === 'create'
        ? supplierSchemas.createSupplierSchema
        : supplierSchemas.updateSupplierSchema;
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorResponse: ErrorResponse = buildErrorResponse(
          ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
          JSON.stringify(result.error.errors ?? [])
        ) as ErrorResponse;
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
        return;
      }
      req.body = result.data;
      next();
    } catch (err) {
      logger.warn(`validateSupplierPayload fallback triggered: ${err instanceof Error ? err.message : String(err)}`);
      next();
    }
  };
}
