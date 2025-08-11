import { Request, Response } from 'express';
import { AccountController } from '../AccountController';
import { AccountService } from '../../../services/accounting2/AccountService';
import { ValidationService } from '../../../services/accounting2/ValidationService';

jest.mock('../../../services/accounting2/AccountService');
jest.mock('../../../services/accounting2/ValidationService');
jest.mock('../../../utils/logger');

const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user: any = null) => {
  const req = {} as Request;
  req.body = body;
  req.params = params;
  req.query = query;
  if (user) {
    (req as any).user = user;
  }
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.setHeader = jest.fn().mockReturnThis();
  return res;
};

describe('AccountController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('應該建立一個新的帳戶', async () => {
      const req = mockRequest(
        {
          code: 'ACC-001',
          name: '測試帳戶',
          accountType: 'asset'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccount = { 
        _id: 'acc-1', 
        code: 'ACC-001', 
        name: '測試帳戶', 
        accountType: 'asset' 
      };

      (AccountService.createAccount as jest.Mock).mockResolvedValue(mockAccount);

      await AccountController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '帳戶建立成功',
        data: mockAccount
      });
      expect(AccountService.createAccount).toHaveBeenCalledWith(req.body, 'user-123');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {
          code: 'ACC-001',
          name: '測試帳戶',
          accountType: 'asset'
        },
        {},
        {},
        null
      );
      const res = mockResponse();

      await AccountController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在缺少必要欄位時返回 400', async () => {
      const req = mockRequest(
        {
          // code is missing
          name: '測試帳戶',
          accountType: 'asset'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要欄位：code, name, accountType'
      });
    });

    it('應該在服務層拋出錯誤時返回 500', async () => {
      const req = mockRequest(
        {
          code: 'ACC-001',
          name: '測試帳戶',
          accountType: 'asset'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '帳戶代碼 ACC-001 已存在';

      (AccountService.createAccount as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await AccountController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('updateAccount', () => {
    it('應該更新指定的帳戶', async () => {
      const req = mockRequest(
        { name: '更新的帳戶名稱' },
        { id: 'acc-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccount = { 
        _id: 'acc-1', 
        code: 'ACC-001', 
        name: '更新的帳戶名稱', 
        accountType: 'asset' 
      };

      (AccountService.updateAccount as jest.Mock).mockResolvedValue(mockAccount);

      await AccountController.updateAccount(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '帳戶更新成功',
        data: mockAccount
      });
      expect(AccountService.updateAccount).toHaveBeenCalledWith('acc-1', { name: '更新的帳戶名稱' }, 'user-123');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        { name: '更新的帳戶名稱' },
        { id: 'acc-1' },
        {},
        null
      );
      const res = mockResponse();

      await AccountController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在缺少帳戶 ID 時返回 400', async () => {
      const req = mockRequest(
        { name: '更新的帳戶名稱' },
        {}, // id is missing
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少帳戶ID'
      });
    });

    it('應該在找不到帳戶時返回 404', async () => {
      const req = mockRequest(
        { name: '更新的帳戶名稱' },
        { id: 'non-existent-id' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountService.updateAccount as jest.Mock).mockResolvedValue(null);

      await AccountController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '帳戶不存在或無權限修改'
      });
    });
  });

  describe('deleteAccount', () => {
    it('應該刪除指定的帳戶', async () => {
      const req = mockRequest(
        {},
        { id: 'acc-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountService.deleteAccount as jest.Mock).mockResolvedValue(true);

      await AccountController.deleteAccount(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '帳戶刪除成功'
      });
      expect(AccountService.deleteAccount).toHaveBeenCalledWith('acc-1', 'user-123');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        { id: 'acc-1' },
        {},
        null
      );
      const res = mockResponse();

      await AccountController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在缺少帳戶 ID 時返回 400', async () => {
      const req = mockRequest(
        {},
        {}, // id is missing
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少帳戶ID'
      });
    });

    it('應該在找不到帳戶時返回 404', async () => {
      const req = mockRequest(
        {},
        { id: 'non-existent-id' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountService.deleteAccount as jest.Mock).mockResolvedValue(false);

      await AccountController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '帳戶不存在或無權限刪除'
      });
    });
  });

  describe('getAccountById', () => {
    it('應該返回指定的帳戶', async () => {
      const req = mockRequest(
        {},
        { id: 'acc-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccount = { 
        _id: 'acc-1', 
        code: 'ACC-001', 
        name: '測試帳戶', 
        accountType: 'asset' 
      };

      (AccountService.getAccountById as jest.Mock).mockResolvedValue(mockAccount);

      await AccountController.getAccountById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount
      });
      expect(AccountService.getAccountById).toHaveBeenCalledWith('acc-1', 'user-123');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        { id: 'acc-1' },
        {},
        null
      );
      const res = mockResponse();

      await AccountController.getAccountById(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在缺少帳戶 ID 時返回 400', async () => {
      const req = mockRequest(
        {},
        {}, // id is missing
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountController.getAccountById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少帳戶ID'
      });
    });

    it('應該在找不到帳戶時返回 404', async () => {
      const req = mockRequest(
        {},
        { id: 'non-existent-id' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountService.getAccountById as jest.Mock).mockResolvedValue(null);

      await AccountController.getAccountById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '帳戶不存在或無權限查看'
      });
    });
  });

  describe('getAccountsByUser', () => {
    it('應該返回使用者相關的帳戶列表', async () => {
      const req = mockRequest(
        {},
        {},
        { page: '1', limit: '10' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccounts = [
        { _id: 'acc-1', code: 'ACC-001', name: '測試帳戶1', accountType: 'asset' },
        { _id: 'acc-2', code: 'ACC-002', name: '測試帳戶2', accountType: 'liability' }
      ];

      (AccountService.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

      await AccountController.getAccountsByUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      });
      expect(AccountService.getAccounts).toHaveBeenCalledWith('user-123', undefined, expect.any(Object));
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        { page: '1', limit: '10' },
        null
      );
      const res = mockResponse();

      await AccountController.getAccountsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該處理分頁和篩選參數', async () => {
      const req = mockRequest(
        {},
        {},
        { 
          page: '2', 
          limit: '5', 
          accountType: 'asset', 
          isActive: 'true',
          sortBy: 'name',
          sortOrder: 'desc'
        },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccounts = [
        { _id: 'acc-1', code: 'ACC-001', name: '測試帳戶1', accountType: 'asset' },
        { _id: 'acc-2', code: 'ACC-002', name: '測試帳戶2', accountType: 'asset' }
      ];

      (AccountService.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

      await AccountController.getAccountsByUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        pagination: {
          page: 2,
          limit: 5,
          total: 2,
          totalPages: 1
        }
      });
      expect(AccountService.getAccounts).toHaveBeenCalledWith(
        'user-123', 
        undefined, 
        expect.objectContaining({
          accountType: 'asset',
          isActive: true
        })
      );
    });
  });

  describe('getAccountStatistics', () => {
    it('應該返回帳戶統計資料', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockStatistics = [
        { accountType: 'asset', count: 5, accounts: [] },
        { accountType: 'liability', count: 3, accounts: [] }
      ];

      (AccountService.getAccountTypeStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      await AccountController.getAccountStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics
      });
      expect(AccountService.getAccountTypeStatistics).toHaveBeenCalledWith('user-123', 'org-1');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        null
      );
      const res = mockResponse();

      await AccountController.getAccountStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在找不到統計資料時返回 404', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountService.getAccountTypeStatistics as jest.Mock).mockResolvedValue(null);

      await AccountController.getAccountStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '帳戶不存在或無權限查看'
      });
    });
  });

  describe('validateAccounts', () => {
    it('應該驗證帳戶完整性', async () => {
      const req = mockRequest(
        { organizationId: 'org-1' },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockValidation = {
        isValid: true,
        issues: []
      };

      (ValidationService.validateSystemIntegrity as jest.Mock).mockResolvedValue(mockValidation);

      await AccountController.validateAccounts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockValidation
      });
      expect(ValidationService.validateSystemIntegrity).toHaveBeenCalledWith('user-123', 'org-1');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        { organizationId: 'org-1' },
        {},
        {},
        null
      );
      const res = mockResponse();

      await AccountController.validateAccounts(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });
  });

  describe('exportAccounts', () => {
    it('應該以 JSON 格式匯出帳戶資料', async () => {
      const req = mockRequest(
        {},
        {},
        { format: 'json', organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccounts = [
        { _id: 'acc-1', code: 'ACC-001', name: '測試帳戶1', accountType: 'asset' },
        { _id: 'acc-2', code: 'ACC-002', name: '測試帳戶2', accountType: 'liability' }
      ];

      (AccountService.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

      await AccountController.exportAccounts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccounts,
        exportedAt: expect.any(Date),
        totalRecords: 2
      });
    });

    it('應該以 CSV 格式匯出帳戶資料', async () => {
      const req = mockRequest(
        {},
        {},
        { format: 'csv', organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccounts = [
        { 
          _id: 'acc-1', 
          code: 'ACC-001', 
          name: '測試帳戶1', 
          accountType: 'asset',
          balance: 1000,
          currency: 'TWD',
          description: '測試描述',
          createdAt: new Date()
        }
      ];

      (AccountService.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

      await AccountController.exportAccounts(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=accounts.csv');
      expect(res.send).toHaveBeenCalled();
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        { format: 'json', organizationId: 'org-1' },
        null
      );
      const res = mockResponse();

      await AccountController.exportAccounts(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });
  });

  describe('batchCreateAccounts', () => {
    it('應該批次建立帳戶', async () => {
      const accounts = [
        { code: 'ACC-001', name: '測試帳戶1', accountType: 'asset' },
        { code: 'ACC-002', name: '測試帳戶2', accountType: 'liability' }
      ];
      const req = mockRequest(
        { accounts },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockResults = [
        { index: 0, success: true, data: { _id: 'acc-1', ...accounts[0] } },
        { index: 1, success: true, data: { _id: 'acc-2', ...accounts[1] } }
      ];
      const mockErrors: any[] = [];

      // 模擬每個帳戶的創建
      (AccountService.createAccount as jest.Mock).mockImplementation(async (accountData) => {
        const index = accounts.findIndex(a => a.code === accountData.code);
        return { _id: `acc-${index + 1}`, ...accountData };
      });

      await AccountController.batchCreateAccounts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('批次處理完成'),
        data: {
          successful: expect.any(Array),
          failed: expect.any(Array),
          summary: {
            total: 2,
            successful: 2,
            failed: 0
          }
        }
      });
      expect(AccountService.createAccount).toHaveBeenCalledTimes(2);
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        { accounts: [] },
        {},
        {},
        null
      );
      const res = mockResponse();

      await AccountController.batchCreateAccounts(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在未提供有效的帳戶陣列時返回 400', async () => {
      const req = mockRequest(
        { accounts: 'not-an-array' },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountController.batchCreateAccounts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '請提供有效的帳戶陣列'
      });
    });

    it('應該處理部分帳戶創建失敗的情況', async () => {
      const accounts = [
        { code: 'ACC-001', name: '測試帳戶1', accountType: 'asset' },
        { code: 'ACC-001', name: '重複代碼', accountType: 'liability' } // 重複的代碼
      ];
      const req = mockRequest(
        { accounts },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      // 模擬第一個帳戶創建成功，第二個失敗
      (AccountService.createAccount as jest.Mock).mockImplementation(async (accountData, userId) => {
        if (accountData.code === 'ACC-001' && accountData.name === '測試帳戶1') {
          return { _id: 'acc-1', ...accountData };
        } else {
          throw new Error('帳戶代碼 ACC-001 已存在');
        }
      });

      await AccountController.batchCreateAccounts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('批次處理完成'),
        data: {
          successful: expect.arrayContaining([expect.objectContaining({ success: true })]),
          failed: expect.arrayContaining([expect.objectContaining({ success: false })]),
          summary: {
            total: 2,
            successful: 1,
            failed: 1
          }
        }
      });
    });
  });
});