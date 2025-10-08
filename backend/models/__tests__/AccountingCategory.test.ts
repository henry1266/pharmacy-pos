import AccountingCategory, { type AccountingCategoryDocument } from '../../modules/daily-journals/models/accountingCategory.model';

describe('AccountingCategory Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await AccountingCategory.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的記帳名目類別', async () => {
      const categoryData: Partial<AccountingCategoryDocument> = {
        name: '收入類別',
        description: '各種收入項目',
        order: 1,
        isActive: true
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.order).toBe(categoryData.order);
      expect(savedCategory.isActive).toBe(categoryData.isActive);
      expect(savedCategory.createdAt).toBeDefined();
      expect(savedCategory.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位name', async () => {
      const category = new AccountingCategory({});
      
      await expect(category.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該確保名稱唯一性', async () => {
      const categoryData1 = {
        name: '支出類別',
        description: '各種支出項目'
      };

      const categoryData2 = {
        name: '支出類別', // 相同名稱
        description: '重複的支出項目'
      };

      await new AccountingCategory(categoryData1).save();
      
      const category2 = new AccountingCategory(categoryData2);
      await expect(category2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該自動修剪名稱空白', async () => {
      const categoryData = {
        name: '  資產類別  ',
        description: '固定資產和流動資產'
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();
      
      expect(savedCategory.name).toBe('資產類別');
    });

    it('應該設置預設值', async () => {
      const categoryData = {
        name: '負債類別'
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();
      
      expect(savedCategory.description).toBe('');
      expect(savedCategory.order).toBe(999);
      expect(savedCategory.isActive).toBe(true);
      expect(savedCategory.createdAt).toBeDefined();
      expect(savedCategory.updatedAt).toBeDefined();
    });
  });

  describe('Optional Fields', () => {
    it('應該允許創建只有必填欄位的類別', async () => {
      const minimalCategoryData = {
        name: '最小類別'
      };

      const category = new AccountingCategory(minimalCategoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe(minimalCategoryData.name);
      expect(savedCategory.description).toBe('');
      expect(savedCategory.order).toBe(999);
      expect(savedCategory.isActive).toBe(true);
    });

    it('應該允許設置所有選填欄位', async () => {
      const completeCategoryData = {
        name: '完整類別',
        description: '完整的類別描述',
        order: 5,
        isActive: false
      };

      const category = new AccountingCategory(completeCategoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe(completeCategoryData.name);
      expect(savedCategory.description).toBe(completeCategoryData.description);
      expect(savedCategory.order).toBe(completeCategoryData.order);
      expect(savedCategory.isActive).toBe(completeCategoryData.isActive);
    });

    it('應該允許空的描述', async () => {
      const categoryData = {
        name: '無描述類別',
        description: ''
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.description).toBe('');
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const categoryData = {
        name: '時間戳測試類別'
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();
      
      expect(savedCategory.createdAt).toBeDefined();
      expect(savedCategory.updatedAt).toBeDefined();
      expect(savedCategory.createdAt).toBeInstanceOf(Date);
      expect(savedCategory.updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const categoryData = {
        name: '更新測試類別'
      };

      const category = await new AccountingCategory(categoryData).save();
      const originalUpdatedAt = category.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      category.description = '更新的描述';
      const updatedCategory = await category.save();
      
      expect(updatedCategory.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await AccountingCategory.create([
        {
          name: '收入類別',
          description: '各種收入項目',
          order: 1,
          isActive: true
        },
        {
          name: '支出類別',
          description: '各種支出項目',
          order: 2,
          isActive: true
        },
        {
          name: '資產類別',
          description: '固定資產和流動資產',
          order: 3,
          isActive: false
        },
        {
          name: '負債類別',
          description: '短期和長期負債',
          order: 4,
          isActive: true
        }
      ]);
    });

    it('應該能夠按名稱查詢', async () => {
      const category = await AccountingCategory.findOne({ name: '收入類別' });
      expect(category).toBeTruthy();
      expect(category?.description).toBe('各種收入項目');
      expect(category?.order).toBe(1);
    });

    it('應該能夠按活躍狀態查詢', async () => {
      const activeCategories = await AccountingCategory.find({ isActive: true });
      expect(activeCategories).toHaveLength(3);

      const inactiveCategories = await AccountingCategory.find({ isActive: false });
      expect(inactiveCategories).toHaveLength(1);
      expect(inactiveCategories[0].name).toBe('資產類別');
    });

    it('應該能夠按順序排序查詢', async () => {
      const categories = await AccountingCategory.find({}).sort({ order: 1 });
      expect(categories).toHaveLength(4);
      expect(categories[0].name).toBe('收入類別');
      expect(categories[1].name).toBe('支出類別');
      expect(categories[2].name).toBe('資產類別');
      expect(categories[3].name).toBe('負債類別');
    });

    it('應該能夠按描述模糊查詢', async () => {
      const categories = await AccountingCategory.find({ 
        description: { $regex: '資產', $options: 'i' } 
      });
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('資產類別');
    });

    it('應該能夠查詢活躍且有描述的類別', async () => {
      const categories = await AccountingCategory.find({ 
        isActive: true,
        description: { $ne: '' }
      });
      expect(categories).toHaveLength(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的類別生命週期', async () => {
      // 創建新類別
      const category = await AccountingCategory.create({
        name: '生命週期類別',
        description: '初始描述',
        order: 10,
        isActive: true
      });

      expect(category.name).toBe('生命週期類別');
      expect(category.description).toBe('初始描述');
      expect(category.order).toBe(10);
      expect(category.isActive).toBe(true);

      // 更新描述
      category.description = '更新的描述';
      await category.save();

      expect(category.description).toBe('更新的描述');

      // 停用類別
      category.isActive = false;
      await category.save();

      expect(category.isActive).toBe(false);

      // 重新排序
      category.order = 1;
      await category.save();

      expect(category.order).toBe(1);
    });

    it('應該處理多種類別類型', async () => {
      const categories = await AccountingCategory.create([
        {
          name: '藥品銷售',
          description: '處方藥和非處方藥銷售收入',
          order: 1,
          isActive: true
        },
        {
          name: '醫療器材',
          description: '醫療器材銷售收入',
          order: 2,
          isActive: true
        },
        {
          name: '營運費用',
          description: '日常營運相關費用',
          order: 10,
          isActive: true
        },
        {
          name: '已停用類別',
          description: '不再使用的類別',
          order: 999,
          isActive: false
        }
      ]);

      expect(categories).toHaveLength(4);

      // 驗證每個類別的特定屬性
      const pharmaCategory = categories.find(c => c.name === '藥品銷售');
      expect(pharmaCategory?.order).toBe(1);
      expect(pharmaCategory?.isActive).toBe(true);

      const medicalCategory = categories.find(c => c.name === '醫療器材');
      expect(medicalCategory?.description).toBe('醫療器材銷售收入');

      const expenseCategory = categories.find(c => c.name === '營運費用');
      expect(expenseCategory?.order).toBe(10);

      const inactiveCategory = categories.find(c => c.name === '已停用類別');
      expect(inactiveCategory?.isActive).toBe(false);
    });

    it('應該處理類別的批量更新', async () => {
      await AccountingCategory.create([
        {
          name: '批量類別1',
          order: 5,
          isActive: true
        },
        {
          name: '批量類別2',
          order: 5,
          isActive: true
        },
        {
          name: '批量類別3',
          order: 10,
          isActive: true
        }
      ]);

      // 批量更新相同順序的類別
      const categoriesToUpdate = await AccountingCategory.find({ order: 5 });
      
      for (const category of categoriesToUpdate) {
        category.order = 15;
        category.description = '批量更新的描述';
        await category.save();
      }

      // 驗證更新結果
      const updatedCategories = await AccountingCategory.find({ order: 15 });
      expect(updatedCategories).toHaveLength(2);
      
      updatedCategories.forEach(category => {
        expect(category.description).toBe('批量更新的描述');
      });

      // 驗證未更新的類別
      const unchangedCategory = await AccountingCategory.findOne({ order: 10 });
      expect(unchangedCategory?.name).toBe('批量類別3');
      expect(unchangedCategory?.description).toBe('');
    });

    it('應該處理重新排序場景', async () => {
      const categories = await AccountingCategory.create([
        { name: '類別A', order: 1 },
        { name: '類別B', order: 2 },
        { name: '類別C', order: 3 },
        { name: '類別D', order: 4 }
      ]);

      // 將類別D移到第一位
      const categoryD = categories.find(c => c.name === '類別D');
      if (categoryD) {
        categoryD.order = 0;
        await categoryD.save();
      }

      // 驗證新的排序
      const sortedCategories = await AccountingCategory.find({}).sort({ order: 1 });
      expect(sortedCategories[0].name).toBe('類別D');
      expect(sortedCategories[0].order).toBe(0);
      expect(sortedCategories[1].name).toBe('類別A');
      expect(sortedCategories[2].name).toBe('類別B');
      expect(sortedCategories[3].name).toBe('類別C');
    });
  });

  describe('Edge Cases', () => {
    it('應該處理極長的名稱', async () => {
      const longName = 'A'.repeat(100);
      const categoryData = {
        name: longName,
        description: '極長名稱測試'
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe(longName);
    });

    it('應該處理極長的描述', async () => {
      const longDescription = 'B'.repeat(500);
      const categoryData = {
        name: '極長描述測試',
        description: longDescription
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.description).toBe(longDescription);
    });

    it('應該處理負數順序', async () => {
      const categoryData = {
        name: '負數順序類別',
        order: -1
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.order).toBe(-1);
    });

    it('應該處理零順序', async () => {
      const categoryData = {
        name: '零順序類別',
        order: 0
      };

      const category = new AccountingCategory(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.order).toBe(0);
    });
  });
});
