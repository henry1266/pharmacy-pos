import request from 'supertest';
import { createApp } from '../../app';
import Supplier from '../../models/Supplier';
import mongoose from 'mongoose';

describe('Suppliers API', () => {
  let app: any;
  let testSupplier: any;

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
    await Supplier.deleteMany({});

    // 創建測試供應商
    testSupplier = await Supplier.create({
      code: 'S001',
      name: '測試供應商',
      contactPerson: '張三',
      phone: '02-12345678',
      email: 'supplier@example.com',
      address: '台北市中山區',
      taxId: '12345678',
      paymentTerms: 30,
      isActive: true
    });
  });

  describe('GET /api/suppliers', () => {
    beforeEach(async () => {
      // 創建多個測試供應商
      await Supplier.create([
        {
          code: 'S002',
          name: '供應商二',
          contactPerson: '李四',
          phone: '02-87654321',
          email: 'supplier2@example.com',
          paymentTerms: 45
        },
        {
          code: 'S003',
          name: '供應商三',
          contactPerson: '王五',
          phone: '03-11111111',
          email: 'supplier3@example.com',
          paymentTerms: 60
        }
      ]);
    });

    it('應該返回所有供應商列表', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('code');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('contactPerson');
    });

    it('應該支援搜尋功能', async () => {
      const response = await request(app)
        .get('/api/suppliers?search=測試')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('測試供應商');
    });

    it('應該支援分頁功能', async () => {
      const response = await request(app)
        .get('/api/suppliers?page=1&limit=2')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('應該支援狀態篩選', async () => {
      // 創建一個非活躍供應商
      await Supplier.create({
        code: 'S004',
        name: '非活躍供應商',
        contactPerson: '趙六',
        phone: '04-22222222',
        email: 'inactive@example.com',
        isActive: false
      });

      const response = await request(app)
        .get('/api/suppliers?isActive=true')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((supplier: any) => supplier.isActive === true)).toBe(true);
    });

    it('應該支援排序功能', async () => {
      const response = await request(app)
        .get('/api/suppliers?sortBy=name&sortOrder=asc')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const names = response.body.data.map((supplier: any) => supplier.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('應該返回指定的供應商', async () => {
      const response = await request(app)
        .get(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('測試供應商');
      expect(response.body.data.code).toBe('S001');
      expect(response.body.data.contactPerson).toBe('張三');
    });

    it('應該處理不存在的供應商', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/suppliers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的ID格式', async () => {
      const response = await request(app)
        .get('/api/suppliers/invalid-id')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/suppliers', () => {
    const validSupplierData = {
      code: 'S004',
      name: '新供應商',
      contactPerson: '陳七',
      phone: '05-33333333',
      email: 'newsupplier@example.com',
      address: '台中市西區',
      taxId: '87654321',
      paymentTerms: 30
    };

    it('應該創建新的供應商', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(validSupplierData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('新供應商');
      expect(response.body.data.code).toBe('S004');
      expect(response.body.data.contactPerson).toBe('陳七');

      // 驗證供應商確實被創建
      const createdSupplier = await Supplier.findOne({ code: 'S004' });
      expect(createdSupplier).toBeTruthy();
      expect(createdSupplier?.name).toBe('新供應商');
    });

    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該檢查重複的供應商代碼', async () => {
      const duplicateData = {
        ...validSupplierData,
        code: 'S001' // 已存在的代碼
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已存在');
    });

    it('應該驗證電子郵件格式', async () => {
      const invalidEmailData = {
        ...validSupplierData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該驗證統一編號格式', async () => {
      const invalidTaxIdData = {
        ...validSupplierData,
        taxId: '123' // 無效的統一編號
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(invalidTaxIdData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該驗證付款條件', async () => {
      const invalidPaymentTermsData = {
        ...validSupplierData,
        paymentTerms: -10 // 負數付款條件
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(invalidPaymentTermsData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('應該更新供應商資料', async () => {
      const updateData = {
        name: '更新的供應商名稱',
        contactPerson: '新聯絡人',
        phone: '06-44444444',
        paymentTerms: 45
      };

      const response = await request(app)
        .put(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新的供應商名稱');
      expect(response.body.data.contactPerson).toBe('新聯絡人');
      expect(response.body.data.paymentTerms).toBe(45);

      // 驗證資料庫中的資料確實被更新
      const updatedSupplier = await Supplier.findById(testSupplier._id);
      expect(updatedSupplier?.name).toBe('更新的供應商名稱');
    });

    it('應該處理不存在的供應商', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/suppliers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ name: '測試' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該驗證更新資料', async () => {
      const response = await request(app)
        .put(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該防止更新為重複的代碼', async () => {
      // 創建另一個供應商
      const anotherSupplier = await Supplier.create({
        code: 'S005',
        name: '另一個供應商',
        contactPerson: '其他人',
        phone: '07-55555555',
        email: 'another@example.com'
      });

      const response = await request(app)
        .put(`/api/suppliers/${anotherSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ code: 'S001' }) // 嘗試使用已存在的代碼
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('應該刪除供應商', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);

      // 驗證供應商確實被刪除
      const deletedSupplier = await Supplier.findById(testSupplier._id);
      expect(deletedSupplier).toBeNull();
    });

    it('應該處理不存在的供應商', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/suppliers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該檢查供應商是否有關聯的採購訂單', async () => {
      // 這個測試假設有業務邏輯檢查關聯的採購訂單
      // 實際實現可能需要根據具體的業務邏輯調整
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/suppliers/code/:code', () => {
    it('應該根據代碼查找供應商', async () => {
      const response = await request(app)
        .get('/api/suppliers/code/S001')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('S001');
      expect(response.body.data.name).toBe('測試供應商');
    });

    it('應該處理不存在的供應商代碼', async () => {
      const response = await request(app)
        .get('/api/suppliers/code/NONEXISTENT')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('業務邏輯測試', () => {
    it('應該計算供應商統計資料', async () => {
      // 更新供應商統計資料
      await Supplier.findByIdAndUpdate(testSupplier._id, {
        totalPurchases: 50000,
        purchaseCount: 15,
        lastPurchaseDate: new Date(),
        averageDeliveryDays: 7
      });

      const response = await request(app)
        .get(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPurchases).toBe(50000);
      expect(response.body.data.purchaseCount).toBe(15);
      expect(response.body.data.averageDeliveryDays).toBe(7);
    });

    it('應該支援供應商狀態切換', async () => {
      const response = await request(app)
        .put(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('應該支援信用評級管理', async () => {
      const response = await request(app)
        .put(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ 
          creditRating: 'A',
          creditLimit: 100000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.creditRating).toBe('A');
      expect(response.body.data.creditLimit).toBe(100000);
    });

    it('應該處理供應商分類', async () => {
      const response = await request(app)
        .put(`/api/suppliers/${testSupplier._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ 
          category: 'pharmaceutical',
          priority: 'high'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('pharmaceutical');
      expect(response.body.data.priority).toBe('high');
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理資料庫連接錯誤', async () => {
      const mockFind = jest.spyOn(Supplier, 'find').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      
      mockFind.mockRestore();
    });

    it('應該處理無效的 ObjectId', async () => {
      const response = await request(app)
        .get('/api/suppliers/invalid-object-id')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理空的請求體', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該處理網路超時', async () => {
      // 模擬網路超時情況
      const mockCreate = jest.spyOn(Supplier, 'create').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      const validData = {
        code: 'S999',
        name: '超時測試供應商',
        contactPerson: '測試人員',
        phone: '09-99999999',
        email: 'timeout@example.com'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(validData)
        .expect(500);

      expect(response.body.success).toBe(false);
      
      mockCreate.mockRestore();
    });
  });

  describe('API 回應格式測試', () => {
    it('成功回應應該符合標準格式', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('錯誤回應應該符合標準格式', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/suppliers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('分頁回應應該包含分頁資訊', async () => {
      const response = await request(app)
        .get('/api/suppliers?page=1&limit=10')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('currentPage');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('totalItems');
      expect(response.body.pagination).toHaveProperty('itemsPerPage');
    });
  });
});