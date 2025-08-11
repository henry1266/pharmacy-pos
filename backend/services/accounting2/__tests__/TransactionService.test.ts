import { TransactionService } from '../TransactionService';
import TransactionGroupWithEntries, { ITransactionGroupWithEntries } from '../../../models/TransactionGroupWithEntries';
import Account2 from '../../../models/Account2';
import { Accounting3To2Adapter } from '../../../../shared/adapters/accounting3to2';

// Mock dependencies
jest.mock('../../../models/TransactionGroupWithEntries');
jest.mock('../../../models/Account2');
jest.mock('../../../../shared/adapters/accounting3to2');

const MockedTransactionGroupWithEntries = TransactionGroupWithEntries as jest.Mocked<typeof TransactionGroupWithEntries>;
const MockedAccount2 = Account2 as jest.Mocked<typeof Account2>;
const MockedAccounting3To2Adapter = Accounting3To2Adapter as jest.Mocked<typeof Accounting3To2Adapter>;

describe('TransactionService', () => {
  const mockUserId = 'user123';
  const mockOrganizationId = 'org456';
  const mockTransactionId = 'transaction123';
  
  const mockTransactionData: Partial<ITransactionGroupWithEntries> = {
    groupNumber: 'TXN001',
    description: '測試交易',
    transactionDate: new Date(),
    totalAmount: 1000,
    entries: [
      {
        accountId: 'account1',
        debitAmount: 1000,
        creditAmount: 0,
        sequence: 1,
        description: '借方分錄'
      },
      {
        accountId: 'account2',
        debitAmount: 0,
        creditAmount: 1000,
        sequence: 2,
        description: '貸方分錄'
      }
    ]
  };

  const mockTransaction = {
    _id: mockTransactionId,
    ...mockTransactionData,
    status: 'draft',
    createdBy: mockUserId,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn()
  } as unknown as ITransactionGroupWithEntries;

  const mockAccount = {
    _id: 'account1',
    code: 'ACC001',
    name: '測試帳戶',
    accountType: 'asset',
    isActive: true,
    createdBy: mockUserId
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  describe('createTransactionGroup', () => {
    it('應該成功建立新交易群組', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(null); // 沒有重複的群組編號
      const mockSave = jest.fn().mockResolvedValue(mockTransaction);
      MockedTransactionGroupWithEntries.prototype.save = mockSave;
      (MockedTransactionGroupWithEntries as any).mockImplementation(() => ({
        save: mockSave
      }));

      // Mock validateEntries
      const originalValidateEntries = (TransactionService as any).validateEntries;
      (TransactionService as any).validateEntries = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await TransactionService.createTransactionGroup(mockTransactionData, mockUserId, mockOrganizationId);

      // Assert
      expect(MockedTransactionGroupWithEntries.findOne).toHaveBeenCalledWith({
        groupNumber: mockTransactionData.groupNumber,
        createdBy: mockUserId,
        organizationId: mockOrganizationId
      });
      expect(result).toEqual(mockTransaction);

      // Restore
      (TransactionService as any).validateEntries = originalValidateEntries;
    });

    it('應該在群組編號重複時拋出錯誤', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(mockTransaction);

      // Act & Assert
      await expect(
        TransactionService.createTransactionGroup(mockTransactionData, mockUserId, mockOrganizationId)
      ).rejects.toThrow(`交易群組編號 ${mockTransactionData.groupNumber} 已存在`);
    });

    it('應該驗證分錄資料', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue(mockTransaction);
      MockedTransactionGroupWithEntries.prototype.save = mockSave;
      (MockedTransactionGroupWithEntries as any).mockImplementation(() => ({
        save: mockSave
      }));

      const originalValidateEntries = (TransactionService as any).validateEntries;
      const mockValidateEntries = jest.fn().mockResolvedValue(undefined);
      (TransactionService as any).validateEntries = mockValidateEntries;

      // Act
      await TransactionService.createTransactionGroup(mockTransactionData, mockUserId, mockOrganizationId);

      // Assert
      expect(mockValidateEntries).toHaveBeenCalledWith(mockTransactionData.entries, mockUserId);

      // Restore
      (TransactionService as any).validateEntries = originalValidateEntries;
    });
  });

  describe('getTransactionGroups', () => {
    const mockTransactions = [mockTransaction];

    it('應該成功取得交易群組列表', async () => {
      // Arrange
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTransactions)
      };
      MockedTransactionGroupWithEntries.find.mockReturnValue(mockFind as any);
      MockedTransactionGroupWithEntries.countDocuments.mockResolvedValue(1);

      // Act
      const result = await TransactionService.getTransactionGroups(mockUserId, mockOrganizationId);

      // Assert
      expect(MockedTransactionGroupWithEntries.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        organizationId: mockOrganizationId
      });
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
    });

    it('應該支援篩選條件', async () => {
      // Arrange
      const filters = {
        status: 'confirmed' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        search: '測試',
        page: 2,
        limit: 10
      };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTransactions)
      };
      MockedTransactionGroupWithEntries.find.mockReturnValue(mockFind as any);
      MockedTransactionGroupWithEntries.countDocuments.mockResolvedValue(1);

      // Act
      const result = await TransactionService.getTransactionGroups(mockUserId, mockOrganizationId, filters);

      // Assert
      expect(result).toBeDefined();
      expect(MockedTransactionGroupWithEntries.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        status: 'confirmed',
        transactionDate: {
          $gte: filters.startDate,
          $lte: filters.endDate
        },
        $or: [
          { groupNumber: { $regex: '測試', $options: 'i' } },
          { description: { $regex: '測試', $options: 'i' } }
        ]
      });
      expect(mockFind.skip).toHaveBeenCalledWith(10); // (page-1) * limit
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getTransactionGroupById', () => {
    it('應該成功取得單一交易群組', async () => {
      // Arrange
      const mockPopulate = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue(mockTransaction);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      // Act
      const result = await TransactionService.getTransactionGroupById(mockTransactionId, mockUserId);

      // Assert
      expect(MockedTransactionGroupWithEntries.findOne).toHaveBeenCalledWith({
        _id: mockTransactionId,
        createdBy: mockUserId
      });
      expect(result).toEqual(mockTransaction);
    });

    it('應該在交易不存在時拋出錯誤', async () => {
      // Arrange
      const mockPopulate = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue(null);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      // Act & Assert
      await expect(
        TransactionService.getTransactionGroupById('nonexistent', mockUserId)
      ).rejects.toThrow('交易群組不存在或無權限存取');
    });

    it('應該包含相容性資訊當 includeCompatibilityInfo 為 true', async () => {
      // Arrange
      const mockPopulate = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue(mockTransaction);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      const mockLegacyFormat = {
        _id: 'legacy123',
        groupNumber: 'TXN001',
        description: '測試',
        transactionDate: new Date(),
        totalAmount: 1000,
        status: 'draft',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        entries: [],
        linkedTransactionIds: [],
        fundingType: 'original' as const
      };
      const mockEntries = [{
        _id: 'entry1',
        transactionGroupId: 'legacy123',
        sequence: 1,
        accountId: 'account1',
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試分錄',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      const mockValidation = { isValid: true, errors: [] };

      MockedAccounting3To2Adapter.convertToLegacyTransactionGroup.mockReturnValue(mockLegacyFormat as any);
      MockedAccounting3To2Adapter.extractAllEntriesFromTransactions.mockReturnValue(mockEntries);
      MockedAccounting3To2Adapter.validateConversion.mockReturnValue(mockValidation);

      // Act
      const result = await TransactionService.getTransactionGroupById(mockTransactionId, mockUserId, true);

      // Assert
      expect(result.compatibilityInfo).toBeDefined();
      expect(result.compatibilityInfo.isValid).toBe(true);
      expect(result.compatibilityInfo.legacyFormat).toEqual(mockLegacyFormat);
    });
  });

  describe('updateTransactionGroup', () => {
    const updateData = { description: '更新後的描述' };

    it('應該成功更新交易群組', async () => {
      // Arrange
      const draftTransaction = { ...mockTransaction, status: 'draft' };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(draftTransaction);
      MockedTransactionGroupWithEntries.findByIdAndUpdate.mockResolvedValue({
        ...mockTransaction,
        ...updateData
      });

      const originalValidateEntries = (TransactionService as any).validateEntries;
      (TransactionService as any).validateEntries = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await TransactionService.updateTransactionGroup(mockTransactionId, updateData, mockUserId);

      // Assert
      expect(MockedTransactionGroupWithEntries.findOne).toHaveBeenCalledWith({
        _id: mockTransactionId,
        createdBy: mockUserId
      });
      expect(MockedTransactionGroupWithEntries.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTransactionId,
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
      expect(result).toEqual({ ...mockTransaction, ...updateData });

      // Restore
      (TransactionService as any).validateEntries = originalValidateEntries;
    });

    it('應該在交易不存在時拋出錯誤', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TransactionService.updateTransactionGroup('nonexistent', updateData, mockUserId)
      ).rejects.toThrow('交易群組不存在或無權限存取');
    });

    it('應該在交易已確認時拋出錯誤', async () => {
      // Arrange
      const confirmedTransaction = { ...mockTransaction, status: 'confirmed' };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(confirmedTransaction);

      // Act & Assert
      await expect(
        TransactionService.updateTransactionGroup(mockTransactionId, updateData, mockUserId)
      ).rejects.toThrow('已確認的交易無法修改');
    });

    it('應該檢查群組編號唯一性當更新群組編號時', async () => {
      // Arrange
      const updateDataWithGroupNumber = { groupNumber: 'NEW001' };
      const draftTransaction = { ...mockTransaction, status: 'draft' };
      MockedTransactionGroupWithEntries.findOne
        .mockResolvedValueOnce(draftTransaction) // 第一次調用：找到要更新的交易
        .mockResolvedValueOnce(mockTransaction); // 第二次調用：找到重複的群組編號

      // Act & Assert
      await expect(
        TransactionService.updateTransactionGroup(mockTransactionId, updateDataWithGroupNumber, mockUserId)
      ).rejects.toThrow(`交易群組編號 ${updateDataWithGroupNumber.groupNumber} 已存在`);
    });
  });

  describe('confirmTransactionGroup', () => {
    it('應該成功確認交易群組', async () => {
      // Arrange
      const draftTransaction = {
        ...mockTransaction,
        status: 'draft',
        entries: [
          { debitAmount: 1000, creditAmount: 0 },
          { debitAmount: 0, creditAmount: 1000 }
        ]
      };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(draftTransaction);
      MockedTransactionGroupWithEntries.findByIdAndUpdate.mockResolvedValue({
        ...draftTransaction,
        status: 'confirmed'
      });

      // Act
      const result = await TransactionService.confirmTransactionGroup(mockTransactionId, mockUserId);

      // Assert
      expect(MockedTransactionGroupWithEntries.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTransactionId,
        expect.objectContaining({
          status: 'confirmed',
          confirmedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }),
        { new: true }
      );
      expect(result.status).toBe('confirmed');
    });

    it('應該在交易不存在時拋出錯誤', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TransactionService.confirmTransactionGroup('nonexistent', mockUserId)
      ).rejects.toThrow('交易群組不存在或無權限存取');
    });

    it('應該在交易已確認時拋出錯誤', async () => {
      // Arrange
      const confirmedTransaction = { ...mockTransaction, status: 'confirmed' };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(confirmedTransaction);

      // Act & Assert
      await expect(
        TransactionService.confirmTransactionGroup(mockTransactionId, mockUserId)
      ).rejects.toThrow('交易群組已經確認');
    });

    it('應該在交易已取消時拋出錯誤', async () => {
      // Arrange
      const cancelledTransaction = { ...mockTransaction, status: 'cancelled' };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(cancelledTransaction);

      // Act & Assert
      await expect(
        TransactionService.confirmTransactionGroup(mockTransactionId, mockUserId)
      ).rejects.toThrow('已取消的交易無法確認');
    });

    it('應該在沒有分錄時拋出錯誤', async () => {
      // Arrange
      const transactionWithoutEntries = {
        ...mockTransaction,
        status: 'draft' as const,
        entries: []
      };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(transactionWithoutEntries);

      // Act & Assert
      await expect(
        TransactionService.confirmTransactionGroup(mockTransactionId, mockUserId)
      ).rejects.toThrow('交易群組必須包含分錄才能確認');
    });

    it('應該在借貸不平衡時拋出錯誤', async () => {
      // Arrange
      const unbalancedTransaction = {
        ...mockTransaction,
        status: 'draft',
        entries: [
          { debitAmount: 1000, creditAmount: 0 },
          { debitAmount: 0, creditAmount: 500 } // 不平衡
        ]
      };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(unbalancedTransaction);

      // Act & Assert
      await expect(
        TransactionService.confirmTransactionGroup(mockTransactionId, mockUserId)
      ).rejects.toThrow('交易借貸不平衡：借方 1000，貸方 500');
    });
  });

  describe('cancelTransactionGroup', () => {
    it('應該成功取消交易群組', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(mockTransaction);
      MockedTransactionGroupWithEntries.find.mockResolvedValue([]); // 沒有引用交易
      MockedTransactionGroupWithEntries.findByIdAndUpdate.mockResolvedValue({
        ...mockTransaction,
        status: 'cancelled'
      });

      // Act
      const result = await TransactionService.cancelTransactionGroup(mockTransactionId, mockUserId, '測試取消');

      // Assert
      expect(MockedTransactionGroupWithEntries.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTransactionId,
        expect.objectContaining({
          status: 'cancelled',
          cancelledAt: expect.any(Date),
          cancelReason: '測試取消',
          updatedAt: expect.any(Date)
        }),
        { new: true }
      );
      expect(result.status).toBe('cancelled');
    });

    it('應該在交易不存在時拋出錯誤', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TransactionService.cancelTransactionGroup('nonexistent', mockUserId)
      ).rejects.toThrow('交易群組不存在或無權限存取');
    });

    it('應該在交易已取消時拋出錯誤', async () => {
      // Arrange
      const cancelledTransaction = { ...mockTransaction, status: 'cancelled' };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(cancelledTransaction);

      // Act & Assert
      await expect(
        TransactionService.cancelTransactionGroup(mockTransactionId, mockUserId)
      ).rejects.toThrow('交易群組已經取消');
    });

    it('應該在有其他交易引用時拋出錯誤', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(mockTransaction);
      MockedTransactionGroupWithEntries.find.mockResolvedValue([
        { _id: 'ref1', groupNumber: 'REF001' },
        { _id: 'ref2', groupNumber: 'REF002' }
      ]); // 有引用交易

      // Act & Assert
      await expect(
        TransactionService.cancelTransactionGroup(mockTransactionId, mockUserId)
      ).rejects.toThrow('無法取消交易：有 2 筆交易引用此交易');
    });
  });

  describe('calculateTransactionBalance', () => {
    it('應該成功計算交易餘額', async () => {
      // Arrange
      const confirmedTransaction = { ...mockTransaction, status: 'confirmed', totalAmount: 1000 };
      const mockLean = jest.fn()
        .mockResolvedValueOnce(confirmedTransaction) // 來源交易
        .mockResolvedValueOnce([{ // 引用交易
          _id: 'ref1',
          groupNumber: 'REF001',
          description: '引用交易',
          transactionDate: new Date(),
          entries: [
            {
              sourceTransactionId: mockTransactionId,
              debitAmount: 300,
              creditAmount: 0
            }
          ]
        }]);
      
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);
      const mockPopulate = jest.fn().mockReturnThis();
      MockedTransactionGroupWithEntries.find.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      // Act
      const result = await TransactionService.calculateTransactionBalance(mockTransactionId, mockUserId);

      // Assert
      expect(result.transactionId).toBe(mockTransactionId);
      expect(result.totalAmount).toBe(1000);
      expect(result.usedAmount).toBe(300);
      expect(result.availableAmount).toBe(700);
      expect(result.referencedByCount).toBe(1);
    });

    it('應該在交易不存在或未確認時拋出錯誤', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue(null);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act & Assert
      await expect(
        TransactionService.calculateTransactionBalance('nonexistent', mockUserId)
      ).rejects.toThrow('交易不存在、未確認或無權限存取');
    });

    it('應該正確處理沒有引用的交易', async () => {
      // Arrange
      const confirmedTransaction = { ...mockTransaction, status: 'confirmed', totalAmount: 1000 };
      const mockLean = jest.fn()
        .mockResolvedValueOnce(confirmedTransaction) // 來源交易
        .mockResolvedValueOnce([]); // 沒有引用交易
      
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);
      const mockPopulate = jest.fn().mockReturnThis();
      MockedTransactionGroupWithEntries.find.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      // Act
      const result = await TransactionService.calculateTransactionBalance(mockTransactionId, mockUserId);

      // Assert
      expect(result.usedAmount).toBe(0);
      expect(result.availableAmount).toBe(1000);
      expect(result.referencedByCount).toBe(0);
    });
  });

  describe('calculateMultipleTransactionBalances', () => {
    it('應該成功批次計算交易餘額', async () => {
      // Arrange
      const transactionIds = ['tx1', 'tx2'];
      const originalCalculateTransactionBalance = TransactionService.calculateTransactionBalance;
      TransactionService.calculateTransactionBalance = jest.fn()
        .mockResolvedValueOnce({
          transactionId: 'tx1',
          totalAmount: 1000,
          usedAmount: 300,
          availableAmount: 700,
          referencedByCount: 1,
          referencedByTransactions: []
        })
        .mockResolvedValueOnce({
          transactionId: 'tx2',
          totalAmount: 2000,
          usedAmount: 500,
          availableAmount: 1500,
          referencedByCount: 2,
          referencedByTransactions: []
        });

      // Act
      const result = await TransactionService.calculateMultipleTransactionBalances(transactionIds, mockUserId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[0].transactionId).toBe('tx1');
      expect(result[1].success).toBe(true);
      expect(result[1].transactionId).toBe('tx2');

      // Restore
      TransactionService.calculateTransactionBalance = originalCalculateTransactionBalance;
    });

    it('應該處理部分失敗的情況', async () => {
      // Arrange
      const transactionIds = ['tx1', 'tx2'];
      const originalCalculateTransactionBalance = TransactionService.calculateTransactionBalance;
      TransactionService.calculateTransactionBalance = jest.fn()
        .mockResolvedValueOnce({
          transactionId: 'tx1',
          totalAmount: 1000,
          usedAmount: 300,
          availableAmount: 700,
          referencedByCount: 1,
          referencedByTransactions: []
        })
        .mockRejectedValueOnce(new Error('計算失敗'));

      // Act
      const result = await TransactionService.calculateMultipleTransactionBalances(transactionIds, mockUserId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
      expect(result[1].error).toBe('計算失敗');

      // Restore
      TransactionService.calculateTransactionBalance = originalCalculateTransactionBalance;
    });
  });

  describe('getTransactionStatistics', () => {
    it('應該成功取得交易統計', async () => {
      // Arrange
      const mockTransactions = [
        { ...mockTransaction, status: 'confirmed', totalAmount: 1000 },
        { ...mockTransaction, _id: 'tx2', status: 'draft', totalAmount: 500 },
        { ...mockTransaction, _id: 'tx3', status: 'cancelled', totalAmount: 300 }
      ];
      const mockLean = jest.fn().mockResolvedValue(mockTransactions);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await TransactionService.getTransactionStatistics(mockUserId, mockOrganizationId);

      // Assert
      expect(result.totalTransactions).toBe(3);
      expect(result.confirmedTransactions).toBe(1);
      expect(result.draftTransactions).toBe(1);
      expect(result.cancelledTransactions).toBe(1);
      expect(result.totalAmount).toBe(1800);
      expect(result.averageAmount).toBe(600);
      expect(result.transactionsByStatus).toHaveLength(3);
    });

    it('應該支援日期範圍篩選', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      await TransactionService.getTransactionStatistics(mockUserId, mockOrganizationId, { startDate, endDate });

      // Assert
      expect(MockedTransactionGroupWithEntries.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        transactionDate: {
          $gte: startDate,
          $lte: endDate
        }
      });
    });

    it('應該正確處理沒有交易的情況', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await TransactionService.getTransactionStatistics(mockUserId, mockOrganizationId);

      // Assert
      expect(result.totalTransactions).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.averageAmount).toBe(0);
      expect(result.transactionsByStatus).toHaveLength(0);
    });
  });

  describe('validateEntries (private method)', () => {
    it('應該成功驗證有效的分錄', async () => {
      // Arrange
      const validEntries = [
        { accountId: 'account1', debitAmount: 1000, creditAmount: 0 },
        { accountId: 'account2', debitAmount: 0, creditAmount: 1000 }
      ];
      MockedAccount2.find.mockResolvedValue([mockAccount, { ...mockAccount, _id: 'account2' }]);

      // Act & Assert - 不應該拋出錯誤
      await expect(
        (TransactionService as any).validateEntries(validEntries, mockUserId)
      ).resolves.not.toThrow();
    });

    it('應該在沒有指定會計科目時拋出錯誤', async () => {
      // Arrange
      const entriesWithoutAccount = [
        { debitAmount: 1000, creditAmount: 0 }
      ];

      // Act & Assert
      await expect(
        (TransactionService as any).validateEntries(entriesWithoutAccount, mockUserId)
      ).rejects.toThrow('分錄必須指定會計科目');
    });

    it('應該在會計科目不存在時拋出錯誤', async () => {
      // Arrange
      const entriesWithInvalidAccount = [
        { accountId: 'nonexistent', debitAmount: 1000, creditAmount: 0 }
      ];
      MockedAccount2.find.mockResolvedValue([]); // 沒有找到帳戶

      // Act & Assert
      await expect(
        (TransactionService as any).validateEntries(entriesWithInvalidAccount, mockUserId)
      ).rejects.toThrow('以下會計科目不存在或無權限存取: nonexistent');
    });

    it('應該在分錄金額為負數時拋出錯誤', async () => {
      // Arrange
      const entriesWithNegativeAmount = [
        { accountId: 'account1', debitAmount: -100, creditAmount: 0 }
      ];
      MockedAccount2.find.mockResolvedValue([mockAccount]);

      // Act & Assert
      await expect(
        (TransactionService as any).validateEntries(entriesWithNegativeAmount, mockUserId)
      ).rejects.toThrow('分錄金額不能為負數');
    });

    it('應該在分錄沒有金額時拋出錯誤', async () => {
      // Arrange
      const entriesWithoutAmount = [
        { accountId: 'account1', debitAmount: 0, creditAmount: 0 }
      ];
      MockedAccount2.find.mockResolvedValue([mockAccount]);

      // Act & Assert
      await expect(
        (TransactionService as any).validateEntries(entriesWithoutAmount, mockUserId)
      ).rejects.toThrow('分錄必須有借方或貸方金額');
    });

    it('應該在分錄同時有借方和貸方金額時拋出錯誤', async () => {
      // Arrange
      const entriesWithBothAmounts = [
        { accountId: 'account1', debitAmount: 100, creditAmount: 200 }
      ];
      MockedAccount2.find.mockResolvedValue([mockAccount]);

      // Act & Assert
      await expect(
        (TransactionService as any).validateEntries(entriesWithBothAmounts, mockUserId)
      ).rejects.toThrow('分錄不能同時有借方和貸方金額');
    });
  });
});