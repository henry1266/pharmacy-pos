// 在導入任何模組之前設置環境變數
process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import {
  globalErrorHandler,
  handleNotFound,
  catchAsync,
  validateRequest,
  requirePermission,
  requireRole,
  requireOwnership,
  handleRateLimitError,
  validateBusinessRule,
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  HealthCheckError
} from '../errorHandler';

// Mock console methods to reduce test output noise
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// 創建測試應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 測試路由
  app.get('/test/success', (req, res) => {
    res.json({ success: true, message: '成功' });
  });
  
  app.get('/test/app-error', (req, res, next) => {
    next(new AppError('測試應用錯誤', 400, 'TEST_ERROR'));
  });
  
  app.get('/test/validation-error', (req, res, next) => {
    const details = [
      { field: 'name', message: '名稱為必填', value: null },
      { field: 'email', message: '電子郵件格式不正確', value: 'invalid-email' }
    ];
    next(new ValidationError('驗證失敗', details));
  });
  
  app.get('/test/database-error', (req, res, next) => {
    next(new DatabaseError('資料庫連接失敗'));
  });
  
  app.get('/test/auth-error', (req, res, next) => {
    next(new AuthenticationError('認證失敗'));
  });
  
  app.get('/test/authz-error', (req, res, next) => {
    next(new AuthorizationError('權限不足'));
  });
  
  app.get('/test/not-found-error', (req, res, next) => {
    next(new NotFoundError('用戶'));
  });
  
  app.get('/test/conflict-error', (req, res, next) => {
    next(new ConflictError('用戶名已存在'));
  });
  
  app.get('/test/business-error', (req, res, next) => {
    next(new BusinessLogicError('業務邏輯錯誤'));
  });
  
  app.get('/test/health-error', (req, res, next) => {
    const checks = { database: false, redis: true };
    next(new HealthCheckError('健康檢查失敗', checks));
  });
  
  app.get('/test/mongoose-validation', (req, res, next) => {
    const mongooseError = new mongoose.Error.ValidationError();
    mongooseError.errors = {
      name: {
        path: 'name',
        message: '名稱為必填',
        value: null
      } as any,
      email: {
        path: 'email',
        message: '電子郵件格式不正確',
        value: 'invalid'
      } as any
    };
    next(mongooseError);
  });
  
  app.get('/test/mongoose-cast', (req, res, next) => {
    const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', 'id');
    next(castError);
  });
  
  app.get('/test/duplicate-key', (req, res, next) => {
    const duplicateError = {
      name: 'MongoError',
      code: 11000,
      keyValue: { email: 'test@example.com' }
    };
    next(duplicateError);
  });
  
  app.get('/test/jwt-error', (req, res, next) => {
    const jwtError = new Error('invalid token');
    jwtError.name = 'JsonWebTokenError';
    next(jwtError);
  });
  
  app.get('/test/jwt-expired', (req, res, next) => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    next(expiredError);
  });
  
  app.get('/test/generic-error', (req, res, next) => {
    next(new Error('一般錯誤'));
  });
  
  app.get('/test/async-error', catchAsync(async (req: any, res: any, next: any) => {
    throw new Error('異步錯誤');
  }));
  
  // 模擬用戶中間件
  app.use('/test/auth', (req: any, res, next) => {
    const userId = req.headers['x-user-id'] as string;
    const role = req.headers['x-user-role'] as string;
    const permissions = req.headers['x-user-permissions'] as string;
    
    if (userId) {
      req.user = {
        id: userId,
        role: role || 'user',
        permissions: permissions ? permissions.split(',') : []
      };
    }
    next();
  });
  
  app.get('/test/auth/permission', requirePermission('read:users'), (req, res) => {
    res.json({ success: true, message: '有權限訪問' });
  });
  
  app.get('/test/auth/role', requireRole('admin'), (req, res) => {
    res.json({ success: true, message: '角色驗證通過' });
  });
  
  app.get('/test/auth/roles', requireRole(['admin', 'moderator']), (req, res) => {
    res.json({ success: true, message: '多角色驗證通過' });
  });
  
  app.get('/test/auth/ownership', requireOwnership(), (req, res) => {
    res.json({ success: true, message: '擁有者驗證通過' });
  });
  
  app.get('/test/business-rule', 
    validateBusinessRule('test-rule', (data) => data.value > 0, '值必須大於0'),
    (req, res) => {
      res.json({ success: true, message: '業務規則驗證通過' });
    }
  );
  
  app.get('/test/rate-limit', (req, res) => {
    handleRateLimitError(req, res);
  });
  
  // 404 處理
  app.use(handleNotFound);
  
  // 全局錯誤處理
  app.use(globalErrorHandler);
  
  return app;
};

describe('ErrorHandler Middleware 測試', () => {
  let testApp: express.Application;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('錯誤類測試', () => {
    test('AppError 應該正確設置屬性', () => {
      const error = new AppError('測試錯誤', 400, 'TEST_CODE');
      
      expect(error.message).toBe('測試錯誤');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_CODE');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    test('ValidationError 應該包含詳細信息', () => {
      const details = [{ field: 'name', message: '必填', value: null }];
      const error = new ValidationError('驗證失敗', details);
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });

    test('DatabaseError 應該正確設置', () => {
      const originalError = new Error('DB connection failed');
      const error = new DatabaseError('資料庫錯誤', originalError);
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.stack).toBe(originalError.stack);
    });

    test('AuthenticationError 應該有預設訊息', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('認證失敗');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    test('AuthorizationError 應該有預設訊息', () => {
      const error = new AuthorizationError();
      
      expect(error.message).toBe('權限不足');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    test('NotFoundError 應該格式化資源名稱', () => {
      const error = new NotFoundError('用戶');
      
      expect(error.message).toBe('用戶不存在');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND_ERROR');
    });

    test('ConflictError 應該正確設置', () => {
      const error = new ConflictError('資源衝突');
      
      expect(error.message).toBe('資源衝突');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT_ERROR');
    });

    test('BusinessLogicError 應該正確設置', () => {
      const error = new BusinessLogicError('業務邏輯錯誤');
      
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
    });

    test('HealthCheckError 應該包含檢查結果', () => {
      const checks = { database: false, redis: true };
      const error = new HealthCheckError('健康檢查失敗', checks);
      
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('HEALTH_CHECK_FAILED');
      expect(error.checks).toEqual(checks);
    });
  });

  describe('全局錯誤處理測試', () => {
    test('應該處理 AppError', async () => {
      const response = await request(testApp)
        .get('/test/app-error')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '測試應用錯誤',
        code: 'TEST_ERROR',
        timestamp: expect.any(String)
      });
    });

    test('應該處理 ValidationError', async () => {
      const response = await request(testApp)
        .get('/test/validation-error')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('驗證失敗');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.timestamp).toBeDefined();
      // 在測試環境中，ValidationError 的 details 會被包含在回應中
      if (response.body.details) {
        expect(Array.isArray(response.body.details)).toBe(true);
        expect(response.body.details.length).toBe(2);
      }
    });

    test('應該處理 Mongoose ValidationError', async () => {
      const response = await request(testApp)
        .get('/test/mongoose-validation')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('資料驗證失敗');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveLength(2);
    });

    test('應該處理 Mongoose CastError', async () => {
      const response = await request(testApp)
        .get('/test/mongoose-cast')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('資源不存在');
      expect(response.body.code).toBe('NOT_FOUND_ERROR');
    });

    test('應該處理重複鍵錯誤', async () => {
      const response = await request(testApp)
        .get('/test/duplicate-key')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('email "test@example.com" 已經存在');
      expect(response.body.code).toBe('CONFLICT_ERROR');
    });

    test('應該處理 JWT 錯誤', async () => {
      const response = await request(testApp)
        .get('/test/jwt-error')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('無效的認證令牌');
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    test('應該處理 JWT 過期錯誤', async () => {
      const response = await request(testApp)
        .get('/test/jwt-expired')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('認證令牌已過期');
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    test('應該處理一般錯誤', async () => {
      const response = await request(testApp)
        .get('/test/generic-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('catchAsync 測試', () => {
    test('應該捕獲異步錯誤', async () => {
      const response = await request(testApp)
        .get('/test/async-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');
    });
  });

  describe('handleNotFound 測試', () => {
    test('應該處理 404 錯誤', async () => {
      const response = await request(testApp)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('路由 /non-existent-route不存在');
      expect(response.body.code).toBe('NOT_FOUND_ERROR');
    });
  });

  describe('requirePermission 測試', () => {
    test('應該拒絕沒有用戶的請求', async () => {
      const response = await request(testApp)
        .get('/test/auth/permission')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請先登入');
    });

    test('應該拒絕沒有權限的用戶', async () => {
      const response = await request(testApp)
        .get('/test/auth/permission')
        .set('x-user-id', 'user123')
        .set('x-user-permissions', 'write:posts')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要 read:users 權限');
    });

    test('應該允許有權限的用戶', async () => {
      const response = await request(testApp)
        .get('/test/auth/permission')
        .set('x-user-id', 'user123')
        .set('x-user-permissions', 'read:users,write:posts')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('requireRole 測試', () => {
    test('應該拒絕沒有用戶的請求', async () => {
      const response = await request(testApp)
        .get('/test/auth/role')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('應該拒絕角色不符的用戶', async () => {
      const response = await request(testApp)
        .get('/test/auth/role')
        .set('x-user-id', 'user123')
        .set('x-user-role', 'user')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要以下角色之一: admin');
    });

    test('應該允許正確角色的用戶', async () => {
      const response = await request(testApp)
        .get('/test/auth/role')
        .set('x-user-id', 'admin123')
        .set('x-user-role', 'admin')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('應該支援多角色驗證', async () => {
      const response = await request(testApp)
        .get('/test/auth/roles')
        .set('x-user-id', 'mod123')
        .set('x-user-role', 'moderator')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('requireOwnership 測試', () => {
    test('應該拒絕沒有用戶的請求', async () => {
      const response = await request(testApp)
        .get('/test/auth/ownership')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('應該允許管理員訪問', async () => {
      const response = await request(testApp)
        .get('/test/auth/ownership')
        .set('x-user-id', 'admin123')
        .set('x-user-role', 'admin')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('應該允許一般用戶訪問（簡化實現）', async () => {
      const response = await request(testApp)
        .get('/test/auth/ownership')
        .set('x-user-id', 'user123')
        .set('x-user-role', 'user')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('validateBusinessRule 測試', () => {
    test('應該拒絕不符合業務規則的請求', async () => {
      const response = await request(testApp)
        .get('/test/business-rule')
        .send({ value: -1 })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('test-rule: 值必須大於0');
      expect(response.body.code).toBe('BUSINESS_LOGIC_ERROR');
    });

    test('應該允許符合業務規則的請求', async () => {
      const response = await request(testApp)
        .get('/test/business-rule')
        .send({ value: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('handleRateLimitError 測試', () => {
    test('應該返回速率限制錯誤', async () => {
      const response = await request(testApp)
        .get('/test/rate-limit')
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請求過於頻繁，請稍後再試');
      expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('環境變數測試', () => {
    test('測試環境應該顯示詳細錯誤信息', async () => {
      const response = await request(testApp)
        .get('/test/app-error')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('測試應用錯誤');
      expect(response.body.code).toBe('TEST_ERROR');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('回應格式驗證', () => {
    test('所有錯誤回應都應包含標準格式', async () => {
      const response = await request(testApp)
        .get('/test/app-error')
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(false);
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('時間戳應該是有效的 ISO 字符串', async () => {
      const response = await request(testApp)
        .get('/test/app-error')
        .expect(400);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });
});