import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';

const saleListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  wildcardSearch: z.string().trim().max(100).optional()
});

export function validateSaleQuery() {
  return function (req: Request, res: Response, next: NextFunction) {
    const parsed = saleListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid query parameters',
        errors: parsed.error.errors.map(e => ({ msg: e.message, param: (e.path || []).join('.') }))
      } as any;
      res.status(400).json(errorResponse);
      return;
    }
    next();
  };
}

