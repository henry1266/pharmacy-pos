import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  AuthenticationError,
  AuthorizationError,
  AppError,
  ValidationError,
  catchAsync,
  validateRequest,
  requirePermission,
  requireRole,
  requireOwnership,
  handleRateLimitError,
  globalErrorHandler
} from '../../middleware/errorHandler';

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');

const createMockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('errorHandler middleware utilities', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('catchAsync', () => {
    it('propagates rejected promises', async () => {
      const error = new Error('boom');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const next = jest.fn();
      const wrapper = catchAsync(asyncFn);
      await wrapper({} as Request, {} as Response, next as NextFunction);
      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateRequest', () => {
    it('passes when validation succeeds', async () => {
      const rule = { run: jest.fn().mockResolvedValue(undefined) };
      validationResult.mockReturnValue({ isEmpty: () => true });
      const middleware = validateRequest([rule]);
      const next = jest.fn();
      await middleware({} as Request, {} as Response, next as NextFunction);
      expect(rule.run).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('raises ValidationError when rules fail', async () => {
      const rule = { run: jest.fn().mockResolvedValue(undefined) };
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ param: 'field', msg: 'Invalid', value: 'x', location: 'body' }]
      });
      const middleware = validateRequest([rule]);
      const next = jest.fn();
      await middleware({} as Request, {} as Response, next as NextFunction);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).details).toHaveLength(1);
    });
  });

  describe('requirePermission', () => {
    it('permits when permission granted', () => {
      const middleware = requirePermission('manage');
      const next = jest.fn();
      middleware({ user: { permissions: ['manage'] } } as any, {} as Response, next as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('throws AuthenticationError when user missing', () => {
      const middleware = requirePermission('manage');
      const next = jest.fn();
      middleware({} as Request, {} as Response, next as NextFunction);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AuthenticationError);
    });

    it('throws AuthorizationError when permission missing', () => {
      const middleware = requirePermission('manage');
      const next = jest.fn();
      middleware({ user: { permissions: ['read'] } } as any, {} as Response, next as NextFunction);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AuthorizationError);
    });
  });

  describe('requireRole', () => {
    it('permits allowed roles', () => {
      const middleware = requireRole(['admin', 'manager']);
      const next = jest.fn();
      middleware({ user: { role: 'manager' } } as any, {} as Response, next as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('requires authentication', () => {
      const middleware = requireRole('admin');
      const next = jest.fn();
      middleware({} as Request, {} as Response, next as NextFunction);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AuthenticationError);
    });

    it('checks role membership', () => {
      const middleware = requireRole(['admin']);
      const next = jest.fn();
      middleware({ user: { role: 'staff' } } as any, {} as Response, next as NextFunction);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AuthorizationError);
    });
  });

  describe('requireOwnership', () => {
    it('allows admin users', async () => {
      const middleware = requireOwnership();
      const next = jest.fn();
      await middleware({ user: { role: 'admin' } } as any, {} as Response, next as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('requires authentication for ownership checks', async () => {
      const middleware = requireOwnership();
      const next = jest.fn();
      await middleware({} as Request, {} as Response, next as NextFunction);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AuthenticationError);
    });
  });

  describe('handleRateLimitError', () => {
    it('uses development formatter when NODE_ENV=development', () => {
      process.env.NODE_ENV = 'development';
      const res = createMockRes();
      handleRateLimitError({} as Request, res);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json.mock.calls[0][0].error).toBeDefined();
    });

    it('uses production formatter when NODE_ENV=production', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      handleRateLimitError({} as Request, res);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json.mock.calls[0][0].message).toBeDefined();
    });
  });

  describe('globalErrorHandler', () => {
    it('handles operational AppError in production', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const err = new AppError('Oops', 418, 'TEAPOT');
      const req = { method: 'GET', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json.mock.calls[0][0].code).toBe('TEAPOT');
    });

    it('exposes stack traces in development', () => {
      process.env.NODE_ENV = 'development';
      const res = createMockRes();
      const err = new AppError('Oops', 400, 'CODE');
      const req = { method: 'GET', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      const payloadDev = res.json.mock.calls[0][0];
expect(payloadDev.success).toBe(false);
expect(payloadDev.error).toBeDefined();
    });

    it('transforms mongoose validation error', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const validationError: any = new mongoose.Error.ValidationError();
      validationError.errors = {
        field: { path: 'field', message: 'Invalid', value: 'x' }
      };
      const req = { method: 'PUT', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(validationError, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
    it('handles mongoose cast errors', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const err = new mongoose.Error.CastError('ObjectId', 'bad-id', 'accountId');
      const req = { method: 'GET', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('handles duplicate key errors', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const err: any = { code: 11000, keyValue: { name: 'Cash' }, message: 'Duplicate' };
      const req = { method: 'POST', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('handles JWT errors', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const err: any = { name: 'JsonWebTokenError', message: 'jwt malformed' };
      const req = { method: 'GET', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('handles expired JWT errors', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const err: any = { name: 'TokenExpiredError', message: 'jwt expired' };
      const req = { method: 'GET', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('falls back to 500 for unknown errors', () => {
      process.env.NODE_ENV = 'production';
      const res = createMockRes();
      const err = new Error('unexpected');
      const req = { method: 'GET', ip: '127.0.0.1', get: () => 'jest' } as any;
      globalErrorHandler(err, req as Request, res, (() => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(500);
    });
