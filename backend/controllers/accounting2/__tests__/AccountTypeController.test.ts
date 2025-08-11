import { Request, Response } from 'express';
import { AccountTypeController } from '../AccountTypeController';
import AccountType, { initializeSystemAccountTypes } from '../../../models/AccountType';

jest.mock('../../../models/AccountType');
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
  return res;
};

describe('AccountTypeController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccountTypes', () => {
    it('應該返回帳戶類型列表', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountTypes = [
        { _id: 'type-1', code: 'ASSET', name: '資產', label: '資產' },
        { _id: 'type-2', code: 'LIABILITY', name: '負債', label: '負債' }
      ];

      (AccountType.getByOrganization as jest.Mock).mockResolvedValue(mockAccountTypes);

      await AccountTypeController.getAccountTypes(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccountTypes
      });
      expect(AccountType.getByOrganization).toHaveBeenCalledWith('org-1');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        null
      );
      const res = mockResponse();

      await AccountTypeController.getAccountTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (AccountType.getByOrganization as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await AccountTypeController.getAccountTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '取得帳戶類型失敗'
      });
    });
  });

  describe('getAccountTypeById', () => {
    it('應該返回指定的帳戶類型', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET', 
        name: '資產', 
        label: '資產' 
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);

      await AccountTypeController.getAccountTypeById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccountType
      });
      expect(AccountType.findById).toHaveBeenCalledWith('type-1');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        null
      );
      const res = mockResponse();

      await AccountTypeController.getAccountTypeById(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在找不到帳戶類型時返回 404', async () => {
      const req = mockRequest(
        {},
        { id: 'non-existent-id' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountType.findById as jest.Mock).mockResolvedValue(null);

      await AccountTypeController.getAccountTypeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '找不到指定的帳戶類型'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (AccountType.findById as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await AccountTypeController.getAccountTypeById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '取得帳戶類型失敗'
      });
    });
  });

  describe('createAccountType', () => {
    it('應該建立一個新的帳戶類型', async () => {
      const req = mockRequest(
        {
          code: 'ASSET',
          name: '資產',
          label: '資產',
          description: '資產類型',
          codePrefix: 'A',
          normalBalance: 'debit',
          sortOrder: 1,
          organizationId: 'org-1'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        ...req.body,
        save: jest.fn().mockResolvedValue(true)
      };

      (AccountType.isCodeAvailable as jest.Mock).mockResolvedValue(true);
      (AccountType as any).mockImplementation(() => mockAccountType);

      await AccountTypeController.createAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccountType,
        message: '帳戶類型建立成功'
      });
      expect(mockAccountType.save).toHaveBeenCalled();
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {
          code: 'ASSET',
          name: '資產',
          label: '資產',
          description: '資產類型',
          codePrefix: 'A',
          normalBalance: 'debit'
        },
        {},
        {},
        null
      );
      const res = mockResponse();

      await AccountTypeController.createAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在缺少必要欄位時返回 400', async () => {
      const req = mockRequest(
        {
          // code is missing
          name: '資產',
          label: '資產',
          description: '資產類型',
          normalBalance: 'debit'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountTypeController.createAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要欄位'
      });
    });

    it('應該在代碼已存在時返回 400', async () => {
      const req = mockRequest(
        {
          code: 'ASSET',
          name: '資產',
          label: '資產',
          description: '資產類型',
          codePrefix: 'A',
          normalBalance: 'debit',
          organizationId: 'org-1'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountType.isCodeAvailable as jest.Mock).mockResolvedValue(false);

      await AccountTypeController.createAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '帳戶類型代碼已存在'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {
          code: 'ASSET',
          name: '資產',
          label: '資產',
          description: '資產類型',
          codePrefix: 'A',
          normalBalance: 'debit',
          organizationId: 'org-1'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (AccountType.isCodeAvailable as jest.Mock).mockResolvedValue(true);
      (AccountType as any).mockImplementation(() => {
        return {
          save: jest.fn().mockRejectedValue(new Error(errorMessage))
        };
      });

      await AccountTypeController.createAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '建立帳戶類型失敗'
      });
    });
  });

  describe('updateAccountType', () => {
    it('應該更新指定的帳戶類型', async () => {
      const req = mockRequest(
        {
          name: '更新的資產',
          label: '更新的資產',
          description: '更新的資產類型'
        },
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        label: '資產',
        description: '資產類型',
        codePrefix: 'A',
        normalBalance: 'debit',
        organizationId: 'org-1',
        canEdit: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);

      await AccountTypeController.updateAccountType(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          name: '更新的資產',
          label: '更新的資產',
          description: '更新的資產類型'
        }),
        message: '帳戶類型更新成功'
      });
      expect(mockAccountType.save).toHaveBeenCalled();
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        { name: '更新的資產' },
        { id: 'type-1' },
        {},
        null
      );
      const res = mockResponse();

      await AccountTypeController.updateAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在找不到帳戶類型時返回 404', async () => {
      const req = mockRequest(
        { name: '更新的資產' },
        { id: 'non-existent-id' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountType.findById as jest.Mock).mockResolvedValue(null);

      await AccountTypeController.updateAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '找不到指定的帳戶類型'
      });
    });

    it('應該在無法編輯系統預設類型時返回 403', async () => {
      const req = mockRequest(
        { name: '更新的資產' },
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        isSystem: true,
        canEdit: jest.fn().mockReturnValue(false)
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);

      await AccountTypeController.updateAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '系統預設類型無法編輯'
      });
    });

    it('應該在代碼已存在時返回 400', async () => {
      const req = mockRequest(
        {
          code: 'NEW_CODE',
          name: '更新的資產'
        },
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        organizationId: 'org-1',
        canEdit: jest.fn().mockReturnValue(true)
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);
      (AccountType.isCodeAvailable as jest.Mock).mockResolvedValue(false);

      await AccountTypeController.updateAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '帳戶類型代碼已存在'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        { name: '更新的資產' },
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        canEdit: jest.fn().mockReturnValue(true),
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);

      await AccountTypeController.updateAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '更新帳戶類型失敗'
      });
    });
  });

  describe('deleteAccountType', () => {
    it('應該刪除指定的帳戶類型', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        canDelete: jest.fn().mockReturnValue(true)
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);
      (AccountType.findByIdAndDelete as jest.Mock).mockResolvedValue(true);

      await AccountTypeController.deleteAccountType(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '帳戶類型刪除成功'
      });
      expect(AccountType.findByIdAndDelete).toHaveBeenCalledWith('type-1');
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        null
      );
      const res = mockResponse();

      await AccountTypeController.deleteAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在找不到帳戶類型時返回 404', async () => {
      const req = mockRequest(
        {},
        { id: 'non-existent-id' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountType.findById as jest.Mock).mockResolvedValue(null);

      await AccountTypeController.deleteAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '找不到指定的帳戶類型'
      });
    });

    it('應該在無法刪除系統預設類型時返回 403', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        isSystem: true,
        canDelete: jest.fn().mockReturnValue(false)
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);

      await AccountTypeController.deleteAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '系統預設類型無法刪除'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {},
        { id: 'type-1' },
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';
      const mockAccountType = { 
        _id: 'type-1', 
        code: 'ASSET',
        name: '資產',
        canDelete: jest.fn().mockReturnValue(true)
      };

      (AccountType.findById as jest.Mock).mockResolvedValue(mockAccountType);
      (AccountType.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await AccountTypeController.deleteAccountType(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '刪除帳戶類型失敗'
      });
    });
  });

  describe('reorderAccountTypes', () => {
    it('應該重新排序帳戶類型', async () => {
      const req = mockRequest(
        {
          items: [
            { id: 'type-1', sortOrder: 1 },
            { id: 'type-2', sortOrder: 2 }
          ]
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (AccountType.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      await AccountTypeController.reorderAccountTypes(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '排序更新成功'
      });
      expect(AccountType.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        { items: [] },
        {},
        {},
        null
      );
      const res = mockResponse();

      await AccountTypeController.reorderAccountTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在提供無效的排序資料時返回 400', async () => {
      const req = mockRequest(
        { items: 'not-an-array' },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await AccountTypeController.reorderAccountTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '無效的排序資料'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {
          items: [
            { id: 'type-1', sortOrder: 1 },
            { id: 'type-2', sortOrder: 2 }
          ]
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (AccountType.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await AccountTypeController.reorderAccountTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '重新排序失敗'
      });
    });
  });

  describe('initializeSystemTypes', () => {
    it('應該初始化系統預設類型', async () => {
      const req = mockRequest(
        {},
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      (initializeSystemAccountTypes as jest.Mock).mockResolvedValue(true);

      await AccountTypeController.initializeSystemTypes(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '系統預設類型初始化完成'
      });
      expect(initializeSystemAccountTypes).toHaveBeenCalled();
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        {},
        null
      );
      const res = mockResponse();

      await AccountTypeController.initializeSystemTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未授權的請求'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {},
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (initializeSystemAccountTypes as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await AccountTypeController.initializeSystemTypes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '初始化系統類型失敗'
      });
    });
  });
});