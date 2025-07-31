import mongoose from 'mongoose';
import { AccountingIntegrationService } from '../AccountingIntegrationService';
import Account2, { IAccount2 } from '../../models/Account2';
import AutoAccountingEntryService from '../AutoAccountingEntryService';
import { IPurchaseOrderDocument } from '../../models/PurchaseOrder';

// Mock dependencies
jest.mock('../../models/Account2');
jest.mock('../AutoAccountingEntryService');

describe('AccountingIntegrationService', () => {
  const mockObjectId = new mongoose.Types.ObjectId();
  const mockOrganizationId = new mongoose.Types.ObjectId();
  const mockTransactionGroupId = new mongoose.Types.ObjectId();
  const mockAccountId1 = new mongoose.Types.ObjectId();
  const mockAccountId2 = new mongoose.Types.ObjectId();

  const mockPurchaseOrder: Partial<IPurchaseOrderDocument> = {
    _id: mockObjectId,
    poid: '20240101001',
    posupplier: '測試供應商',
    totalAmount: 1000,
    organizationId: mockOrganizationId,
    transactionType: '進貨',
    selectedAccountIds: [mockAccountId1, mockAccountId2],
    relatedTransactionGroupId: mockTransactionGroupId
  };

  const mockAccount: Partial<IAccount2> = {
    _id: mockObjectId,
    organizationId: mockOrganizationId,
    code: '5101',
    name: '進貨',
    accountType: 'expense',
    type: 'other',
    level: 1,
    balance: 0,
    initialBalance: 0,
    currency: 'TWD',
    isActive: true,
    createdBy: 'system'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handlePurchaseOrderCompletion', () => {
    it('應該成功處理有自動會計分錄的進貨單', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1, mockAccountId2]
      } as IPurchaseOrderDocument;

      (AutoAccountingEntryService.handlePurchaseOrderCompletion as jest.Mock)
        .mockResolvedValue(mockTransactionGroupId);

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO, 'user123');

      // Assert
      expect(result).toBe(mockTransactionGroupId);
      expect(AutoAccountingEntryService.handlePurchaseOrderCompletion)
        .toHaveBeenCalledWith(mockPO, 'user123');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('處理進貨單 20240101001 的會計整合')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('嘗試創建自動會計分錄')
      );
    });

    it('應該在沒有足夠會計科目時跳過自動分錄並執行傳統邏輯', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1], // 只有一個科目
        transactionType: '進貨'
      } as IPurchaseOrderDocument;

      jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValue(mockAccount);
      const handlePurchaseTransactionSpy = jest.spyOn(AccountingIntegrationService as any, 'handlePurchaseTransaction')
        .mockResolvedValue(undefined);

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(handlePurchaseTransactionSpy).toHaveBeenCalledWith(mockPO);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('執行傳統會計科目創建，交易類型: 進貨')
      );
    });

    it('應該處理支出交易類型', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1], // 只有一個科目，跳過自動分錄
        transactionType: '支出'
      } as IPurchaseOrderDocument;

      const handleExpenseTransactionSpy = jest.spyOn(AccountingIntegrationService as any, 'handleExpenseTransaction')
        .mockResolvedValue(undefined);

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(handleExpenseTransactionSpy).toHaveBeenCalledWith(mockPO);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('執行傳統會計科目創建，交易類型: 支出')
      );
    });

    it('應該在缺少交易類型時跳過傳統會計科目創建', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1], // 只有一個科目，跳過自動分錄
        organizationId: mockOrganizationId
      } as any;
      delete mockPO.transactionType;

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('進貨單缺少交易類型或機構資訊，跳過傳統會計科目創建')
      );
    });

    it('應該在缺少機構ID時跳過傳統會計科目創建', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1], // 只有一個科目，跳過自動分錄
        transactionType: '進貨'
      } as any;
      delete mockPO.organizationId;

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('進貨單缺少交易類型或機構資訊，跳過傳統會計科目創建')
      );
    });

    it('應該處理未知的交易類型', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1], // 只有一個科目，跳過自動分錄
        transactionType: '未知類型'
      } as IPurchaseOrderDocument;

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('未知的交易類型: 未知類型')
      );
    });

    it('應該在自動分錄失敗時執行傳統邏輯', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1, mockAccountId2],
        transactionType: '進貨'
      } as IPurchaseOrderDocument;

      (AutoAccountingEntryService.handlePurchaseOrderCompletion as jest.Mock)
        .mockResolvedValue(null); // 自動分錄失敗

      const handlePurchaseTransactionSpy = jest.spyOn(AccountingIntegrationService as any, 'handlePurchaseTransaction')
        .mockResolvedValue(undefined);

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(AutoAccountingEntryService.handlePurchaseOrderCompletion)
        .toHaveBeenCalledWith(mockPO, undefined);
      expect(handlePurchaseTransactionSpy).toHaveBeenCalledWith(mockPO);
    });

    it('應該處理錯誤情況', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1, mockAccountId2]
      } as IPurchaseOrderDocument;

      const error = new Error('測試錯誤');
      (AutoAccountingEntryService.handlePurchaseOrderCompletion as jest.Mock)
        .mockRejectedValue(error);

      // Act & Assert
      await expect(
        AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO)
      ).rejects.toThrow('測試錯誤');

      expect(console.error).toHaveBeenCalledWith(
        '❌ 處理進貨單會計整合時發生錯誤:',
        error
      );
    });
  });

  describe('handlePurchaseOrderUnlock', () => {
    it('應該成功刪除關聯的會計分錄', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        relatedTransactionGroupId: mockTransactionGroupId
      } as IPurchaseOrderDocument;

      (AutoAccountingEntryService.deletePurchaseOrderEntries as jest.Mock)
        .mockResolvedValue(undefined);

      // Act
      await AccountingIntegrationService.handlePurchaseOrderUnlock(mockPO);

      // Assert
      expect(AutoAccountingEntryService.deletePurchaseOrderEntries)
        .toHaveBeenCalledWith(mockTransactionGroupId);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('處理進貨單 20240101001 的狀態解鎖')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(`刪除關聯的會計分錄，交易群組ID: ${mockTransactionGroupId}`)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('成功刪除進貨單 20240101001 的會計分錄')
      );
    });

    it('應該處理沒有關聯會計分錄的情況', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder
      } as any;
      delete mockPO.relatedTransactionGroupId;

      // Act
      await AccountingIntegrationService.handlePurchaseOrderUnlock(mockPO);

      // Assert
      expect(AutoAccountingEntryService.deletePurchaseOrderEntries)
        .not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('進貨單 20240101001 沒有關聯的會計分錄')
      );
    });

    it('應該處理刪除會計分錄時的錯誤', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        relatedTransactionGroupId: mockTransactionGroupId
      } as IPurchaseOrderDocument;

      const error = new Error('刪除失敗');
      (AutoAccountingEntryService.deletePurchaseOrderEntries as jest.Mock)
        .mockRejectedValue(error);

      // Act & Assert
      await expect(
        AccountingIntegrationService.handlePurchaseOrderUnlock(mockPO)
      ).rejects.toThrow('刪除失敗');

      expect(console.error).toHaveBeenCalledWith(
        '❌ 處理進貨單狀態解鎖時發生錯誤:',
        error
      );
    });
  });

  describe('handlePurchaseTransaction (private method)', () => {
    it('應該創建進貨相關的會計科目', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        organizationId: mockOrganizationId,
        posupplier: '測試供應商'
      } as IPurchaseOrderDocument;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId };
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount) // 父科目
        .mockResolvedValueOnce(mockAccount); // 子科目

      // Act
      await (AccountingIntegrationService as any).handlePurchaseTransaction(mockPO);

      // Assert
      expect(findOrCreateAccountSpy).toHaveBeenCalledTimes(2);
      
      // 檢查父科目創建
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(1, {
        organizationId: mockOrganizationId,
        code: '5101',
        name: '進貨',
        accountType: 'expense',
        type: 'other',
        level: 1,
        createdBy: 'system'
      });

      // 檢查子科目創建
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          organizationId: mockOrganizationId,
          name: '進貨-測試供應商',
          accountType: 'expense',
          type: 'other',
          level: 2,
          parentId: mockObjectId,
          createdBy: 'system'
        })
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('已為進貨單 20240101001 創建或確認進貨科目')
      );
    });

    it('應該處理未知供應商的情況', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        organizationId: mockOrganizationId
      } as any;
      delete mockPO.posupplier;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId };
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount)
        .mockResolvedValueOnce(mockAccount);

      // Act
      await (AccountingIntegrationService as any).handlePurchaseTransaction(mockPO);

      // Assert
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          name: '進貨-未知供應商'
        })
      );
    });
  });

  describe('handleExpenseTransaction (private method)', () => {
    it('應該創建支出相關的會計科目', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        organizationId: mockOrganizationId,
        posupplier: '測試廠商'
      } as IPurchaseOrderDocument;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId, code: '6101', name: '支出' };
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount) // 父科目
        .mockResolvedValueOnce(mockAccount); // 子科目

      // Act
      await (AccountingIntegrationService as any).handleExpenseTransaction(mockPO);

      // Assert
      expect(findOrCreateAccountSpy).toHaveBeenCalledTimes(2);
      
      // 檢查父科目創建
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(1, {
        organizationId: mockOrganizationId,
        code: '6101',
        name: '支出',
        accountType: 'expense',
        type: 'other',
        level: 1,
        createdBy: 'system'
      });

      // 檢查子科目創建
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          organizationId: mockOrganizationId,
          name: '支出-測試廠商',
          accountType: 'expense',
          type: 'other',
          level: 2,
          parentId: mockObjectId,
          createdBy: 'system'
        })
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('已為進貨單 20240101001 創建或確認支出科目')
      );
    });

    it('應該處理未知廠商的情況', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        organizationId: mockOrganizationId
      } as any;
      delete mockPO.posupplier;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId };
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount)
        .mockResolvedValueOnce(mockAccount);

      // Act
      await (AccountingIntegrationService as any).handleExpenseTransaction(mockPO);

      // Assert
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          name: '支出-未知廠商'
        })
      );
    });
  });

  describe('findOrCreateAccount (private method)', () => {
    const mockAccountData = {
      organizationId: mockOrganizationId,
      code: '5101',
      name: '進貨',
      accountType: 'expense' as const,
      type: 'other' as const,
      level: 1,
      createdBy: 'system'
    };

    it('應該返回現有的會計科目', async () => {
      // Arrange
      const existingAccount = { ...mockAccount };
      (Account2.findOne as jest.Mock).mockResolvedValue(existingAccount);

      // Act
      const result = await (AccountingIntegrationService as any).findOrCreateAccount(mockAccountData);

      // Assert
      expect(result).toBe(existingAccount);
      expect(Account2.findOne).toHaveBeenCalledWith({
        organizationId: mockOrganizationId,
        code: '5101'
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('找到現有會計科目: 5101 - 進貨')
      );
    });

    it('應該創建新的會計科目', async () => {
      // Arrange
      (Account2.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockNewAccount = {
        ...mockAccountData,
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        isActive: true,
        description: '系統自動創建 - 來自進貨單整合',
        save: mockSave
      };
      
      (Account2 as any).mockImplementation(() => mockNewAccount);

      // Act
      const result = await (AccountingIntegrationService as any).findOrCreateAccount(mockAccountData);

      // Assert
      expect(result).toBe(mockNewAccount);
      expect(mockSave).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('創建新會計科目: 5101 - 進貨')
      );
    });

    it('應該為子科目設置正確的父科目ID', async () => {
      // Arrange
      const parentId = new mongoose.Types.ObjectId();
      const accountDataWithParent = {
        ...mockAccountData,
        parentId,
        level: 2
      };

      (Account2.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockNewAccount = {
        ...accountDataWithParent,
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        isActive: true,
        description: '系統自動創建 - 來自進貨單整合',
        save: mockSave
      };
      
      (Account2 as any).mockImplementation(() => mockNewAccount);

      // Act
      const result = await (AccountingIntegrationService as any).findOrCreateAccount(accountDataWithParent);

      // Assert
      expect(result.parentId).toBe(parentId);
      expect(result.level).toBe(2);
    });
  });

  describe('generateSupplierCode (private method)', () => {
    it('應該為供應商生成正確的代碼格式', () => {
      // Act
      const code1 = (AccountingIntegrationService as any).generateSupplierCode('測試供應商');
      const code2 = (AccountingIntegrationService as any).generateSupplierCode('ABC公司');

      // Assert
      expect(code1).toMatch(/^510101\d{2}$/);
      expect(code2).toMatch(/^510101\d{2}$/);
      expect(code1).not.toBe(code2); // 不同供應商應該有不同代碼
    });

    it('應該為相同供應商生成相同的代碼', () => {
      // Act
      const code1 = (AccountingIntegrationService as any).generateSupplierCode('測試供應商');
      const code2 = (AccountingIntegrationService as any).generateSupplierCode('測試供應商');

      // Assert
      expect(code1).toBe(code2);
    });
  });

  describe('generateExpenseSupplierCode (private method)', () => {
    it('應該為廠商生成正確的支出代碼格式', () => {
      // Act
      const code1 = (AccountingIntegrationService as any).generateExpenseSupplierCode('測試廠商');
      const code2 = (AccountingIntegrationService as any).generateExpenseSupplierCode('XYZ廠商');

      // Assert
      expect(code1).toMatch(/^610101\d{2}$/);
      expect(code2).toMatch(/^610101\d{2}$/);
      expect(code1).not.toBe(code2); // 不同廠商應該有不同代碼
    });

    it('應該為相同廠商生成相同的代碼', () => {
      // Act
      const code1 = (AccountingIntegrationService as any).generateExpenseSupplierCode('測試廠商');
      const code2 = (AccountingIntegrationService as any).generateExpenseSupplierCode('測試廠商');

      // Assert
      expect(code1).toBe(code2);
    });
  });

  describe('hashString (private method)', () => {
    it('應該為字符串生成0-99範圍內的哈希值', () => {
      // Act
      const hash1 = (AccountingIntegrationService as any).hashString('測試字符串');
      const hash2 = (AccountingIntegrationService as any).hashString('另一個字符串');
      const hash3 = (AccountingIntegrationService as any).hashString('');

      // Assert
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThan(100);
      expect(hash2).toBeGreaterThanOrEqual(0);
      expect(hash2).toBeLessThan(100);
      expect(hash3).toBeGreaterThanOrEqual(0);
      expect(hash3).toBeLessThan(100);
    });

    it('應該為相同字符串生成相同的哈希值', () => {
      // Act
      const hash1 = (AccountingIntegrationService as any).hashString('測試字符串');
      const hash2 = (AccountingIntegrationService as any).hashString('測試字符串');

      // Assert
      expect(hash1).toBe(hash2);
    });

    it('應該為不同字符串生成不同的哈希值（大多數情況下）', () => {
      // Act
      const hash1 = (AccountingIntegrationService as any).hashString('字符串A');
      const hash2 = (AccountingIntegrationService as any).hashString('字符串B');

      // Assert
      // 注意：由於哈希函數的性質，不同輸入可能產生相同輸出，但機率很低
      expect(hash1).not.toBe(hash2);
    });

    it('應該處理特殊字符', () => {
      // Act
      const hash1 = (AccountingIntegrationService as any).hashString('!@#$%^&*()');
      const hash2 = (AccountingIntegrationService as any).hashString('測試中文字符');
      const hash3 = (AccountingIntegrationService as any).hashString('123456789');

      // Assert
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThan(100);
      expect(hash2).toBeGreaterThanOrEqual(0);
      expect(hash2).toBeLessThan(100);
      expect(hash3).toBeGreaterThanOrEqual(0);
      expect(hash3).toBeLessThan(100);
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理空的進貨單號', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        poid: '',
        selectedAccountIds: [mockAccountId1, mockAccountId2]
      } as IPurchaseOrderDocument;

      (AutoAccountingEntryService.handlePurchaseOrderCompletion as jest.Mock)
        .mockResolvedValue(mockTransactionGroupId);

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBe(mockTransactionGroupId);
    });

    it('應該處理空的供應商名稱', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        posupplier: '',
        selectedAccountIds: [mockAccountId1], // 跳過自動分錄
        transactionType: '進貨'
      } as IPurchaseOrderDocument;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId };
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount)
        .mockResolvedValueOnce(mockAccount);

      // Act
      await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          name: '進貨-未知供應商'
        })
      );
    });

    it('應該處理極長的供應商名稱', async () => {
      // Arrange
      const longSupplierName = '這是一個非常非常非常長的供應商名稱'.repeat(10);
      const mockPO = {
        ...mockPurchaseOrder,
        posupplier: longSupplierName,
        selectedAccountIds: [mockAccountId1], // 跳過自動分錄
        transactionType: '進貨'
      } as IPurchaseOrderDocument;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId };
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount)
        .mockResolvedValueOnce(mockAccount);

      // Act
      await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          name: `進貨-${longSupplierName}`
        })
      );
    });

    it('應該處理零金額的進貨單', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        totalAmount: 0,
        selectedAccountIds: [mockAccountId1, mockAccountId2]
      } as IPurchaseOrderDocument;

      (AutoAccountingEntryService.handlePurchaseOrderCompletion as jest.Mock)
        .mockResolvedValue(null); // 自動分錄會因為金額為0而失敗

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('整合測試', () => {
    it('應該完整處理進貨單從創建到解鎖的流程', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1, mockAccountId2],
        relatedTransactionGroupId: mockTransactionGroupId
      } as IPurchaseOrderDocument;

      (AutoAccountingEntryService.handlePurchaseOrderCompletion as jest.Mock)
        .mockResolvedValue(mockTransactionGroupId);
      (AutoAccountingEntryService.deletePurchaseOrderEntries as jest.Mock)
        .mockResolvedValue(undefined);

      // Act - 處理完成
      const completionResult = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Act - 處理解鎖
      await AccountingIntegrationService.handlePurchaseOrderUnlock(mockPO);

      // Assert
      expect(completionResult).toBe(mockTransactionGroupId);
      expect(AutoAccountingEntryService.handlePurchaseOrderCompletion)
        .toHaveBeenCalledWith(mockPO, undefined);
      expect(AutoAccountingEntryService.deletePurchaseOrderEntries)
        .toHaveBeenCalledWith(mockTransactionGroupId);
    });

    it('應該處理複雜的會計科目創建流程', async () => {
      // Arrange
      const mockPO = {
        ...mockPurchaseOrder,
        selectedAccountIds: [mockAccountId1], // 跳過自動分錄
        transactionType: '進貨',
        posupplier: '複雜供應商名稱'
      } as IPurchaseOrderDocument;

      const mockParentAccount = { ...mockAccount, _id: mockObjectId };
      const mockChildAccount = { ...mockAccount, _id: new mongoose.Types.ObjectId() };
      
      const findOrCreateAccountSpy = jest.spyOn(AccountingIntegrationService as any, 'findOrCreateAccount')
        .mockResolvedValueOnce(mockParentAccount)
        .mockResolvedValueOnce(mockChildAccount);

      // Act
      const result = await AccountingIntegrationService.handlePurchaseOrderCompletion(mockPO);

      // Assert
      expect(result).toBeNull();
      expect(findOrCreateAccountSpy).toHaveBeenCalledTimes(2);
      
      // 驗證父科目創建
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          code: '5101',
          name: '進貨',
          level: 1
        })
      );

      // 驗證子科目創建
      expect(findOrCreateAccountSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          name: '進貨-複雜供應商名稱',
          level: 2,
          parentId: mockObjectId
        })
      );
    });
  });
});