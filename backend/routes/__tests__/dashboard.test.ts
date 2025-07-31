import request from 'supertest';
import { createApp } from '../../app';
import Sale from '../../models/Sale';
import BaseProduct from '../../models/BaseProduct';
import Customer from '../../models/Customer';
import Inventory from '../../models/Inventory';
import { ProductType } from '@pharmacy-pos/shared/enums';
import mongoose from 'mongoose';

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
      isActive: true
    });

    // 創建測試客戶
    testCustomer = await Customer.create({
      code: 'C001',
      name: '測試客戶',
      phone: '0912345678',
      email: 'test@example.com'
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
        createdAt: today
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
        createdAt: yesterday
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
        createdAt: lastWeek
      }
    ]);

    // 創建庫存記錄
    await Inventory.create([
      {
        product: testProduct._id,
        quantity: 100,
        type: 'purchase',
        unitCost: 50,
        totalCost: 5000
      },
      {
        product: testProduct._id,
        quantity: -6, // 對應銷售
        type: 'sale',
        unitCost: 50,
        totalCost: -300
      }
    ]);
  }

  describe('GET /api/dashboard', () => {
    it('應該返回儀表板總覽數據', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('charts');
      expect(response.body.data).toHaveProperty('recentActivities');
      expect(response.body.data).toHaveProperty('alerts');
    });

    it('應該包含正確的摘要統計', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const summary = response.body.data.summary;
      expect(summary).toHaveProperty('todaySales');
      expect(summary).toHaveProperty('totalRevenue');
      expect(summary).toHaveProperty('totalCustomers');
      expect(summary).toHaveProperty('totalProducts');
      expect(summary).toHaveProperty('lowStockProducts');
      expect(summary).toHaveProperty('pendingOrders');

      expect(typeof summary.todaySales).toBe('number');
      expect(typeof summary.totalRevenue).toBe('number');
      expect(typeof summary.totalCustomers).toBe('number');
      expect(typeof summary.totalProducts).toBe('number');
    });

    it('應該包含圖表數據', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const charts = response.body.data.charts;
      expect(charts).toHaveProperty('salesTrend');
      expect(charts).toHaveProperty('topProducts');
      expect(charts).toHaveProperty('paymentMethods');
      expect(charts).toHaveProperty('customerGrowth');

      expect(Array.isArray(charts.salesTrend)).toBe(true);
      expect(Array.isArray(charts.topProducts)).toBe(true);
      expect(Array.isArray(charts.paymentMethods)).toBe(true);
    });

    it('應該包含最近活動', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const activities = response.body.data.recentActivities;
      expect(Array.isArray(activities)).toBe(true);
      
      if (activities.length > 0) {
        expect(activities[0]).toHaveProperty('type');
        expect(activities[0]).toHaveProperty('description');
        expect(activities[0]).toHaveProperty('timestamp');
        expect(activities[0]).toHaveProperty('user');
      }
    });

    it('應該包含警報信息', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const alerts = response.body.data.alerts;
      expect(Array.isArray(alerts)).toBe(true);
      
      if (alerts.length > 0) {
        expect(alerts[0]).toHaveProperty('type');
        expect(alerts[0]).toHaveProperty('message');
        expect(alerts[0]).toHaveProperty('severity');
        expect(alerts[0]).toHaveProperty('timestamp');
      }
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('應該返回詳細統計數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sales');
      expect(response.body.data).toHaveProperty('inventory');
      expect(response.body.data).toHaveProperty('customers');
      expect(response.body.data).toHaveProperty('products');
    });

    it('應該支援日期範圍篩選', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/dashboard/stats?startDate=${today}&endDate=${today}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dateRange');
      expect(response.body.data.dateRange.startDate).toBe(today);
      expect(response.body.data.dateRange.endDate).toBe(today);
    });

    it('應該包含銷售統計', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const sales = response.body.data.sales;
      expect(sales).toHaveProperty('totalSales');
      expect(sales).toHaveProperty('totalRevenue');
      expect(sales).toHaveProperty('averageOrderValue');
      expect(sales).toHaveProperty('salesGrowth');
      expect(sales).toHaveProperty('topSellingProducts');

      expect(typeof sales.totalSales).toBe('number');
      expect(typeof sales.totalRevenue).toBe('number');
      expect(typeof sales.averageOrderValue).toBe('number');
    });

    it('應該包含庫存統計', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const inventory = response.body.data.inventory;
      expect(inventory).toHaveProperty('totalProducts');
      expect(inventory).toHaveProperty('totalValue');
      expect(inventory).toHaveProperty('lowStockCount');
      expect(inventory).toHaveProperty('expiringCount');
      expect(inventory).toHaveProperty('turnoverRate');

      expect(typeof inventory.totalProducts).toBe('number');
      expect(typeof inventory.totalValue).toBe('number');
      expect(typeof inventory.lowStockCount).toBe('number');
    });
  });

  describe('GET /api/dashboard/sales-trend', () => {
    it('應該返回銷售趨勢數據', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('date');
        expect(response.body.data[0]).toHaveProperty('sales');
        expect(response.body.data[0]).toHaveProperty('revenue');
        expect(response.body.data[0]).toHaveProperty('orders');
      }
    });

    it('應該支援時間範圍參數', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend?period=7days')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(7);
    });

    it('應該支援不同的時間粒度', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend?granularity=hour')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/top-products', () => {
    it('應該返回熱銷產品列表', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-products')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('product');
        expect(response.body.data[0]).toHaveProperty('totalSold');
        expect(response.body.data[0]).toHaveProperty('totalRevenue');
        expect(response.body.data[0]).toHaveProperty('rank');
      }
    });

    it('應該支援限制返回數量', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-products?limit=5')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('應該按銷售量排序', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-products')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const products = response.body.data;
      for (let i = 1; i < products.length; i++) {
        expect(products[i-1].totalSold).toBeGreaterThanOrEqual(products[i].totalSold);
      }
    });
  });

  describe('GET /api/dashboard/recent-activities', () => {
    it('應該返回最近活動列表', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent-activities')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('type');
        expect(response.body.data[0]).toHaveProperty('description');
        expect(response.body.data[0]).toHaveProperty('timestamp');
        expect(response.body.data[0]).toHaveProperty('user');
      }
    });

    it('應該支援活動類型篩選', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent-activities?type=sale')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((activity: any) => {
        expect(activity.type).toBe('sale');
      });
    });

    it('應該按時間倒序排列', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent-activities')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const activities = response.body.data;
      for (let i = 1; i < activities.length; i++) {
        const prevTime = new Date(activities[i-1].timestamp).getTime();
        const currTime = new Date(activities[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });

  describe('GET /api/dashboard/alerts', () => {
    beforeEach(async () => {
      // 創建低庫存產品以觸發警報
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
        type: 'purchase',
        unitCost: 30
      });
    });

    it('應該返回系統警報列表', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('type');
        expect(response.body.data[0]).toHaveProperty('message');
        expect(response.body.data[0]).toHaveProperty('severity');
        expect(response.body.data[0]).toHaveProperty('timestamp');
      }
    });

    it('應該包含低庫存警報', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts?type=low_stock')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].type).toBe('low_stock');
    });

    it('應該支援嚴重程度篩選', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts?severity=high')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((alert: any) => {
        expect(alert.severity).toBe('high');
      });
    });
  });

  describe('業務邏輯測試', () => {
    it('應該正確計算今日銷售額', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const todaySales = response.body.data.summary.todaySales;
      expect(todaySales).toBe(160); // 今天的銷售額
    });

    it('應該正確計算銷售成長率', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const salesGrowth = response.body.data.sales.salesGrowth;
      expect(typeof salesGrowth).toBe('number');
      expect(salesGrowth).toBeGreaterThanOrEqual(-100); // 成長率不應低於 -100%
    });

    it('應該正確識別低庫存產品', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts?type=low_stock')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('應該計算平均訂單價值', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const avgOrderValue = response.body.data.sales.averageOrderValue;
      expect(typeof avgOrderValue).toBe('number');
      expect(avgOrderValue).toBeGreaterThan(0);
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理資料庫連接錯誤', async () => {
      const mockAggregate = jest.spyOn(Sale, 'aggregate').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      
      mockAggregate.mockRestore();
    });

    it('應該處理無效的日期範圍', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats?startDate=invalid-date&endDate=2023-12-31')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的時間範圍參數', async () => {
      const response = await request(app)
        .get('/api/dashboard/sales-trend?period=invalid-period')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('性能測試', () => {
    it('儀表板載入應該在合理時間內完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // 5秒內完成
    });

    it('統計數據查詢應該高效', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/stats')
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
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      // 第二次請求（應該使用快取）
      const response2 = await request(app)
        .get('/api/dashboard')
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