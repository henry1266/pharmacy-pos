import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import logger from '../../../utils/logger';

export function validateSale(mode: 'create' | 'update') {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const modulePath = require.resolve('@pharmacy-pos/shared/schemas/zod/sale.js');
      const mod = await import(modulePath);
      const schema = mode === 'create' ? (mod as any).createSaleSchema : (mod as any).updateSaleSchema;
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Validation failed',
          errors: result.error.errors?.map((e: any) => ({ msg: e.message, param: (e.path || []).join('.') }))
        } as any;
        res.status(400).json(errorResponse);
        return;
      }
      next();
    } catch (err) {
      // If schema can't be loaded, log and proceed (do not block)
      logger.warn(`validateSale zod skipped: ${err instanceof Error ? err.message : String(err)}`);
      next();
    }
  };
}

