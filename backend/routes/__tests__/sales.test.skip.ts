import request from 'supertest';
import { createApp } from '../../app';
import Sale from '../../models/Sale';
import BaseProduct from '../../models/BaseProduct';
import Customer from '../../models/Customer';
import Inventory from '../../models/Inventory';
import { ProductType } from '@pharmacy-pos/shared/enums';
import mongoose from 'mongoose';

describe('Sales API', () => {
  let app: any;
  let testProduct: any;
  let testCustomer: any;

  beforeAll(async () => {
    app = await createApp();
    
    // 設置測試模式環境變數
    process.env.REACT_APP_TEST_MODE = 'true';
  });

  afterAll(async () => {
    // 清理由 test/setup.ts 管理的連接
  });

  beforeEach(async () => {
    // 清理所有集合
    await Sale.deleteMany({});
    await BaseProduct.deleteMany({});
    await Customer.deleteMany({});
    await Inventory.deleteMany({});

    // 創建測試產品
    testProduct = await BaseProduct.create({
      code: 'P001',
      shortCode: 'P001',
      name: '測試產品',
      unit: '個',
      purchasePrice: 50,
      sellingPrice: 80,
      productType: ProductType.PRODUCT,
      isActive: true
    });

    // 創建測試客戶
    testCustomer = await Customer.create({
      code: 'C001',
      name: '測試客戶',
      phone: '0912345678',
      email: 'test@example.com'
    });

    // 創建初始庫存
    await Inventory.create({
      product: testProduct._id,
      quantity: 100,
      type: 'purchase',
      lastUpdated: new Date()
    });
  });

  describe('GET /api/sales', () => {
    beforeEach(async () => {
      // 創建測試銷售記錄
      await Sale.create([
        {
          saleNumber: 'S001',
          customer: testCustomer._id,
          items: [{
            product: testProduct._id,
            quantity: 2,
            price: 80,
            subtotal: 160
          }],
          totalAmount: 160,
          paymentMethod: 'cash',
          paymentStatus: 'paid'
        },
        {
          saleNumber: 'S002',
          items: [{
            product: testProduct._id,
            quantity: 1,
            price: 80,
            subtotal: 80
          }],
          totalAmount: 80,
          paymentMethod: 'credit_card',
          paymentStatus: 'paid'
        }
      ]);
    });

    it('應該返回所有銷售記錄', async () => {
      const response = await request(app)
        .get('/api/sales')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('應該支援搜尋功能', async () => {
      const response = await request(app)
        .get('/api/sales?search=S001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].saleNumber).toBe('S001');
    });

    it('應該支援萬用字元搜尋', async () => {
      const response = await request(app)
        .get('/api/sales?wildcardSearch=S00*')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sales/:id', () => {
    let saleId: string;

    beforeEach(async () => {
      const sale = await Sale.create({
        saleNumber: 'S001',
        customer: testCustomer._id,
        items: [{
          product: testProduct._id,
          quantity: 2,
          price: 80,
          subtotal: 160
        }],
        totalAmount: 160,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      });
      saleId = sale._id.toString();
    });

    it('應該返回指定的銷售記錄', async () => {
      const response = await request(app)
        .get(`/api/sales/${saleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.saleNumber).toBe('S001');
      expect(response.body.data.totalAmount).toBe(160);
    });

    it('應該處理不存在的銷售記錄', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/sales/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的ID格式', async () => {
      const response = await request(app)
        .get('/api/sales/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/sales', () => {
    const validSaleData = {
      items: [{
        product: '', // 將在測試中設置
        quantity: 2,
        price: 80,
        subtotal: 160
      }],
      totalAmount: 160,
      paymentMethod: 'cash',
      paymentStatus: 'paid'
    };

    beforeEach(() => {
      validSaleData.items[0].product = testProduct._id.toString();
    });

    it('應該創建新的銷售記錄', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(validSaleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBe(160);
      expect(response.body.data.saleNumber).toBeDefined();

      // 驗證庫存是否正確扣除
      const inventoryRecords = await Inventory.find({
        product: testProduct._id,
        type: 'sale'
      });
      expect(inventoryRecords).toHaveLength(1);
      expect(inventoryRecords[0].quantity).toBe(-2);
    });

    it('應該處理包含客戶的銷售', async () => {
      const saleWithCustomer = {
        ...validSaleData,
        customer: testCustomer._id.toString()
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(saleWithCustomer)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toBeDefined();
    });

    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該檢查產品是否存在', async () => {
      const invalidSaleData = {
        ...validSaleData,
        items: [{
          product: new mongoose.Types.ObjectId().toString(),
          quantity: 1,
          price: 80,
          subtotal: 80
        }]
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(invalidSaleData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該檢查客戶是否存在', async () => {
      const invalidSaleData = {
        ...validSaleData,
        customer: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(invalidSaleData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該允許負庫存銷售', async () => {
      // 創建庫存不足的情況
      await Inventory.deleteMany({ product: testProduct._id });
      await Inventory.create({
        product: testProduct._id,
        quantity: 1, // 只有1個庫存
        type: 'purchase'
      });

      const largeSaleData = {
        ...validSaleData,
        items: [{
          product: testProduct._id.toString(),
          quantity: 5, // 要求5個，但只有1個庫存
          price: 80,
          subtotal: 400
        }],
        totalAmount: 400
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(largeSaleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // 驗證庫存變為負數
      const totalInventory = await Inventory.aggregate([
        { $match: { product: testProduct._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);
      expect(totalInventory[0].total).toBe(-4); // 1 - 5 = -4
    });
  });

  describe('PUT /api/sales/:id', () => {
    let saleId: string;

    beforeEach(async () => {
      const sale = await Sale.create({
        saleNumber: 'S001',
        items: [{
          product: testProduct._id,
          quantity: 2,
          price: 80,
          subtotal: 160
        }],
        totalAmount: 160,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      });
      saleId = sale._id.toString();
    });

    it('應該更新銷售記錄', async () => {
      const updateData = {
        items: [{
          product: testProduct._id.toString(),
          quantity: 3,
          price: 80,
          subtotal: 240
        }],
        totalAmount: 240,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid'
      };

      const response = await request(app)
        .put(`/api/sales/${saleId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBe(240);
      expect(response.body.data.paymentMethod).toBe('credit_card');
    });

    it('應該處理不存在的銷售記錄', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/sales/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({
          items: [{ product: testProduct._id, quantity: 1, price: 80, subtotal: 80 }],
          totalAmount: 80
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該更新庫存記錄', async () => {
      const updateData = {
        items: [{
          product: testProduct._id.toString(),
          quantity: 5, // 從2改為5
          price: 80,
          subtotal: 400
        }],
        totalAmount: 400
      };

      await request(app)
        .put(`/api/sales/${saleId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send(updateData)
        .expect(200);

      // 驗證舊的庫存記錄被刪除，新的被創建
      const afterUpdate = await Inventory.find({ 
        product: testProduct._id,
        type: 'sale'
      });

      expect(afterUpdate).toHaveLength(1);
      expect(afterUpdate[0].quantity).toBe(-5);
    });
  });

  describe('DELETE /api/sales/:id', () => {
    let saleId: string;

    beforeEach(async () => {
      const sale = await Sale.create({
        saleNumber: 'S001',
        items: [{
          product: testProduct._id,
          quantity: 2,
          price: 80,
          subtotal: 160
        }],
        totalAmount: 160,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      });
      saleId = sale._id.toString();

      // 創建對應的庫存記錄
      await Inventory.create({
        product: testProduct._id,
        quantity: -2,
        type: 'sale',
        saleId: sale._id
      });
    });

    it('應該刪除銷售記錄', async () => {
      const response = await request(app)
        .delete(`/api/sales/${saleId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(saleId);

      // 驗證記錄確實被刪除
      const deletedSale = await Sale.findById(saleId);
      expect(deletedSale).toBeNull();
    });

    it('應該恢復庫存', async () => {
      await request(app)
        .delete(`/api/sales/${saleId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      // 驗證相關的庫存記錄被刪除（恢復庫存）
      const inventoryRecords = await Inventory.find({
        saleId: new mongoose.Types.ObjectId(saleId)
      });
      expect(inventoryRecords).toHaveLength(0);
    });

    it('應該處理不存在的銷售記錄', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/sales/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('業務邏輯測試', () => {
    it('應該正確計算銷售總額', async () => {
      const saleData = {
        items: [
          {
            product: testProduct._id.toString(),
            quantity: 2,
            price: 80,
            subtotal: 160
          },
          {
            product: testProduct._id.toString(),
            quantity: 1,
            price: 80,
            subtotal: 80
          }
        ],
        totalAmount: 240,
        discount: 20,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(saleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBe(240);
      expect(response.body.data.discount).toBe(20);
    });

    it('應該處理不扣庫存的產品', async () => {
      // 創建不扣庫存的產品
      const noStockProduct = await BaseProduct.create({
        code: 'P002',
        shortCode: 'P002',
        name: '不扣庫存產品',
        unit: '個',
        purchasePrice: 30,
        sellingPrice: 50,
        productType: ProductType.PRODUCT,
        excludeFromStock: true,
        isActive: true
      });

      const saleData = {
        items: [{
          product: (noStockProduct as any)._id.toString(),
          quantity: 5,
          price: 50,
          subtotal: 250
        }],
        totalAmount: 250,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(saleData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 驗證創建了特殊的庫存記錄
      const inventoryRecords = await Inventory.find({
        product: (noStockProduct as any)._id,
        type: 'sale-no-stock'
      });
      expect(inventoryRecords).toHaveLength(1);
      expect(inventoryRecords[0].quantity).toBe(5); // 正數，不扣庫存
    });

    it('應該更新客戶購買記錄', async () => {
      const saleData = {
        customer: testCustomer._id.toString(),
        items: [{
          product: testProduct._id.toString(),
          quantity: 2,
          price: 80,
          subtotal: 160
        }],
        totalAmount: 160,
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      };

      await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send(saleData)
        .expect(200);

      // 驗證客戶記錄被更新
      const updatedCustomer = await Customer.findById(testCustomer._id);
      expect(updatedCustomer?.totalPurchases).toBe(160);
      expect(updatedCustomer?.lastPurchaseDate).toBeDefined();
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理資料庫連接錯誤', async () => {
      // 模擬資料庫錯誤
      const mockFind = jest.spyOn(Sale, 'find').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/sales')
        .expect(500);

      expect(response.body.success).toBe(false);
      
      // 恢復原始方法
      mockFind.mockRestore();
    });

    it('應該處理無效的 ObjectId', async () => {
      const response = await request(app)
        .get('/api/sales/invalid-object-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理空的請求體', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', 'Bearer test-mode-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});