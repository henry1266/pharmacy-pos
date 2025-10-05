import type { Request, Response, NextFunction } from 'express';
import { RequestValidationError } from '@ts-rest/express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

type ValidationIssue = {
  location: 'path' | 'query' | 'body' | 'headers';
  path: string;
  message: string;
};

export interface ValidationErrorHandlerOptions {
  defaultStatus?: number;
  pathParamStatus?: number;
  message?: string;
}

function collectIssues(error: RequestValidationError): ValidationIssue[] {
  const details: ValidationIssue[] = [];

  const pushIssues = (issues: unknown, location: ValidationIssue['location']) => {
    if (!issues || !Array.isArray((issues as any).issues)) {
      return;
    }

    for (const issue of (issues as any).issues) {
      const path = Array.isArray(issue.path)
        ? issue.path.join('.')
        : typeof issue.path === 'string'
          ? issue.path
          : '';

      if (typeof issue.message === 'string') {
        details.push({
          location,
          path,
          message: issue.message,
        });
      }
    }
  };

  pushIssues(error.pathParams, 'path');
  pushIssues(error.query, 'query');
  pushIssues(error.body, 'body');
  pushIssues(error.headers, 'headers');

  return details;
}

export function createValidationErrorHandler(options: ValidationErrorHandlerOptions = {}) {
  const {
    defaultStatus = API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    pathParamStatus,
    message = ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
  } = options;

  return (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (!(err instanceof RequestValidationError)) {
      return next(err);
    }

    const issues = collectIssues(err);
    const hasPathIssues = issues.some((issue) => issue.location === 'path');
    const status = hasPathIssues && pathParamStatus ? pathParamStatus : defaultStatus;

    res.status(status).json({
      success: false,
      message: issues[0]?.message ?? message,
      errors: issues.length > 0 ? issues : undefined,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  };
}
