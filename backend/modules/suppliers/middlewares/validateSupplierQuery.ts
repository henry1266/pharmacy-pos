import { Request, Response, NextFunction } from 'express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { z } from 'zod';
import logger from '../../../utils/logger';
import { buildErrorResponse } from '../suppliers.utils';

export function validateSupplierQuery() {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const modulePath = require.resolve('@pharmacy-pos/shared/schemas/zod/supplier.js');
      const mod = await import(modulePath);
      const schema = (mod as any).supplierSearchSchema as z.ZodTypeAny;
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const response: ErrorResponse = buildErrorResponse(
          ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
          JSON.stringify(result.error.errors ?? [])
        ) as ErrorResponse;
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
        return;
      }
      req.query = result.data as any;
      next();
    } catch (err) {
      logger.warn(`validateSupplierQuery fallback triggered: ${err instanceof Error ? err.message : String(err)}`);
      const fallback = z.object({
        search: z.string().trim().optional(),
        active: z.coerce.boolean().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        sortBy: z.string().trim().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional()
      }).strip();
      const parsed = fallback.safeParse(req.query);
      if (!parsed.success) {
        const response: ErrorResponse = buildErrorResponse(
          ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
          JSON.stringify(parsed.error.errors ?? [])
        ) as ErrorResponse;
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
        return;
      }
      req.query = parsed.data as any;
      next();
    }
  };
}
