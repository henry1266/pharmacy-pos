import Category2, { ICategory2 } from '../Category2';

describe('Category2 Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Category2.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的類別', async () => {
      const categoryData: Partial<ICategory2> = {
        name: '收入類別',
        type: 'income',
        icon: '💰',
        color: '#FF6B6B',
        description: '主要收入來源',
        isDefault: false,
        isActive: true,
        sortOrder: 1,
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.type).toBe(categoryData.type);
      expect(savedCategory.icon).toBe(categoryData.icon);
      expect(savedCategory.color).toBe(categoryData.color);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.isDefault).toBe(categoryData.isDefault);
      expect(savedCategory.isActive).toBe(categoryData.isActive);
      expect(savedCategory.sortOrder).toBe(categoryData.sortOrder);
      expect(savedCategory.createdBy).toBe(categoryData.createdBy);
      expect((savedCategory as any).createdAt).toBeDefined();
      expect((savedCategory as any).updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const category = new Category2({});
      await expect(category.save()).rejects.toThrow();
    });

    it('應該要求類別名稱', async () => {
      const categoryData = {
        type: 'income',
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該要求類別類型', async () => {
      const categoryData = {
        name: '測試類別',
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow(/type.*required/i);
    });

    it('應該要求創建者', async () => {
      const categoryData = {
        name: '測試類別',
        type: 'income'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow(/createdBy.*required/i);
    });

    it('應該驗證類型枚舉值', async () => {
      const categoryData = {
        name: '測試類別',
        type: 'invalid_type' as any,
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow();
    });

    it('應該驗證顏色格式', async () => {
      const categoryData = {
        name: '測試類別',
        type: 'income',
        color: 'invalid_color',
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow();
    });

    it('應該驗證名稱長度', async () => {
      const longName = 'a'.repeat(101); // 超過100個字符
      const categoryData = {
        name: longName,
        type: 'income',
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow();
    });

    it('應該驗證圖標長度', async () => {
      const longIcon = 'a'.repeat(51); // 超過50個字符
      const categoryData = {
        name: '測試類別',
        type: 'income',
        icon: longIcon,
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow();
    });

    it('應該驗證描述長度', async () => {
      const longDescription = 'a'.repeat(501); // 超過500個字符
      const categoryData = {
        name: '測試類別',
        type: 'income',
        description: longDescription,
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      await expect(category.save()).rejects.toThrow();
    });

    it('應該設置默認值', async () => {
      const categoryData = {
        name: '測試類別',
        type: 'income',
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.isDefault).toBe(false);
      expect(savedCategory.isActive).toBe(true);
      expect(savedCategory.sortOrder).toBe(0);
      expect(savedCategory.parentId).toBeNull();
      expect(savedCategory.organizationId).toBeNull();
    });
  });

  describe('Virtual Fields', () => {
    it('應該支援子類別虛擬欄位', async () => {
      // 創建父類別
      const parentCategory = await Category2.create({
        name: '父類別',
        type: 'income',
        createdBy: 'user123'
      });

      // 創建子類別
      const childCategory = await Category2.create({
        name: '子類別',
        type: 'income',
        parentId: parentCategory._id,
        createdBy: 'user123'
      });

      // 查詢父類別並填充子類別
      const populatedParent = await Category2.findById(parentCategory._id).populate('children');
      expect(populatedParent?.children).toHaveLength(1);
      expect(populatedParent?.children?.[0].name).toBe('子類別');
    });
  });

  describe('Indexes', () => {
    it('應該支援按創建者、類型和活躍狀態查詢', async () => {
      await Category2.create([
        {
          name: '收入類別1',
          type: 'income',
          isActive: true,
          createdBy: 'user123'
        },
        {
          name: '支出類別1',
          type: 'expense',
          isActive: true,
          createdBy: 'user123'
        },
        {
          name: '收入類別2',
          type: 'income',
          isActive: false,
          createdBy: 'user123'
        }
      ]);

      const activeIncomeCategories = await Category2.find({
        createdBy: 'user123',
        type: 'income',
        isActive: true
      });

      expect(activeIncomeCategories).toHaveLength(1);
      expect(activeIncomeCategories[0].name).toBe('收入類別1');
    });

    it('應該支援按機構查詢', async () => {
      const orgId = '507f1f77bcf86cd799439011';

      await Category2.create([
        {
          name: '機構類別',
          type: 'income',
          organizationId: orgId,
          createdBy: 'user123'
        },
        {
          name: '個人類別',
          type: 'income',
          createdBy: 'user123'
        }
      ]);

      const orgCategories = await Category2.find({
        organizationId: orgId,
        type: 'income',
        isActive: true
      });

      expect(orgCategories).toHaveLength(1);
      expect(orgCategories[0].name).toBe('機構類別');
    });

    it('應該支援按父類別和排序查詢', async () => {
      const parentId = '507f1f77bcf86cd799439012';

      await Category2.create([
        {
          name: '子類別1',
          type: 'income',
          parentId: parentId,
          sortOrder: 2,
          createdBy: 'user123'
        },
        {
          name: '子類別2',
          type: 'income',
          parentId: parentId,
          sortOrder: 1,
          createdBy: 'user123'
        }
      ]);

      const sortedChildren = await Category2.find({
        parentId: parentId
      }).sort({ sortOrder: 1 });

      expect(sortedChildren).toHaveLength(2);
      expect(sortedChildren[0].name).toBe('子類別2'); // sortOrder: 1
      expect(sortedChildren[1].name).toBe('子類別1'); // sortOrder: 2
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const categoryData = {
        name: '測試類別',
        type: 'income',
        createdBy: 'user123'
      };

      const category = new Category2(categoryData);
      const savedCategory = await category.save();

      expect((savedCategory as any).createdAt).toBeDefined();
      expect((savedCategory as any).updatedAt).toBeDefined();
      expect((savedCategory as any).createdAt).toBeInstanceOf(Date);
      expect((savedCategory as any).updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const category = await Category2.create({
        name: '測試類別',
        type: 'income',
        createdBy: 'user123'
      });

      const originalUpdatedAt = (category as any).updatedAt;

      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));

      category.name = '更新的名稱';
      const updatedCategory = await category.save();

      expect((updatedCategory as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await Category2.create([
        {
          name: '工資收入',
          type: 'income',
          isDefault: true,
          isActive: true,
          sortOrder: 1,
          createdBy: 'user123'
        },
        {
          name: '餐飲支出',
          type: 'expense',
          isDefault: false,
          isActive: true,
          sortOrder: 2,
          createdBy: 'user123'
        },
        {
          name: '投資收入',
          type: 'income',
          isDefault: false,
          isActive: false,
          sortOrder: 3,
          createdBy: 'user123'
        }
      ]);
    });

    it('應該能夠按類型查詢', async () => {
      const incomeCategories = await Category2.find({ type: 'income' });
      expect(incomeCategories).toHaveLength(2);

      const expenseCategories = await Category2.find({ type: 'expense' });
      expect(expenseCategories).toHaveLength(1);
    });

    it('應該能夠按默認狀態查詢', async () => {
      const defaultCategories = await Category2.find({ isDefault: true });
      expect(defaultCategories).toHaveLength(1);
      expect(defaultCategories[0].name).toBe('工資收入');
    });

    it('應該能夠按活躍狀態查詢', async () => {
      const activeCategories = await Category2.find({ isActive: true });
      expect(activeCategories).toHaveLength(2);
    });

    it('應該能夠按創建者查詢', async () => {
      const userCategories = await Category2.find({ createdBy: 'user123' });
      expect(userCategories).toHaveLength(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的類別層次結構', async () => {
      // 創建根類別
      const rootCategory = await Category2.create({
        name: '收入',
        type: 'income',
        createdBy: 'user123'
      });

      // 創建子類別
      const child1 = await Category2.create({
        name: '工資',
        type: 'income',
        parentId: rootCategory._id,
        sortOrder: 1,
        createdBy: 'user123'
      });

      const child2 = await Category2.create({
        name: '投資',
        type: 'income',
        parentId: rootCategory._id,
        sortOrder: 2,
        createdBy: 'user123'
      });

      // 創建孫類別
      const grandchild = await Category2.create({
        name: '股票投資',
        type: 'income',
        parentId: child2._id,
        sortOrder: 1,
        createdBy: 'user123'
      });

      // 驗證層次結構
      const populatedRoot = await Category2.findById(rootCategory._id).populate({
        path: 'children',
        populate: {
          path: 'children'
        }
      });

      expect(populatedRoot?.children).toHaveLength(2);
      const investmentCategory = populatedRoot?.children?.find(c => c.name === '投資');
      expect(investmentCategory?.children).toHaveLength(1);
      expect(investmentCategory?.children?.[0].name).toBe('股票投資');
    });

    it('應該處理類別停用和重新啟用', async () => {
      const category = await Category2.create({
        name: '臨時類別',
        type: 'income',
        isActive: true,
        createdBy: 'user123'
      });

      // 停用類別
      category.isActive = false;
      await category.save();

      let foundCategory = await Category2.findById(category._id);
      expect(foundCategory?.isActive).toBe(false);

      // 重新啟用類別
      category.isActive = true;
      await category.save();

      foundCategory = await Category2.findById(category._id);
      expect(foundCategory?.isActive).toBe(true);
    });

    it('應該處理排序更新', async () => {
      const categories = await Category2.create([
        {
          name: '類別A',
          type: 'income',
          sortOrder: 1,
          createdBy: 'user123'
        },
        {
          name: '類別B',
          type: 'income',
          sortOrder: 2,
          createdBy: 'user123'
        }
      ]);

      // 交換排序
      categories[0].sortOrder = 3;
      categories[1].sortOrder = 1;
      await Promise.all([
        categories[0].save(),
        categories[1].save()
      ]);

      const sortedCategories = await Category2.find({ type: 'income' }).sort({ sortOrder: 1 });
      expect(sortedCategories[0].name).toBe('類別B');
      expect(sortedCategories[1].name).toBe('類別A');
    });
  });
});