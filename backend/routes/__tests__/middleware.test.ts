import request from 'supertest';
import express from 'express';

// 創建測試應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 測試中間件
  const testMiddleware = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).testData = { processed: true };
    next();
  };
  
  const errorMiddleware = (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const error = new Error('測試錯誤');
    next(error);
  };
  
  const asyncMiddleware = async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      (req as any).asyncData = { processed: true };
      next();
    } catch (error) {
      next(error);
    }
  };
  
  // 路由設置
  app.get('/test-middleware', testMiddleware, (req, res) => {
    res.json({
      success: true,
      data: (req as any).testData,
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/test-error', errorMiddleware, (_req, res) => {
    res.json({ success: true });
  });
  
  app.get('/test-async', asyncMiddleware, (req, res) => {
    res.json({
      success: true,
      data: (req as any).asyncData,
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/test-headers', (req, res) => {
    res.set('X-Test-Header', 'test-value');
    res.json({
      success: true,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  });
  
  app.post('/test-body', (req, res) => {
    res.json({
      success: true,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  });
  
  // 錯誤處理中間件
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('中間件測試套件', () => {
  let testApp: express.Application;

  beforeEach(() => {
    testApp = createTestApp();
  });

  describe('基本中間件功能', () => {
    test('應該正確處理測試中間件', async () => {
      const response = await request(testApp)
        .get('/test-middleware')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ processed: true });
      expect(response.body.timestamp).toBeDefined();
    });

    test('應該正確處理異步中間件', async () => {
      const response = await request(testApp)
        .get('/test-async')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ processed: true });
      expect(response.body.timestamp).toBeDefined();
    });

    test('應該正確處理錯誤中間件', async () => {
      const response = await request(testApp)
        .get('/test-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('測試錯誤');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('HTTP 標頭處理', () => {
    test('應該正確設置回應標頭', async () => {
      const response = await request(testApp)
        .get('/test-headers')
        .expect(200);

      expect(response.headers['x-test-header']).toBe('test-value');
      expect(response.body.success).toBe(true);
      expect(response.body.headers).toBeDefined();
    });

    test('應該正確處理自定義標頭', async () => {
      const response = await request(testApp)
        .get('/test-headers')
        .set('X-Custom-Header', 'custom-value')
        .expect(200);

      expect(response.body.headers['x-custom-header']).toBe('custom-value');
    });

    test('應該正確處理 User-Agent 標頭', async () => {
      const response = await request(testApp)
        .get('/test-headers')
        .set('User-Agent', 'test-agent')
        .expect(200);

      expect(response.body.headers['user-agent']).toBe('test-agent');
    });
  });

  describe('請求體處理', () => {
    test('應該正確處理 JSON 請求體', async () => {
      const testData = { name: '測試', value: 123 };
      
      const response = await request(testApp)
        .post('/test-body')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.body).toEqual(testData);
    });

    test('應該正確處理空請求體', async () => {
      const response = await request(testApp)
        .post('/test-body')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.body).toEqual({});
    });

    test('應該正確處理複雜請求體', async () => {
      const complexData = {
        user: { id: 1, name: '測試用戶' },
        items: [{ id: 1, name: '項目1' }, { id: 2, name: '項目2' }],
        metadata: { timestamp: new Date().toISOString() }
      };
      
      const response = await request(testApp)
        .post('/test-body')
        .send(complexData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.body).toEqual(complexData);
    });
  });

  describe('錯誤處理', () => {
    test('應該正確處理 404 錯誤', async () => {
      await request(testApp)
        .get('/non-existent-route')
        .expect(404);
    });

    test('應該正確處理不支援的 HTTP 方法', async () => {
      await request(testApp)
        .patch('/test-middleware')
        .expect(404);
    });
  });

  describe('回應格式驗證', () => {
    test('所有成功回應都應該包含 success 欄位', async () => {
      const response = await request(testApp)
        .get('/test-middleware')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    test('所有回應都應該包含 timestamp 欄位', async () => {
      const response = await request(testApp)
        .get('/test-middleware')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('錯誤回應應該包含 error 欄位', async () => {
      const response = await request(testApp)
        .get('/test-error')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
    });

    test('時間戳應該是有效的 ISO 字符串', async () => {
      const response = await request(testApp)
        .get('/test-middleware')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});