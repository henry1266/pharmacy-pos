import {
  validateEmployeeId,
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser,
  validateRole,
  handleError,
  createSuccessResponse
} from '../employeeAccountValidation';
import mongoose from 'mongoose';
import User from '../../models/User';
import Employee from '../../models/Employee';
import { Response } from 'express';

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/Employee');

const MockedUser = User as jest.Mocked<typeof User>;
const MockedEmployee = Employee as jest.Mocked<typeof Employee>;

// Mock Express Response
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock console.error
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('employeeAccountValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEmployeeId', () => {
    it('應該驗證有效的員工ID', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(validateEmployeeId(validId)).toBe(true);
    });

    it('應該拒絕無效的員工ID', () => {
      expect(validateEmployeeId('invalid-id')).toBe(false);
      expect(validateEmployeeId('')).toBe(false);
      expect(validateEmployeeId('123')).toBe(false);
    });

    it('應該處理特殊情況', () => {
      expect(validateEmployeeId('000000000000000000000000')).toBe(true); // Valid ObjectId format
      expect(validateEmployeeId('60d5ecb54b24a1234567890g')).toBe(false); // Invalid character
    });
  });

  describe('findEmployeeById', () => {
    it('應該找到存在的員工', async () => {
      const employeeId = new mongoose.Types.ObjectId().toString();
      const mockEmployee = { _id: employeeId, name: '測試員工' };
      
      MockedEmployee.findById.mockResolvedValue(mockEmployee);

      const result = await findEmployeeById(employeeId);
      
      expect(result).toEqual(mockEmployee);
      expect(MockedEmployee.findById).toHaveBeenCalledWith(employeeId);
    });

    it('應該在員工不存在時拋出錯誤', async () => {
      const employeeId = new mongoose.Types.ObjectId().toString();
      
      MockedEmployee.findById.mockResolvedValue(null);

      await expect(findEmployeeById(employeeId)).rejects.toThrow('找不到此員工資料');
    });

    it('應該在員工ID無效時拋出錯誤', async () => {
      await expect(findEmployeeById('invalid-id')).rejects.toThrow('無效的員工ID格式');
    });

    it('應該處理數據庫錯誤', async () => {
      const employeeId = new mongoose.Types.ObjectId().toString();
      
      MockedEmployee.findById.mockRejectedValue(new Error('Database error'));

      await expect(findEmployeeById(employeeId)).rejects.toThrow('Database error');
    });
  });

  describe('isUsernameExists', () => {
    it('應該檢測存在的用戶名', async () => {
      const mockUser = { _id: 'user1', username: 'testuser' };
      
      MockedUser.findOne.mockResolvedValue(mockUser);

      const result = await isUsernameExists('testuser');
      
      expect(result).toBe(true);
      expect(MockedUser.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('應該檢測不存在的用戶名', async () => {
      MockedUser.findOne.mockResolvedValue(null);

      const result = await isUsernameExists('nonexistent');
      
      expect(result).toBe(false);
    });

    it('應該排除指定的用戶ID', async () => {
      const excludeUserId = 'user1';
      
      MockedUser.findOne.mockResolvedValue(null);

      const result = await isUsernameExists('testuser', excludeUserId);
      
      expect(result).toBe(false);
      expect(MockedUser.findOne).toHaveBeenCalledWith({
        username: 'testuser',
        _id: { $ne: excludeUserId }
      });
    });

    it('應該處理數據庫錯誤', async () => {
      MockedUser.findOne.mockRejectedValue(new Error('Database error'));

      await expect(isUsernameExists('testuser')).rejects.toThrow('Database error');
    });
  });

  describe('isEmailExists', () => {
    it('應該檢測存在的電子郵件', async () => {
      const mockUser = { _id: 'user1', email: 'test@example.com' };
      
      MockedUser.findOne.mockResolvedValue(mockUser);

      const result = await isEmailExists('test@example.com');
      
      expect(result).toBe(true);
    });

    it('應該檢測不存在的電子郵件', async () => {
      MockedUser.findOne.mockResolvedValue(null);

      const result = await isEmailExists('nonexistent@example.com');
      
      expect(result).toBe(false);
    });

    it('應該處理空的電子郵件', async () => {
      expect(await isEmailExists('')).toBe(false);
      expect(await isEmailExists('   ')).toBe(false);
      expect(MockedUser.findOne).not.toHaveBeenCalled();
    });

    it('應該處理null電子郵件', async () => {
      expect(await isEmailExists(null as any)).toBe(false);
      expect(MockedUser.findOne).not.toHaveBeenCalled();
    });

    it('應該排除指定的用戶ID', async () => {
      const excludeUserId = 'user1';
      
      MockedUser.findOne.mockResolvedValue(null);

      await isEmailExists('test@example.com', excludeUserId);
      
      expect(MockedUser.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        _id: { $ne: excludeUserId }
      });
    });
  });

  describe('hasEmployeeAccount', () => {
    it('應該檢測員工有帳號', async () => {
      const mockEmployee = { userId: 'user1' };
      const mockUser = { _id: 'user1', username: 'testuser' };
      
      MockedUser.findById.mockResolvedValue(mockUser);

      const result = await hasEmployeeAccount(mockEmployee);
      
      expect(result).toBe(true);
      expect(MockedUser.findById).toHaveBeenCalledWith('user1');
    });

    it('應該檢測員工沒有帳號（無userId）', async () => {
      const mockEmployee = { userId: null };

      const result = await hasEmployeeAccount(mockEmployee);
      
      expect(result).toBe(false);
      expect(MockedUser.findById).not.toHaveBeenCalled();
    });

    it('應該檢測員工沒有帳號（用戶不存在）', async () => {
      const mockEmployee = { userId: 'user1' };
      
      MockedUser.findById.mockResolvedValue(null);

      const result = await hasEmployeeAccount(mockEmployee);
      
      expect(result).toBe(false);
    });

    it('應該處理數據庫錯誤', async () => {
      const mockEmployee = { userId: 'user1' };
      
      MockedUser.findById.mockRejectedValue(new Error('Database error'));

      await expect(hasEmployeeAccount(mockEmployee)).rejects.toThrow('Database error');
    });
  });

  describe('getEmployeeUser', () => {
    it('應該獲取員工用戶（不包含密碼）', async () => {
      const mockEmployee = { userId: 'user1' };
      const mockUser = { _id: 'user1', username: 'testuser' };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      
      MockedUser.findById.mockReturnValue({ select: mockSelect } as any);

      const result = await getEmployeeUser(mockEmployee);
      
      expect(result).toEqual(mockUser);
      expect(MockedUser.findById).toHaveBeenCalledWith('user1');
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('應該獲取員工用戶（包含密碼）', async () => {
      const mockEmployee = { userId: 'user1' };
      const mockUser = { _id: 'user1', username: 'testuser', password: 'hashed' };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      
      MockedUser.findById.mockReturnValue({ select: mockSelect } as any);

      const result = await getEmployeeUser(mockEmployee, true);
      
      expect(result).toEqual(mockUser);
      expect(mockSelect).toHaveBeenCalledWith('');
    });

    it('應該在員工沒有userId時拋出錯誤', async () => {
      const mockEmployee = { userId: null };

      await expect(getEmployeeUser(mockEmployee)).rejects.toThrow('此員工尚未建立帳號');
    });

    it('應該在用戶不存在時拋出錯誤', async () => {
      const mockEmployee = { userId: 'user1' };
      const mockSelect = jest.fn().mockResolvedValue(null);
      
      MockedUser.findById.mockReturnValue({ select: mockSelect } as any);

      await expect(getEmployeeUser(mockEmployee)).rejects.toThrow('找不到此員工的帳號資訊');
    });
  });

  describe('validateRole', () => {
    it('應該驗證有效的角色', () => {
      expect(validateRole('admin')).toBe(true);
      expect(validateRole('pharmacist')).toBe(true);
      expect(validateRole('staff')).toBe(true);
    });

    it('應該拒絕無效的角色', () => {
      expect(validateRole('invalid')).toBe(false);
      expect(validateRole('user')).toBe(false);
      expect(validateRole('')).toBe(false);
      expect(validateRole('ADMIN')).toBe(false); // Case sensitive
    });

    it('應該處理特殊情況', () => {
      expect(validateRole(null as any)).toBe(false);
      expect(validateRole(undefined as any)).toBe(false);
    });
  });

  describe('handleError', () => {
    it('應該處理伺服器錯誤（500）', () => {
      const res = mockResponse();
      const error = new Error('Test error');

      handleError(res, error, 500);

      expect(console.error).toHaveBeenCalledWith('Test error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          timestamp: expect.any(Date)
        })
      );
    });

    it('應該處理其他錯誤狀態碼', () => {
      const res = mockResponse();
      const error = new Error('Validation error');

      handleError(res, error, 400);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Validation error'
      });
    });

    it('應該使用默認狀態碼500', () => {
      const res = mockResponse();
      const error = new Error('Default error');

      handleError(res, error);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createSuccessResponse', () => {
    it('應該創建成功響應', () => {
      const message = '操作成功';
      const data = { id: 1, name: '測試' };

      const result = createSuccessResponse(message, data);

      expect(result).toEqual({
        msg: message,
        id: 1,
        name: '測試'
      });
    });

    it('應該創建沒有額外數據的成功響應', () => {
      const message = '操作成功';

      const result = createSuccessResponse(message);

      expect(result).toEqual({
        msg: message
      });
    });

    it('應該處理空對象數據', () => {
      const message = '操作成功';
      const data = {};

      const result = createSuccessResponse(message, data);

      expect(result).toEqual({
        msg: message
      });
    });

    it('應該處理複雜數據結構', () => {
      const message = '操作成功';
      const data = {
        user: { id: 1, name: '用戶' },
        permissions: ['read', 'write']
      };

      const result = createSuccessResponse(message, data);

      expect(result).toEqual({
        msg: message,
        user: { id: 1, name: '用戶' },
        permissions: ['read', 'write']
      });
    });
  });

  describe('integration scenarios', () => {
    it('應該處理完整的員工驗證流程', async () => {
      const employeeId = new mongoose.Types.ObjectId().toString();
      const mockEmployee = { 
        _id: employeeId, 
        name: '測試員工',
        userId: 'user1'
      };
      const mockUser = { 
        _id: 'user1', 
        username: 'testuser',
        email: 'test@example.com'
      };
      
      MockedEmployee.findById.mockResolvedValue(mockEmployee);
      MockedUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      } as any);

      // 驗證員工ID
      expect(validateEmployeeId(employeeId)).toBe(true);
      
      // 查找員工
      const employee = await findEmployeeById(employeeId);
      expect(employee).toEqual(mockEmployee);
      
      // 檢查是否有帳號
      const hasAccount = await hasEmployeeAccount(employee);
      expect(hasAccount).toBe(true);
      
      // 獲取用戶資訊
      const user = await getEmployeeUser(employee);
      expect(user).toEqual(mockUser);
    });

    it('應該處理用戶名和電子郵件唯一性檢查', async () => {
      // 檢查用戶名不存在
      MockedUser.findOne.mockResolvedValueOnce(null);
      expect(await isUsernameExists('newuser')).toBe(false);
      
      // 檢查電子郵件不存在
      MockedUser.findOne.mockResolvedValueOnce(null);
      expect(await isEmailExists('new@example.com')).toBe(false);
      
      // 檢查用戶名存在
      MockedUser.findOne.mockResolvedValueOnce({ username: 'existinguser' });
      expect(await isUsernameExists('existinguser')).toBe(true);
      
      // 檢查電子郵件存在
      MockedUser.findOne.mockResolvedValueOnce({ email: 'existing@example.com' });
      expect(await isEmailExists('existing@example.com')).toBe(true);
    });

    it('應該處理角色驗證和響應創建', () => {
      // 驗證有效角色
      expect(validateRole('admin')).toBe(true);
      
      // 創建成功響應
      const response = createSuccessResponse('角色驗證成功', { role: 'admin' });
      expect(response).toEqual({
        msg: '角色驗證成功',
        role: 'admin'
      });
    });
  });
});