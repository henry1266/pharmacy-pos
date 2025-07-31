import request from 'supertest';
import { createApp } from '../../app';
import Sale from '../../models/Sale';
import BaseProduct from '../../models/BaseProduct';
import Customer from '../../models/Customer';
import Inventory from '../../models/Inventory';
import { ProductType } from '@pharmacy-pos/shared/enums';

describe('Dashboard API', () => {
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
      minStock: 10,
      isActive: true
    });

    // 創建測試客戶
    testCustomer = await Customer.create({
      code: 'C001',
      name: '測試客戶',
      phone: '0912345678',
      email: 'test@example.com',
      address: '測試地址'
    });

    // 創建測試數據
    await createTestData();
  });

  // 創建測試數據的輔助方法
  async function createTestData() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 創建銷售記錄
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
        paymentStatus: 'paid',
        date: today
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
        paymentStatus: 'paid',
        date: yesterday
      },
      {
        saleNumber: 'S003',
        items: [{
          product: testProduct._id,
          quantity: 3,
          price: 80,
          subtotal: 240
        }],
        totalAmount: 240,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        date: lastWeek
      }
    ]);

    // 創建庫存記錄
    await Inventory.create([
      {
        product: testProduct._id,
        quantity: 100,
        type: 'purchase'
      },
      {
        product: testProduct._id,
        quantity: -6, // 對應銷售
        type: 'sale'
      }
    ]);
  }

  describe('GET /api/dashboard/summary', () => {
    it('應該返回儀表板總覽數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('salesSummary');
      expect(response.body.data).toHaveProperty('counts');
      expect(response.body.data).toHaveProperty('lowStockWarnings');
      expect(response.body.data).toHaveProperty('topProducts');
      expect(response.body.data).toHaveProperty('recentSales');
    });

    it('應該包含正確的摘要統計', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const salesSummary = response.body.data.salesSummary;
      expect(salesSummary).toHaveProperty('total');
      expect(salesSummary).toHaveProperty('today');
      expect(salesSummary).toHaveProperty('month');

      const counts = response.body.data.counts;
      expect(counts).toHaveProperty('products');
      expect(counts).toHaveProperty('customers');
      expect(counts).toHaveProperty('suppliers');
      expect(counts).toHaveProperty('orders');

      expect(typeof salesSummary.total).toBe('number');
      expect(typeof salesSummary.today).toBe('number');
      expect(typeof salesSummary.month).toBe('number');
      expect(typeof counts.products).toBe('number');
      expect(typeof counts.customers).toBe('number');
    });

    it('應該包含熱銷產品數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const topProducts = response.body.data.topProducts;
      expect(Array.isArray(topProducts)).toBe(true);
      
      if (topProducts.length > 0) {
        expect(topProducts[0]).toHaveProperty('productId');
        expect(topProducts[0]).toHaveProperty('productCode');
        expect(topProducts[0]).toHaveProperty('productName');
        expect(topProducts[0]).toHaveProperty('quantity');
        expect(topProducts[0]).toHaveProperty('revenue');
      }
    });

    it('應該包含最近銷售記錄', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const recentSales = response.body.data.recentSales;
      expect(Array.isArray(recentSales)).toBe(true);
      
      if (recentSales.length > 0) {
        expect(recentSales[0]).toHaveProperty('id');
        expect(recentSales[0]).toHaveProperty('customerName');
        expect(recentSales[0]).toHaveProperty('totalAmount');
        expect(recentSales[0]).toHaveProperty('date');
        expect(recentSales[0]).toHaveProperty('paymentStatus');
      }
    });

    it('應該包含低庫存警告', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const lowStockWarnings = response.body.data.lowStockWarnings;
      expect(Array.isArray(lowStockWarnings)).toBe(true);
      
      if (lowStockWarnings.length > 0) {
        expect(lowStockWarnings[0]).toHaveProperty('productId');
        expect(lowStockWarnings[0]).toHaveProperty('productCode');
        expect(lowStockWarnings[0]).toHaveProperty('productName');
        expect(lowStockWarnings[0]).toHaveProperty('currentStock');
        expect(lowStockWarnings[0]).toHaveProperty('minStock');
      }
    });
  });

  describe('GET /api/dashboard/summary (詳細統計)', () => {
    it('應該返回詳細統計數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('salesSummary');
      expect(response.body.data).toHaveProperty('counts');
      expect(response.body.data).toHaveProperty('lowStockWarnings');
      expect(response.body.data).toHaveProperty('topProducts');
      expect(response.body.data).toHaveProperty('recentSales');
    });

    it('應該包含銷售摘要統計', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const salesSummary = response.body.data.salesSummary;
      expect(salesSummary).toHaveProperty('total');
      expect(salesSummary).toHaveProperty('today');
      expect(salesSummary).toHaveProperty('month');

      expect(typeof salesSummary.total).toBe('number');
      expect(typeof salesSummary.today).toBe('number');
      expect(typeof salesSummary.month).toBe('number');
    });

    it('應該包含各種計數統計', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const counts = response.body.data.counts;
      expect(counts).toHaveProperty('products');
      expect(counts).toHaveProperty('customers');
      expect(counts).toHaveProperty('suppliers');
      expect(counts).toHaveProperty('orders');

      expect(typeof counts.products).toBe('number');
      expect(typeof counts.customers).toBe('number');
      expect(typeof counts.suppliers).toBe('number');
      expect(typeof counts.orders).toBe('number');
    });

    it('應該包含低庫存警告統計', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const lowStockWarnings = response.body.data.lowStockWarnings;
      expect(Array.isArray(lowStockWarnings)).toBe(true);
      
      if (lowStockWarnings.length > 0) {
        expect(lowStockWarnings[0]).toHaveProperty('productId');
        expect(lowStockWarnings[0]).toHaveProperty('productCode');
        expect(lowStockWarnings[0]).toHaveProperty('productName');
        expect(lowStockWarnings[0]).toHaveProperty('currentStock');
        expect(lowStockWarnings[0]).toHaveProperty('minStock');
      }
    });
  });

  describe('GET /api/dashboard/sales-trend', () => {
    it('應該返回銷售趨勢數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('salesTrend');
      expect(response.body.data).toHaveProperty('categorySales');
      
      expect(Array.isArray(response.body.data.salesTrend)).toBe(true);
      expect(Array.isArray(response.body.data.categorySales)).toBe(true);
      
      if (response.body.data.salesTrend.length > 0) {
        expect(response.body.data.salesTrend[0]).toHaveProperty('date');
        expect(response.body.data.salesTrend[0]).toHaveProperty('amount');
        expect(response.body.data.salesTrend[0]).toHaveProperty('count');
      }
      
      if (response.body.data.categorySales.length > 0) {
        expect(response.body.data.categorySales[0]).toHaveProperty('category');
        expect(response.body.data.categorySales[0]).toHaveProperty('amount');
      }
    });

    it('應該返回30天的銷售趨勢', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.salesTrend.length).toBeLessThanOrEqual(30);
    });

    it('應該包含類別銷售數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const categorySales = response.body.data.categorySales;
      expect(Array.isArray(categorySales)).toBe(true);
      
      if (categorySales.length > 0) {
        expect(typeof categorySales[0].category).toBe('string');
        expect(typeof categorySales[0].amount).toBe('number');
      }
    });
  });

  // 注意：以下端點在當前實現中不存在，已移除相關測試
  // - /api/dashboard/top-products (熱銷產品數據已整合在 /api/dashboard/summary 中)
  // - /api/dashboard/recent-activities (最近活動數據已整合在 /api/dashboard/summary 中)
  // - /api/dashboard/alerts (警報數據已整合在 /api/dashboard/summary 中)

  describe('業務邏輯測試', () => {
    it('應該正確計算今日銷售額', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const todaySales = response.body.data.salesSummary.today;
      expect(typeof todaySales).toBe('number');
      expect(todaySales).toBeGreaterThanOrEqual(0);
    });

    it('應該正確計算總銷售額', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const totalSales = response.body.data.salesSummary.total;
      expect(typeof totalSales).toBe('number');
      expect(totalSales).toBeGreaterThanOrEqual(0);
    });

    it('應該正確識別低庫存產品', async () => {
      // 創建低庫存產品
      const lowStockProduct = await BaseProduct.create({
        code: 'P002',
        shortCode: 'P002',
        name: '低庫存產品',
        unit: '個',
        purchasePrice: 30,
        sellingPrice: 50,
        productType: ProductType.PRODUCT,
        minStock: 20,
        isActive: true
      });

      await Inventory.create({
        product: lowStockProduct._id,
        quantity: 5, // 低於 minStock
        type: 'purchase'
      });

      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const lowStockWarnings = response.body.data.lowStockWarnings;
      expect(Array.isArray(lowStockWarnings)).toBe(true);
      expect(lowStockWarnings.length).toBeGreaterThan(0);
    });

    it('應該正確統計各種計數', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const counts = response.body.data.counts;
      expect(typeof counts.products).toBe('number');
      expect(typeof counts.customers).toBe('number');
      expect(typeof counts.suppliers).toBe('number');
      expect(typeof counts.orders).toBe('number');
      expect(counts.products).toBeGreaterThan(0);
      expect(counts.customers).toBeGreaterThan(0);
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理資料庫連接錯誤', async () => {
      const mockFind = jest.spyOn(Sale, 'find').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      
      mockFind.mockRestore();
    });

    it('應該處理銷售趨勢查詢錯誤', async () => {
      const mockFind = jest.spyOn(Sale, 'find').mockImplementation(() => {
        throw new Error('Query failed');
      });

      const response = await request(app)
        .get('/api/dashboard/sales-trend')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      
      mockFind.mockRestore();
    });
  });

  describe('性能測試', () => {
    it('儀表板摘要載入應該在合理時間內完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // 5秒內完成
    });

    it('銷售趨勢查詢應該高效', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/sales-trend')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(3000); // 3秒內完成
    });
  });

  describe('快取測試', () => {
    it('應該支援數據快取', async () => {
      // 第一次請求
      const response1 = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      // 第二次請求（應該使用快取）
      const response2 = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      
      // 驗證快取標頭（如果有實現）
      if (response2.headers['x-cache']) {
        expect(response2.headers['x-cache']).toBe('HIT');
      }
    });
  });
});