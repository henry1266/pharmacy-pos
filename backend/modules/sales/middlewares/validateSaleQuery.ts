import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';

export function validateSaleQuery() {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // Load shared sale zod schema and merge with extra fields used by this endpoint
      const modulePath = require.resolve('@pharmacy-pos/shared/dist/schemas/zod/sale.js');
      const mod = await import(modulePath);
      const base = (mod as any).saleSearchSchema as z.ZodObject<any>;
      const extra = z.object({
        search: z.string().trim().max(100).optional(),
        wildcardSearch: z.string().trim().max(100).optional()
      });
      const schema = base.merge(extra);

      const parsed = schema.safeParse(req.query);
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
      // Fallback: minimal local validation to avoid blocking
      const fallback = z.object({
        search: z.string().trim().max(100).optional(),
        wildcardSearch: z.string().trim().max(100).optional()
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

