
import { Request, Response, NextFunction } from 'express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { z } from 'zod';
import logger from '../../../utils/logger';
import { buildErrorResponse } from '../customers.utils';

export function validateCustomerQuery() {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const modulePath = require.resolve('@pharmacy-pos/shared/dist/schemas/zod/customer.js');
      const mod = await import(modulePath);
      const schema = (mod as any).customerSearchSchema as z.ZodTypeAny;
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
      logger.warn(`validateCustomerQuery fallback triggered: ${err instanceof Error ? err.message : String(err)}`);
      const fallback = z.object({
        search: z.string().trim().optional(),
        wildcardSearch: z.string().trim().optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        membershipLevel: z.string().trim().optional()
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
