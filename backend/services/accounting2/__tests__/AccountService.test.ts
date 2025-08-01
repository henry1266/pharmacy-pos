import { AccountService } from '../AccountService';
import Account2, { IAccount2 } from '../../../models/Account2';
import TransactionGroupWithEntries from '../../../models/TransactionGroupWithEntries';
import { AccountManagementAdapter } from '../../../../shared/adapters/accounting2to3';
import { VersionCompatibilityManager } from '../../../../shared/services/compatibilityService';

// Mock dependencies
jest.mock('../../../models/Account2');
jest.mock('../../../models/TransactionGroupWithEntries');
jest.mock('../../../../shared/adapters/accounting2to3');
jest.mock('../../../../shared/services/compatibilityService');

const MockedAccount2 = Account2 as jest.Mocked<typeof Account2>;
const MockedTransactionGroupWithEntries = TransactionGroupWithEntries as jest.Mocked<typeof TransactionGroupWithEntries>;
const MockedAccountManagementAdapter = AccountManagementAdapter as jest.Mocked<typeof AccountManagementAdapter>;
const MockedVersionCompatibilityManager = VersionCompatibilityManager as jest.Mocked<typeof VersionCompatibilityManager>;

describe('AccountService', () => {
  const mockUserId = 'user123';
  const mockOrganizationId = 'org456';
  
  const mockAccountData: Partial<IAccount2> = {
    code: 'ACC001',
    name: '測試帳戶',
    accountType: 'asset',
    description: '測試用帳戶',
    currency: 'TWD'
  };

  const mockAccount = {
    _id: 'account123',
    code: 'ACC001',
    name: '測試帳戶',
    accountType: 'asset',
    type: 'other',
    level: 1,
    description: '測試用帳戶',
    currency: 'TWD',
    balance: 0,
    initialBalance: 0,
    normalBalance: 'debit',
    isActive: true,
    createdBy: mockUserId,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn()
  } as unknown as IAccount2;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  describe('createAccount', () => {
    it('應該成功建立新帳戶', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(null); // 沒有重複的帳戶
      const mockSave = jest.fn().mockResolvedValue(mockAccount);
      MockedAccount2.prototype.save = mockSave;
      (MockedAccount2 as any).mockImplementation(() => ({
        save: mockSave
      }));

      // Act
      const result = await AccountService.createAccount(mockAccountData, mockUserId, mockOrganizationId);

      // Assert
      expect(MockedAccount2.findOne).toHaveBeenCalledWith({
        code: mockAccountData.code,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        isActive: true
      });
      expect(result).toEqual(mockAccount);
    });

    it('應該在帳戶代碼重複時拋出錯誤', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(mockAccount); // 找到重複的帳戶

      // Act & Assert
      await expect(
        AccountService.createAccount(mockAccountData, mockUserId, mockOrganizationId)
      ).rejects.toThrow(`帳戶代碼 ${mockAccountData.code} 已存在`);
    });

    it('應該處理資料庫錯誤', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      MockedAccount2.findOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        AccountService.createAccount(mockAccountData, mockUserId, mockOrganizationId)
      ).rejects.toThrow(dbError);
    });
  });

  describe('getAccounts', () => {
    const mockAccounts = [mockAccount];

    it('應該成功取得帳戶列表', async () => {
      // Arrange
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAccounts)
      };
      MockedAccount2.find.mockReturnValue(mockFind as any);

      // Act
      const result = await AccountService.getAccounts(mockUserId, mockOrganizationId);

      // Assert
      expect(MockedAccount2.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        isActive: true
      });
      expect(result).toEqual(mockAccounts);
    });

    it('應該支援篩選條件', async () => {
      // Arrange
      const filters = {
        accountType: 'asset',
        isActive: true,
        search: '測試'
      };
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAccounts)
      };
      MockedAccount2.find.mockReturnValue(mockFind as any);

      // Act
      const result = await AccountService.getAccounts(mockUserId, mockOrganizationId, filters);

      // Assert
      expect(MockedAccount2.find).toHaveBeenCalledWith({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        isActive: true,
        accountType: 'asset',
        $or: [
          { name: { $regex: '測試', $options: 'i' } },
          { code: { $regex: '測試', $options: 'i' } },
          { description: { $regex: '測試', $options: 'i' } }
        ]
      });
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getAccountById', () => {
    it('應該成功取得單一帳戶', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue(mockAccount);
      MockedAccount2.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await AccountService.getAccountById('account123', mockUserId);

      // Assert
      expect(MockedAccount2.findOne).toHaveBeenCalledWith({
        _id: 'account123',
        createdBy: mockUserId,
        isActive: true
      });
      expect(result).toEqual(mockAccount);
    });

    it('應該在帳戶不存在時拋出錯誤', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue(null);
      MockedAccount2.findOne.mockReturnValue({ lean: mockLean } as any);

      // Act & Assert
      await expect(
        AccountService.getAccountById('nonexistent', mockUserId)
      ).rejects.toThrow('帳戶不存在或無權限存取');
    });

    it('應該包含統計資料當 includeStatistics 為 true', async () => {
      // Arrange
      const mockLean = jest.fn().mockResolvedValue(mockAccount);
      MockedAccount2.findOne.mockReturnValue({ lean: mockLean } as any);
      
      const mockTransactionLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);
      
      const mockStatistics = {
        totalEntries: 0,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        lastTransactionDate: new Date()
      };
      MockedAccountManagementAdapter.calculateAccountStatistics.mockReturnValue(mockStatistics);

      // Act
      const result = await AccountService.getAccountById('account123', mockUserId, true);

      // Assert
      expect(result).toEqual({
        ...mockAccount,
        statistics: mockStatistics
      });
    });
  });

  describe('updateAccount', () => {
    const updateData = { name: '更新後的帳戶名稱' };

    it('應該成功更新帳戶', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(mockAccount);
      MockedAccount2.findByIdAndUpdate.mockResolvedValue({ ...mockAccount, ...updateData });

      // Act
      const result = await AccountService.updateAccount('account123', updateData, mockUserId);

      // Assert
      expect(MockedAccount2.findOne).toHaveBeenCalledWith({
        _id: 'account123',
        createdBy: mockUserId,
        isActive: true
      });
      expect(MockedAccount2.findByIdAndUpdate).toHaveBeenCalledWith(
        'account123',
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
      expect(result).toEqual({ ...mockAccount, ...updateData });
    });

    it('應該在帳戶不存在時拋出錯誤', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AccountService.updateAccount('nonexistent', updateData, mockUserId)
      ).rejects.toThrow('帳戶不存在或無權限存取');
    });

    it('應該檢查代碼唯一性當更新代碼時', async () => {
      // Arrange
      const updateDataWithCode = { code: 'NEW001' };
      MockedAccount2.findOne
        .mockResolvedValueOnce(mockAccount) // 第一次調用：找到要更新的帳戶
        .mockResolvedValueOnce(mockAccount); // 第二次調用：找到重複的代碼

      // Act & Assert
      await expect(
        AccountService.updateAccount('account123', updateDataWithCode, mockUserId)
      ).rejects.toThrow(`帳戶代碼 ${updateDataWithCode.code} 已存在`);
    });
  });

  describe('deleteAccount', () => {
    it('應該成功軟刪除帳戶', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(mockAccount);
      const mockTransactionLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);
      MockedAccountManagementAdapter.canDeleteAccount.mockReturnValue({
        canDelete: true,
        reason: '',
        usageCount: 0
      });
      MockedAccount2.findByIdAndUpdate.mockResolvedValue(mockAccount);

      // Act
      const result = await AccountService.deleteAccount('account123', mockUserId);

      // Assert
      expect(result).toBe(true);
      expect(MockedAccount2.findByIdAndUpdate).toHaveBeenCalledWith(
        'account123',
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('應該在帳戶不存在時拋出錯誤', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AccountService.deleteAccount('nonexistent', mockUserId)
      ).rejects.toThrow('帳戶不存在或無權限存取');
    });

    it('應該在無法刪除時拋出錯誤', async () => {
      // Arrange
      MockedAccount2.findOne.mockResolvedValue(mockAccount);
      const mockTransactionLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);
      MockedAccountManagementAdapter.canDeleteAccount.mockReturnValue({
        canDelete: false,
        reason: '帳戶有相關交易',
        usageCount: 1
      });

      // Act & Assert
      await expect(
        AccountService.deleteAccount('account123', mockUserId)
      ).rejects.toThrow('無法刪除帳戶：帳戶有相關交易');
    });
  });

  describe('getAccountTypeStatistics', () => {
    it('應該成功取得帳戶類型統計', async () => {
      // Arrange
      const mockAccounts = [
        { ...mockAccount, accountType: 'asset' },
        { ...mockAccount, _id: 'account456', accountType: 'liability' }
      ];
      const mockLean = jest.fn().mockResolvedValue(mockAccounts);
      MockedAccount2.find.mockReturnValue({ lean: mockLean } as any);

      // Act
      const result = await AccountService.getAccountTypeStatistics(mockUserId, mockOrganizationId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        accountType: 'asset',
        count: 1,
        accounts: [mockAccounts[0]]
      });
      expect(result[1]).toEqual({
        accountType: 'liability',
        count: 1,
        accounts: [mockAccounts[1]]
      });
    });
  });

  describe('createMultipleAccounts', () => {
    it('應該成功批量建立帳戶', async () => {
      // Arrange
      const accountsData = [mockAccountData, { ...mockAccountData, code: 'ACC002' }];
      MockedAccount2.findOne.mockResolvedValue(null);
      const mockSave = jest.fn()
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce({ ...mockAccount, code: 'ACC002' });
      MockedAccount2.prototype.save = mockSave;
      (MockedAccount2 as any).mockImplementation(() => ({
        save: mockSave
      }));

      // Act
      const result = await AccountService.createMultipleAccounts(accountsData, mockUserId, mockOrganizationId);

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('應該處理部分失敗的情況', async () => {
      // Arrange
      const accountsData = [mockAccountData, { ...mockAccountData, code: 'ACC002' }];
      MockedAccount2.findOne
        .mockResolvedValueOnce(null) // 第一個帳戶成功
        .mockResolvedValueOnce(mockAccount); // 第二個帳戶重複
      const mockSave = jest.fn().mockResolvedValue(mockAccount);
      MockedAccount2.prototype.save = mockSave;
      (MockedAccount2 as any).mockImplementation(() => ({
        save: mockSave
      }));

      // Act
      const result = await AccountService.createMultipleAccounts(accountsData, mockUserId, mockOrganizationId);

      // Assert
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('已存在');
    });
  });

  describe('validateAccountIntegrity', () => {
    it('應該成功驗證帳戶完整性', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockLean = jest.fn().mockResolvedValue(mockAccounts);
      MockedAccount2.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: mockLean
      } as any);

      const mockTransactionLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await AccountService.validateAccountIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('應該檢測到相容性問題', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockLean = jest.fn().mockResolvedValue(mockAccounts);
      MockedAccount2.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: mockLean
      } as any);

      const mockTransactionLean = jest.fn().mockResolvedValue([]);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: false,
          issues: ['資料格式不相容'],
          recommendations: ['建議更新資料格式']
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await AccountService.validateAccountIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe('資料格式不相容');
    });
  });
});