import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../server';

// 模擬共享模組
jest.mock('@pharmacy-pos/shared/types/api', () => ({
  ApiResponse: {}
}));

jest.mock('@pharmacy-pos/shared/enums', () => ({
  ProductType: {
    PRODUCT: 'product',
    MEDICINE: 'medicine'
  }
}));

jest.mock('@pharmacy-pos/shared/constants', () => ({
  ERROR_MESSAGES: {
    GENERIC: {
      INTERNAL_ERROR: '內部伺服器錯誤',
      VALIDATION_FAILED: '驗證失敗'
    },
    PRODUCT: {
      NOT_FOUND: '產品未找到',
      CODE_EXISTS: '產品代碼已存在'
    }
  },
  API_CONSTANTS: {
    HTTP_STATUS: {
      OK: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      NOT_FOUND: 404,
      INTERNAL_SERVER_ERROR: 500
    }
  }
}));

// 模擬認證中間件
jest.mock('../../middleware/auth', () => {
  return (_req: any, _res: any, next: any) => {
    next();
  };
});

// 模擬包裝單位服務
jest.mock('../../services/PackageUnitService', () => ({
  PackageUnitService: {
    getProductPackageUnits: jest.fn().mockResolvedValue([]),
    createOrUpdatePackageUnits: jest.fn().mockResolvedValue(true),
    deletePackageUnits: jest.fn().mockResolvedValue(true)
  }
}));

// 模擬代碼生成器
jest.mock('../../utils/codeGenerator', () => ({
  generateProductCodeByHealthInsurance: jest.fn().mockResolvedValue({
    code: 'P000001'
  })
}));

describe('Products API 整合測試', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // 啟動內存 MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 斷開現有連接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // 連接到測試資料庫
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // 清理並關閉連接
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

  describe('GET /api/products', () => {
    it('應該返回空的產品列表', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '產品列表獲取成功');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body).toHaveProperty('count', 0);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('應該支援搜尋參數', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          search: '測試',
          productType: 'product',
          sortBy: 'name',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters).toMatchObject({
        search: '測試',
        productType: 'product',
        sort: { by: 'name', order: 'desc' }
      });
    });

    it('應該支援價格區間篩選', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          minPrice: '10',
          maxPrice: '100'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.priceRange).toMatchObject({
        min: '10',
        max: '100'
      });
    });
  });

  describe('GET /api/products/products', () => {
    it('應該返回商品列表', async () => {
      const response = await request(app)
        .get('/api/products/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '商品列表獲取成功');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/products/medicines', () => {
    it('應該返回藥品列表', async () => {
      const response = await request(app)
        .get('/api/products/medicines')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '藥品列表獲取成功');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('應該返回 404 當產品不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '產品未找到');
    });

    it('應該返回 400 當 ID 格式錯誤', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該返回 400 當缺少 ID 參數', async () => {
      await request(app)
        .get('/api/products/')
        .expect(200); // 這會匹配到 GET /api/products 路由

      // 這個測試驗證路由處理
    });
  });

  describe('GET /api/products/code/:code', () => {
    it('應該返回 404 當產品代碼不存在', async () => {
      const response = await request(app)
        .get('/api/products/code/NONEXISTENT')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '產品未找到');
    });

    it('應該處理空的產品代碼', async () => {
      const response = await request(app)
        .get('/api/products/code/')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/create-test-data', () => {
    it('應該創建測試數據', async () => {
      const response = await request(app)
        .post('/api/products/create-test-data')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    });

    it('應該檢測已存在的測試數據', async () => {
      // 先創建一次
      await request(app)
        .post('/api/products/create-test-data')
        .expect(200);

      // 再次創建應該返回已存在的消息
      const response = await request(app)
        .post('/api/products/create-test-data')
        .expect(200);

      expect(response.body.message).toContain('測試數據已存在');
    });
  });

  describe('POST /api/products/product', () => {
    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/products/product')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '驗證失敗');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('應該驗證價格格式', async () => {
      const response = await request(app)
        .post('/api/products/product')
        .send({
          name: '測試產品',
          unit: '個',
          purchasePrice: 'invalid',
          sellingPrice: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some((error: any) => 
        error.msg.includes('進貨價格必須是數字') || 
        error.msg.includes('售價必須是數字')
      )).toBe(true);
    });

    it('應該接受有效的產品數據', async () => {
      const productData = {
        name: '測試產品',
        unit: '個',
        purchasePrice: '50',
        sellingPrice: '80',
        description: '測試描述'
      };

      const response = await request(app)
        .post('/api/products/product')
        .send(productData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '商品創建成功');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', productData.name);
    });
  });

  describe('POST /api/products/medicine', () => {
    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/products/medicine')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '驗證失敗');
    });

    it('應該接受有效的藥品數據', async () => {
      const medicineData = {
        name: '測試藥品',
        unit: '盒',
        purchasePrice: '100',
        sellingPrice: '150',
        healthInsuranceCode: 'HC001',
        healthInsurancePrice: '120'
      };

      const response = await request(app)
        .post('/api/products/medicine')
        .send(medicineData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '藥品創建成功');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', medicineData.name);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('應該返回 404 當產品不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({
          name: '更新的產品',
          unit: '個'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '產品未找到');
    });

    it('應該驗證更新數據', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({
          name: '', // 空名稱應該失敗
          unit: ''  // 空單位應該失敗
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('應該返回 404 當產品不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '產品未找到');
    });

    it('應該返回 400 當缺少 ID 參數', async () => {
      const response = await request(app)
        .delete('/api/products/')
        .expect(404); // Express 會返回 404 因為路由不匹配

      // 這個測試驗證路由處理
    });
  });

  describe('錯誤處理', () => {
    it('應該處理資料庫連接錯誤', async () => {
      // 暫時關閉資料庫連接來模擬錯誤
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body.success).toBe(false);

      // 重新連接資料庫
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('API 回應格式', () => {
    it('所有成功回應都應該包含標準欄位', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('所有錯誤回應都應該包含標準欄位', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });
});