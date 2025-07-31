// 在導入任何模組之前設置環境變數
process.env.REACT_APP_TEST_MODE = 'true';
process.env.NODE_ENV = 'test';

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ProductType } from '@pharmacy-pos/shared/enums';
import { ERROR_MESSAGES, API_CONSTANTS } from '@pharmacy-pos/shared/constants';

describe('使用 Shared 模組的產品 API 測試', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;

  beforeAll(async () => {
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
    // 確保所有連接都正確關閉
    await mongoose.connection.close();
    await mongoServer.stop();
    
    // 強制關閉所有 mongoose 連接
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('基本 API 測試', () => {
    test('GET /api/products 應該返回符合 ApiResponse 格式的產品列表', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any[]>;
      expect(apiResponse.success).toBe(true);
      expect(Array.isArray(apiResponse.data)).toBe(true);
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

  describe('產品創建測試', () => {
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
        .set('Authorization', 'Bearer test-mode-token') // 使用正確的認證標頭
        .send({})
        .expect(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toBeDefined();
    });

    test('POST /api/products/product 有效數據應該創建產品', async () => {
      const productData = {
        code: 'TEST001',
        shortCode: 'T001',
        name: '測試產品',
        unit: '盒',
        purchasePrice: 80,
        sellingPrice: 100,
        productType: ProductType.PRODUCT,
        description: '這是一個測試產品'
      };

      const response = await request(app)
        .post('/api/products/product')
        .set('Authorization', 'Bearer test-mode-token') // 使用正確的認證標頭
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
        shortCode: 'M001',
        name: '測試藥品',
        unit: '盒',
        purchasePrice: 150,
        sellingPrice: 200,
        productType: ProductType.MEDICINE,
        medicineInfo: {
          licenseNumber: 'LIC001',
          ingredients: '測試成分',
          dosage: '每日三次'
        }
      };

      const response = await request(app)
        .post('/api/products/medicine')
        .set('Authorization', 'Bearer test-mode-token') // 使用正確的認證標頭
        .send(medicineData)
        .expect(API_CONSTANTS.HTTP_STATUS.CREATED);

      const apiResponse = response.body as ApiResponse<any>;
      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data).toBeDefined();
      expect(apiResponse.data.code).toBe(medicineData.code);
      expect(apiResponse.data.name).toBe(medicineData.name);
      // 檢查藥品特有欄位，medicineInfo 可能不會直接返回，但藥品類型應該正確
      expect(apiResponse.data.productType).toBe(ProductType.MEDICINE);
    });
  });

  describe('錯誤處理測試', () => {
    test('GET /api/products/:id 不存在的產品應該返回 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toContain(ERROR_MESSAGES.PRODUCT.NOT_FOUND);
    });

    test('重複的產品代碼應該返回衝突錯誤', async () => {
      const productData = {
        code: 'DUPLICATE001',
        shortCode: 'D001',
        name: '重複測試產品',
        unit: '盒',
        purchasePrice: 80,
        sellingPrice: 100,
        productType: ProductType.PRODUCT
      };

      // 先創建一個產品
      await request(app)
        .post('/api/products/product')
        .set('Authorization', 'Bearer test-mode-token') // 使用正確的認證標頭
        .send(productData)
        .expect(API_CONSTANTS.HTTP_STATUS.CREATED);

      // 嘗試創建相同代碼的產品，期望返回 409 CONFLICT
      const response = await request(app)
        .post('/api/products/product')
        .set('Authorization', 'Bearer test-mode-token') // 使用正確的認證標頭
        .send(productData)
        .expect(API_CONSTANTS.HTTP_STATUS.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(ERROR_MESSAGES.PRODUCT.CODE_EXISTS);
    });
  });

  describe('Shared 常數驗證測試', () => {
    test('應該能正確使用 shared 模組的常數', () => {
      expect(ProductType.PRODUCT).toBe('product');
      expect(ProductType.MEDICINE).toBe('medicine');
      expect(API_CONSTANTS.HTTP_STATUS.OK).toBe(200);
      expect(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(ERROR_MESSAGES.PRODUCT.NOT_FOUND).toBe('找不到產品');
      expect(ERROR_MESSAGES.PRODUCT.CODE_EXISTS).toBe('產品代碼已存在');
    });

    test('API 回應格式應該符合 shared 型別定義', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(API_CONSTANTS.HTTP_STATUS.OK);

      const apiResponse = response.body as ApiResponse<any>;
      
      // 驗證 ApiResponse 介面
      expect(typeof apiResponse.success).toBe('boolean');
      expect(apiResponse.data).toBeDefined();
      expect(typeof apiResponse.message).toBe('string');
      expect(typeof apiResponse.timestamp).toBe('string');
      
      // 驗證時間戳格式
      expect(new Date(apiResponse.timestamp as string).toISOString()).toBe(apiResponse.timestamp);
    });
  });

  describe('搜尋和篩選測試', () => {
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
});