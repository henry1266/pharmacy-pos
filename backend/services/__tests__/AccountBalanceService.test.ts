import { AccountBalanceService } from '../accountBalanceService';
import AccountingEntry from '../../models/AccountingEntry';
import Account2 from '../../models/Account2';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/AccountingEntry');
jest.mock('../../models/Account2');

const MockedAccountingEntry = AccountingEntry as jest.Mocked<typeof AccountingEntry>;
const MockedAccount2 = Account2 as jest.Mocked<typeof Account2>;

describe('AccountBalanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAccountBalance', () => {
    const mockAccount = {
      _id: new mongoose.Types.ObjectId(),
      name: '現金',
      code: '1101',
      accountType: 'asset',
      normalBalance: 'debit'
    };

    const mockEntries = [
      {
        _id: new mongoose.Types.ObjectId(),
        accountId: mockAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        createdAt: new Date('2024-01-01'),
        transactionGroupId: {
          status: 'confirmed',
          transactionDate: new Date('2024-01-01')
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        accountId: mockAccount._id,
        debitAmount: 0,
        creditAmount: 300,
        createdAt: new Date('2024-01-02'),
        transactionGroupId: {
          status: 'confirmed',
          transactionDate: new Date('2024-01-02')
        }
      }
    ];

    beforeEach(() => {
      (MockedAccount2.findById as jest.Mock).mockResolvedValue(mockAccount);
      
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockEntries)
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);
    });

    it('應該正確計算借方科目餘額', async () => {
      const result = await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString());

      expect(result).toEqual({
        accountId: mockAccount._id,
        accountName: mockAccount.name,
        accountCode: mockAccount.code,
        accountType: mockAccount.accountType,
        normalBalance: mockAccount.normalBalance,
        totalDebit: 1000,
        totalCredit: 300,
        balance: 700, // 1000 - 300 (借方科目)
        entryCount: 2,
        lastTransactionDate: new Date('2024-01-02')
      });
    });

    it('應該正確計算貸方科目餘額', async () => {
      const creditAccount = {
        ...mockAccount,
        normalBalance: 'credit'
      };
      (MockedAccount2.findById as jest.Mock).mockResolvedValue(creditAccount);

      const result = await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString());

      expect(result.balance).toBe(-700); // 300 - 1000 (貸方科目)
    });

    it('應該支援截止日期篩選', async () => {
      const endDate = new Date('2024-01-01');
      await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString(), endDate);

      expect(MockedAccountingEntry.find).toHaveBeenCalledWith({
        accountId: mockAccount._id.toString(),
        createdAt: { $lte: endDate }
      });
    });

    it('應該支援機構ID篩選', async () => {
      const organizationId = 'org123';
      await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString(), undefined, organizationId);

      expect(MockedAccountingEntry.find).toHaveBeenCalledWith({
        accountId: mockAccount._id.toString(),
        organizationId
      });
    });

    it('應該只計算已確認的交易', async () => {
      const entriesWithPending = [
        ...mockEntries,
        {
          _id: new mongoose.Types.ObjectId(),
          accountId: mockAccount._id,
          debitAmount: 500,
          creditAmount: 0,
          createdAt: new Date('2024-01-03'),
          transactionGroupId: {
            status: 'pending',
            transactionDate: new Date('2024-01-03')
          }
        }
      ];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(entriesWithPending)
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);

      const result = await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString());

      expect(result.totalDebit).toBe(1000); // 不包含pending的500
      expect(result.entryCount).toBe(2);
    });

    it('應該拋出錯誤當會計科目不存在時', async () => {
      (MockedAccount2.findById as jest.Mock).mockResolvedValue(null);

      await expect(AccountBalanceService.calculateAccountBalance('nonexistent'))
        .rejects.toThrow('會計科目不存在');
    });

    it('應該處理沒有交易記錄的科目', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);

      const result = await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString());

      expect(result.balance).toBe(0);
      expect(result.entryCount).toBe(0);
      expect(result.lastTransactionDate).toBeNull();
    });
  });

  describe('calculateMultipleAccountBalances', () => {
    it('應該批量計算多個科目餘額', async () => {
      const accountIds = ['acc1', 'acc2'];
      const mockBalance = {
        accountId: 'acc1',
        balance: 1000,
        totalDebit: 1000,
        totalCredit: 0
      };

      // Mock calculateAccountBalance
      jest.spyOn(AccountBalanceService, 'calculateAccountBalance')
        .mockResolvedValue(mockBalance as any);

      const result = await AccountBalanceService.calculateMultipleAccountBalances(accountIds);

      expect(result).toHaveLength(2);
      expect(AccountBalanceService.calculateAccountBalance).toHaveBeenCalledTimes(2);
    });

    it('應該處理批量計算錯誤', async () => {
      jest.spyOn(AccountBalanceService, 'calculateAccountBalance')
        .mockRejectedValue(new Error('計算錯誤'));

      await expect(AccountBalanceService.calculateMultipleAccountBalances(['acc1']))
        .rejects.toThrow('計算錯誤');
    });
  });

  describe('calculateBalanceByAccountType', () => {
    const mockAccounts = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: '現金',
        code: '1101',
        accountType: 'asset'
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: '銀行存款',
        code: '1102',
        accountType: 'asset'
      }
    ];

    beforeEach(() => {
      (MockedAccount2.find as jest.Mock).mockResolvedValue(mockAccounts);
      
      // Mock calculateAccountBalance
      jest.spyOn(AccountBalanceService, 'calculateAccountBalance')
        .mockResolvedValue({
          accountId: mockAccounts[0]._id,
          balance: 1000
        } as any);
    });

    it('應該按科目類型計算餘額匯總', async () => {
      const result = await AccountBalanceService.calculateBalanceByAccountType('asset');

      expect(MockedAccount2.find).toHaveBeenCalledWith({
        accountType: 'asset',
        isActive: true
      });

      expect(result).toEqual({
        accountType: 'asset',
        totalBalance: 2000, // 1000 * 2
        accountCount: 2,
        accounts: expect.any(Array)
      });
    });

    it('應該支援機構ID篩選', async () => {
      const organizationId = 'org123';
      await AccountBalanceService.calculateBalanceByAccountType('asset', undefined, organizationId);

      expect(MockedAccount2.find).toHaveBeenCalledWith({
        accountType: 'asset',
        isActive: true,
        organizationId
      });
    });

    it('應該處理沒有科目的情況', async () => {
      (MockedAccount2.find as jest.Mock).mockResolvedValue([]);

      const result = await AccountBalanceService.calculateBalanceByAccountType('asset');

      expect(result).toEqual({
        accountType: 'asset',
        totalBalance: 0,
        accountCount: 0,
        accounts: []
      });
    });
  });

  describe('generateTrialBalance', () => {
    beforeEach(() => {
      // Mock calculateBalanceByAccountType
      jest.spyOn(AccountBalanceService, 'calculateBalanceByAccountType')
        .mockImplementation(async (accountType) => ({
          accountType,
          totalBalance: 1000,
          accountCount: 1,
          accounts: [{
            accountId: 'acc1',
            balance: 1000,
            totalDebit: 1000,
            totalCredit: 0
          }]
        } as any));
    });

    it('應該生成試算表', async () => {
      const result = await AccountBalanceService.generateTrialBalance();

      expect(result).toHaveProperty('trialBalanceData');
      expect(result).toHaveProperty('summary');
      expect(result.trialBalanceData).toHaveLength(5); // 5種科目類型
      expect(result.summary).toMatchObject({
        totalDebit: expect.any(Number),
        totalCredit: expect.any(Number),
        difference: expect.any(Number),
        isBalanced: expect.any(Boolean),
        generatedAt: expect.any(Date),
        endDate: expect.any(Date)
      });
    });

    it('應該支援截止日期', async () => {
      const endDate = new Date('2024-01-31');
      const result = await AccountBalanceService.generateTrialBalance(endDate);

      expect(result.summary.endDate).toEqual(endDate);
    });

    it('應該正確計算借貸平衡', async () => {
      // Mock 平衡的情況 - 確保借方和貸方總額相等
      jest.spyOn(AccountBalanceService, 'calculateBalanceByAccountType')
        .mockImplementation(async (accountType) => {
          if (accountType === 'asset') {
            return {
              accountType,
              totalBalance: 1000,
              accountCount: 1,
              accounts: [{
                accountId: 'acc1',
                balance: 1000, // 正數表示借方餘額
                totalDebit: 1000,
                totalCredit: 0
              }]
            } as any;
          } else if (accountType === 'liability') {
            return {
              accountType,
              totalBalance: -1000,
              accountCount: 1,
              accounts: [{
                accountId: 'acc2',
                balance: -1000, // 負數表示貸方餘額
                totalDebit: 0,
                totalCredit: 1000
              }]
            } as any;
          } else {
            return {
              accountType,
              totalBalance: 0,
              accountCount: 0,
              accounts: []
            } as any;
          }
        });

      const result = await AccountBalanceService.generateTrialBalance();

      expect(result.summary.isBalanced).toBe(true);
      expect(result.summary.difference).toBeLessThan(0.01);
    });
  });

  describe('getAccountTransactionHistory', () => {
    const mockAccount = {
      _id: new mongoose.Types.ObjectId(),
      name: '現金',
      normalBalance: 'debit'
    };

    const mockEntries = [
      {
        _id: new mongoose.Types.ObjectId(),
        accountId: mockAccount,
        description: '交易1',
        debitAmount: 1000,
        creditAmount: 0,
        createdAt: new Date('2024-01-01'),
        sequence: 1,
        transactionGroupId: {
          groupNumber: 'TXN001',
          description: '交易群組1'
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        accountId: mockAccount,
        description: '交易2',
        debitAmount: 0,
        creditAmount: 300,
        createdAt: new Date('2024-01-02'),
        sequence: 2,
        transactionGroupId: {
          groupNumber: 'TXN002',
          description: '交易群組2'
        }
      }
    ];

    beforeEach(() => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEntries)
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);
    });

    it('應該返回會計科目交易歷史', async () => {
      const result = await AccountBalanceService.getAccountTransactionHistory('acc1');

      expect(result).toEqual({
        accountId: 'acc1',
        transactionHistory: expect.any(Array),
        totalTransactions: 2,
        currentBalance: 700 // 1000 - 300 for debit account
      });

      expect(result.transactionHistory).toHaveLength(2);
      expect(result.transactionHistory[0]).toMatchObject({
        entryId: expect.any(mongoose.Types.ObjectId),
        description: '交易1',
        debitAmount: 1000,
        creditAmount: 0,
        balanceChange: 1000,
        runningBalance: 700
      });
    });

    it('應該支援日期範圍篩選', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await AccountBalanceService.getAccountTransactionHistory('acc1', startDate, endDate);

      expect(MockedAccountingEntry.find).toHaveBeenCalledWith({
        accountId: 'acc1',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
    });

    it('應該支援限制筆數', async () => {
      const limit = 10;
      await AccountBalanceService.getAccountTransactionHistory('acc1', undefined, undefined, limit);

      const mockFind = (MockedAccountingEntry.find as jest.Mock)();
      expect(mockFind.limit).toHaveBeenCalledWith(limit);
    });

    it('應該正確計算貸方科目的餘額變化', async () => {
      const creditAccount = {
        ...mockAccount,
        normalBalance: 'credit'
      };

      const entriesWithCreditAccount = mockEntries.map(entry => ({
        ...entry,
        accountId: creditAccount
      }));

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(entriesWithCreditAccount)
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);

      const result = await AccountBalanceService.getAccountTransactionHistory('acc1');

      expect(result.currentBalance).toBe(-700); // 300 - 1000 for credit account
    });
  });

  describe('錯誤處理', () => {
    it('應該處理資料庫連接錯誤', async () => {
      (MockedAccount2.findById as jest.Mock).mockRejectedValue(new Error('資料庫連接失敗'));

      await expect(AccountBalanceService.calculateAccountBalance('acc1'))
        .rejects.toThrow('資料庫連接失敗');
    });

    it('應該處理聚合查詢錯誤', async () => {
      (MockedAccount2.find as jest.Mock).mockRejectedValue(new Error('查詢失敗'));

      await expect(AccountBalanceService.calculateBalanceByAccountType('asset'))
        .rejects.toThrow('查詢失敗');
    });

    it('應該處理試算表生成錯誤', async () => {
      jest.spyOn(AccountBalanceService, 'calculateBalanceByAccountType')
        .mockRejectedValue(new Error('計算錯誤'));

      await expect(AccountBalanceService.generateTrialBalance())
        .rejects.toThrow('計算錯誤');
    });

    it('應該處理交易歷史查詢錯誤', async () => {
      (MockedAccountingEntry.find as jest.Mock).mockImplementation(() => {
        throw new Error('查詢失敗');
      });

      await expect(AccountBalanceService.getAccountTransactionHistory('acc1'))
        .rejects.toThrow('查詢失敗');
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理空的交易記錄', async () => {
      const mockAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '現金',
        normalBalance: 'debit'
      };

      (MockedAccount2.findById as jest.Mock).mockResolvedValue(mockAccount);
      
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);

      const result = await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString());

      expect(result.balance).toBe(0);
      expect(result.entryCount).toBe(0);
    });

    it('應該處理無效的科目類型', async () => {
      (MockedAccount2.find as jest.Mock).mockResolvedValue([]);

      const result = await AccountBalanceService.calculateBalanceByAccountType('invalid' as any);

      expect(result.totalBalance).toBe(0);
      expect(result.accountCount).toBe(0);
    });

    it('應該處理極大的金額', async () => {
      const mockAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '現金',
        normalBalance: 'debit'
      };

      const largeAmountEntry = {
        _id: new mongoose.Types.ObjectId(),
        accountId: mockAccount._id,
        debitAmount: Number.MAX_SAFE_INTEGER,
        creditAmount: 0,
        createdAt: new Date(),
        transactionGroupId: {
          status: 'confirmed'
        }
      };

      (MockedAccount2.findById as jest.Mock).mockResolvedValue(mockAccount);
      
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([largeAmountEntry])
      };
      (MockedAccountingEntry.find as jest.Mock).mockReturnValue(mockFind);

      const result = await AccountBalanceService.calculateAccountBalance(mockAccount._id.toString());

      expect(result.balance).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});