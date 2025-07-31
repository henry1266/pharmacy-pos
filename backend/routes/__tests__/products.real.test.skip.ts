import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ProductType } from '@pharmacy-pos/shared/enums';
import { ERROR_MESSAGES, API_CONSTANTS } from '@pharmacy-pos/shared/constants';

describe('真實產品 API 測試', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;

  beforeAll(async () => {
    // 增加超時時間以處理 MongoDB 下載
    jest.setTimeout(60000);
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    
    // 創建應用程序實例
    app = createApp();
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // 清理所有集合
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('產品列表 API', () => {
    test('GET /api/products 應該返回空的產品列表', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any[]>;
      expect(apiResponse.success).toBe(true);
      expect(Array.isArray(apiResponse.data)).toBe(true);
      expect(apiResponse.data).toHaveLength(0);
      expect(apiResponse.timestamp).toBeDefined();
    });

    test('GET /api/products/products 應該返回商品列表', async () => {
      const response = await request(app)
        .get('/api/products/products')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any[]>;
      expect(apiResponse.success).toBe(true);
      expect(Array.isArray(apiResponse.data)).toBe(true);
    });

    test('GET /api/products/medicines 應該返回藥品列表', async () => {
      const response = await request(app)
        .get('/api/products/medicines')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any[]>;
      expect(apiResponse.success).toBe(true);
      expect(Array.isArray(apiResponse.data)).toBe(true);
    });
  });

  describe('產品創建 API', () => {
    test('POST /api/products/create-test-data 應該創建測試數據', async () => {
      const response = await request(app)
        .post('/api/products/create-test-data')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data).toBeDefined();
    });

    test('POST /api/products/product 缺少必填欄位應該返回 400', async () => {
      const response = await request(app)
        .post('/api/products/product')
        .send({})
        .expect(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toBeDefined();
    });

    test('POST /api/products/medicine 缺少必填欄位應該返回 400', async () => {
      const response = await request(app)
        .post('/api/products/medicine')
        .send({})
        .expect(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toBeDefined();
    });

    test('POST /api/products/product 有效數據應該創建產品', async () => {
      const productData = {
        code: 'TEST001',
        name: '測試產品',
        unit: '盒',
        price: 100,
        cost: 80,
        productType: ProductType.PRODUCT,
        description: '這是一個測試產品'
      };

      const response = await request(app)
        .post('/api/products/product')
        .send(productData)
        .expect(API_CONSTANTS.HTTP_STATUS.CREATED);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data).toBeDefined();
      expect(apiResponse.data.code).toBe(productData.code);
      expect(apiResponse.data.name).toBe(productData.name);
    });

    test('POST /api/products/medicine 有效數據應該創建藥品', async () => {
      const medicineData = {
        code: 'MED001',
        name: '測試藥品',
        unit: '盒',
        price: 200,
        cost: 150,
        productType: ProductType.MEDICINE,
        medicineInfo: {
          licenseNumber: 'LIC001',
          ingredients: '測試成分',
          dosage: '每日三次'
        }
      };

      const response = await request(app)
        .post('/api/products/medicine')
        .send(medicineData)
        .expect(API_CONSTANTS.HTTP_STATUS.CREATED);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data).toBeDefined();
      expect(apiResponse.data.code).toBe(medicineData.code);
      expect(apiResponse.data.name).toBe(medicineData.name);
      expect(apiResponse.data.medicineInfo).toBeDefined();
    });
  });

  describe('產品查詢 API', () => {
    test('GET /api/products/:id 不存在的產品應該返回 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toContain(ERROR_MESSAGES.PRODUCT.NOT_FOUND);
    });

    test('GET /api/products/code/:code 不存在的產品代碼應該返回 404', async () => {
      const response = await request(app)
        .get('/api/products/code/NONEXISTENT')
        .expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
    });

    test('GET /api/products 支援搜尋參數', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          search: '測試', 
          productType: ProductType.PRODUCT,
          page: 1,
          limit: 10
        })
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data).toBeDefined();
    });

    test('GET /api/products 支援價格篩選', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          minPrice: '10', 
          maxPrice: '100',
          sortBy: 'price',
          sortOrder: 'asc'
        })
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse.success).toBe(true);
    });
  });

  describe('錯誤處理測試', () => {
    test('無效的產品 ID 格式應該返回 404', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id-format')
        .expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
    });

    test('重複的產品代碼應該返回衝突錯誤', async () => {
      // 先創建一個產品
      const productData = {
        code: 'DUPLICATE001',
        name: '重複測試產品',
        unit: '盒',
        price: 100,
        productType: ProductType.PRODUCT
      };

      await request(app)
        .post('/api/products/product')
        .send(productData)
        .expect(API_CONSTANTS.HTTP_STATUS.CREATED);

      // 嘗試創建相同代碼的產品
      const response = await request(app)
        .post('/api/products/product')
        .send(productData)
        .expect(API_CONSTANTS.HTTP_STATUS.CONFLICT);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toContain(ERROR_MESSAGES.PRODUCT.CODE_EXISTS);
    });
  });

  describe('API 回應格式測試', () => {
    test('成功回應應該符合 ApiResponse 格式', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse).toHaveProperty('success');
      expect(apiResponse).toHaveProperty('data');
      expect(apiResponse).toHaveProperty('message');
      expect(apiResponse).toHaveProperty('timestamp');
      expect(typeof apiResponse.success).toBe('boolean');
      expect(typeof apiResponse.timestamp).toBe('string');
    });

    test('錯誤回應應該符合 ErrorResponse 格式', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse).toHaveProperty('success', false);
      expect(errorResponse).toHaveProperty('message');
      expect(errorResponse).toHaveProperty('timestamp');
      expect(typeof errorResponse.message).toBe('string');
      expect(typeof errorResponse.timestamp).toBe('string');
    });

    test('時間戳應該是有效的 ISO 字符串', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any>;
      const timestamp = apiResponse.timestamp as string;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('共享常數測試', () => {
    test('應該能正確使用 shared 模組的常數', () => {
      expect(ProductType.PRODUCT).toBe('product');
      expect(ProductType.MEDICINE).toBe('medicine');
      expect(API_CONSTANTS.HTTP_STATUS.OK).toBe(200);
      expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(ERROR_MESSAGES.PRODUCT.NOT_FOUND).toBe('找不到產品');
      expect(ERROR_MESSAGES.PRODUCT.CODE_EXISTS).toBe('產品代碼已存在');
    });
  });
});