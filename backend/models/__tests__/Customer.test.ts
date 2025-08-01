import Customer, { ICustomer } from '../Customer';

describe('Customer Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Customer.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的客戶', async () => {
      const customerData: Partial<ICustomer> = {
        code: 'CUST001',
        name: '張三',
        phone: '0912345678',
        email: 'zhang@example.com',
        address: '台北市信義區信義路100號',
        birthdate: new Date('1990-01-01'),
        gender: 'male',
        medicalHistory: '高血壓',
        allergies: ['青黴素', '阿司匹林'],
        idCardNumber: 'A123456789',
        membershipLevel: 'silver'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer._id).toBeDefined();
      expect(savedCustomer.code).toBe(customerData.code);
      expect(savedCustomer.name).toBe(customerData.name);
      expect(savedCustomer.phone).toBe(customerData.phone);
      expect(savedCustomer.email).toBe(customerData.email);
      expect(savedCustomer.address).toBe(customerData.address);
      expect(savedCustomer.birthdate).toEqual(customerData.birthdate);
      expect(savedCustomer.gender).toBe(customerData.gender);
      expect(savedCustomer.medicalHistory).toBe(customerData.medicalHistory);
      expect(savedCustomer.allergies).toEqual(customerData.allergies);
      expect(savedCustomer.idCardNumber).toBe(customerData.idCardNumber);
      expect(savedCustomer.membershipLevel).toBe(customerData.membershipLevel);
      expect(savedCustomer.totalPurchases).toBe(0); // 默認值
      expect((savedCustomer as any).createdAt).toBeDefined();
      expect((savedCustomer as any).updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const customer = new Customer({});
      
      await expect(customer.save()).rejects.toThrow();
    });

    it('應該要求客戶代碼', async () => {
      const customerData = {
        name: '張三'
      };

      const customer = new Customer(customerData);
      await expect(customer.save()).rejects.toThrow(/code.*required/i);
    });

    it('應該要求客戶姓名', async () => {
      const customerData = {
        code: 'CUST001'
      };

      const customer = new Customer(customerData);
      await expect(customer.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該確保客戶代碼唯一性', async () => {
      const customerData1 = {
        code: 'CUST001',
        name: '張三'
      };

      const customerData2 = {
        code: 'CUST001', // 相同代碼
        name: '李四'
      };

      await new Customer(customerData1).save();
      
      const customer2 = new Customer(customerData2);
      await expect(customer2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該驗證性別枚舉值', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三',
        gender: 'invalid_gender' as any
      };

      const customer = new Customer(customerData);
      await expect(customer.save()).rejects.toThrow();
    });

    it('應該驗證會員等級枚舉值', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三',
        membershipLevel: 'invalid_level' as any
      };

      const customer = new Customer(customerData);
      await expect(customer.save()).rejects.toThrow();
    });

    it('應該設置默認會員等級為regular', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      
      expect(savedCustomer.membershipLevel).toBe('regular');
    });

    it('應該設置默認總購買金額為0', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      
      expect(savedCustomer.totalPurchases).toBe(0);
    });

    it('應該設置默認過敏清單為空陣列', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      
      expect(savedCustomer.allergies).toEqual([]);
    });
  });

  describe('Instance Methods', () => {
    let customer: any;

    beforeEach(async () => {
      customer = await Customer.create({
        code: 'CUST001',
        name: '張三',
        birthdate: new Date('1990-01-01'),
        totalPurchases: 25000,
        lastPurchaseDate: new Date('2024-01-01')
      });
    });

    describe('updatePurchaseRecord', () => {
      it('應該更新購買記錄', () => {
        const initialTotal = customer.totalPurchases;
        const purchaseAmount = 1500;
        
        customer.updatePurchaseRecord(purchaseAmount);
        
        expect(customer.totalPurchases).toBe(initialTotal + purchaseAmount);
        expect(customer.lastPurchaseDate).toBeInstanceOf(Date);
        expect(customer.lastPurchaseDate.getTime()).toBeCloseTo(Date.now(), -1000);
      });

      it('應該處理null的初始總購買金額', async () => {
        const newCustomer: any = await Customer.create({
          code: 'CUST002',
          name: '李四'
        });
        
        // 手動設置為null來測試
        newCustomer.totalPurchases = null;
        
        newCustomer.updatePurchaseRecord(1000);
        
        expect(newCustomer.totalPurchases).toBe(1000);
      });
    });

    describe('getAge', () => {
      it('應該計算正確的年齡', () => {
        const age = customer.getAge();
        const expectedAge = new Date().getFullYear() - 1990;
        
        expect(age).toBe(expectedAge);
      });

      it('應該處理生日尚未到的情況', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() - 25);
        futureDate.setMonth(futureDate.getMonth() + 1); // 下個月生日
        
        const customerWithFutureBirthday: any = await Customer.create({
          code: 'CUST003',
          name: '王五',
          birthdate: futureDate
        });
        
        const age = customerWithFutureBirthday.getAge();
        expect(age).toBe(24); // 應該少一歲
      });

      it('應該在沒有生日時返回null', async () => {
        const customerWithoutBirthdate: any = await Customer.create({
          code: 'CUST004',
          name: '趙六'
        });
        
        const age = customerWithoutBirthdate.getAge();
        expect(age).toBeNull();
      });
    });

    describe('isActiveCustomer', () => {
      it('應該識別活躍客戶（默認90天內）', () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 30); // 30天前
        customer.lastPurchaseDate = recentDate;
        
        expect(customer.isActiveCustomer()).toBe(true);
      });

      it('應該識別非活躍客戶', () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 100); // 100天前
        customer.lastPurchaseDate = oldDate;
        
        expect(customer.isActiveCustomer()).toBe(false);
      });

      it('應該支援自定義天數', () => {
        const date = new Date();
        date.setDate(date.getDate() - 50); // 50天前
        customer.lastPurchaseDate = date;
        
        expect(customer.isActiveCustomer(60)).toBe(true); // 60天內算活躍
        expect(customer.isActiveCustomer(40)).toBe(false); // 40天內不算活躍
      });

      it('應該在沒有購買記錄時返回false', async () => {
        const newCustomer: any = await Customer.create({
          code: 'CUST005',
          name: '錢七'
        });
        
        expect(newCustomer.isActiveCustomer()).toBe(false);
      });
    });

    describe('getCustomerTier', () => {
      it('應該返回platinum等級', () => {
        customer.totalPurchases = 150000;
        expect(customer.getCustomerTier()).toBe('platinum');
      });

      it('應該返回gold等級', () => {
        customer.totalPurchases = 75000;
        expect(customer.getCustomerTier()).toBe('gold');
      });

      it('應該返回silver等級', () => {
        customer.totalPurchases = 35000;
        expect(customer.getCustomerTier()).toBe('silver');
      });

      it('應該返回regular等級', () => {
        customer.totalPurchases = 15000;
        expect(customer.getCustomerTier()).toBe('regular');
      });

      it('應該處理null的總購買金額', async () => {
        const newCustomer: any = await Customer.create({
          code: 'CUST006',
          name: '孫八'
        });
        
        newCustomer.totalPurchases = null;
        expect(newCustomer.getCustomerTier()).toBe('regular');
      });

      it('應該處理邊界值', () => {
        customer.totalPurchases = 100000; // 正好100000
        expect(customer.getCustomerTier()).toBe('platinum');
        
        customer.totalPurchases = 50000; // 正好50000
        expect(customer.getCustomerTier()).toBe('gold');
        
        customer.totalPurchases = 20000; // 正好20000
        expect(customer.getCustomerTier()).toBe('silver');
      });
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      
      expect((savedCustomer as any).createdAt).toBeDefined();
      expect((savedCustomer as any).updatedAt).toBeDefined();
      expect((savedCustomer as any).createdAt).toBeInstanceOf(Date);
      expect((savedCustomer as any).updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const customerData = {
        code: 'CUST001',
        name: '張三'
      };

      const customer = await new Customer(customerData).save();
      const originalUpdatedAt = (customer as any).updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      customer.name = '更新的姓名';
      const updatedCustomer = await customer.save();
      
      expect((updatedCustomer as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await Customer.create([
        {
          code: 'CUST001',
          name: '張三',
          membershipLevel: 'gold',
          totalPurchases: 60000,
          lastPurchaseDate: new Date('2024-01-01')
        },
        {
          code: 'CUST002',
          name: '李四',
          membershipLevel: 'silver',
          totalPurchases: 30000,
          lastPurchaseDate: new Date('2023-06-01')
        },
        {
          code: 'CUST003',
          name: '王五',
          membershipLevel: 'regular',
          totalPurchases: 5000
        }
      ]);
    });

    it('應該能夠按會員等級查詢', async () => {
      const goldCustomers = await Customer.find({ membershipLevel: 'gold' });
      expect(goldCustomers).toHaveLength(1);
      expect(goldCustomers[0].name).toBe('張三');
    });

    it('應該能夠按客戶代碼查詢', async () => {
      const customer = await Customer.findOne({ code: 'CUST002' });
      expect(customer).toBeTruthy();
      expect(customer?.name).toBe('李四');
    });

    it('應該能夠按總購買金額範圍查詢', async () => {
      const highValueCustomers = await Customer.find({ 
        totalPurchases: { $gte: 25000 } 
      });
      expect(highValueCustomers).toHaveLength(2);
    });

    it('應該能夠查詢有購買記錄的客戶', async () => {
      const customersWithPurchases = await Customer.find({ 
        lastPurchaseDate: { $exists: true } 
      });
      expect(customersWithPurchases).toHaveLength(2);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的客戶生命週期', async () => {
      // 創建新客戶
      const customer: any = await Customer.create({
        code: 'CUST001',
        name: '張三',
        birthdate: new Date('1990-01-01'),
        allergies: ['青黴素']
      });

      expect(customer.getCustomerTier()).toBe('regular');
      expect(customer.isActiveCustomer()).toBe(false);

      // 第一次購買
      customer.updatePurchaseRecord(15000);
      await customer.save();

      expect(customer.totalPurchases).toBe(15000);
      expect(customer.getCustomerTier()).toBe('regular');
      expect(customer.isActiveCustomer()).toBe(true);

      // 多次購買升級到silver
      customer.updatePurchaseRecord(10000);
      await customer.save();

      expect(customer.totalPurchases).toBe(25000);
      expect(customer.getCustomerTier()).toBe('silver');

      // 繼續購買升級到gold
      customer.updatePurchaseRecord(30000);
      await customer.save();

      expect(customer.totalPurchases).toBe(55000);
      expect(customer.getCustomerTier()).toBe('gold');

      // 最終升級到platinum
      customer.updatePurchaseRecord(50000);
      await customer.save();

      expect(customer.totalPurchases).toBe(105000);
      expect(customer.getCustomerTier()).toBe('platinum');
    });

    it('應該處理過敏資訊更新', async () => {
      const customer = await Customer.create({
        code: 'CUST001',
        name: '張三',
        allergies: ['青黴素']
      });

      // 添加新的過敏
      customer.allergies?.push('阿司匹林');
      customer.allergies?.push('磺胺類');
      await customer.save();

      const updatedCustomer = await Customer.findById(customer._id);
      expect(updatedCustomer?.allergies).toHaveLength(3);
      expect(updatedCustomer?.allergies).toContain('青黴素');
      expect(updatedCustomer?.allergies).toContain('阿司匹林');
      expect(updatedCustomer?.allergies).toContain('磺胺類');
    });
  });
});