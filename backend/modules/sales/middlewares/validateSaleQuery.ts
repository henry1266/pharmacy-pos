import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';

export function validateSaleQuery() {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { saleQuerySchema } = await import('@pharmacy-pos/shared/schemas/zod/sale');
      const parsed = (saleQuerySchema as z.ZodTypeAny).safeParse(req.query);
      if (!parsed.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Invalid query parameters',
          errors: parsed.error.errors.map((e: any) => ({ msg: e.message, param: (e.path || []).join('.') }))
        } as any;
        res.status(400).json(errorResponse);
        return;
      }
      next();
    } catch (err) {
      const fallback = z.object({
        search: z.string().trim().max(100).optional(),
        wildcardSearch: z.string().trim().max(100).optional(),
      });
      const parsed = fallback.safeParse(req.query);
      if (!parsed.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Invalid query parameters',
          errors: parsed.error.errors.map((e: any) => ({ msg: e.message, param: (e.path || []).join('.') }))
        } as any;
        res.status(400).json(errorResponse);
        return;
      }
      next();
    }
  };
}

