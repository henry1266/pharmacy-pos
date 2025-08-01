import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AccountingIntegrationService } from '../AccountingIntegrationService';
import AutoAccountingEntryService from '../AutoAccountingEntryService';

// Mock AutoAccountingEntryService
jest.mock('../AutoAccountingEntryService', () => ({
  __esModule: true,
  default: {
    handlePurchaseOrderCompletion: jest.fn(),
    deletePurchaseOrderEntries: jest.fn()
  }
}));

// Mock Account2 模型
jest.mock('../../models/Account2', () => {
  const mockFindOne = jest.fn();
  const mockSave = jest.fn().mockResolvedValue(true);
  
  const MockAccount2 = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: new mongoose.Types.ObjectId(),
    save: mockSave
  }));
  
  Object.assign(MockAccount2, {
    findOne: mockFindOne
  });
  
  return MockAccount2;
});

// 取得 mock 實例
const Account2 = require('../../models/Account2');
const mockAccount2 = { findOne: Account2.findOne };

describe('AccountingIntegrationService', () => {
  let mongoServer: MongoMemoryServer;
  const mockAutoAccountingEntryService = AutoAccountingEntryService as jest.Mocked<typeof AutoAccountingEntryService>;

  beforeAll(async () => {
    // 斷開現有連接（如果有的話）
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePurchaseOrderCompletion', () => {
    const mockPurchaseOrder = {
      _id: new mongoose.Types.ObjectId(),
      poid: 'PO-2024-001',
      organizationId: new mongoose.Types.ObjectId(),
      posupplier: '測試供應商',
      transactionType: '進貨',
      selectedAccountIds: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ]
    } as any;

    it('應該優先處理自動會計分錄', async () => {
      const mockTransactionGroupId = new mongoose.Types.ObjectId();
      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(mockTransactionGroupId);

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPurchaseOrder, 'test-user');

      expect(mockAutoAccountingEntryService.handlePurchaseOrderCompletion).toHaveBeenCalledWith(mockPurchaseOrder, 'test-user');
      expect(result).toBe(mockTransactionGroupId);
    });

    it('應該在自動分錄失敗時執行傳統會計科目創建', async () => {
      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);
      mockAccount2.findOne.mockResolvedValue(null);

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPurchaseOrder);

      expect(mockAccount2.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('應該處理進貨交易類型', async () => {
      const purchaseOrder = {
        ...mockPurchaseOrder,
        selectedAccountIds: [], // 不滿足自動分錄條件
        transactionType: '進貨'
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);
      
      // Mock 父科目查詢
      const mockParentAccount = {
        _id: new mongoose.Types.ObjectId(),
        code: '5101',
        name: '進貨'
      };

      // Mock 子科目查詢
      const mockChildAccount = {
        _id: new mongoose.Types.ObjectId(),
        code: '51010101',
        name: '進貨-測試供應商'
      };

      mockAccount2.findOne
        .mockResolvedValueOnce(mockParentAccount) // 父科目存在
        .mockResolvedValueOnce(mockChildAccount); // 子科目存在

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(mockAccount2.findOne).toHaveBeenCalledTimes(2);
      expect(mockAccount2.findOne).toHaveBeenCalledWith({
        organizationId: purchaseOrder.organizationId,
        code: '5101'
      });
    });

    it('應該處理支出交易類型', async () => {
      const purchaseOrder = {
        ...mockPurchaseOrder,
        selectedAccountIds: [], // 不滿足自動分錄條件
        transactionType: '支出'
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);
      
      const mockParentAccount = {
        _id: new mongoose.Types.ObjectId(),
        code: '6101',
        name: '支出'
      };

      mockAccount2.findOne.mockResolvedValue(mockParentAccount);

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(mockAccount2.findOne).toHaveBeenCalledWith({
        organizationId: purchaseOrder.organizationId,
        code: '6101'
      });
    });

    it('應該處理未知交易類型', async () => {
      const purchaseOrder = {
        ...mockPurchaseOrder,
        selectedAccountIds: [],
        transactionType: '未知類型'
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('未知的交易類型'));
      consoleSpy.mockRestore();
    });

    it('應該處理缺少必要資訊的進貨單', async () => {
      const purchaseOrder = {
        ...mockPurchaseOrder,
        selectedAccountIds: [],
        transactionType: undefined,
        organizationId: undefined
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('缺少交易類型或機構資訊'));
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('應該處理錯誤情況', async () => {
      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockRejectedValue(new Error('Test error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        AccountingIntegrationService.handlePurchaseOrderCompletion(mockPurchaseOrder)
      ).rejects.toThrow('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('處理進貨單會計整合時發生錯誤'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handlePurchaseOrderUnlock', () => {
    it('應該刪除關聯的會計分錄', async () => {
      const mockTransactionGroupId = new mongoose.Types.ObjectId();
      const purchaseOrder = {
        poid: 'PO-2024-001',
        relatedTransactionGroupId: mockTransactionGroupId
      } as any;

      mockAutoAccountingEntryService.deletePurchaseOrderEntries.mockResolvedValue();

      await AccountingIntegrationService.handlePurchaseOrderUnlock(purchaseOrder);

      expect(mockAutoAccountingEntryService.deletePurchaseOrderEntries).toHaveBeenCalledWith(mockTransactionGroupId);
    });

    it('應該處理沒有關聯會計分錄的情況', async () => {
      const purchaseOrder = {
        poid: 'PO-2024-001',
        relatedTransactionGroupId: undefined
      } as any;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AccountingIntegrationService.handlePurchaseOrderUnlock(purchaseOrder);

      expect(mockAutoAccountingEntryService.deletePurchaseOrderEntries).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('沒有關聯的會計分錄'));
      consoleSpy.mockRestore();
    });

    it('應該處理錯誤情況', async () => {
      const mockTransactionGroupId = new mongoose.Types.ObjectId();
      const purchaseOrder = {
        poid: 'PO-2024-001',
        relatedTransactionGroupId: mockTransactionGroupId
      } as any;

      mockAutoAccountingEntryService.deletePurchaseOrderEntries.mockRejectedValue(new Error('Delete error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        AccountingIntegrationService.handlePurchaseOrderUnlock(purchaseOrder)
      ).rejects.toThrow('Delete error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('處理進貨單狀態解鎖時發生錯誤'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('私有方法測試 (通過公開方法間接測試)', () => {
    it('應該創建新的會計科目', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO-2024-001',
        organizationId: new mongoose.Types.ObjectId(),
        posupplier: '測試供應商',
        selectedAccountIds: [],
        transactionType: '進貨'
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);
      mockAccount2.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(mockAccount2.findOne).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('創建新會計科目'));
      consoleSpy.mockRestore();
    });

    it('應該返回現有的會計科目', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO-2024-001',
        organizationId: new mongoose.Types.ObjectId(),
        posupplier: '測試供應商',
        selectedAccountIds: [],
        transactionType: '進貨'
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);

      const mockExistingAccount = {
        _id: new mongoose.Types.ObjectId(),
        code: '5101',
        name: '進貨'
      };

      mockAccount2.findOne.mockResolvedValue(mockExistingAccount);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('找到現有會計科目'));
      consoleSpy.mockRestore();
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理空的供應商名稱', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO-2024-001',
        organizationId: new mongoose.Types.ObjectId(),
        selectedAccountIds: [],
        transactionType: '進貨',
        posupplier: ''
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);
      mockAccount2.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('創建新會計科目'));
      consoleSpy.mockRestore();
    });

    it('應該處理 null 供應商名稱', async () => {
      const purchaseOrder = {
        _id: new mongoose.Types.ObjectId(),
        poid: 'PO-2024-001',
        organizationId: new mongoose.Types.ObjectId(),
        selectedAccountIds: [],
        transactionType: '支出',
        posupplier: null
      } as any;

      mockAutoAccountingEntryService.handlePurchaseOrderCompletion.mockResolvedValue(null);
      mockAccount2.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('創建新會計科目'));
      consoleSpy.mockRestore();
    });
  });
});