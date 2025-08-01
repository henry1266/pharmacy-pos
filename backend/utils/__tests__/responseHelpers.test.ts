import { Response } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationErrorResponse,
  sendInvalidRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  handleObjectIdError,
  validateRequestId,
  safeToString,
  createUpdateFields
} from '../responseHelpers';

// Mock Express Response
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('responseHelpers', () => {
  describe('createSuccessResponse', () => {
    it('應該創建成功回應', () => {
      const message = '操作成功';
      const data = { id: 1, name: '測試' };

      const response = createSuccessResponse(message, data);

      expect(response.success).toBe(true);
      expect(response.message).toBe(message);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('應該處理空資料', () => {
      const message = '操作成功';
      const data = null;

      const response = createSuccessResponse(message, data);

      expect(response.success).toBe(true);
      expect(response.data).toBe(null);
    });

    it('應該處理複雜資料結構', () => {
      const message = '操作成功';
      const data = {
        users: [{ id: 1, name: '用戶1' }, { id: 2, name: '用戶2' }],
        pagination: { page: 1, limit: 10, total: 2 }
      };

      const response = createSuccessResponse(message, data);

      expect(response.data).toEqual(data);
    });
  });

  describe('createErrorResponse', () => {
    it('應該創建錯誤回應', () => {
      const message = '操作失敗';
      const error = '詳細錯誤信息';

      const response = createErrorResponse(message, error);

      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.error).toBe(error);
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('應該創建沒有錯誤詳情的錯誤回應', () => {
      const message = '操作失敗';

      const response = createErrorResponse(message);

      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.error).toBeUndefined();
    });

    it('應該處理空字串錯誤', () => {
      const message = '操作失敗';
      const error = '';

      const response = createErrorResponse(message, error);

      expect(response.error).toBe('');
    });
  });

  describe('sendSuccessResponse', () => {
    it('應該發送成功回應', () => {
      const res = mockResponse();
      const message = '操作成功';
      const data = { id: 1 };

      sendSuccessResponse(res, message, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message,
          data
        })
      );
    });

    it('應該使用自定義狀態碼', () => {
      const res = mockResponse();
      const message = '資源已創建';
      const data = { id: 1 };
      const statusCode = 201;

      sendSuccessResponse(res, message, data, statusCode);

      expect(res.status).toHaveBeenCalledWith(statusCode);
    });
  });

  describe('sendErrorResponse', () => {
    it('應該發送錯誤回應', () => {
      const res = mockResponse();
      const message = '操作失敗';
      const statusCode = 400;
      const error = '詳細錯誤';

      sendErrorResponse(res, message, statusCode, error);

      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message,
          error
        })
      );
    });

    it('應該發送沒有錯誤詳情的錯誤回應', () => {
      const res = mockResponse();
      const message = '操作失敗';
      const statusCode = 500;

      sendErrorResponse(res, message, statusCode);

      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message
        })
      );
    });
  });

  describe('sendValidationErrorResponse', () => {
    it('應該發送驗證錯誤回應', () => {
      const res = mockResponse();
      const errors = [
        { field: 'name', message: '名稱為必填' },
        { field: 'email', message: '電子郵件格式不正確' }
      ];

      sendValidationErrorResponse(res, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: JSON.stringify(errors)
        })
      );
    });
  });

  describe('sendInvalidRequestResponse', () => {
    it('應該發送無效請求回應', () => {
      const res = mockResponse();

      sendInvalidRequestResponse(res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('應該使用自定義錯誤訊息', () => {
      const res = mockResponse();
      const message = '自定義錯誤訊息';

      sendInvalidRequestResponse(res, message);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message
        })
      );
    });
  });

  describe('sendNotFoundResponse', () => {
    it('應該發送資源不存在回應', () => {
      const res = mockResponse();
      const message = '用戶不存在';

      sendNotFoundResponse(res, message);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message
        })
      );
    });
  });

  describe('sendServerErrorResponse', () => {
    it('應該發送伺服器錯誤回應', () => {
      const res = mockResponse();

      sendServerErrorResponse(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('應該記錄錯誤信息', () => {
      const res = mockResponse();
      const error = new Error('測試錯誤');

      sendServerErrorResponse(res, error);

      expect(console.error).toHaveBeenCalledWith(error.message);
    });

    it('應該處理字串錯誤', () => {
      const res = mockResponse();
      const error = '字串錯誤';

      sendServerErrorResponse(res, error);

      expect(console.error).toHaveBeenCalledWith(error);
    });
  });

  describe('handleObjectIdError', () => {
    it('應該處理 ObjectId 錯誤', () => {
      const res = mockResponse();
      const error = { kind: 'ObjectId' };
      const notFoundMessage = '資源不存在';

      handleObjectIdError(res, error, notFoundMessage);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: notFoundMessage
        })
      );
    });

    it('應該處理其他類型錯誤', () => {
      const res = mockResponse();
      const error = new Error('其他錯誤');
      const notFoundMessage = '資源不存在';

      handleObjectIdError(res, error, notFoundMessage);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateRequestId', () => {
    it('應該驗證有效的 ID', () => {
      const res = mockResponse();
      const id = '123456';

      const result = validateRequestId(res, id);

      expect(result).toBe(true);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('應該拒絕無效的 ID', () => {
      const res = mockResponse();
      const id = undefined;

      const result = validateRequestId(res, id);

      expect(result).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('應該使用自定義錯誤訊息', () => {
      const res = mockResponse();
      const id = undefined;
      const invalidMessage = '自定義無效 ID 訊息';

      const result = validateRequestId(res, id, invalidMessage);

      expect(result).toBe(false);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: invalidMessage
        })
      );
    });

    it('應該拒絕空字串 ID', () => {
      const res = mockResponse();
      const id = '';

      const result = validateRequestId(res, id);

      expect(result).toBe(false);
    });
  });

  describe('safeToString', () => {
    it('應該轉換字串', () => {
      expect(safeToString('test')).toBe('test');
    });

    it('應該轉換數字', () => {
      expect(safeToString(123)).toBe('123');
    });

    it('應該轉換布林值', () => {
      expect(safeToString(true)).toBe('true');
      expect(safeToString(false)).toBe('false');
    });

    it('應該處理 null 和 undefined', () => {
      expect(safeToString(null)).toBe('');
      expect(safeToString(undefined)).toBe('');
    });

    it('應該轉換物件', () => {
      const obj = { id: 1, name: '測試' };
      expect(safeToString(obj)).toBe('[object Object]');
    });

    it('應該轉換陣列', () => {
      const arr = [1, 2, 3];
      expect(safeToString(arr)).toBe('1,2,3');
    });

    it('應該處理有 toString 方法的物件', () => {
      const obj = {
        toString: () => 'custom string'
      };
      expect(safeToString(obj)).toBe('custom string');
    });
  });

  describe('createUpdateFields', () => {
    it('應該創建更新欄位物件', () => {
      const source = {
        name: '測試名稱',
        email: 'test@example.com',
        age: 25,
        active: true
      };

      const result = createUpdateFields(source);

      expect(result).toEqual({
        name: '測試名稱',
        email: 'test@example.com',
        age: '25',
        active: 'true'
      });
    });

    it('應該過濾 undefined 值', () => {
      const source = {
        name: '測試名稱',
        email: undefined,
        age: 25,
        active: undefined
      };

      const result = createUpdateFields(source);

      expect(result).toEqual({
        name: '測試名稱',
        age: '25'
      });
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('active');
    });

    it('應該使用欄位映射', () => {
      const source = {
        userName: '測試用戶',
        userEmail: 'test@example.com'
      };

      const fieldMappings = {
        userName: 'name',
        userEmail: 'email'
      };

      const result = createUpdateFields(source, fieldMappings);

      expect(result).toEqual({
        name: '測試用戶',
        email: 'test@example.com'
      });
    });

    it('應該處理空物件', () => {
      const source = {};

      const result = createUpdateFields(source);

      expect(result).toEqual({});
    });

    it('應該處理 null 和 false 值', () => {
      const source = {
        name: null,
        active: false,
        count: 0
      };

      const result = createUpdateFields(source);

      expect(result).toEqual({
        name: '',
        active: 'false',
        count: '0'
      });
    });

    it('應該處理複雜的欄位映射', () => {
      const source = {
        firstName: '張',
        lastName: '三',
        phoneNumber: '0912345678',
        isActive: true
      };

      const fieldMappings = {
        firstName: 'first_name',
        lastName: 'last_name',
        phoneNumber: 'phone',
        isActive: 'active'
      };

      const result = createUpdateFields(source, fieldMappings);

      expect(result).toEqual({
        first_name: '張',
        last_name: '三',
        phone: '0912345678',
        active: 'true'
      });
    });
  });

  describe('integration scenarios', () => {
    it('應該處理完整的成功流程', () => {
      const res = mockResponse();
      const data = { id: 1, name: '測試用戶' };

      sendSuccessResponse(res, '用戶創建成功', data, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '用戶創建成功',
          data,
          timestamp: expect.any(Date)
        })
      );
    });

    it('應該處理完整的錯誤流程', () => {
      const res = mockResponse();
      const error = new Error('數據庫連接失敗');

      sendServerErrorResponse(res, error);

      expect(console.error).toHaveBeenCalledWith(error.message);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          timestamp: expect.any(Date)
        })
      );
    });
  });
});