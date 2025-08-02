import Supplier, { ISupplier } from '../Supplier';

describe('Supplier Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Supplier.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的供應商', async () => {
      const supplierData: Partial<ISupplier> = {
        code: 'SUP001',
        shortCode: 'S001',
        name: '測試供應商',
        contactPerson: '張三',
        phone: '02-12345678',
        email: 'supplier@example.com',
        address: '台北市信義區信義路100號',
        taxId: '12345678',
        paymentTerms: '月結30天',
        notes: '優質供應商'
      };

      const supplier = new Supplier(supplierData);
      const savedSupplier = await supplier.save();

      expect(savedSupplier._id).toBeDefined();
      expect(savedSupplier.code).toBe(supplierData.code);
      expect(savedSupplier.shortCode).toBe(supplierData.shortCode);
      expect(savedSupplier.name).toBe(supplierData.name);
      expect(savedSupplier.contactPerson).toBe(supplierData.contactPerson);
      expect(savedSupplier.phone).toBe(supplierData.phone);
      expect(savedSupplier.email).toBe(supplierData.email);
      expect(savedSupplier.address).toBe(supplierData.address);
      expect(savedSupplier.taxId).toBe(supplierData.taxId);
      expect(savedSupplier.paymentTerms).toBe(supplierData.paymentTerms);
      expect(savedSupplier.notes).toBe(supplierData.notes);
      expect(savedSupplier.date).toBeDefined();
      expect(savedSupplier.createdAt).toBeDefined();
      expect(savedSupplier.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const supplier = new Supplier({});
      
      await expect(supplier.save()).rejects.toThrow();
    });

    it('應該要求供應商代碼', async () => {
      const supplierData = {
        shortCode: 'S001',
        name: '測試供應商'
      };

      const supplier = new Supplier(supplierData);
      await expect(supplier.save()).rejects.toThrow(/code.*required/i);
    });

    it('應該要求供應商簡碼', async () => {
      const supplierData = {
        code: 'SUP001',
        name: '測試供應商'
      };

      const supplier = new Supplier(supplierData);
      await expect(supplier.save()).rejects.toThrow(/shortCode.*required/i);
    });

    it('應該要求供應商名稱', async () => {
      const supplierData = {
        code: 'SUP001',
        shortCode: 'S001'
      };

      const supplier = new Supplier(supplierData);
      await expect(supplier.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該確保供應商代碼唯一性', async () => {
      const supplierData1 = {
        code: 'SUP001',
        shortCode: 'S001',
        name: '供應商1'
      };

      const supplierData2 = {
        code: 'SUP001', // 相同代碼
        shortCode: 'S002',
        name: '供應商2'
      };

      await new Supplier(supplierData1).save();
      
      const supplier2 = new Supplier(supplierData2);
      await expect(supplier2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該設置默認日期', async () => {
      const supplierData = {
        code: 'SUP001',
        shortCode: 'S001',
        name: '測試供應商'
      };

      const supplier = new Supplier(supplierData);
      const savedSupplier = await supplier.save();
      
      expect(savedSupplier.date).toBeDefined();
      expect(savedSupplier.date).toBeInstanceOf(Date);
    });
  });

  describe('Instance Methods', () => {
    let supplier: any;

    beforeEach(async () => {
      supplier = await Supplier.create({
        code: 'SUP001',
        shortCode: 'S001',
        name: '測試供應商',
        contactPerson: '張三',
        phone: '02-12345678',
        email: 'supplier@example.com',
        address: '台北市信義區信義路100號',
        taxId: '12345678',
        paymentTerms: '月結30天',
        notes: '優質供應商'
      });
    });

    describe('updateSupplierInfo', () => {
      it('應該更新供應商資訊', async () => {
        const updateData = {
          name: '更新的供應商名稱',
          contactPerson: '李四',
          phone: '02-87654321',
          email: 'updated@example.com',
          address: '台北市大安區敦化南路200號',
          paymentTerms: '月結45天',
          notes: '更新的備註'
        };

        supplier.updateSupplierInfo(updateData);
        await supplier.save();

        expect(supplier.name).toBe(updateData.name);
        expect(supplier.contactPerson).toBe(updateData.contactPerson);
        expect(supplier.phone).toBe(updateData.phone);
        expect(supplier.email).toBe(updateData.email);
        expect(supplier.address).toBe(updateData.address);
        expect(supplier.paymentTerms).toBe(updateData.paymentTerms);
        expect(supplier.notes).toBe(updateData.notes);
      });

      it('應該只更新提供的欄位', async () => {
        const originalName = supplier.name;
        const originalPhone = supplier.phone;
        
        const partialUpdateData = {
          contactPerson: '王五',
          email: 'partial@example.com'
        };

        supplier.updateSupplierInfo(partialUpdateData);
        await supplier.save();

        expect(supplier.name).toBe(originalName); // 未更新
        expect(supplier.phone).toBe(originalPhone); // 未更新
        expect(supplier.contactPerson).toBe(partialUpdateData.contactPerson); // 已更新
        expect(supplier.email).toBe(partialUpdateData.email); // 已更新
      });

      it('應該處理空的更新資料', async () => {
        const originalData = {
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email
        };

        supplier.updateSupplierInfo({});
        await supplier.save();

        expect(supplier.name).toBe(originalData.name);
        expect(supplier.contactPerson).toBe(originalData.contactPerson);
        expect(supplier.phone).toBe(originalData.phone);
        expect(supplier.email).toBe(originalData.email);
      });
    });

    describe('getSupplierSummary', () => {
      it('應該返回基本的供應商摘要', async () => {
        const summary = supplier.getSupplierSummary();

        expect(summary).toHaveProperty('code');
        expect(summary).toHaveProperty('name');
        expect(summary.code).toBe(supplier.code);
        expect(summary.name).toBe(supplier.name);
      });

      it('應該包含聯絡人資訊（如果有）', async () => {
        const summary = supplier.getSupplierSummary();

        expect(summary).toHaveProperty('contactPerson');
        expect(summary.contactPerson).toBe(supplier.contactPerson);
      });

      it('應該處理沒有聯絡人的情況', async () => {
        const supplierWithoutContact: any = await Supplier.create({
          code: 'SUP002',
          shortCode: 'S002',
          name: '無聯絡人供應商'
        });

        const summary = supplierWithoutContact.getSupplierSummary();

        expect(summary).toHaveProperty('code');
        expect(summary).toHaveProperty('name');
        expect(summary.code).toBe('SUP002');
        expect(summary.name).toBe('無聯絡人供應商');
        expect(summary.contactPerson).toBeUndefined();
      });

      it('應該不包含totalOrders屬性', async () => {
        const summary = supplier.getSupplierSummary();

        expect(summary).not.toHaveProperty('totalOrders');
      });
    });
  });

  describe('Optional Fields', () => {
    it('應該允許創建只有必填欄位的供應商', async () => {
      const minimalSupplierData = {
        code: 'SUP_MIN',
        shortCode: 'SMIN',
        name: '最小供應商'
      };

      const supplier = new Supplier(minimalSupplierData);
      const savedSupplier = await supplier.save();

      expect(savedSupplier.code).toBe(minimalSupplierData.code);
      expect(savedSupplier.shortCode).toBe(minimalSupplierData.shortCode);
      expect(savedSupplier.name).toBe(minimalSupplierData.name);
      expect(savedSupplier.contactPerson).toBeUndefined();
      expect(savedSupplier.phone).toBeUndefined();
      expect(savedSupplier.email).toBeUndefined();
      expect(savedSupplier.address).toBeUndefined();
      expect(savedSupplier.taxId).toBeUndefined();
      expect(savedSupplier.paymentTerms).toBeUndefined();
      expect(savedSupplier.notes).toBeUndefined();
    });

    it('應該允許設置所有選填欄位', async () => {
      const completeSupplierData = {
        code: 'SUP_COMPLETE',
        shortCode: 'SCOM',
        name: '完整供應商',
        contactPerson: '完整聯絡人',
        phone: '02-11111111',
        email: 'complete@example.com',
        address: '完整地址',
        taxId: '87654321',
        paymentTerms: '現金交易',
        notes: '完整備註'
      };

      const supplier = new Supplier(completeSupplierData);
      const savedSupplier = await supplier.save();

      Object.keys(completeSupplierData).forEach(key => {
        expect(savedSupplier[key as keyof typeof completeSupplierData]).toBe(
          completeSupplierData[key as keyof typeof completeSupplierData]
        );
      });
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const supplierData = {
        code: 'SUP001',
        shortCode: 'S001',
        name: '測試供應商'
      };

      const supplier = new Supplier(supplierData);
      const savedSupplier = await supplier.save();
      
      expect(savedSupplier.createdAt).toBeDefined();
      expect(savedSupplier.updatedAt).toBeDefined();
      expect(savedSupplier.createdAt).toBeInstanceOf(Date);
      expect(savedSupplier.updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const supplierData = {
        code: 'SUP001',
        shortCode: 'S001',
        name: '測試供應商'
      };

      const supplier = await new Supplier(supplierData).save();
      const originalUpdatedAt = supplier.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      supplier.name = '更新的供應商名稱';
      const updatedSupplier = await supplier.save();
      
      expect(updatedSupplier.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await Supplier.create([
        {
          code: 'SUP001',
          shortCode: 'S001',
          name: '藥品供應商A',
          contactPerson: '張三',
          phone: '02-12345678',
          email: 'supplierA@example.com',
          paymentTerms: '月結30天'
        },
        {
          code: 'SUP002',
          shortCode: 'S002',
          name: '醫材供應商B',
          contactPerson: '李四',
          phone: '02-87654321',
          email: 'supplierB@example.com',
          paymentTerms: '現金交易'
        },
        {
          code: 'SUP003',
          shortCode: 'S003',
          name: '設備供應商C',
          contactPerson: '王五',
          phone: '02-11111111',
          paymentTerms: '月結45天'
        }
      ]);
    });

    it('應該能夠按代碼查詢', async () => {
      const supplier = await Supplier.findOne({ code: 'SUP002' });
      expect(supplier).toBeTruthy();
      expect(supplier?.name).toBe('醫材供應商B');
      expect(supplier?.contactPerson).toBe('李四');
    });

    it('應該能夠按簡碼查詢', async () => {
      const supplier = await Supplier.findOne({ shortCode: 'S003' });
      expect(supplier).toBeTruthy();
      expect(supplier?.name).toBe('設備供應商C');
    });

    it('應該能夠按名稱查詢', async () => {
      const supplier = await Supplier.findOne({ name: '藥品供應商A' });
      expect(supplier).toBeTruthy();
      expect(supplier?.code).toBe('SUP001');
    });

    it('應該能夠按聯絡人查詢', async () => {
      const supplier = await Supplier.findOne({ contactPerson: '李四' });
      expect(supplier).toBeTruthy();
      expect(supplier?.name).toBe('醫材供應商B');
    });

    it('應該能夠按付款條件查詢', async () => {
      const monthlySuppliers = await Supplier.find({ 
        paymentTerms: { $regex: '月結', $options: 'i' } 
      });
      expect(monthlySuppliers).toHaveLength(2);

      const cashSuppliers = await Supplier.find({ paymentTerms: '現金交易' });
      expect(cashSuppliers).toHaveLength(1);
      expect(cashSuppliers[0].name).toBe('醫材供應商B');
    });

    it('應該能夠按電子郵件查詢', async () => {
      const supplier = await Supplier.findOne({ email: 'supplierA@example.com' });
      expect(supplier).toBeTruthy();
      expect(supplier?.name).toBe('藥品供應商A');
    });

    it('應該能夠查詢有電子郵件的供應商', async () => {
      const suppliersWithEmail = await Supplier.find({ 
        email: { $exists: true, $ne: null } 
      });
      expect(suppliersWithEmail).toHaveLength(2);
    });

    it('應該能夠查詢沒有電子郵件的供應商', async () => {
      const suppliersWithoutEmail = await Supplier.find({ 
        $or: [
          { email: { $exists: false } },
          { email: null },
          { email: '' }
        ]
      });
      expect(suppliersWithoutEmail).toHaveLength(1);
      expect(suppliersWithoutEmail[0].name).toBe('設備供應商C');
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的供應商生命週期', async () => {
      // 創建新供應商
      const supplier = await Supplier.create({
        code: 'SUP_LIFECYCLE',
        shortCode: 'SLC',
        name: '生命週期供應商',
        contactPerson: '初始聯絡人',
        phone: '02-00000000',
        paymentTerms: '月結30天'
      });

      expect(supplier.name).toBe('生命週期供應商');
      expect(supplier.contactPerson).toBe('初始聯絡人');
      expect(supplier.paymentTerms).toBe('月結30天');

      // 更新聯絡資訊
      (supplier as any).updateSupplierInfo({
        contactPerson: '新聯絡人',
        phone: '02-99999999',
        email: 'new@example.com'
      });
      await supplier.save();

      expect(supplier.contactPerson).toBe('新聯絡人');
      expect(supplier.phone).toBe('02-99999999');
      expect(supplier.email).toBe('new@example.com');

      // 更新付款條件
      (supplier as any).updateSupplierInfo({
        paymentTerms: '現金交易',
        notes: '改為現金交易'
      });
      await supplier.save();

      expect(supplier.paymentTerms).toBe('現金交易');
      expect(supplier.notes).toBe('改為現金交易');

      // 驗證摘要
      const summary = (supplier as any).getSupplierSummary();
      expect(summary.code).toBe('SUP_LIFECYCLE');
      expect(summary.name).toBe('生命週期供應商');
      expect(summary.contactPerson).toBe('新聯絡人');
    });

    it('應該處理多種供應商類型', async () => {
      const suppliers = await Supplier.create([
        {
          code: 'SUP_PHARMA',
          shortCode: 'SPH',
          name: '製藥公司',
          contactPerson: '藥品經理',
          phone: '02-11111111',
          email: 'pharma@example.com',
          taxId: '11111111',
          paymentTerms: '月結60天',
          notes: '主要藥品供應商'
        },
        {
          code: 'SUP_MEDICAL',
          shortCode: 'SMD',
          name: '醫療器材公司',
          contactPerson: '器材經理',
          phone: '02-22222222',
          email: 'medical@example.com',
          taxId: '22222222',
          paymentTerms: '月結30天',
          notes: '醫療器材專業供應商'
        },
        {
          code: 'SUP_OFFICE',
          shortCode: 'SOF',
          name: '辦公用品公司',
          contactPerson: '業務代表',
          phone: '02-33333333',
          paymentTerms: '現金交易',
          notes: '辦公用品供應商'
        }
      ]);

      expect(suppliers).toHaveLength(3);

      // 驗證每個供應商的特定屬性
      const pharmaSupplier = suppliers.find(s => s.code === 'SUP_PHARMA');
      expect(pharmaSupplier?.paymentTerms).toBe('月結60天');
      expect(pharmaSupplier?.taxId).toBe('11111111');

      const medicalSupplier = suppliers.find(s => s.code === 'SUP_MEDICAL');
      expect(medicalSupplier?.contactPerson).toBe('器材經理');
      expect(medicalSupplier?.email).toBe('medical@example.com');

      const officeSupplier = suppliers.find(s => s.code === 'SUP_OFFICE');
      expect(officeSupplier?.paymentTerms).toBe('現金交易');
      expect(officeSupplier?.email).toBeUndefined();
    });

    it('應該處理供應商資訊的批量更新', async () => {
      await Supplier.create([
        {
          code: 'SUP_BATCH1',
          shortCode: 'SB1',
          name: '批量供應商1',
          paymentTerms: '月結30天'
        },
        {
          code: 'SUP_BATCH2',
          shortCode: 'SB2',
          name: '批量供應商2',
          paymentTerms: '月結30天'
        },
        {
          code: 'SUP_BATCH3',
          shortCode: 'SB3',
          name: '批量供應商3',
          paymentTerms: '現金交易'
        }
      ]);

      // 批量更新月結供應商的付款條件
      const monthlySuppliers = await Supplier.find({ paymentTerms: '月結30天' });
      
      for (const supplier of monthlySuppliers) {
        (supplier as any).updateSupplierInfo({
          paymentTerms: '月結45天',
          notes: '統一調整付款條件'
        });
        await supplier.save();
      }

      // 驗證更新結果
      const updatedSuppliers = await Supplier.find({ paymentTerms: '月結45天' });
      expect(updatedSuppliers).toHaveLength(2);
      
      updatedSuppliers.forEach(supplier => {
        expect(supplier.notes).toBe('統一調整付款條件');
      });

      // 驗證未更新的供應商
      const cashSupplier = await Supplier.findOne({ code: 'SUP_BATCH3' });
      expect(cashSupplier?.paymentTerms).toBe('現金交易');
      expect(cashSupplier?.notes).toBeUndefined();
    });
  });
});