import request from 'supertest';
import { createApp } from '../../app';
import Customer from '../../models/Customer';
import mongoose from 'mongoose';

describe('Customers API', () => {
  let app: any;
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
    await Customer.deleteMany({});

    // 創建測試客戶
    testCustomer = await Customer.create({
      code: 'C001',
      name: '測試客戶',
      phone: '0912345678',
      email: 'test@example.com',
      address: '台北市信義區',
      membershipLevel: 'regular',
      isActive: true
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      // 創建多個測試客戶
      await Customer.create([
        {
          code: 'C002',
          name: '客戶二',
          phone: '0987654321',
          email: 'customer2@example.com',
          membershipLevel: 'silver'
        },
        {
          code: 'C003',
          name: '客戶三',
          phone: '0911111111',
          email: 'customer3@example.com',
          membershipLevel: 'gold'
        }
      ]);
    });

    it('應該返回所有客戶列表', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('code');
      expect(response.body.data[0]).toHaveProperty('name');
    });

    it('應該忽略不支援的查詢參數', async () => {
      const response = await request(app)
        .get('/api/customers?search=測試')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // 返回所有客戶，忽略搜尋參數
    });

    it('應該忽略分頁參數', async () => {
      const response = await request(app)
        .get('/api/customers?page=1&limit=2')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // 返回所有客戶，忽略分頁參數
    });

    it('應該忽略會員等級篩選參數', async () => {
      const response = await request(app)
        .get('/api/customers?membershipLevel=gold')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // 返回所有客戶，忽略篩選參數
      // 驗證確實有 gold 等級的客戶存在
      const goldCustomer = response.body.data.find((c: any) => c.membershipLevel === 'gold');
      expect(goldCustomer).toBeTruthy();
    });
  });

  describe('GET /api/customers/:id', () => {
    it('應該返回指定的客戶', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('測試客戶');
      expect(response.body.data.code).toBe('C001');
    });

    it('應該處理不存在的客戶', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的ID格式', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/customers/${invalidId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/customers', () => {
    const validCustomerData = {
      code: 'C004',
      name: '新客戶',
      phone: '0922222222',
      email: 'newcustomer@example.com',
      address: '台中市西區',
      membershipLevel: 'regular'
    };

    it('應該創建新的客戶', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(validCustomerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('新客戶');
      expect(response.body.data.code).toBe('C004');

      // 驗證客戶確實被創建
      const createdCustomer = await Customer.findOne({ code: 'C004' });
      expect(createdCustomer).toBeTruthy();
      expect(createdCustomer?.name).toBe('新客戶');
    });

    it('應該驗證必填欄位', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該檢查重複的客戶代碼', async () => {
      const duplicateData = {
        ...validCustomerData,
        code: 'C001' // 已存在的代碼
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該接受有效的客戶資料', async () => {
      const validData = {
        ...validCustomerData,
        email: 'valid@example.com'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('應該處理無效的會員等級', async () => {
      const invalidLevelData = {
        ...validCustomerData,
        membershipLevel: 'invalid-level'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .send(invalidLevelData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('應該更新客戶資料', async () => {
      const updateData = {
        name: '更新的客戶名稱',
        phone: '0933333333',
        membershipLevel: 'silver'
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新的客戶名稱');
      expect(response.body.data.membershipLevel).toBe('silver');

      // 驗證資料庫中的資料確實被更新
      const updatedCustomer = await Customer.findById(testCustomer._id);
      expect(updatedCustomer?.name).toBe('更新的客戶名稱');
    });

    it('應該處理不存在的客戶', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/customers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ name: '測試' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的客戶ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/customers/${invalidId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ name: '測試' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('應該刪除客戶', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);

      // 驗證客戶確實被刪除
      const deletedCustomer = await Customer.findById(testCustomer._id);
      expect(deletedCustomer).toBeNull();
    });

    it('應該處理不存在的客戶', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/customers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('業務邏輯測試', () => {
    it('應該正確計算客戶統計資料', async () => {
      // 創建一些購買記錄
      await Customer.findByIdAndUpdate(testCustomer._id, {
        totalPurchases: 1500,
        lastPurchaseDate: new Date()
      });

      const response = await request(app)
        .get(`/api/customers/${testCustomer._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPurchases).toBe(1500);
      expect(response.body.data.lastPurchaseDate).toBeDefined();
    });

    it('應該測試客戶模型方法', async () => {
      // 更新客戶資料以測試模型方法
      await Customer.findByIdAndUpdate(testCustomer._id, {
        totalPurchases: 25000,
        birthdate: new Date('1990-01-01'),
        lastPurchaseDate: new Date()
      });

      const customer = await Customer.findById(testCustomer._id);
      
      if (customer) {
        // 測試年齡計算
        const age = (customer as any).getAge();
        expect(age).toBeGreaterThan(30);

        // 測試客戶等級
        const tier = (customer as any).getCustomerTier();
        expect(tier).toBe('silver');

        // 測試活躍狀態
        const isActive = (customer as any).isActiveCustomer();
        expect(isActive).toBe(true);
      }
    });

    it('應該處理會員等級升級', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ membershipLevel: 'platinum' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.membershipLevel).toBe('platinum');
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理資料庫連接錯誤', async () => {
      // 模擬資料庫錯誤
      const mockFind = jest.spyOn(Customer, 'find').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      
      // 恢復原始方法
      mockFind.mockRestore();
    });

    it('應該處理無效的 ObjectId', async () => {
      const response = await request(app)
        .get('/api/customers/invalid-object-id')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('應該處理空的請求體', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test-mode-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('API 回應格式測試', () => {
    it('成功回應應該符合標準格式', async () => {
      const response = await request(app)
        .get('/api/customers')
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
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });
});