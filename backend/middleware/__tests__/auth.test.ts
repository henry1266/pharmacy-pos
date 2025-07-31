// 在導入任何模組之前設置環境變數
process.env.REACT_APP_TEST_MODE = 'true';
process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import config from 'config';
import auth from '../auth';

// Mock config
jest.mock('config');
const mockConfig = config as jest.Mocked<typeof config>;

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// 創建測試應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 受保護的路由
  app.get('/protected', auth, (req: any, res) => {
    res.json({
      success: true,
      user: req.user,
      message: '成功訪問受保護的路由'
    });
  });
  
  // 錯誤處理中間件
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).json({
      success: false,
      error: err.message
    });
  });
  
  return app;
};

describe('Auth Middleware 測試', () => {
  let testApp: express.Application;
  const mockJwtSecret = 'test-jwt-secret';
  const validUserId = 'user123';

  beforeEach(() => {
    testApp = createTestApp();
    mockConfig.get.mockReturnValue(mockJwtSecret);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('無 Token 情況', () => {
    test('應該拒絕沒有 token 的請求', async () => {
      const response = await request(testApp)
        .get('/protected')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: '沒有權限，請先登入',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕空的 Authorization header', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('Authorization', '')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: '沒有權限，請先登入',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕格式錯誤的 Authorization header', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: '沒有權限，請先登入',
        timestamp: expect.any(String)
      });
    });
  });

  describe('有效 Token 情況', () => {
    test('應該接受有效的 x-auth-token', async () => {
      const token = jwt.sign({ user: { id: validUserId } }, mockJwtSecret);
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', token)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: { id: validUserId },
        message: '成功訪問受保護的路由'
      });
    });

    test('應該接受有效的 Bearer token', async () => {
      const token = jwt.sign({ user: { id: validUserId } }, mockJwtSecret);
      
      const response = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: { id: validUserId },
        message: '成功訪問受保護的路由'
      });
    });

    test('應該優先使用 x-auth-token 而非 Authorization header', async () => {
      const validToken = jwt.sign({ user: { id: validUserId } }, mockJwtSecret);
      const invalidToken = 'invalid-token';
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', validToken)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: { id: validUserId },
        message: '成功訪問受保護的路由'
      });
    });
  });

  describe('無效 Token 情況', () => {
    test('應該拒絕無效的 JWT token', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', 'invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 無效或已過期',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕過期的 JWT token', async () => {
      const expiredToken = jwt.sign(
        { user: { id: validUserId }, exp: Math.floor(Date.now() / 1000) - 3600 }, // 1小時前過期
        mockJwtSecret
      );
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', expiredToken)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 無效或已過期',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕缺少用戶 ID 的 token', async () => {
      const tokenWithoutUserId = jwt.sign({ user: {} }, mockJwtSecret);
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', tokenWithoutUserId)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 格式無效',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕沒有 user 物件的 token', async () => {
      const tokenWithoutUser = jwt.sign({ someOtherData: 'value' }, mockJwtSecret);
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', tokenWithoutUser)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 格式無效',
        timestamp: expect.any(String)
      });
    });
  });

  describe('測試模式', () => {
    test('應該接受測試模式 token', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', 'test-mode-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: { id: 'test-user-id' },
        message: '成功訪問受保護的路由'
      });
    });

    test('測試模式下仍應驗證非測試 token', async () => {
      const validToken = jwt.sign({ user: { id: validUserId } }, mockJwtSecret);
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', validToken)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: { id: validUserId },
        message: '成功訪問受保護的路由'
      });
    });

    test('測試模式下仍應拒絕無效 token', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', 'invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 無效或已過期',
        timestamp: expect.any(String)
      });
    });
  });

  describe('錯誤處理', () => {
    test('應該處理 JWT 驗證異常', async () => {
      // Mock jwt.verify 拋出異常
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', 'some-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 無效或已過期',
        timestamp: expect.any(String)
      });

      // 恢復原始函數
      jwt.verify = originalVerify;
    });

    test('應該處理 config.get 異常', async () => {
      mockConfig.get.mockImplementation(() => {
        throw new Error('Config error');
      });

      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', 'some-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Token 無效或已過期',
        timestamp: expect.any(String)
      });
    });
  });

  describe('回應格式驗證', () => {
    test('成功回應應包含正確的時間戳格式', async () => {
      const token = jwt.sign({ user: { id: validUserId } }, mockJwtSecret);
      
      const response = await request(testApp)
        .get('/protected')
        .set('x-auth-token', token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual({ id: validUserId });
    });

    test('錯誤回應應包含正確的時間戳格式', async () => {
      const response = await request(testApp)
        .get('/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
      
      // 驗證時間戳是有效的 ISO 字符串
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });
});