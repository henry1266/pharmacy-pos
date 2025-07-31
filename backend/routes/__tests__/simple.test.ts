import request from 'supertest';
import express from 'express';

// 創建一個完全獨立的測試應用，不依賴任何外部服務
const createSimpleApp = () => {
  const app = express();
  app.use(express.json());
  
  // 健康檢查路由
  app.get('/health', (_req, res) => {
    res.json({ 
      success: true, 
      message: '服務正常運行',
      timestamp: new Date().toISOString()
    });
  });
  
  // 簡單的 API 路由
  app.get('/api/test', (_req, res) => {
    res.json({
      success: true,
      message: '測試 API 正常',
      data: { version: '1.0.0' },
      timestamp: new Date().toISOString()
    });
  });
  
  // POST 測試路由
  app.post('/api/echo', (req, res) => {
    res.json({
      success: true,
      message: '回音測試',
      received: req.body,
      timestamp: new Date().toISOString()
    });
  });
  
  // 錯誤測試路由
  app.get('/api/error', (_req, res) => {
    res.status(500).json({
      success: false,
      message: '測試錯誤',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('簡單 API 測試（無資料庫）', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createSimpleApp();
  });

  describe('基本路由測試', () => {
    test('健康檢查應該返回成功', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('服務正常運行');
      expect(response.body.timestamp).toBeDefined();
    });

    test('測試 API 應該返回版本資訊', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
    });

    test('POST 回音測試應該返回發送的數據', async () => {
      const testData = { message: '測試數據', number: 123 };
      
      const response = await request(app)
        .post('/api/echo')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.received).toEqual(testData);
      expect(response.body.timestamp).toBeDefined();
    });

    test('錯誤路由應該返回 500', async () => {
      const response = await request(app)
        .get('/api/error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('HTTP 方法測試', () => {
    test('不存在的路由應該返回 404', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404);
    });

    test('不支援的 HTTP 方法應該返回 404', async () => {
      await request(app)
        .delete('/health')
        .expect(404);
    });
  });

  describe('JSON 處理測試', () => {
    test('應該正確處理空的 JSON 請求', async () => {
      const response = await request(app)
        .post('/api/echo')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.received).toEqual({});
    });

    test('應該正確處理複雜的 JSON 數據', async () => {
      const complexData = {
        user: { id: 1, name: '測試用戶' },
        items: [
          { id: 1, name: '商品1', price: 100 },
          { id: 2, name: '商品2', price: 200 }
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      const response = await request(app)
        .post('/api/echo')
        .send(complexData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.received).toEqual(complexData);
    });
  });

  describe('回應格式測試', () => {
    test('所有成功回應都應該包含標準欄位', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('錯誤回應應該包含標準錯誤欄位', async () => {
      const response = await request(app)
        .get('/api/error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('時間戳應該是有效的 ISO 字符串', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});