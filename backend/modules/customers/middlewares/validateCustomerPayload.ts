
import { Request, Response, NextFunction } from 'express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import logger from '../../../utils/logger';
import { buildErrorResponse } from '../customers.utils';

export function validateCustomerPayload(mode: 'create' | 'update' | 'quick') {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const customerSchemas: any = await import('@pharmacy-pos/shared/schemas/zod/customer');
      const schema = mode === 'create'
        ? customerSchemas.createCustomerSchema
        : mode === 'update'
          ? customerSchemas.updateCustomerSchema
          : customerSchemas.quickCreateCustomerSchema;
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
      logger.warn(`validateCustomerPayload fallback triggered: ${err instanceof Error ? err.message : String(err)}`);
      next();
    }
  };
}
