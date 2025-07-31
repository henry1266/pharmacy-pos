import mongoose from 'mongoose';
import { AutoAccountingEntryService } from '../AutoAccountingEntryService';
import Account2, { IAccount2 } from '../../models/Account2';
import { IPurchaseOrderDocument } from '../../models/PurchaseOrder';

// Mock dependencies
jest.mock('../../models/Account2');
jest.mock('../../models/TransactionGroupWithEntries');

describe('AutoAccountingEntryService - 記帳格式測試', () => {
  let mockPurchaseOrder: Partial<IPurchaseOrderDocument>;
  let mockAccounts: IAccount2[];

  beforeEach(() => {
    // 重置 mocks
    jest.clearAllMocks();

    // 模擬進貨單
    mockPurchaseOrder = {
      _id: new mongoose.Types.ObjectId(),
      poid: '20250125001',
      posupplier: '測試供應商',
      totalAmount: 10000,
      selectedAccountIds: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ],
      organizationId: new mongoose.Types.ObjectId(),
      status: 'completed'
    };

    // 模擬會計科目
    mockAccounts = [
      {
        _id: new mongoose.Types.ObjectId(),
        code: '5101',
        name: '進貨費用',
        accountType: 'expense',
        normalBalance: 'debit',
        organizationId: mockPurchaseOrder.organizationId
      } as IAccount2,
      {
        _id: new mongoose.Types.ObjectId(),
        code: '1101',
        name: '現金',
        accountType: 'asset',
        normalBalance: 'debit',
        organizationId: mockPurchaseOrder.organizationId
      } as IAccount2
    ];
  });

  describe('determineDebitCreditAccounts 方法測試', () => {
    test('支出-資產格式：應正確識別借貸科目', () => {
      // 使用反射來訪問私有方法
      const result = (AutoAccountingEntryService as any).determineDebitCreditAccounts(
        mockAccounts,
        'expense-asset'
      );

      expect(result.debitAccount).toBeTruthy();
      expect(result.creditAccount).toBeTruthy();
      expect(result.debitAccount.accountType).toBe('expense');
      expect(result.creditAccount.accountType).toBe('asset');
      expect(result.debitAccount.name).toBe('進貨費用');
      expect(result.creditAccount.name).toBe('現金');
    });

    test('資產-負債格式：應正確識別借貸科目', () => {
      // 修改模擬科目為資產-負債格式
      const assetLiabilityAccounts: IAccount2[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          code: '1301',
          name: '存貨',
          accountType: 'asset',
          normalBalance: 'debit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2,
        {
          _id: new mongoose.Types.ObjectId(),
          code: '2101',
          name: '應付帳款',
          accountType: 'liability',
          normalBalance: 'credit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2
      ];

      const result = (AutoAccountingEntryService as any).determineDebitCreditAccounts(
        assetLiabilityAccounts,
        'asset-liability'
      );

      expect(result.debitAccount).toBeTruthy();
      expect(result.creditAccount).toBeTruthy();
      expect(result.debitAccount.accountType).toBe('asset');
      expect(result.creditAccount.accountType).toBe('liability');
      expect(result.debitAccount.name).toBe('存貨');
      expect(result.creditAccount.name).toBe('應付帳款');
    });

    test('不支援的格式：應返回 null', () => {
      const result = (AutoAccountingEntryService as any).determineDebitCreditAccounts(
        mockAccounts,
        'invalid-format' as any
      );

      expect(result.debitAccount).toBeNull();
      expect(result.creditAccount).toBeNull();
    });

    test('缺少必要科目類型：應返回 null', () => {
      // 只有支出科目，沒有資產科目
      const incompleteAccounts: IAccount2[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          code: '5101',
          name: '進貨費用',
          accountType: 'expense',
          normalBalance: 'debit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2
      ];

      const result = (AutoAccountingEntryService as any).determineDebitCreditAccounts(
        incompleteAccounts,
        'expense-asset'
      );

      expect(result.debitAccount).toBeTruthy();
      expect(result.creditAccount).toBeNull();
    });
  });

  describe('shouldCreateAutoEntry 方法測試', () => {
    test('滿足所有條件：應返回 true', () => {
      const result = (AutoAccountingEntryService as any).shouldCreateAutoEntry(mockPurchaseOrder);
      expect(result).toBe(true);
    });

    test('科目數量不足：應返回 false', () => {
      mockPurchaseOrder.selectedAccountIds = [new mongoose.Types.ObjectId()]; // 只有一個科目
      const result = (AutoAccountingEntryService as any).shouldCreateAutoEntry(mockPurchaseOrder);
      expect(result).toBe(false);
    });

    test('總金額無效：應返回 false', () => {
      mockPurchaseOrder.totalAmount = 0;
      const result = (AutoAccountingEntryService as any).shouldCreateAutoEntry(mockPurchaseOrder);
      expect(result).toBe(false);
    });

    test('沒有選擇科目：應返回 false', () => {
      mockPurchaseOrder.selectedAccountIds = [];
      const result = (AutoAccountingEntryService as any).shouldCreateAutoEntry(mockPurchaseOrder);
      expect(result).toBe(false);
    });
  });

  describe('整合測試', () => {
    beforeEach(() => {
      // Mock Account2.find
      (Account2.find as jest.Mock).mockResolvedValue(mockAccounts);
    });

    test('支出-資產格式的完整流程', async () => {
      mockPurchaseOrder.accountingEntryType = 'expense-asset';

      // Mock TransactionGroupWithEntries
      const mockTransactionGroup = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };

      const TransactionGroupWithEntries = require('../../models/TransactionGroupWithEntries').default;
      TransactionGroupWithEntries.mockImplementation(() => mockTransactionGroup);

      const result = await AutoAccountingEntryService.handlePurchaseOrderCompletion(
        mockPurchaseOrder as IPurchaseOrderDocument,
        'test-user-id'
      );

      expect(result).toBeTruthy();
      expect(Account2.find).toHaveBeenCalledWith({
        _id: { $in: mockPurchaseOrder.selectedAccountIds }
      });
      expect(mockTransactionGroup.save).toHaveBeenCalled();
    });

    test('資產-負債格式的完整流程', async () => {
      // 修改模擬科目為資產-負債格式
      const assetLiabilityAccounts: IAccount2[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          code: '1301',
          name: '存貨',
          accountType: 'asset',
          normalBalance: 'debit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2,
        {
          _id: new mongoose.Types.ObjectId(),
          code: '2101',
          name: '應付帳款',
          accountType: 'liability',
          normalBalance: 'credit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2
      ];

      (Account2.find as jest.Mock).mockResolvedValue(assetLiabilityAccounts);
      mockPurchaseOrder.accountingEntryType = 'asset-liability';

      // Mock TransactionGroupWithEntries
      const mockTransactionGroup = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };

      const TransactionGroupWithEntries = require('../../models/TransactionGroupWithEntries').default;
      TransactionGroupWithEntries.mockImplementation(() => mockTransactionGroup);

      const result = await AutoAccountingEntryService.handlePurchaseOrderCompletion(
        mockPurchaseOrder as IPurchaseOrderDocument,
        'test-user-id'
      );

      expect(result).toBeTruthy();
      expect(Account2.find).toHaveBeenCalledWith({
        _id: { $in: mockPurchaseOrder.selectedAccountIds }
      });
      expect(mockTransactionGroup.save).toHaveBeenCalled();
    });
  });

  describe('錯誤處理測試', () => {
    test('科目不存在時應拋出錯誤', async () => {
      (Account2.find as jest.Mock).mockResolvedValue([]); // 沒有找到科目

      await expect(
        AutoAccountingEntryService.handlePurchaseOrderCompletion(
          mockPurchaseOrder as IPurchaseOrderDocument
        )
      ).rejects.toThrow('部分會計科目不存在');
    });

    test('無法找到合適的借貸科目時應返回 null', async () => {
      // 模擬兩個相同類型的科目
      const sameTypeAccounts: IAccount2[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          code: '5101',
          name: '進貨費用',
          accountType: 'expense',
          normalBalance: 'debit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2,
        {
          _id: new mongoose.Types.ObjectId(),
          code: '5102',
          name: '運費',
          accountType: 'expense',
          normalBalance: 'debit',
          organizationId: mockPurchaseOrder.organizationId
        } as IAccount2
      ];

      (Account2.find as jest.Mock).mockResolvedValue(sameTypeAccounts);
      mockPurchaseOrder.accountingEntryType = 'expense-asset';

      const result = await AutoAccountingEntryService.handlePurchaseOrderCompletion(
        mockPurchaseOrder as IPurchaseOrderDocument
      );

      expect(result).toBeNull();
    });
  });
});