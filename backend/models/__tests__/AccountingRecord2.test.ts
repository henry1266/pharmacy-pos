import AccountingRecord2, { IAccountingRecord2 } from '../../modules/accounting-old/models/AccountingRecord2';
import mongoose from 'mongoose';

describe('AccountingRecord2 Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await AccountingRecord2.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的記帳記錄', async () => {
      const recordData: Partial<IAccountingRecord2> = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId().toString(),
        accountId: new mongoose.Types.ObjectId().toString(),
        date: new Date(),
        description: '銷售收入',
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();

      expect(savedRecord._id).toBeDefined();
      expect(savedRecord.type).toBe(recordData.type);
      expect(savedRecord.amount).toBe(recordData.amount);
      expect(savedRecord.categoryId.toString()).toBe(recordData.categoryId);
      expect(savedRecord.accountId.toString()).toBe(recordData.accountId);
      expect(savedRecord.description).toBe(recordData.description);
      expect(savedRecord.createdBy).toBe(recordData.createdBy);
      expect(savedRecord.createdAt).toBeDefined();
      expect(savedRecord.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const record = new AccountingRecord2({});
      
      await expect(record.save()).rejects.toThrow();
    });

    it('應該要求type', async () => {
      const recordData = {
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/type.*required/i);
    });

    it('應該要求amount', async () => {
      const recordData = {
        type: 'income',
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/amount.*required/i);
    });

    it('應該要求categoryId', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/categoryId.*required/i);
    });

    it('應該要求accountId', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/accountId.*required/i);
    });

    it('應該要求createdBy', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId()
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/createdBy.*required/i);
    });

    it('應該限制type為指定值', async () => {
      const recordData = {
        type: 'invalid_type',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/enum/i);
    });

    it('應該拒絕負數金額', async () => {
      const recordData = {
        type: 'income',
        amount: -1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow();
    });

    it('應該設置預設日期', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.date).toBeDefined();
      expect(savedRecord.date).toBeInstanceOf(Date);
    });

    it('應該自動修剪描述空白', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        description: '  測試描述  ',
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.description).toBe('測試描述');
    });

    it('應該限制描述長度', async () => {
      const longDescription = 'A'.repeat(1001);
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        description: longDescription,
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/maximum allowed length/i);
    });
  });

  describe('Type Validation', () => {
    it('應該允許income類型', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.type).toBe('income');
    });

    it('應該允許expense類型', async () => {
      const recordData = {
        type: 'expense',
        amount: 500,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.type).toBe('expense');
    });

    it('應該允許transfer類型', async () => {
      const recordData = {
        type: 'transfer',
        amount: 2000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.type).toBe('transfer');
    });
  });

  describe('Optional Fields', () => {
    it('應該允許設置tags', async () => {
      const tags = ['重要', '月結', '客戶A'];
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        tags,
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.tags).toEqual(tags);
    });

    it('應該允許設置attachments', async () => {
      const attachments = ['receipt1.pdf', 'invoice2.jpg'];
      const recordData = {
        type: 'expense',
        amount: 500,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        attachments,
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.attachments).toEqual(attachments);
    });

    it('應該允許設置organizationId', async () => {
      const organizationId = new mongoose.Types.ObjectId();
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        organizationId: organizationId.toString(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.organizationId).toEqual(organizationId);
    });

    it('應該限制tag長度', async () => {
      const longTag = 'A'.repeat(51);
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        tags: [longTag],
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      await expect(record.save()).rejects.toThrow(/maximum allowed length/i);
    });

    it('應該自動修剪tag空白', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        tags: ['  重要  ', '  月結  '],
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.tags).toEqual(['重要', '月結']);
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.createdAt).toBeDefined();
      expect(savedRecord.updatedAt).toBeDefined();
      expect(savedRecord.createdAt).toBeInstanceOf(Date);
      expect(savedRecord.updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = await new AccountingRecord2(recordData).save();
      const originalUpdatedAt = record.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      record.description = '更新的描述';
      const updatedRecord = await record.save();
      
      expect(updatedRecord.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Basic Query Methods', () => {
    beforeEach(async () => {
      const categoryId1 = new mongoose.Types.ObjectId();
      const categoryId2 = new mongoose.Types.ObjectId();
      const accountId1 = new mongoose.Types.ObjectId();
      const accountId2 = new mongoose.Types.ObjectId();
      const organizationId = new mongoose.Types.ObjectId();
      
      // 使用collection.insertMany避免populate
      await AccountingRecord2.collection.insertMany([
        {
          type: 'income',
          amount: 1000,
          categoryId: categoryId1,
          accountId: accountId1,
          description: '銷售收入',
          tags: ['重要', '月結'],
          organizationId,
          createdBy: 'user1',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          type: 'expense',
          amount: 500,
          categoryId: categoryId2,
          accountId: accountId2,
          description: '辦公用品',
          tags: ['日常'],
          organizationId,
          createdBy: 'user1',
          date: new Date('2024-01-20'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          type: 'transfer',
          amount: 2000,
          categoryId: categoryId1,
          accountId: accountId1,
          description: '帳戶轉移',
          createdBy: 'user2',
          date: new Date('2024-01-25'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });

    it('應該能夠按類型查詢', async () => {
      const incomeCount = await AccountingRecord2.countDocuments({ type: 'income' });
      expect(incomeCount).toBe(1);

      const expenseCount = await AccountingRecord2.countDocuments({ type: 'expense' });
      expect(expenseCount).toBe(1);
    });

    it('應該能夠按創建者查詢', async () => {
      const user1Count = await AccountingRecord2.countDocuments({ createdBy: 'user1' });
      expect(user1Count).toBe(2);

      const user2Count = await AccountingRecord2.countDocuments({ createdBy: 'user2' });
      expect(user2Count).toBe(1);
    });

    it('應該能夠按金額範圍查詢', async () => {
      const highAmountCount = await AccountingRecord2.countDocuments({ 
        amount: { $gte: 1000 } 
      });
      expect(highAmountCount).toBe(2);

      const lowAmountCount = await AccountingRecord2.countDocuments({ 
        amount: { $lt: 1000 } 
      });
      expect(lowAmountCount).toBe(1);
    });

    it('應該能夠按日期範圍查詢', async () => {
      const januaryCount = await AccountingRecord2.countDocuments({
        date: {
          $gte: new Date('2024-01-01'),
          $lt: new Date('2024-02-01')
        }
      });
      expect(januaryCount).toBe(3);

      const midJanuaryCount = await AccountingRecord2.countDocuments({
        date: {
          $gte: new Date('2024-01-20'),
          $lt: new Date('2024-01-30')
        }
      });
      expect(midJanuaryCount).toBe(2);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的收入記錄', async () => {
      const organizationId = new mongoose.Types.ObjectId();
      const categoryId = new mongoose.Types.ObjectId();
      const accountId = new mongoose.Types.ObjectId();
      
      const record = await AccountingRecord2.create({
        type: 'income',
        amount: 5000,
        categoryId,
        accountId,
        date: new Date('2024-01-15'),
        description: '產品銷售收入',
        tags: ['銷售', '重要', '月結'],
        attachments: ['receipt_001.pdf', 'invoice_001.jpg'],
        organizationId,
        createdBy: 'salesManager'
      });

      expect(record.type).toBe('income');
      expect(record.amount).toBe(5000);
      expect(record.description).toBe('產品銷售收入');
      expect(record.tags).toEqual(['銷售', '重要', '月結']);
      expect(record.attachments).toEqual(['receipt_001.pdf', 'invoice_001.jpg']);
      expect(record.organizationId).toEqual(organizationId);
      expect(record.createdBy).toBe('salesManager');
    });

    it('應該處理完整的支出記錄', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      const accountId = new mongoose.Types.ObjectId();
      
      const record = await AccountingRecord2.create({
        type: 'expense',
        amount: 1200,
        categoryId,
        accountId,
        date: new Date('2024-01-20'),
        description: '辦公設備採購',
        tags: ['設備', '必要'],
        attachments: ['purchase_order.pdf'],
        createdBy: 'officeManager'
      });

      expect(record.type).toBe('expense');
      expect(record.amount).toBe(1200);
      expect(record.description).toBe('辦公設備採購');
      expect(record.tags).toEqual(['設備', '必要']);
      expect(record.attachments).toEqual(['purchase_order.pdf']);
      expect(record.organizationId).toBeNull();
    });

    it('應該處理轉帳記錄', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      const accountId = new mongoose.Types.ObjectId();
      
      const record = await AccountingRecord2.create({
        type: 'transfer',
        amount: 10000,
        categoryId,
        accountId,
        date: new Date('2024-01-25'),
        description: '從支票帳戶轉至現金帳戶',
        tags: ['內部轉帳'],
        createdBy: 'accountant'
      });

      expect(record.type).toBe('transfer');
      expect(record.amount).toBe(10000);
      expect(record.description).toBe('從支票帳戶轉至現金帳戶');
      expect(record.tags).toEqual(['內部轉帳']);
    });
  });

  describe('Edge Cases', () => {
    it('應該處理零金額', async () => {
      const recordData = {
        type: 'income',
        amount: 0,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.amount).toBe(0);
    });

    it('應該處理極大金額', async () => {
      const largeAmount = 999999999.99;
      const recordData = {
        type: 'income',
        amount: largeAmount,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.amount).toBe(largeAmount);
    });

    it('應該處理小數金額', async () => {
      const decimalAmount = 123.45;
      const recordData = {
        type: 'expense',
        amount: decimalAmount,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.amount).toBe(decimalAmount);
    });

    it('應該處理空的tags陣列', async () => {
      const recordData = {
        type: 'income',
        amount: 1000,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        tags: [],
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.tags).toEqual([]);
    });

    it('應該處理空的attachments陣列', async () => {
      const recordData = {
        type: 'expense',
        amount: 500,
        categoryId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        attachments: [],
        createdBy: 'testUser'
      };

      const record = new AccountingRecord2(recordData);
      const savedRecord = await record.save();
      
      expect(savedRecord.attachments).toEqual([]);
    });
  });
});