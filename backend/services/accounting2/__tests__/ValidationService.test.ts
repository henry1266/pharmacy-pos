import { ValidationService } from '../ValidationService';
import TransactionGroupWithEntries from '../../../models/TransactionGroupWithEntries';
import Account2 from '../../../models/Account2';
import { VersionCompatibilityManager } from '../../../../shared/services/compatibilityService';

// Mock dependencies
jest.mock('../../../models/TransactionGroupWithEntries');
jest.mock('../../../models/Account2');
jest.mock('../../../../shared/services/compatibilityService');

const MockedTransactionGroupWithEntries = TransactionGroupWithEntries as jest.Mocked<typeof TransactionGroupWithEntries>;
const MockedAccount2 = Account2 as jest.Mocked<typeof Account2>;
const MockedVersionCompatibilityManager = VersionCompatibilityManager as jest.Mocked<typeof VersionCompatibilityManager>;

describe('ValidationService', () => {
  const mockUserId = 'user123';
  const mockOrganizationId = 'org456';
  
  const mockAccount = {
    _id: 'account123',
    code: 'ACC001',
    name: '測試帳戶',
    accountType: 'asset',
    isActive: true,
    createdBy: mockUserId,
    organizationId: mockOrganizationId,
    balance: 1000,
    initialBalance: 0,
    currency: 'TWD',
    normalBalance: 'debit',
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTransaction = {
    _id: 'transaction123',
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
        accountId: 'account123',
        debitAmount: 1000,
        creditAmount: 0,
        sequence: 1,
        description: '借方分錄'
      },
      {
        _id: 'entry2',
        accountId: 'account123', // 改為使用相同的存在帳戶
        debitAmount: 0,
        creditAmount: 1000,
        sequence: 2,
        description: '貸方分錄'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  describe('validateSystemIntegrity', () => {
    it('應該成功驗證系統完整性', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockTransactions = [mockTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.summary.totalAccounts).toBe(1);
      expect(result.summary.totalTransactions).toBe(1);
      expect(result.summary.compatibilityScore).toBe(95);
      expect(result.issues.length).toBe(0);
    });

    it('應該檢測帳戶驗證問題', async () => {
      // Arrange
      const invalidAccount = {
        ...mockAccount,
        code: '', // 缺少代碼
        name: '', // 缺少名稱
        accountType: undefined // 缺少類型
      };
      const mockAccounts = [invalidAccount];
      const mockTransactions: any[] = [];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.type === 'account' && issue.severity === 'error')).toBe(true);
    });

    it('應該檢測交易驗證問題', async () => {
      // Arrange
      const invalidTransaction = {
        ...mockTransaction,
        groupNumber: '', // 缺少群組編號
        transactionDate: undefined, // 缺少日期
        entries: [] // 沒有分錄
      };
      const mockAccounts = [mockAccount];
      const mockTransactions = [invalidTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.type === 'transaction' && issue.severity === 'error')).toBe(true);
    });

    it('應該檢測借貸不平衡問題', async () => {
      // Arrange
      const unbalancedTransaction = {
        ...mockTransaction,
        entries: [
          {
            _id: 'entry1',
            accountId: 'account123',
            debitAmount: 1000,
            creditAmount: 0,
            sequence: 1,
            description: '借方分錄'
          },
          {
            _id: 'entry2',
            accountId: 'account456',
            debitAmount: 0,
            creditAmount: 500, // 不平衡
            sequence: 2,
            description: '貸方分錄'
          }
        ]
      };
      const mockAccounts = [mockAccount];
      const mockTransactions = [unbalancedTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => 
        issue.type === 'transaction' && 
        issue.description.includes('借貸不平衡')
      )).toBe(true);
    });

    it('應該檢測資料關聯性問題', async () => {
      // Arrange
      const transactionWithInvalidAccount = {
        ...mockTransaction,
        entries: [
          {
            _id: 'entry1',
            accountId: 'nonexistent', // 不存在的帳戶
            debitAmount: 1000,
            creditAmount: 0,
            sequence: 1,
            description: '借方分錄'
          }
        ]
      };
      const mockAccounts = [mockAccount];
      const mockTransactions = [transactionWithInvalidAccount];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => 
        issue.type === 'relationship' && 
        issue.description.includes('引用不存在的帳戶')
      )).toBe(true);
    });

    it('應該檢測孤立帳戶', async () => {
      // Arrange
      const unusedAccount = {
        ...mockAccount,
        _id: 'unused123',
        code: 'UNUSED001',
        name: '未使用帳戶'
      };
      const mockAccounts = [mockAccount, unusedAccount];
      const mockTransactions = [mockTransaction]; // 只使用了 mockAccount
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.issues.some(issue => 
        issue.type === 'relationship' && 
        issue.severity === 'info' &&
        issue.description.includes('未被任何交易使用')
      )).toBe(true);
    });

    it('應該檢測相容性問題', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockTransactions = [mockTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: false,
          issues: ['資料格式不相容'],
          recommendations: ['建議更新資料格式']
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 60
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.issues.some(issue => 
        issue.type === 'compatibility' && 
        issue.severity === 'warning' &&
        issue.description === '資料格式不相容'
      )).toBe(true);
      expect(result.issues.some(issue => 
        issue.type === 'compatibility' && 
        issue.severity === 'info' &&
        issue.description === '建議更新資料格式'
      )).toBe(true);
    });

    it('應該處理相容性檢查錯誤', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockTransactions = [mockTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockRejectedValue(new Error('相容性檢查失敗')),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 0
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.issues.some(issue => 
        issue.type === 'compatibility' && 
        issue.severity === 'error' &&
        issue.description.includes('相容性檢查失敗')
      )).toBe(true);
    });

    it('應該按嚴重程度排序問題', async () => {
      // Arrange
      const problemAccount = {
        ...mockAccount,
        code: '', // 錯誤
        balance: undefined // 警告
      };
      const mockAccounts = [problemAccount];
      const mockTransactions: any[] = [];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: ['建議改善'] // 資訊
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.validateSystemIntegrity(mockUserId, mockOrganizationId);

      // Assert
      expect(result.issues.length).toBeGreaterThan(0);
      // 檢查排序：error -> warning -> info
      let lastSeverityIndex = -1;
      const severityOrder = ['error', 'warning', 'info'];
      result.issues.forEach(issue => {
        const currentSeverityIndex = severityOrder.indexOf(issue.severity);
        expect(currentSeverityIndex).toBeGreaterThanOrEqual(lastSeverityIndex);
        lastSeverityIndex = currentSeverityIndex;
      });
    });
  });

  describe('generateValidationReport', () => {
    it('應該成功生成驗證報告', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockTransactions = [mockTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.generateValidationReport(mockUserId, mockOrganizationId);

      // Assert
      expect(result.reportId).toMatch(/^VAL-\d+-\w{6}$/);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.summary).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('應該生成相容性分數偏低的建議', async () => {
      // Arrange
      const mockAccounts = [mockAccount];
      const mockTransactions = [mockTransaction];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 70 // 低於80
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.generateValidationReport(mockUserId, mockOrganizationId);

      // Assert
      expect(result.recommendations).toContain('系統相容性分數偏低，建議進行資料格式統一');
    });

    it('應該生成錯誤數量的建議', async () => {
      // Arrange
      const invalidAccount = { ...mockAccount, code: '' };
      const mockAccounts = [invalidAccount];
      const mockTransactions: any[] = [];
      
      const mockAccountLean = jest.fn().mockResolvedValue(mockAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.generateValidationReport(mockUserId, mockOrganizationId);

      // Assert
      expect(result.recommendations.some(rec => rec.includes('個嚴重錯誤'))).toBe(true);
    });

    it('應該生成資料完整性的建議', async () => {
      // Arrange
      const incompleteAccounts = Array(10).fill(null).map((_, i) => ({
        ...mockAccount,
        _id: `account${i}`,
        code: i < 8 ? `ACC${i.toString().padStart(3, '0')}` : '' // 80%有效
      }));
      const mockTransactions: any[] = [];
      
      const mockAccountLean = jest.fn().mockResolvedValue(incompleteAccounts);
      const mockTransactionLean = jest.fn().mockResolvedValue(mockTransactions);
      
      MockedAccount2.find.mockReturnValue({ lean: mockAccountLean } as any);
      MockedTransactionGroupWithEntries.find.mockReturnValue({ lean: mockTransactionLean } as any);

      const mockCompatibilityManager = {
        checkSystemCompatibility: jest.fn().mockResolvedValue({
          isCompatible: true,
          issues: [],
          recommendations: []
        }),
        getCompatibilityStats: jest.fn().mockReturnValue({
          compatibilityScore: 95
        })
      };
      MockedVersionCompatibilityManager.getInstance.mockReturnValue(mockCompatibilityManager as any);

      // Act
      const result = await ValidationService.generateValidationReport(mockUserId, mockOrganizationId);

      // Assert
      expect(result.recommendations.some(rec => rec.includes('帳戶資料完整性不足'))).toBe(true);
    });
  });
});