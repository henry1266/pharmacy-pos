import { AccountingIntegrationService } from '../AccountingIntegrationService';
import Account2 from '../../models/Account2';
import AutoAccountingEntryService from '../AutoAccountingEntryService';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../models/Account2');
jest.mock('../AutoAccountingEntryService');

const MockedAccount2 = Account2 as any;
const MockedAutoAccountingEntryService = AutoAccountingEntryService as jest.Mocked<typeof AutoAccountingEntryService>;

describe('AccountingIntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Reset all mocks to default implementations
    MockedAccount2.findOne = jest.fn();
    MockedAutoAccountingEntryService.handlePurchaseOrderCompletion = jest.fn();
    MockedAutoAccountingEntryService.deletePurchaseOrderEntries = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handlePurchaseOrderCompletion', () => {
    const mockPurchaseOrder = {
      _id: new mongoose.Types.ObjectId(),
      poid: 'PO001',
      posupplier: '測試供應商',
      organizationId: new mongoose.Types.ObjectId(),
      transactionType: '進貨',
      selectedAccountIds: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ]
    };

    it('應該優先處理自動會計分錄', async () => {
      const mockTransactionGroupId = new mongoose.Types.ObjectId();
      MockedAutoAccountingEntryService.handlePurchaseOrderCompletion
        .mockResolvedValue(mockTransactionGroupId);

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        mockPurchaseOrder as any,
        'user123'
      );

      expect(MockedAutoAccountingEntryService.handlePurchaseOrderCompletion)
        .toHaveBeenCalledWith(mockPurchaseOrder, 'user123');
      expect(result).toBe(mockTransactionGroupId);
    });

    it('應該在沒有足夠會計科目時跳過自動分錄', async () => {
      const purchaseOrderWithoutAccounts = {
        ...mockPurchaseOrder,
        selectedAccountIds: [new mongoose.Types.ObjectId()] // 只有一個科目
      };

      const mockAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '進貨',
        code: '5101'
      };
      MockedAccount2.findOne.mockResolvedValue(mockAccount as any);
      // Mock Account2 constructor to return mock account with save method
      (MockedAccount2 as any).mockImplementation(() => ({
        ...mockAccount,
        save: jest.fn().mockResolvedValue(mockAccount)
      }));

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrderWithoutAccounts as any
      );

      expect(MockedAutoAccountingEntryService.handlePurchaseOrderCompletion)
        .not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('應該處理進貨交易類型', async () => {
      const purchaseOrderWithoutAutoAccounting = {
        ...mockPurchaseOrder,
        selectedAccountIds: [] // 沒有選擇會計科目
      };

      const mockParentAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '進貨',
        code: '5101',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockChildAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '進貨-測試供應商',
        code: '51010100',
        save: jest.fn().mockResolvedValue(true)
      };

      MockedAccount2.findOne
        .mockResolvedValueOnce(null) // 第一次查找父科目不存在
        .mockResolvedValueOnce(null); // 第二次查找子科目不存在

      // Mock Account2 constructor for different account levels
      (MockedAccount2 as any).mockImplementation((data: any) => {
        if (data.level === 1) {
          return { ...mockParentAccount, ...data, save: jest.fn().mockResolvedValue(mockParentAccount) };
        } else {
          return { ...mockChildAccount, ...data, save: jest.fn().mockResolvedValue(mockChildAccount) };
        }
      });

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrderWithoutAutoAccounting as any
      );

      expect(MockedAccount2.findOne).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    });

    it('應該處理支出交易類型', async () => {
      const expensePurchaseOrder = {
        ...mockPurchaseOrder,
        transactionType: '支出',
        selectedAccountIds: []
      };

      const mockParentAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '支出',
        code: '6101',
        save: jest.fn().mockResolvedValue(true)
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for expense accounts
      (MockedAccount2 as any).mockImplementation(() => ({
        ...mockParentAccount,
        save: jest.fn().mockResolvedValue(mockParentAccount)
      }));

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        expensePurchaseOrder as any
      );

      expect(result).toBeNull();
    });

    it('應該處理未知交易類型', async () => {
      const unknownTypePurchaseOrder = {
        ...mockPurchaseOrder,
        transactionType: '未知類型',
        selectedAccountIds: []
      };

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        unknownTypePurchaseOrder as any
      );

      expect(result).toBeNull();
    });

    it('應該在缺少必要資訊時跳過處理', async () => {
      const incompletePurchaseOrder = {
        ...mockPurchaseOrder,
        transactionType: undefined,
        organizationId: undefined,
        selectedAccountIds: []
      };

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        incompletePurchaseOrder as any
      );

      expect(result).toBeNull();
    });

    it('應該處理自動分錄失敗的情況', async () => {
      MockedAutoAccountingEntryService.handlePurchaseOrderCompletion
        .mockResolvedValue(null);

      const mockAccount = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };
      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor
      (MockedAccount2 as any).mockImplementation(() => ({
        ...mockAccount,
        save: jest.fn().mockResolvedValue(mockAccount)
      }));

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(
        mockPurchaseOrder as any
      );

      expect(MockedAutoAccountingEntryService.handlePurchaseOrderCompletion)
        .toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('應該處理錯誤情況', async () => {
      MockedAutoAccountingEntryService.handlePurchaseOrderCompletion
        .mockRejectedValue(new Error('自動分錄失敗'));

      await expect(AccountingIntegrationService.handlePurchaseOrderCompletion(
        mockPurchaseOrder as any
      )).rejects.toThrow('自動分錄失敗');
    });
  });

  describe('handlePurchaseOrderUnlock', () => {
    const mockPurchaseOrder = {
      _id: new mongoose.Types.ObjectId(),
      poid: 'PO001',
      relatedTransactionGroupId: new mongoose.Types.ObjectId()
    };

    it('應該刪除關聯的會計分錄', async () => {
      MockedAutoAccountingEntryService.deletePurchaseOrderEntries
        .mockResolvedValue(undefined);

      await AccountingIntegrationService.handlePurchaseOrderUnlock(
        mockPurchaseOrder as any
      );

      expect(MockedAutoAccountingEntryService.deletePurchaseOrderEntries)
        .toHaveBeenCalledWith(mockPurchaseOrder.relatedTransactionGroupId);
    });

    it('應該處理沒有關聯交易群組的情況', async () => {
      const purchaseOrderWithoutTransaction = {
        ...mockPurchaseOrder,
        relatedTransactionGroupId: undefined
      };

      await AccountingIntegrationService.handlePurchaseOrderUnlock(
        purchaseOrderWithoutTransaction as any
      );

      expect(MockedAutoAccountingEntryService.deletePurchaseOrderEntries)
        .not.toHaveBeenCalled();
    });

    it('應該處理刪除分錄時的錯誤', async () => {
      MockedAutoAccountingEntryService.deletePurchaseOrderEntries
        .mockRejectedValue(new Error('刪除失敗'));

      await expect(AccountingIntegrationService.handlePurchaseOrderUnlock(
        mockPurchaseOrder as any
      )).rejects.toThrow('刪除失敗');
    });
  });

  describe('findOrCreateAccount (private method testing through public methods)', () => {
    it('應該找到現有會計科目', async () => {
      const existingAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '現金',
        code: '1101'
      };

      MockedAccount2.findOne.mockResolvedValue(existingAccount as any);

      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: '測試供應商',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      );

      expect(MockedAccount2.findOne).toHaveBeenCalled();
    });

    it('應該創建新的會計科目', async () => {
      MockedAccount2.findOne.mockResolvedValue(null);

      const newAccount = {
        _id: new mongoose.Types.ObjectId(),
        name: '進貨',
        code: '5101',
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock Account2 constructor for new accounts
      (MockedAccount2 as any).mockImplementation(() => ({
        ...newAccount,
        save: jest.fn().mockResolvedValue(newAccount)
      }));

      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: '測試供應商',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      );

      expect(MockedAccount2).toHaveBeenCalled();
    });
  });

  describe('供應商代碼生成', () => {
    it('應該為不同供應商生成不同代碼', async () => {
      const purchaseOrder1 = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: '供應商A',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      const purchaseOrder2 = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO002',
        posupplier: '供應商B',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for supplier tests
      (MockedAccount2 as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
      }));

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder1 as any
      );

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder2 as any
      );

      // 驗證為不同供應商創建了不同的科目
      expect(MockedAccount2).toHaveBeenCalledTimes(4); // 每個供應商2個科目（父+子）
    });

    it('應該處理沒有供應商名稱的情況', async () => {
      const purchaseOrderWithoutSupplier = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: undefined,
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for supplier without name
      (MockedAccount2 as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
      }));

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrderWithoutSupplier as any
      );

      expect(MockedAccount2).toHaveBeenCalled();
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理極長的供應商名稱', async () => {
      const longSupplierName = 'A'.repeat(1000);
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: longSupplierName,
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for long supplier name
      (MockedAccount2 as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
      }));

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      );

      expect(MockedAccount2).toHaveBeenCalled();
    });

    it('應該處理特殊字符的供應商名稱', async () => {
      const specialSupplierName = '測試@#$%^&*()供應商';
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: specialSupplierName,
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for special characters
      (MockedAccount2 as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
      }));

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      );

      expect(MockedAccount2).toHaveBeenCalled();
    });

    it('應該處理空字符串供應商名稱', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: '',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for empty supplier name
      (MockedAccount2 as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
      }));

      await AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      );

      expect(MockedAccount2).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    it('應該處理資料庫查詢錯誤', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: '測試供應商',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockRejectedValue(new Error('資料庫錯誤'));

      await expect(AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      )).rejects.toThrow('資料庫錯誤');
    });

    it('應該處理科目保存錯誤', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO001',
        posupplier: '測試供應商',
        organizationId: new mongoose.Types.ObjectId(),
        transactionType: '進貨',
        selectedAccountIds: []
      };

      MockedAccount2.findOne.mockResolvedValue(null);
      // Mock Account2 constructor for save error
      (MockedAccount2 as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('保存失敗'))
      }));

      await expect(AccountingIntegrationService.handlePurchaseOrderCompletion(
        purchaseOrder as any
      )).rejects.toThrow('保存失敗');
    });
  });
});