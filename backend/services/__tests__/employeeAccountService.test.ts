import {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
} from '../employeeAccountService';
import User from '../../models/User';
// import Employee from '../../models/Employee'; // 移除未使用的導入
import { hashPassword } from '../../utils/passwordUtils';
import {
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser
} from '../../utils/employeeAccountValidation';
import mongoose from 'mongoose';

// Mock 所有依賴
jest.mock('../../models/User');
jest.mock('../../models/Employee');
jest.mock('../../utils/passwordUtils');
jest.mock('../../utils/employeeAccountValidation');

const MockedUser = User as any;
// const MockedEmployee = Employee as any; // 移除未使用的變數
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedFindEmployeeById = findEmployeeById as jest.MockedFunction<typeof findEmployeeById>;
const mockedIsUsernameExists = isUsernameExists as jest.MockedFunction<typeof isUsernameExists>;
const mockedIsEmailExists = isEmailExists as jest.MockedFunction<typeof isEmailExists>;
const mockedHasEmployeeAccount = hasEmployeeAccount as jest.MockedFunction<typeof hasEmployeeAccount>;
const mockedGetEmployeeUser = getEmployeeUser as jest.MockedFunction<typeof getEmployeeUser>;

describe('employeeAccountService', () => {
  let mockEmployee: any;
  let mockUser: any;
  let mockAccountData: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 設置 mock 員工數據
    mockEmployee = {
      id: new mongoose.Types.ObjectId().toString(),
      _id: new mongoose.Types.ObjectId(),
      name: '張三',
      phone: '0912345678',
      position: '藥師',
      hireDate: new Date(),
      userId: null,
      save: jest.fn().mockResolvedValue(true)
    };

    // 設置 mock 用戶數據
    mockUser = {
      id: new mongoose.Types.ObjectId().toString(),
      _id: new mongoose.Types.ObjectId(),
      name: '張三',
      username: 'zhang_san',
      email: 'zhang@example.com',
      password: 'hashedPassword123',
      role: 'staff',
      save: jest.fn().mockResolvedValue(true)
    };

    // 設置 mock 帳號數據
    mockAccountData = {
      employeeId: mockEmployee.id,
      username: 'zhang_san',
      email: 'zhang@example.com',
      password: 'password123',
      role: 'staff'
    };
  });

  describe('createEmployeeAccount', () => {
    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashedPassword123' as any);
      
      // Mock User constructor and save
      (MockedUser as jest.MockedClass<typeof User>).mockImplementation(() => ({
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser)
      }) as any);
    });

    test('應該成功創建員工帳號', async () => {
      const result = await createEmployeeAccount(mockAccountData);

      expect(mockedFindEmployeeById).toHaveBeenCalledWith(mockAccountData.employeeId);
      expect(mockedIsUsernameExists).toHaveBeenCalledWith(mockAccountData.username);
      expect(mockedIsEmailExists).toHaveBeenCalledWith(mockAccountData.email);
      expect(mockedHasEmployeeAccount).toHaveBeenCalledWith(mockEmployee);
      expect(mockedHashPassword).toHaveBeenCalledWith(mockAccountData.password);

      expect(result).toEqual({
        employee: {
          id: mockEmployee.id,
          name: mockEmployee.name
        },
        user: {
          id: mockUser.id,
          name: mockUser.name,
          username: mockUser.username,
          role: mockUser.role
        }
      });

      expect(mockEmployee.save).toHaveBeenCalled();
    });

    test('應該在用戶名已存在時拋出錯誤', async () => {
      mockedIsUsernameExists.mockResolvedValue(true);

      await expect(createEmployeeAccount(mockAccountData))
        .rejects.toThrow('此用戶名已被使用');

      expect(mockedFindEmployeeById).toHaveBeenCalled();
      expect(mockedIsUsernameExists).toHaveBeenCalled();
      expect(MockedUser).not.toHaveBeenCalled();
    });

    test('應該在員工已有帳號時拋出錯誤', async () => {
      mockedHasEmployeeAccount.mockResolvedValue(true);

      await expect(createEmployeeAccount(mockAccountData))
        .rejects.toThrow('此員工已有帳號');

      expect(mockedHasEmployeeAccount).toHaveBeenCalledWith(mockEmployee);
      expect(MockedUser).not.toHaveBeenCalled();
    });

    test('應該在電子郵件已存在時拋出錯誤', async () => {
      mockedIsEmailExists.mockResolvedValue(true);

      await expect(createEmployeeAccount(mockAccountData))
        .rejects.toThrow('此電子郵件已被使用');

      expect(mockedIsEmailExists).toHaveBeenCalledWith(mockAccountData.email);
      expect(MockedUser).not.toHaveBeenCalled();
    });

    test('應該能夠創建沒有電子郵件的帳號', async () => {
      const accountDataWithoutEmail = { ...mockAccountData };
      delete accountDataWithoutEmail.email;

      const result = await createEmployeeAccount(accountDataWithoutEmail);

      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.user.username).toBe(mockAccountData.username);
    });

    test('應該能夠創建空電子郵件的帳號', async () => {
      const accountDataWithEmptyEmail = { ...mockAccountData, email: '' };

      const result = await createEmployeeAccount(accountDataWithEmptyEmail);

      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('應該在密碼加密失敗時拋出錯誤', async () => {
      mockedHashPassword.mockRejectedValue(new Error('密碼加密失敗'));

      await expect(createEmployeeAccount(mockAccountData))
        .rejects.toThrow('密碼加密失敗');
    });
  });

  describe('getEmployeeAccount', () => {
    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedGetEmployeeUser.mockResolvedValue(mockUser);
    });

    test('應該成功獲取員工帳號信息', async () => {
      const result = await getEmployeeAccount(mockEmployee.id);

      expect(mockedFindEmployeeById).toHaveBeenCalledWith(mockEmployee.id);
      expect(mockedGetEmployeeUser).toHaveBeenCalledWith(mockEmployee, false);
      expect(result).toEqual(mockUser);
    });

    test('應該在員工不存在時拋出錯誤', async () => {
      mockedFindEmployeeById.mockRejectedValue(new Error('找不到此員工資料'));

      await expect(getEmployeeAccount('invalid-id'))
        .rejects.toThrow('找不到此員工資料');
    });

    test('應該在員工沒有帳號時拋出錯誤', async () => {
      mockedGetEmployeeUser.mockRejectedValue(new Error('此員工尚未建立帳號'));

      await expect(getEmployeeAccount(mockEmployee.id))
        .rejects.toThrow('此員工尚未建立帳號');
    });
  });

  describe('updateEmployeeAccount', () => {
    let mockUpdatedUser: any;

    beforeEach(() => {
      mockUpdatedUser = { ...mockUser, username: 'new_username' };
      
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedGetEmployeeUser.mockResolvedValue(mockUser);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('newHashedPassword' as any);
      
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });
    });

    test('應該成功更新員工帳號', async () => {
      const updateData = {
        username: 'new_username',
        email: 'new@example.com',
        password: 'newPassword123',
        role: 'pharmacist'
      };

      const result = await updateEmployeeAccount(mockEmployee.id, updateData);

      expect(mockedFindEmployeeById).toHaveBeenCalledWith(mockEmployee.id);
      expect(mockedGetEmployeeUser).toHaveBeenCalledWith(mockEmployee, true);
      expect(mockedIsUsernameExists).toHaveBeenCalledWith(updateData.username, mockUser.id);
      expect(mockedIsEmailExists).toHaveBeenCalledWith(updateData.email, mockUser.id);
      expect(mockedHashPassword).toHaveBeenCalledWith(updateData.password);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    test('應該能夠只更新部分字段', async () => {
      const updateData = { username: 'new_username' };

      const result = await updateEmployeeAccount(mockEmployee.id, updateData);

      expect(mockedIsUsernameExists).toHaveBeenCalledWith(updateData.username, mockUser.id);
      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    test('應該在新用戶名已存在時拋出錯誤', async () => {
      mockedIsUsernameExists.mockResolvedValue(true);
      const updateData = { username: 'existing_username' };

      await expect(updateEmployeeAccount(mockEmployee.id, updateData))
        .rejects.toThrow('此用戶名已被使用');
    });

    test('應該在新電子郵件已存在時拋出錯誤', async () => {
      mockedIsEmailExists.mockResolvedValue(true);
      const updateData = { email: 'existing@example.com' };

      await expect(updateEmployeeAccount(mockEmployee.id, updateData))
        .rejects.toThrow('此電子郵件已被使用');
    });

    test('應該能夠清空電子郵件', async () => {
      const updateData = { email: '' };
      MockedUser.updateOne = jest.fn().mockResolvedValue({});

      const result = await updateEmployeeAccount(mockEmployee.id, updateData);

      expect(result).toEqual(mockUpdatedUser);
    });

    test('應該在相同用戶名時不進行更新', async () => {
      const updateData = { username: mockUser.username };

      const result = await updateEmployeeAccount(mockEmployee.id, updateData);

      expect(mockedIsUsernameExists).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    test('應該在相同電子郵件時不進行更新', async () => {
      const updateData = { email: mockUser.email };

      const result = await updateEmployeeAccount(mockEmployee.id, updateData);

      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('deleteEmployeeAccount', () => {
    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedGetEmployeeUser.mockResolvedValue(mockUser);
      MockedUser.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);
    });

    test('應該成功刪除員工帳號', async () => {
      await deleteEmployeeAccount(mockEmployee.id);

      expect(mockedFindEmployeeById).toHaveBeenCalledWith(mockEmployee.id);
      expect(mockedGetEmployeeUser).toHaveBeenCalledWith(mockEmployee, false);
      expect(MockedUser.findByIdAndDelete).toHaveBeenCalledWith(mockUser.id);
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(mockEmployee.userId).toBeNull();
    });

    test('應該在員工不存在時拋出錯誤', async () => {
      mockedFindEmployeeById.mockRejectedValue(new Error('找不到此員工資料'));

      await expect(deleteEmployeeAccount('invalid-id'))
        .rejects.toThrow('找不到此員工資料');

      expect(MockedUser.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('應該在員工沒有帳號時拋出錯誤', async () => {
      mockedGetEmployeeUser.mockRejectedValue(new Error('此員工尚未建立帳號'));

      await expect(deleteEmployeeAccount(mockEmployee.id))
        .rejects.toThrow('此員工尚未建立帳號');

      expect(MockedUser.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('unbindEmployeeAccount', () => {
    beforeEach(() => {
      mockEmployee.userId = mockUser._id;
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      MockedUser.findById = jest.fn().mockResolvedValue(mockUser);
    });

    test('應該成功解除員工帳號綁定', async () => {
      const result = await unbindEmployeeAccount(mockEmployee.id);

      expect(mockedFindEmployeeById).toHaveBeenCalledWith(mockEmployee.id);
      expect(MockedUser.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(mockEmployee.userId).toBeNull();

      expect(result).toEqual({
        employee: {
          id: mockEmployee.id,
          name: mockEmployee.name
        },
        user: {
          id: mockUser.id,
          name: mockUser.name,
          username: mockUser.username
        }
      });
    });

    test('應該在員工沒有綁定帳號時拋出錯誤', async () => {
      mockEmployee.userId = null;

      await expect(unbindEmployeeAccount(mockEmployee.id))
        .rejects.toThrow('此員工尚未綁定帳號');

      expect(MockedUser.findById).not.toHaveBeenCalled();
      expect(mockEmployee.save).not.toHaveBeenCalled();
    });

    test('應該在員工不存在時拋出錯誤', async () => {
      mockedFindEmployeeById.mockRejectedValue(new Error('找不到此員工資料'));

      await expect(unbindEmployeeAccount('invalid-id'))
        .rejects.toThrow('找不到此員工資料');
    });

    test('應該能夠處理用戶不存在的情況', async () => {
      MockedUser.findById = jest.fn().mockResolvedValue(null);

      const result = await unbindEmployeeAccount(mockEmployee.id);

      expect(result).toEqual({
        employee: {
          id: mockEmployee.id,
          name: mockEmployee.name
        }
      });
      expect(mockEmployee.userId).toBeNull();
      expect(mockEmployee.save).toHaveBeenCalled();
    });
  });

  describe('邊界條件和錯誤處理', () => {
    test('createEmployeeAccount 應該處理密碼加密返回錯誤的情況', async () => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockRejectedValue(new Error('密碼太弱'));

      await expect(createEmployeeAccount(mockAccountData))
        .rejects.toThrow();
    });

    test('updateEmployeeAccount 應該處理用戶保存失敗的情況', async () => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedGetEmployeeUser.mockResolvedValue(mockUser);
      mockUser.save.mockRejectedValue(new Error('保存失敗'));

      const updateData = { username: 'new_username' };

      await expect(updateEmployeeAccount(mockEmployee.id, updateData))
        .rejects.toThrow('保存失敗');
    });

    test('deleteEmployeeAccount 應該處理用戶刪除失敗的情況', async () => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedGetEmployeeUser.mockResolvedValue(mockUser);
      MockedUser.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('刪除失敗'));

      await expect(deleteEmployeeAccount(mockEmployee.id))
        .rejects.toThrow('刪除失敗');
    });

    test('unbindEmployeeAccount 應該處理員工保存失敗的情況', async () => {
      mockEmployee.userId = mockUser._id;
      mockEmployee.save.mockRejectedValue(new Error('保存失敗'));
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      MockedUser.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(unbindEmployeeAccount(mockEmployee.id))
        .rejects.toThrow('保存失敗');
    });
  });

  describe('數據驗證', () => {
    test('createEmployeeAccount 應該正確設置用戶數據', async () => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashedPassword123' as any);

      let capturedUserData: any;
      (MockedUser as jest.MockedClass<typeof User>).mockImplementation((userData: any) => {
        capturedUserData = userData;
        return {
          ...mockUser,
          save: jest.fn().mockResolvedValue(mockUser)
        } as any;
      });

      await createEmployeeAccount(mockAccountData);

      expect(capturedUserData).toEqual({
        name: mockEmployee.name,
        username: mockAccountData.username,
        password: 'hashedPassword123',
        role: mockAccountData.role,
        email: mockAccountData.email
      });
    });

    test('updateEmployeeAccount 應該正確更新用戶屬性', async () => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee);
      mockedGetEmployeeUser.mockResolvedValue(mockUser);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('newHashedPassword' as any);

      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const updateData = {
        username: 'new_username',
        email: 'new@example.com',
        password: 'newPassword123',
        role: 'pharmacist'
      };

      await updateEmployeeAccount(mockEmployee.id, updateData);

      expect(mockUser.username).toBe(updateData.username);
      expect(mockUser.email).toBe(updateData.email);
      expect(mockUser.password).toBe('newHashedPassword');
      expect(mockUser.role).toBe(updateData.role);
    });
  });
});