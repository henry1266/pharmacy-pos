import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProductType } from '@pharmacy-pos/shared/enums';

// Mock BaseProduct 模型 - 必須在 import 之前定義
const mockBaseProduct = {
  find: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn()
};

const mockProduct = {
  find: jest.fn(),
  findById: jest.fn(),
  save: jest.fn()
};

const mockMedicine = {
  find: jest.fn(),
  findById: jest.fn(),
  save: jest.fn()
};

// Mock 相關模組
jest.mock('../../middleware/auth', () => {
  return jest.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-id' };
    next();
  });
});

jest.mock('../../services/PackageUnitService', () => ({
  PackageUnitService: {
    getProductPackageUnits: jest.fn().mockResolvedValue([]),
    createOrUpdatePackageUnits: jest.fn().mockResolvedValue(true),
    deletePackageUnits: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../utils/codeGenerator', () => ({
  generateProductCodeByHealthInsurance: jest.fn().mockResolvedValue({ code: 'P10001' })
}));

jest.mock('../../models/BaseProduct', () => {
  const MockProduct = class MockProduct {
    public _id: mongoose.Types.ObjectId;
    
    constructor(data: any) {
      Object.assign(this, data);
      this._id = new mongoose.Types.ObjectId();
    }
    save = mockProduct.save;
    toObject = jest.fn().mockReturnThis();
    static find = mockProduct.find;
    static findById = mockProduct.findById;
  };

  const MockMedicine = class MockMedicine {
    public _id: mongoose.Types.ObjectId;
    
    constructor(data: any) {
      Object.assign(this, data);
      this._id = new mongoose.Types.ObjectId();
    }
    save = mockMedicine.save;
    toObject = jest.fn().mockReturnThis();
    static find = mockMedicine.find;
    static findById = mockMedicine.findById;
  };

  // 支援 CommonJS require() 調用
  const mockModule = Object.assign(mockBaseProduct, {
    __esModule: true,
    default: mockBaseProduct,
    Product: MockProduct,
    Medicine: MockMedicine
  });

  return mockModule;
});

// 現在可以安全地導入 productsRouter
import productsRouter from '../products';

describe('Products Routes', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // 斷開現有連接（如果有的話）
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // 創建 MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 連接到測試資料庫
    await mongoose.connect(mongoUri);
    
    // 設置 Express 應用
    app = express();
    app.use(express.json());
    app.use('/api/products', productsRouter);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('應該返回所有產品列表', async () => {
      const mockProducts = [
        {
          _id: new mongoose.Types.ObjectId(),
          code: 'P10001',
          name: '測試商品',
          productType: ProductType.PRODUCT,
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            code: 'P10001',
            name: '測試商品'
          })
        }
      ];

      mockBaseProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockProducts)
          })
        })
      });

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('產品列表獲取成功');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('應該支援搜尋功能', async () => {
      mockBaseProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
          })
        })
      });

      const response = await request(app)
        .get('/api/products?search=測試')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockBaseProduct.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: expect.any(RegExp) },
            { code: expect.any(RegExp) }
          ])
        })
      );
    });

    it('應該支援產品類型篩選', async () => {
      mockBaseProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
          })
        })
      });

      await request(app)
        .get('/api/products?productType=product')
        .expect(200);

      expect(mockBaseProduct.find).toHaveBeenCalledWith(
        expect.objectContaining({
          productType: 'product'
        })
      );
    });

    it('應該支援價格區間篩選', async () => {
      mockBaseProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
          })
        })
      });

      await request(app)
        .get('/api/products?minPrice=10&maxPrice=100')
        .expect(200);

      expect(mockBaseProduct.find).toHaveBeenCalledWith(
        expect.objectContaining({
          sellingPrice: { $gte: 10, $lte: 100 }
        })
      );
    });

    it('應該處理資料庫錯誤', async () => {
      mockBaseProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/products/products', () => {
    it('應該返回所有商品（非藥品）', async () => {
      const mockProducts = [
        { _id: new mongoose.Types.ObjectId(), name: '商品1', productType: ProductType.PRODUCT }
      ];

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockProducts)
          })
        })
      });

      const response = await request(app)
        .get('/api/products/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('商品列表獲取成功');
    });
  });

  describe('GET /api/products/medicines', () => {
    it('應該返回所有藥品', async () => {
      const mockMedicines = [
        { _id: new mongoose.Types.ObjectId(), name: '藥品1', productType: ProductType.MEDICINE }
      ];

      mockMedicine.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockMedicines)
          })
        })
      });

      const response = await request(app)
        .get('/api/products/medicines')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('藥品列表獲取成功');
    });
  });

  describe('GET /api/products/code/:code', () => {
    it('應該根據產品代碼返回產品', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId(),
        code: 'P10001',
        name: '測試商品'
      };

      mockBaseProduct.findByCode.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/products/code/P10001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('P10001');
    });

    it('應該處理產品不存在的情況', async () => {
      mockBaseProduct.findByCode.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/code/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/:id', () => {
    it('應該根據ID返回產品', async () => {
      const productId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: productId,
        code: 'P10001',
        name: '測試商品',
        toObject: jest.fn().mockReturnValue({
          _id: productId,
          code: 'P10001',
          name: '測試商品'
        })
      };

      mockBaseProduct.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProduct)
        })
      });

      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('P10001');
    });

    it('應該處理缺少ID參數的情況', async () => {
      // 當訪問 /api/products/ 時，實際上會匹配到 GET /api/products 路由
      // 所以我們需要 mock 產品列表的查詢
      mockBaseProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
          })
        })
      });

      const response = await request(app)
        .get('/api/products/')
        .expect(200); // 實際上會返回產品列表

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('產品列表獲取成功');
    });

    it('應該處理產品不存在的情況', async () => {
      const productId = new mongoose.Types.ObjectId();
      
      mockBaseProduct.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的ID格式', async () => {
      mockBaseProduct.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(Object.assign(new Error('Cast error'), { name: 'CastError' }))
        })
      });

      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/product', () => {
    it('應該創建新商品', async () => {
      const newProductData = {
        name: '新商品',
        unit: '個',
        purchasePrice: 50,
        sellingPrice: 80
      };

      const savedProduct = {
        _id: new mongoose.Types.ObjectId(),
        ...newProductData,
        code: 'P10001'
      };

      mockBaseProduct.findByCode.mockResolvedValue(null);
      mockProduct.save.mockResolvedValue(savedProduct);
      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(savedProduct)
        })
      });

      const response = await request(app)
        .post('/api/products/product')
        .send(newProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('商品創建成功');
    });

    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/products/product')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });

    it('應該檢查重複的產品代碼', async () => {
      const existingProduct = { code: 'P10001', name: '現有商品' };
      mockBaseProduct.findByCode.mockResolvedValue(existingProduct);

      const response = await request(app)
        .post('/api/products/product')
        .send({
          code: 'P10001',
          name: '新商品',
          unit: '個'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/medicine', () => {
    it('應該創建新藥品', async () => {
      const newMedicineData = {
        name: '新藥品',
        unit: '盒',
        purchasePrice: 100,
        sellingPrice: 150,
        healthInsuranceCode: 'HC001'
      };

      const savedMedicine = {
        _id: new mongoose.Types.ObjectId(),
        ...newMedicineData,
        code: 'M10001'
      };

      mockBaseProduct.findByCode.mockResolvedValue(null);
      mockMedicine.save.mockResolvedValue(savedMedicine);
      mockMedicine.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(savedMedicine)
        })
      });

      const response = await request(app)
        .post('/api/products/medicine')
        .send(newMedicineData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('藥品創建成功');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('應該更新產品', async () => {
      const productId = new mongoose.Types.ObjectId();
      const existingProduct = {
        _id: productId,
        code: 'P10001',
        name: '原商品'
      };

      const updatedProduct = {
        _id: productId,
        code: 'P10001',
        name: '更新商品'
      };

      mockBaseProduct.findById.mockResolvedValue(existingProduct);
      mockBaseProduct.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedProduct)
        })
      });

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({
          name: '更新商品',
          unit: '個'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('產品更新成功');
    });

    it('應該處理產品不存在的情況', async () => {
      const productId = new mongoose.Types.ObjectId();
      mockBaseProduct.findById.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({
          name: '更新商品',
          unit: '個'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('應該軟刪除產品', async () => {
      const productId = new mongoose.Types.ObjectId();
      const existingProduct = {
        _id: productId,
        code: 'P10001',
        name: '測試商品',
        isActive: true
      };

      const deletedProduct = {
        ...existingProduct,
        isActive: false
      };

      mockBaseProduct.findById.mockResolvedValue(existingProduct);
      mockBaseProduct.findByIdAndUpdate.mockResolvedValue(deletedProduct);

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('產品刪除成功');
    });

    it('應該處理缺少ID參數的情況', async () => {
      await request(app)
        .delete('/api/products/')
        .expect(404); // Express 路由不匹配
    });
  });

  describe('PUT /api/products/:id/package-units', () => {
    it('應該更新產品包裝單位', async () => {
      const productId = new mongoose.Types.ObjectId();
      const existingProduct = {
        _id: productId,
        code: 'P10001',
        name: '測試商品'
      };

      mockBaseProduct.findById.mockResolvedValue(existingProduct);

      const response = await request(app)
        .put(`/api/products/${productId}/package-units`)
        .send({
          packageUnits: [
            { name: '盒', quantity: 10, isDefault: true }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('包裝單位更新成功');
    });
  });

  describe('POST /api/products/create-test-data', () => {
    it('應該創建測試數據', async () => {
      mockBaseProduct.countDocuments.mockResolvedValue(0);
      mockProduct.save.mockResolvedValue(true);
      mockMedicine.save.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/products/create-test-data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('測試數據創建成功');
    });

    it('應該檢查現有數據', async () => {
      mockBaseProduct.countDocuments.mockResolvedValue(5);

      const response = await request(app)
        .post('/api/products/create-test-data')
        .expect(200);

      expect(response.body.message).toBe('測試數據已存在');
    });
  });
});