import AccountingEntry, { IAccountingEntry } from '../AccountingEntry';
import mongoose from 'mongoose';

describe('AccountingEntry Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await AccountingEntry.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的記帳分錄', async () => {
      const entryData: Partial<IAccountingEntry> = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '現金收入',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();

      expect(savedEntry._id).toBeDefined();
      expect(savedEntry.transactionGroupId).toEqual(entryData.transactionGroupId);
      expect(savedEntry.sequence).toBe(entryData.sequence);
      expect(savedEntry.accountId).toEqual(entryData.accountId);
      expect(savedEntry.debitAmount).toBe(entryData.debitAmount);
      expect(savedEntry.creditAmount).toBe(entryData.creditAmount);
      expect(savedEntry.description).toBe(entryData.description);
      expect(savedEntry.createdBy).toBe(entryData.createdBy);
      expect(savedEntry.createdAt).toBeDefined();
      expect(savedEntry.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const entry = new AccountingEntry({});
      
      await expect(entry.save()).rejects.toThrow();
    });

    it('應該要求transactionGroupId', async () => {
      const entryData = {
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow(/transactionGroupId.*required/i);
    });

    it('應該要求sequence', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow(/sequence.*required/i);
    });

    it('應該要求accountId', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow(/accountId.*required/i);
    });

    it('應該要求description', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow(/description.*required/i);
    });

    it('應該要求createdBy', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試分錄'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow(/createdBy.*required/i);
    });

    it('應該設置預設值', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000, // 必須有一個金額大於0
        creditAmount: 0,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.debitAmount).toBe(1000);
      expect(savedEntry.creditAmount).toBe(0);
      expect(savedEntry.categoryId).toBeNull();
      expect(savedEntry.sourceTransactionId).toBeNull();
      expect(savedEntry.organizationId).toBeNull();
      expect(savedEntry.fundingPath).toEqual([]);
    });

    it('應該自動修剪描述空白', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '  測試分錄  ',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.description).toBe('測試分錄');
    });

    it('應該限制描述長度', async () => {
      const longDescription = 'A'.repeat(501);
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: longDescription,
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow(/maximum allowed length/i);
    });
  });

  describe('Double Entry Validation', () => {
    it('應該拒絕借方和貸方金額都為0的分錄', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 0,
        creditAmount: 0,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow('借方金額或貸方金額至少要有一個大於0');
    });

    it('應該拒絕借方和貸方金額同時大於0的分錄', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 500,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow('借方金額和貸方金額不能同時大於0');
    });

    it('應該允許只有借方金額的分錄', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '借方分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.debitAmount).toBe(1000);
      expect(savedEntry.creditAmount).toBe(0);
    });

    it('應該允許只有貸方金額的分錄', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 0,
        creditAmount: 1000,
        description: '貸方分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.debitAmount).toBe(0);
      expect(savedEntry.creditAmount).toBe(1000);
    });

    it('應該拒絕負數金額', async () => {
      const entryData1 = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: -1000,
        creditAmount: 0,
        description: '負數借方',
        createdBy: 'testUser'
      };

      const entry1 = new AccountingEntry(entryData1);
      await expect(entry1.save()).rejects.toThrow();

      const entryData2 = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 0,
        creditAmount: -1000,
        description: '負數貸方',
        createdBy: 'testUser'
      };

      const entry2 = new AccountingEntry(entryData2);
      await expect(entry2.save()).rejects.toThrow();
    });
  });

  describe('Sequence Validation', () => {
    it('應該要求sequence最小值為1', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 0,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      await expect(entry.save()).rejects.toThrow();
    });

    it('應該確保同一交易群組內序號唯一性', async () => {
      const transactionGroupId = new mongoose.Types.ObjectId();
      
      const entryData1 = {
        transactionGroupId,
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '第一筆分錄',
        createdBy: 'testUser'
      };

      const entryData2 = {
        transactionGroupId,
        sequence: 1, // 相同序號
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 0,
        creditAmount: 1000,
        description: '第二筆分錄',
        createdBy: 'testUser'
      };

      await new AccountingEntry(entryData1).save();
      
      const entry2 = new AccountingEntry(entryData2);
      await expect(entry2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該允許不同交易群組使用相同序號', async () => {
      const transactionGroupId1 = new mongoose.Types.ObjectId();
      const transactionGroupId2 = new mongoose.Types.ObjectId();
      
      const entryData1 = {
        transactionGroupId: transactionGroupId1,
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '群組1分錄',
        createdBy: 'testUser'
      };

      const entryData2 = {
        transactionGroupId: transactionGroupId2,
        sequence: 1, // 相同序號但不同群組
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 0,
        creditAmount: 1000,
        description: '群組2分錄',
        createdBy: 'testUser'
      };

      const entry1 = await new AccountingEntry(entryData1).save();
      const entry2 = await new AccountingEntry(entryData2).save();
      
      expect(entry1.sequence).toBe(1);
      expect(entry2.sequence).toBe(1);
      expect(entry1.transactionGroupId).not.toEqual(entry2.transactionGroupId);
    });
  });

  describe('Optional Fields', () => {
    it('應該允許設置categoryId', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        categoryId,
        description: '有類別的分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.categoryId).toEqual(categoryId);
    });

    it('應該允許設置organizationId', async () => {
      const organizationId = new mongoose.Types.ObjectId();
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        organizationId,
        description: '有機構的分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.organizationId).toEqual(organizationId);
    });

    it('應該允許設置資金來源追蹤欄位', async () => {
      const sourceTransactionId = new mongoose.Types.ObjectId();
      const fundingPath = ['tx1', 'tx2', 'tx3'];
      
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        sourceTransactionId,
        fundingPath,
        description: '有資金追蹤的分錄',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.sourceTransactionId).toEqual(sourceTransactionId);
      expect(savedEntry.fundingPath).toEqual(fundingPath);
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '時間戳測試',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.createdAt).toBeDefined();
      expect(savedEntry.updatedAt).toBeDefined();
      expect(savedEntry.createdAt).toBeInstanceOf(Date);
      expect(savedEntry.updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '更新測試',
        createdBy: 'testUser'
      };

      const entry = await new AccountingEntry(entryData).save();
      const originalUpdatedAt = entry.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      entry.description = '更新的描述';
      const updatedEntry = await entry.save();
      
      expect(updatedEntry.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      const transactionGroupId1 = new mongoose.Types.ObjectId();
      const transactionGroupId2 = new mongoose.Types.ObjectId();
      const accountId1 = new mongoose.Types.ObjectId();
      const accountId2 = new mongoose.Types.ObjectId();
      
      // 創建測試數據
      await AccountingEntry.create([
        {
          transactionGroupId: transactionGroupId1,
          sequence: 1,
          accountId: accountId1,
          debitAmount: 1000,
          creditAmount: 0,
          description: '現金收入',
          createdBy: 'user1'
        },
        {
          transactionGroupId: transactionGroupId1,
          sequence: 2,
          accountId: accountId2,
          debitAmount: 0,
          creditAmount: 1000,
          description: '銷售收入',
          createdBy: 'user1'
        },
        {
          transactionGroupId: transactionGroupId2,
          sequence: 1,
          accountId: accountId1,
          debitAmount: 500,
          creditAmount: 0,
          description: '辦公用品支出',
          createdBy: 'user2'
        }
      ]);
    });

    it('應該能夠按交易群組查詢', async () => {
      const entries = await AccountingEntry.find({}).sort({ sequence: 1 });
      const firstGroupEntries = entries.filter(e => 
        e.transactionGroupId.toString() === entries[0].transactionGroupId.toString()
      );
      
      expect(firstGroupEntries).toHaveLength(2);
      expect(firstGroupEntries[0].sequence).toBe(1);
      expect(firstGroupEntries[1].sequence).toBe(2);
    });

    it('應該能夠按帳戶查詢', async () => {
      const entries = await AccountingEntry.find({});
      const accountId = entries[0].accountId;
      
      const accountEntries = await AccountingEntry.find({ accountId });
      expect(accountEntries.length).toBeGreaterThanOrEqual(1);
    });

    it('應該能夠按創建者查詢', async () => {
      const user1Entries = await AccountingEntry.find({ createdBy: 'user1' });
      expect(user1Entries).toHaveLength(2);

      const user2Entries = await AccountingEntry.find({ createdBy: 'user2' });
      expect(user2Entries).toHaveLength(1);
    });

    it('應該能夠按借方金額查詢', async () => {
      const debitEntries = await AccountingEntry.find({ debitAmount: { $gt: 0 } });
      expect(debitEntries).toHaveLength(2);

      const creditEntries = await AccountingEntry.find({ creditAmount: { $gt: 0 } });
      expect(creditEntries).toHaveLength(1);
    });

    it('應該能夠按描述模糊查詢', async () => {
      const incomeEntries = await AccountingEntry.find({ 
        description: { $regex: '收入', $options: 'i' } 
      });
      expect(incomeEntries).toHaveLength(2);

      const expenseEntries = await AccountingEntry.find({ 
        description: { $regex: '支出', $options: 'i' } 
      });
      expect(expenseEntries).toHaveLength(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的雙分錄交易', async () => {
      const transactionGroupId = new mongoose.Types.ObjectId();
      const cashAccountId = new mongoose.Types.ObjectId();
      const salesAccountId = new mongoose.Types.ObjectId();
      
      // 借方：現金
      const debitEntry = await AccountingEntry.create({
        transactionGroupId,
        sequence: 1,
        accountId: cashAccountId,
        debitAmount: 1000,
        creditAmount: 0,
        description: '現金收入',
        createdBy: 'testUser'
      });

      // 貸方：銷售收入
      const creditEntry = await AccountingEntry.create({
        transactionGroupId,
        sequence: 2,
        accountId: salesAccountId,
        debitAmount: 0,
        creditAmount: 1000,
        description: '銷售收入',
        createdBy: 'testUser'
      });

      expect(debitEntry.transactionGroupId).toEqual(creditEntry.transactionGroupId);
      expect(debitEntry.debitAmount).toBe(creditEntry.creditAmount);
      expect(debitEntry.sequence).toBe(1);
      expect(creditEntry.sequence).toBe(2);
    });

    it('應該處理多筆分錄的複雜交易', async () => {
      const transactionGroupId = new mongoose.Types.ObjectId();
      const cashAccountId = new mongoose.Types.ObjectId();
      const salesAccountId = new mongoose.Types.ObjectId();
      const taxAccountId = new mongoose.Types.ObjectId();
      
      const entries = await AccountingEntry.create([
        {
          transactionGroupId,
          sequence: 1,
          accountId: cashAccountId,
          debitAmount: 1050, // 含稅金額
          creditAmount: 0,
          description: '現金收入（含稅）',
          createdBy: 'testUser'
        },
        {
          transactionGroupId,
          sequence: 2,
          accountId: salesAccountId,
          debitAmount: 0,
          creditAmount: 1000,
          description: '銷售收入',
          createdBy: 'testUser'
        },
        {
          transactionGroupId,
          sequence: 3,
          accountId: taxAccountId,
          debitAmount: 0,
          creditAmount: 50,
          description: '銷售稅',
          createdBy: 'testUser'
        }
      ]);

      expect(entries).toHaveLength(3);
      
      // 驗證借貸平衡
      const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
      const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
      expect(totalDebit).toBe(totalCredit);
    });

    it('應該處理資金來源追蹤', async () => {
      const sourceTransactionId = new mongoose.Types.ObjectId();
      const fundingPath = [
        sourceTransactionId.toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];
      
      const entry = await AccountingEntry.create({
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        sourceTransactionId,
        fundingPath,
        description: '資金追蹤測試',
        createdBy: 'testUser'
      });

      expect(entry.sourceTransactionId).toEqual(sourceTransactionId);
      expect(entry.fundingPath).toEqual(fundingPath);
      
      // 測試按資金來源查詢
      const sourceEntries = await AccountingEntry.find({ sourceTransactionId });
      expect(sourceEntries).toHaveLength(1);
      expect(sourceEntries[0]._id).toEqual(entry._id);
    });

    it('應該處理機構權限分離', async () => {
      const org1Id = new mongoose.Types.ObjectId();
      const org2Id = new mongoose.Types.ObjectId();
      
      await AccountingEntry.create([
        {
          transactionGroupId: new mongoose.Types.ObjectId(),
          sequence: 1,
          accountId: new mongoose.Types.ObjectId(),
          debitAmount: 1000,
          creditAmount: 0,
          organizationId: org1Id,
          description: '機構1分錄',
          createdBy: 'user1'
        },
        {
          transactionGroupId: new mongoose.Types.ObjectId(),
          sequence: 1,
          accountId: new mongoose.Types.ObjectId(),
          debitAmount: 500,
          creditAmount: 0,
          organizationId: org2Id,
          description: '機構2分錄',
          createdBy: 'user2'
        }
      ]);

      // 按機構查詢
      const org1Entries = await AccountingEntry.find({ organizationId: org1Id });
      expect(org1Entries).toHaveLength(1);
      expect(org1Entries[0].description).toBe('機構1分錄');

      const org2Entries = await AccountingEntry.find({ organizationId: org2Id });
      expect(org2Entries).toHaveLength(1);
      expect(org2Entries[0].description).toBe('機構2分錄');
    });
  });

  describe('Edge Cases', () => {
    it('應該處理極大金額', async () => {
      const largeAmount = 999999999.99;
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: largeAmount,
        creditAmount: 0,
        description: '極大金額測試',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.debitAmount).toBe(largeAmount);
    });

    it('應該處理小數金額', async () => {
      const decimalAmount = 123.45;
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: decimalAmount,
        creditAmount: 0,
        description: '小數金額測試',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.debitAmount).toBe(decimalAmount);
    });

    it('應該處理極長的資金路徑', async () => {
      const longFundingPath = Array.from({ length: 100 }, () =>
        new mongoose.Types.ObjectId().toString()
      );
      
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: 1,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        fundingPath: longFundingPath,
        description: '極長資金路徑測試',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.fundingPath).toHaveLength(100);
      expect(savedEntry.fundingPath).toEqual(longFundingPath);
    });

    it('應該處理極大的序號', async () => {
      const largeSequence = 999999;
      const entryData = {
        transactionGroupId: new mongoose.Types.ObjectId(),
        sequence: largeSequence,
        accountId: new mongoose.Types.ObjectId(),
        debitAmount: 1000,
        creditAmount: 0,
        description: '極大序號測試',
        createdBy: 'testUser'
      };

      const entry = new AccountingEntry(entryData);
      const savedEntry = await entry.save();
      
      expect(savedEntry.sequence).toBe(largeSequence);
    });
  });
});