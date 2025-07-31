import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import productsRouter from '../products';
import BaseProduct from '../../models/BaseProduct';
import { ProductType } from '@pharmacy-pos/shared/enums';

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('Products API', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await BaseProduct.deleteMany({});
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // 創建測試產品
      await BaseProduct.create([
        {
          code: 'P001',
          name: '測試產品A',
          unit: '個',
          purchasePrice: 50,
          sellingPrice: 80,
          productType: ProductType.PRODUCT,
          isActive: true
        },
        {
          code: 'M001',
          name: '測試藥品A',
          unit: '盒',
          purchasePrice: 100,
          sellingPrice: 150,
          productType: ProductType.MEDICINE,
          isActive: true
        },
        {
          code: 'P002',
          name: '停用產品',
          unit: '個',
          purchasePrice: 30,
          sellingPrice: 50,
          productType: ProductType.PRODUCT,
          isActive: false
        }
      ]);
    });

    it('應該返回所有啟用的產品', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((p: any) => p.isActive !== false)).toBe(true);
    });

    it('應該支援產品名稱搜尋', async () => {
      const response = await request(app)
        .get('/api/products?search=測試產品')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('測試產品A');
    });

    it('應該支援產品類型篩選', async () => {
      const response = await request(app)
        .get('/api/products?productType=medicine')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].productType).toBe(ProductType.MEDICINE);
    });

    it('應該支援價格區間篩選', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=60&maxPrice=120')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].sellingPrice).toBe(80);
    });

    it('應該支援排序', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=sellingPrice&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].sellingPrice).toBe(150);
      expect(response.body.data[1].sellingPrice).toBe(80);
    });
  });

  describe('GET /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await BaseProduct.create({
        code: 'P001',
        name: '測試產品',
        unit: '個',
        purchasePrice: 50,
        sellingPrice: 80,
        productType: ProductType.PRODUCT,
        isActive: true
      });
      productId = product._id.toString();
    });

    it('應該返回指定的產品', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('測試產品');
      expect(response.body.data.packageUnits).toBeDefined();
    });

    it('應該處理不存在的產品ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的產品ID格式', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/code/:code', () => {
    beforeEach(async () => {
      await BaseProduct.create({
        code: 'P001',
        name: '測試產品',
        unit: '個',
        purchasePrice: 50,
        sellingPrice: 80,
        productType: ProductType.PRODUCT,
        isActive: true
      });
    });

    it('應該根據產品代碼返回產品', async () => {
      const response = await request(app)
        .get('/api/products/code/P001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('P001');
    });

    it('應該處理不存在的產品代碼', async () => {
      const response = await request(app)
        .get('/api/products/code/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理大小寫不敏感的搜尋', async () => {
      const response = await request(app)
        .get('/api/products/code/p001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('P001');
    });
  });

  describe('POST /api/products/product', () => {
    const validProductData = {
      name: '新產品',
      unit: '個',
      purchasePrice: 50,
      sellingPrice: 80,
      description: '測試產品描述'
    };

    it('應該創建新產品', async () => {
      const response = await request(app)
        .post('/api/products/product')
        .send(validProductData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('新產品');
      expect(response.body.data.code).toBeDefined();
    });

    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/products/product')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });

    it('應該檢查產品代碼重複', async () => {
      await BaseProduct.create({
        code: 'P001',
        name: '現有產品',
        unit: '個',
        purchasePrice: 50,
        sellingPrice: 80,
        productType: ProductType.PRODUCT
      });

      const response = await request(app)
        .post('/api/products/product')
        .send({
          ...validProductData,
          code: 'P001'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該處理包裝單位數據', async () => {
      const productWithPackageUnits = {
        ...validProductData,
        packageUnits: [
          { unitName: '盒', unitValue: 100, priority: 1, isBaseUnit: false, isActive: true },
          { unitName: '粒', unitValue: 1, priority: 2, isBaseUnit: true, isActive: true }
        ]
      };

      const response = await request(app)
        .post('/api/products/product')
        .send(productWithPackageUnits)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('新產品');
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await BaseProduct.create({
        code: 'P001',
        name: '原始產品',
        unit: '個',
        purchasePrice: 50,
        sellingPrice: 80,
        productType: ProductType.PRODUCT,
        isActive: true
      });
      productId = product._id.toString();
    });

    it('應該更新產品資訊', async () => {
      const updateData = {
        name: '更新後的產品',
        sellingPrice: 90
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新後的產品');
      expect(response.body.data.sellingPrice).toBe(90);
    });

    it('應該驗證更新數據', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該處理不存在的產品', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({ name: '測試' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await BaseProduct.create({
        code: 'P001',
        name: '待刪除產品',
        unit: '個',
        purchasePrice: 50,
        sellingPrice: 80,
        productType: ProductType.PRODUCT,
        isActive: true
      });
      productId = product._id.toString();
    });

    it('應該軟刪除產品', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);

      // 驗證產品確實被軟刪除
      const deletedProduct = await BaseProduct.findById(productId);
      expect(deletedProduct?.isActive).toBe(false);
    });

    it('應該處理不存在的產品', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});