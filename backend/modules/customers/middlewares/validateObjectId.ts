
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { buildErrorResponse } from '../customers.utils';

export function validateObjectId(paramName: string = 'id') {
  return async function (req: Request, res: Response, next: NextFunction) {
    const id = req.params[paramName];

    try {
      const modulePath = require('@pharmacy-pos/shared/utils/zodUtils');
      const mod = await import(modulePath);
      const zodId = (mod as any).zodId;
      const result = zodId.safeParse(id);
      if (!result.success) {
        const response: ErrorResponse = buildErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND) as ErrorResponse;
        res.status(404).json(response);
        return;
      }
      next();
    } catch (_err) {
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const response: ErrorResponse = buildErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND) as ErrorResponse;
        res.status(404).json(response);
        return;
      }
      next();
    }
  };
}
