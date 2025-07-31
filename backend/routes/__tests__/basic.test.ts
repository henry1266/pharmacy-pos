import request from 'supertest';
import express from 'express';

// 創建一個簡單的測試應用
const app = express();
app.use(express.json());

// 簡單的健康檢查路由
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 簡單的產品路由模擬
app.get('/api/products', (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: '測試產品', price: 100 },
      { id: '2', name: '測試產品2', price: 200 }
    ]
  });
});

describe('基本 API 測試', () => {
  describe('GET /health', () => {
    it('應該返回健康狀態', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/products', () => {
    it('應該返回產品列表', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('產品應該有正確的結構', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      const product = response.body.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(typeof product.price).toBe('number');
    });
  });
});

describe('錯誤處理測試', () => {
  it('應該處理不存在的路由', async () => {
    await request(app)
      .get('/api/nonexistent')
      .expect(404);
  });
});

describe('JSON 解析測試', () => {
  app.post('/api/test', (req, res) => {
    res.json({ received: req.body });
  });

  it('應該正確解析 JSON 請求', async () => {
    const testData = { name: '測試', value: 123 };
    
    const response = await request(app)
      .post('/api/test')
      .send(testData)
      .expect(200);

    expect(response.body.received).toEqual(testData);
  });
});