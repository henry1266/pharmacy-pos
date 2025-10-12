import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { createSaleSchema, updateSaleSchema } from '@pharmacy-pos/shared/schemas/zod/sale';
import logger from '../../../utils/logger';
import type { SaleCreationRequest } from '../sales.types';
import { mapToSaleSchemaInput } from '../services/validation.service';

export function validateSale(mode: 'create' | 'update') {
  const schema = mode === 'create' ? createSaleSchema : updateSaleSchema;

  return function (req: Request, res: Response, next: NextFunction) {
    try {
      const payload = mapToSaleSchemaInput((req.body ?? {}) as SaleCreationRequest);
      const result = schema.safeParse(payload);
      if (!result.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Validation failed',
          errors: result.error.errors?.map((error) => ({
            msg: error.message,
            param: (error.path || []).join('.'),
          })),
        } as ErrorResponse;
        res.status(400).json(errorResponse);
        return;
      }
      next();
    } catch (error: unknown) {
      logger.error(`validateSale middleware failed: ${error instanceof Error ? error.message : String(error)}`);
      next(error instanceof Error ? error : new Error('Sale validation failed'));
    }
  };
}

