import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';

// 創建一個簡單的測試應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 簡單的健康檢查路由
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: '服務正常運行',
      timestamp: new Date().toISOString()
    });
  });
  
  // 簡單的產品列表路由（模擬）
  app.get('/api/products', (_req, res) => {
    res.json({
      success: true,
      message: '成功獲取產品列表',
      data: [],
      timestamp: new Date().toISOString()
    });
  });
  
  // 錯誤處理路由
  app.get('/error', (_req, res) => {
    res.status(500).json({
      success: false,
      message: '測試錯誤',
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('獨立測試套件', () => {
  let mongoServer: MongoMemoryServer;
  let testApp: express.Application;

  beforeAll(async () => {
    // 設置測試用的 MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    
    // 創建測試應用
    testApp = createTestApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('基本功能測試', () => {
    test('健康檢查應該返回成功', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('服務正常運行');
      expect(response.body.timestamp).toBeDefined();
    });

    test('產品 API 應該返回空列表', async () => {
      const response = await request(testApp)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.timestamp).toBeDefined();
    });

    test('錯誤路由應該返回 500', async () => {
      const response = await request(testApp)
        .get('/error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('測試錯誤');
    });
  });

  describe('MongoDB 連接測試', () => {
    test('MongoDB 應該已連接', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    test('可以創建簡單的文檔', async () => {
      const TestSchema = new mongoose.Schema({
        name: String,
        createdAt: { type: Date, default: Date.now }
      });
      
      const TestModel = mongoose.model('Test', TestSchema);
      
      const testDoc = new TestModel({ name: '測試文檔' });
      const savedDoc = await testDoc.save();
      
      expect(savedDoc._id).toBeDefined();
      expect(savedDoc.name).toBe('測試文檔');
      expect(savedDoc.createdAt).toBeDefined();
    });
  });

  describe('Express 應用測試', () => {
    test('應用應該處理 JSON 請求', async () => {
      // 添加一個接受 POST 的路由用於測試
      testApp.post('/test-json', (req, res) => {
        res.json({
          success: true,
          received: req.body,
          timestamp: new Date().toISOString()
        });
      });

      const testData = { message: '測試數據' };
      
      const response = await request(testApp)
        .post('/test-json')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.received).toEqual(testData);
    });

    test('不存在的路由應該返回 404', async () => {
      await request(testApp)
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('時間戳測試', () => {
    test('時間戳應該是有效的 ISO 字符串', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});