// 在導入任何模組之前設置環境變數
process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import adminAuth from '../adminAuth';
import User from '../../models/User';

// Mock User model
jest.mock('../../models/User');
const mockUser = User as jest.Mocked<typeof User>;

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
  
  // 模擬 auth middleware 設置用戶信息
  app.use((req: any, res, next) => {
    // 可以通過 headers 設置用戶信息來模擬不同情況
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      req.user = { id: userId };
    }
    next();
  });
  
  // 受保護的管理員路由
  app.get('/admin/protected', adminAuth, (req: any, res) => {
    res.json({
      success: true,
      message: '成功訪問管理員路由',
      user: req.user
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

describe('AdminAuth Middleware 測試', () => {
  let testApp: express.Application;
  const adminUserId = 'admin123';
  const regularUserId = 'user123';

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('未授權情況', () => {
    test('應該拒絕沒有用戶信息的請求', async () => {
      const response = await request(testApp)
        .get('/admin/protected')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: '未授權，請先登入',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕用戶 ID 為空的請求', async () => {
      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', '')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: '未授權，請先登入',
        timestamp: expect.any(String)
      });
    });
  });

  describe('權限不足情況', () => {
    test('應該拒絕不存在的用戶', async () => {
      mockUser.findById.mockResolvedValue(null);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', 'nonexistent')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: '權限不足，需要管理員權限',
        timestamp: expect.any(String)
      });

      expect(mockUser.findById).toHaveBeenCalledWith('nonexistent');
    });

    test('應該拒絕非管理員用戶', async () => {
      const regularUser = {
        _id: regularUserId,
        username: 'regularuser',
        role: 'user'
      };

      mockUser.findById.mockResolvedValue(regularUser as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', regularUserId)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: '權限不足，需要管理員權限',
        timestamp: expect.any(String)
      });

      expect(mockUser.findById).toHaveBeenCalledWith(regularUserId);
    });

    test('應該拒絕角色為空的用戶', async () => {
      const userWithoutRole = {
        _id: regularUserId,
        username: 'userwithoutrole',
        role: null
      };

      mockUser.findById.mockResolvedValue(userWithoutRole as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', regularUserId)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: '權限不足，需要管理員權限',
        timestamp: expect.any(String)
      });
    });

    test('應該拒絕其他角色的用戶', async () => {
      const moderatorUser = {
        _id: regularUserId,
        username: 'moderator',
        role: 'moderator'
      };

      mockUser.findById.mockResolvedValue(moderatorUser as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', regularUserId)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: '權限不足，需要管理員權限',
        timestamp: expect.any(String)
      });
    });
  });

  describe('管理員權限情況', () => {
    test('應該允許管理員用戶訪問', async () => {
      const adminUser = {
        _id: adminUserId,
        username: 'admin',
        role: 'admin'
      };

      mockUser.findById.mockResolvedValue(adminUser as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', adminUserId)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '成功訪問管理員路由',
        user: { id: adminUserId }
      });

      expect(mockUser.findById).toHaveBeenCalledWith(adminUserId);
    });

    test('應該允許角色為 admin 的用戶（大小寫敏感）', async () => {
      const adminUser = {
        _id: adminUserId,
        username: 'admin',
        role: 'admin'
      };

      mockUser.findById.mockResolvedValue(adminUser as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', adminUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('錯誤處理', () => {
    test('應該處理資料庫查詢錯誤', async () => {
      mockUser.findById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', adminUserId)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: '伺服器錯誤',
        timestamp: expect.any(String)
      });

      expect(mockUser.findById).toHaveBeenCalledWith(adminUserId);
    });

    test('應該處理非 Error 類型的異常', async () => {
      mockUser.findById.mockRejectedValue('String error');

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', adminUserId)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: '伺服器錯誤',
        timestamp: expect.any(String)
      });
    });

    test('應該處理 User.findById 返回 undefined', async () => {
      mockUser.findById.mockResolvedValue(undefined as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', adminUserId)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: '權限不足，需要管理員權限',
        timestamp: expect.any(String)
      });
    });
  });

  describe('回應格式驗證', () => {
    test('成功回應應包含正確的格式', async () => {
      const adminUser = {
        _id: adminUserId,
        username: 'admin',
        role: 'admin'
      };

      mockUser.findById.mockResolvedValue(adminUser as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', adminUserId)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.success).toBe(true);
    });

    test('錯誤回應應包含正確的時間戳格式', async () => {
      const response = await request(testApp)
        .get('/admin/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
      
      // 驗證時間戳是有效的 ISO 字符串
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    test('所有錯誤回應都應包含 timestamp 欄位', async () => {
      // 測試 401 錯誤
      const response401 = await request(testApp)
        .get('/admin/protected')
        .expect(401);
      expect(response401.body.timestamp).toBeDefined();

      // 測試 403 錯誤
      mockUser.findById.mockResolvedValue(null);
      const response403 = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', 'test')
        .expect(403);
      expect(response403.body.timestamp).toBeDefined();

      // 測試 500 錯誤
      mockUser.findById.mockRejectedValue(new Error('Test error'));
      const response500 = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', 'test')
        .expect(500);
      expect(response500.body.timestamp).toBeDefined();
    });
  });

  describe('邊界條件測試', () => {
    test('應該處理用戶 ID 為特殊字符的情況', async () => {
      const specialUserId = 'user@#$%^&*()';
      mockUser.findById.mockResolvedValue(null);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', specialUserId)
        .expect(403);

      expect(mockUser.findById).toHaveBeenCalledWith(specialUserId);
    });

    test('應該處理非常長的用戶 ID', async () => {
      const longUserId = 'a'.repeat(1000);
      mockUser.findById.mockResolvedValue(null);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', longUserId)
        .expect(403);

      expect(mockUser.findById).toHaveBeenCalledWith(longUserId);
    });

    test('應該處理角色為空字符串的用戶', async () => {
      const userWithEmptyRole = {
        _id: regularUserId,
        username: 'user',
        role: ''
      };

      mockUser.findById.mockResolvedValue(userWithEmptyRole as any);

      const response = await request(testApp)
        .get('/admin/protected')
        .set('x-user-id', regularUserId)
        .expect(403);

      expect(response.body.message).toBe('權限不足，需要管理員權限');
    });
  });
});