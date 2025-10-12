import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { saleQuerySchema } from '@pharmacy-pos/shared/schemas/zod/sale';

export function validateSaleQuery() {
  return function (req: Request, res: Response, next: NextFunction) {
    const parsed = (saleQuerySchema as z.ZodTypeAny).safeParse(req.query);
    if (!parsed.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid query parameters',
        errors: parsed.error.errors.map((error) => ({
          msg: error.message,
          param: (error.path || []).join('.'),
        })),
      } as ErrorResponse;
      res.status(400).json(errorResponse);
      return;
    }
    next();
  };
}

