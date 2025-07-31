import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../app';

describe('Products API 簡單測試', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    
    // 創建應用程序實例
    app = createApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('基本 API 測試', () => {
    test('GET /api/products 應該返回產品列表', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/products/products 應該返回商品列表', async () => {
      const response = await request(app)
        .get('/api/products/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/products/medicines 應該返回藥品列表', async () => {
      const response = await request(app)
        .get('/api/products/medicines')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/products/:id 不存在的產品應該返回 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/products/create-test-data 應該創建測試數據', async () => {
      const response = await request(app)
        .post('/api/products/create-test-data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('搜尋和篩選測試', () => {
    test('GET /api/products 支援搜尋參數', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ search: '測試', productType: 'product' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/products 支援價格篩選', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: '10', maxPrice: '100' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('錯誤處理測試', () => {
    test('無效的產品 ID 應該返回 404', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('不存在的產品代碼應該返回 404', async () => {
      const response = await request(app)
        .get('/api/products/code/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('API 回應格式測試', () => {
    test('成功回應應該包含標準欄位', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('錯誤回應應該包含標準欄位', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});