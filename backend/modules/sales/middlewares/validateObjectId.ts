import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { isValidObjectId } from '../services/validation.service';

export function validateObjectId(paramName: string = 'id') {
  return function (req: Request, res: Response, next: NextFunction) {
    const id = req.params[paramName];
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
  };
}

