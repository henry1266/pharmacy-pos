import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { isValidObjectId } from '../services/validation.service';

// Zod-based ObjectId validator with shared zodId as SSOT (with safe fallback)
export function validateObjectId(paramName: string = 'id') {
  return async function (req: Request, res: Response, next: NextFunction) {
    const id = req.params[paramName];

    try {
      const { zodId } = await import('@pharmacy-pos/shared/utils/zodUtils');
      const result = zodId.safeParse(id);
      if (!result.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
          timestamp: new Date()
        } as any;
        res.status(404).json(errorResponse);
        return;
      }
      next();
    } catch (_err) {
      // Fallback to mongoose-based validation if shared build not available
      if (!id || !isValidObjectId(id)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
          timestamp: new Date()
        } as any;
        res.status(404).json(errorResponse);
        return;
      }
      next();
    }
  };
}

