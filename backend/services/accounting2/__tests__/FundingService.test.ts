import { FundingService } from '../FundingService';
import TransactionGroupWithEntries from '../../../models/TransactionGroupWithEntries';

// Mock dependencies
jest.mock('../../../models/TransactionGroupWithEntries');

const MockedTransactionGroupWithEntries = TransactionGroupWithEntries as jest.Mocked<typeof TransactionGroupWithEntries>;

describe('FundingService', () => {
  const mockUserId = 'user123';
  const mockOrganizationId = 'org456';
  const mockTransactionId = 'transaction123';
  
  const mockTransaction = {
    _id: mockTransactionId,
    groupNumber: 'TXN001',
    description: '測試交易',
    transactionDate: new Date(),
    totalAmount: 1000,
    status: 'confirmed',
    createdBy: mockUserId,
    organizationId: mockOrganizationId,
    entries: [
      {
        _id: 'entry1',
        accountId: 'account1',
        debitAmount: 1000,
        creditAmount: 0,
        sequence: 1,
        description: '測試分錄'
      }
    ]
  };

  const mockReferencingTransaction = {
    _id: 'ref123',
    groupNumber: 'REF001',
    description: '引用交易',
    transactionDate: new Date(),
    totalAmount: 500,
    status: 'confirmed',
    createdBy: mockUserId,
    organizationId: mockOrganizationId,
    entries: [
      {
        _id: 'entry2',
        accountId: 'account2',
        debitAmount: 500,
        creditAmount: 0,
        sequence: 1,
        description: '引用分錄',
        sourceTransactionId: mockTransactionId
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  describe('trackFundingUsage', () => {
    it('應該成功追蹤資金使用情況', async () => {
      // Arrange
      const mockLean = jest.fn()
        .mockResolvedValueOnce(mockTransaction) // 來源交易
        .mockResolvedValueOnce([mockReferencingTransaction]); // 引用交易
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await FundingService.trackFundingUsage(mockTransactionId, mockUserId, mockOrganizationId);

      // Assert
      expect(result.sourceTransaction).toEqual(mockTransaction);
      expect(result.totalAmount).toBe(1000);
      expect(result.usedAmount).toBe(500);
      expect(result.remainingAmount).toBe(500);
      expect(result.usageDetails).toHaveLength(1);
      expect(result.usageDetails[0].transactionId).toBe('ref123');
    });

    it('應該在來源交易不存在時拋出錯誤', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue(null);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act & Assert
      await expect(
        FundingService.trackFundingUsage('nonexistent', mockUserId, mockOrganizationId)
      ).rejects.toThrow('來源交易不存在或無權限存取');
    });

    it('應該正確計算沒有引用的交易', async () => {
      // Arrange
      const mockLean = jest.fn()
        .mockResolvedValueOnce(mockTransaction) // 來源交易
        .mockResolvedValueOnce([]); // 沒有引用交易
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await FundingService.trackFundingUsage(mockTransactionId, mockUserId, mockOrganizationId);

      // Assert
      expect(result.usedAmount).toBe(0);
      expect(result.remainingAmount).toBe(1000);
      expect(result.usageDetails).toHaveLength(0);
    });
  });

  describe('getAvailableFundingSources', () => {
    it('應該成功取得可用資金來源', async () => {
      // Arrange
      const mockPopulate = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue([mockTransaction]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      // Mock trackFundingUsage
      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 300,
        remainingAmount: 700
      });

      // Act
      const result = await FundingService.getAvailableFundingSources(mockUserId, mockOrganizationId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].transactionId).toBe(mockTransactionId);
      expect(result[0].availableAmount).toBe(700);

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });

    it('應該過濾掉沒有剩餘金額的資金來源', async () => {
      // Arrange
      const mockPopulate = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue([mockTransaction]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      // Mock trackFundingUsage - 沒有剩餘金額
      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 1000,
        remainingAmount: 0
      });

      // Act
      const result = await FundingService.getAvailableFundingSources(mockUserId, mockOrganizationId);

      // Assert
      expect(result).toHaveLength(0);

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });

    it('應該支援指定會計科目篩選', async () => {
      // Arrange
      const mockPopulate = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue([mockTransaction]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({
        populate: mockPopulate,
        lean: mockLean
      } as any);

      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 0,
        remainingAmount: 1000
      });

      // Act
      await FundingService.getAvailableFundingSources(mockUserId, mockOrganizationId, 'account1');

      // Assert
      expect(MockedTransactionGroupWithEntries.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        status: 'confirmed',
        organizationId: mockOrganizationId,
        'entries.accountId': 'account1'
      });

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });
  });

  describe('createFundingAllocation', () => {
    const mockFundingAllocations = [
      {
        sourceTransactionId: mockTransactionId,
        amount: 300,
        entryIndex: 0
      }
    ];

    it('應該成功建立資金分配', async () => {
      // Arrange
      const targetTransaction = {
        ...mockTransaction,
        _id: 'target123',
        status: 'draft',
        save: jest.fn().mockResolvedValue(true)
      };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(targetTransaction);

      // Mock trackFundingUsage
      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 200,
        remainingAmount: 800
      });

      // Act
      const result = await FundingService.createFundingAllocation(
        'target123',
        mockFundingAllocations,
        mockUserId
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].amount).toBe(300);
      expect(targetTransaction.save).toHaveBeenCalled();

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });

    it('應該在目標交易不存在時拋出錯誤', async () => {
      // Arrange
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        FundingService.createFundingAllocation('nonexistent', mockFundingAllocations, mockUserId)
      ).rejects.toThrow('目標交易不存在或無權限存取');
    });

    it('應該在交易已確認時拋出錯誤', async () => {
      // Arrange
      const confirmedTransaction = {
        ...mockTransaction,
        status: 'confirmed'
      };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(confirmedTransaction);

      // Act & Assert
      await expect(
        FundingService.createFundingAllocation('target123', mockFundingAllocations, mockUserId)
      ).rejects.toThrow('已確認的交易無法修改資金分配');
    });

    it('應該在分配金額超過可用金額時拋出錯誤', async () => {
      // Arrange
      const targetTransaction = {
        ...mockTransaction,
        _id: 'target123',
        status: 'draft',
        save: jest.fn()
      };
      MockedTransactionGroupWithEntries.findOne.mockResolvedValue(targetTransaction);

      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 800,
        remainingAmount: 200 // 可用金額只有200
      });

      const largeAllocation = [{
        sourceTransactionId: mockTransactionId,
        amount: 500, // 超過可用金額
        entryIndex: 0
      }];

      // Act & Assert
      await expect(
        FundingService.createFundingAllocation('target123', largeAllocation, mockUserId)
      ).rejects.toThrow('資金分配金額 500 超過可用金額 200');

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });
  });

  describe('getFundingFlowAnalysis', () => {
    it('應該成功分析資金流向', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue([mockTransaction]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 300,
        remainingAmount: 700,
        usageDetails: [
          {
            transactionId: 'ref1',
            groupNumber: 'REF001',
            description: '引用1',
            usedAmount: 300,
            transactionDate: new Date(),
            status: 'confirmed'
          }
        ]
      });

      // Act
      const result = await FundingService.getFundingFlowAnalysis(mockUserId, mockOrganizationId);

      // Assert
      expect(result.totalFundingSources).toBe(1);
      expect(result.totalFundingAmount).toBe(1000);
      expect(result.totalUsedAmount).toBe(300);
      expect(result.totalAvailableAmount).toBe(700);
      expect(result.utilizationRate).toBe(30);
      expect(result.flowDetails).toHaveLength(1);

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });

    it('應該支援日期範圍篩選', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      await FundingService.getFundingFlowAnalysis(mockUserId, mockOrganizationId, { startDate, endDate });

      // Assert
      expect(MockedTransactionGroupWithEntries.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        status: 'confirmed',
        organizationId: mockOrganizationId,
        transactionDate: {
          $gte: startDate,
          $lte: endDate
        }
      });
    });

    it('應該正確計算使用率', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue([mockTransaction]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockLean } as any);

      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: mockTransaction,
        totalAmount: 1000,
        usedAmount: 750,
        remainingAmount: 250,
        usageDetails: []
      });

      // Act
      const result = await FundingService.getFundingFlowAnalysis(mockUserId, mockOrganizationId);

      // Assert
      expect(result.utilizationRate).toBe(75);
      expect(result.flowDetails[0].utilizationRate).toBe(75);

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });
  });

  describe('validateFundingAllocation', () => {
    it('應該成功驗證有效的資金分配', async () => {
      // Arrange
      const transactionWithValidAllocation = {
        ...mockTransaction,
        entries: [
          {
            _id: 'entry1',
            accountId: 'account1',
            debitAmount: 300,
            creditAmount: 0,
            sourceTransactionId: 'source123'
          }
        ]
      };
      const mockLean = jest.fn().mockResolvedValue(transactionWithValidAllocation);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: { ...mockTransaction, status: 'confirmed' },
        totalAmount: 1000,
        usedAmount: 200,
        remainingAmount: 800
      });

      // Act
      const result = await FundingService.validateFundingAllocation(mockTransactionId, mockUserId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });

    it('應該檢測交易不存在的錯誤', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue(null);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act & Assert
      await expect(
        FundingService.validateFundingAllocation('nonexistent', mockUserId)
      ).rejects.toThrow('交易不存在或無權限存取');
    });

    it('應該檢測沒有分錄的錯誤', async () => {
      // Arrange
      const transactionWithoutEntries = {
        ...mockTransaction,
        entries: []
      };
      const mockLean = jest.fn().mockResolvedValue(transactionWithoutEntries);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await FundingService.validateFundingAllocation(mockTransactionId, mockUserId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('交易沒有分錄');
    });

    it('應該檢測金額超過可用額度的問題', async () => {
      // Arrange
      const transactionWithExcessiveAmount = {
        ...mockTransaction,
        entries: [
          {
            _id: 'entry1',
            accountId: 'account1',
            debitAmount: 500, // 超過可用金額
            creditAmount: 0,
            sourceTransactionId: 'source123'
          }
        ]
      };
      const mockLean = jest.fn().mockResolvedValue(transactionWithExcessiveAmount);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      const originalTrackFundingUsage = FundingService.trackFundingUsage;
      FundingService.trackFundingUsage = jest.fn().mockResolvedValue({
        sourceTransaction: { ...mockTransaction, status: 'confirmed' },
        totalAmount: 1000,
        usedAmount: 800,
        remainingAmount: 200 // 可用金額只有200
      });

      // Act
      const result = await FundingService.validateFundingAllocation(mockTransactionId, mockUserId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('超過來源可用金額'))).toBe(true);

      // Restore
      FundingService.trackFundingUsage = originalTrackFundingUsage;
    });

    it('應該檢測循環引用的問題', async () => {
      // Arrange
      const transactionWithCircularReference = {
        ...mockTransaction,
        entries: [
          {
            _id: 'entry1',
            accountId: 'account1',
            debitAmount: 300,
            creditAmount: 0,
            sourceTransactionId: mockTransactionId // 引用自己
          }
        ]
      };
      const mockLean = jest.fn().mockResolvedValue(transactionWithCircularReference);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await FundingService.validateFundingAllocation(mockTransactionId, mockUserId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('檢測到循環引用：交易不能引用自己作為資金來源');
    });

    it('應該提供未指定資金來源的建議', async () => {
      // Arrange
      const transactionWithoutFundingSource = {
        ...mockTransaction,
        entries: [
          {
            _id: 'entry1',
            accountId: 'account1',
            debitAmount: 300,
            creditAmount: 0
            // 沒有 sourceTransactionId
          }
        ]
      };
      const mockLean = jest.fn().mockResolvedValue(transactionWithoutFundingSource);
      MockedTransactionGroupWithEntries.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await FundingService.validateFundingAllocation(mockTransactionId, mockUserId);

      // Assert
      expect(result.isValid).toBe(true); // 沒有錯誤，只有建議
      expect(result.recommendations.some(rec => rec.includes('建議為分錄'))).toBe(true);
    });
  });
});