import {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
} from '../employeeAccountService';
import User from '../../models/User';
import { hashPassword } from '../../utils/passwordUtils';
import {
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser
} from '../../utils/employeeAccountValidation';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../utils/passwordUtils');
jest.mock('../../utils/employeeAccountValidation');

const MockedUser = User as jest.MockedClass<typeof User>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedFindEmployeeById = findEmployeeById as jest.MockedFunction<typeof findEmployeeById>;
const mockedIsUsernameExists = isUsernameExists as jest.MockedFunction<typeof isUsernameExists>;
const mockedIsEmailExists = isEmailExists as jest.MockedFunction<typeof isEmailExists>;
const mockedHasEmployeeAccount = hasEmployeeAccount as jest.MockedFunction<typeof hasEmployeeAccount>;
const mockedGetEmployeeUser = getEmployeeUser as jest.MockedFunction<typeof getEmployeeUser>;

describe('employeeAccountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEmployeeAccount', () => {
    const mockEmployee = {
      id: 'emp123',
      name: '張三',
      userId: null,
      save: jest.fn().mockResolvedValue(true)
    };

    const mockUser = {
      id: 'user123',
      name: '張三',
      username: 'zhangsan',
      role: 'employee',
      save: jest.fn().mockResolvedValue(true)
    };

    const accountData = {
      employeeId: 'emp123',
      username: 'zhangsan',
      email: 'zhangsan@example.com',
      password: 'password123',
      role: 'employee'
    };

    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashedPassword' as any);
      
      // Mock User constructor and save
      const mockUserInstance = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser)
      };
      MockedUser.mockImplementation(() => mockUserInstance as any);
    });

    it('應該成功創建員工帳號', async () => {
      const result = await createEmployeeAccount(accountData);

      expect(mockedFindEmployeeById).toHaveBeenCalledWith('emp123');
      expect(mockedIsUsernameExists).toHaveBeenCalledWith('zhangsan');
      expect(mockedIsEmailExists).toHaveBeenCalledWith('zhangsan@example.com');
      expect(mockedHasEmployeeAccount).toHaveBeenCalledWith(mockEmployee);
      expect(mockedHashPassword).toHaveBeenCalledWith('password123');

      expect(result).toEqual({
        employee: {
          id: 'emp123',
          name: '張三'
        },
        user: {
          id: 'user123',
          name: '張三',
          username: 'zhangsan',
          role: 'employee'
        }
      });

      expect(mockEmployee.save).toHaveBeenCalled();
    });

    it('應該在用戶名已存在時拋出錯誤', async () => {
      mockedIsUsernameExists.mockResolvedValue(true);

      await expect(createEmployeeAccount(accountData))
        .rejects.toThrow('此用戶名已被使用');
    });

    it('應該在員工已有帳號時拋出錯誤', async () => {
      mockedHasEmployeeAccount.mockResolvedValue(true);

      await expect(createEmployeeAccount(accountData))
        .rejects.toThrow('此員工已有帳號');
    });

    it('應該在電子郵件已存在時拋出錯誤', async () => {
      mockedIsEmailExists.mockResolvedValue(true);

      await expect(createEmployeeAccount(accountData))
        .rejects.toThrow('此電子郵件已被使用');
    });

    it('應該處理沒有電子郵件的情況', async () => {
      const { email, ...accountDataWithoutEmail } = accountData;

      await createEmployeeAccount(accountDataWithoutEmail as any);

      expect(mockedIsEmailExists).not.toHaveBeenCalled();
    });

    it('應該處理空電子郵件字符串', async () => {
      const accountDataWithEmptyEmail = {
        ...accountData,
        email: ''
      };

      await createEmployeeAccount(accountDataWithEmptyEmail);

      expect(mockedIsEmailExists).not.toHaveBeenCalled();
    });
  });

  describe('getEmployeeAccount', () => {
    const mockEmployee = {
      id: 'emp123',
      name: '張三'
    };

    const mockUser = {
      id: 'user123',
      name: '張三',
      username: 'zhangsan',
      role: 'employee'
    };

    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedGetEmployeeUser.mockResolvedValue(mockUser as any);
    });

    it('應該返回員工帳號信息', async () => {
      const result = await getEmployeeAccount('emp123');

      expect(mockedFindEmployeeById).toHaveBeenCalledWith('emp123');
      expect(mockedGetEmployeeUser).toHaveBeenCalledWith(mockEmployee, false);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateEmployeeAccount', () => {
    const mockEmployee = {
      id: 'emp123',
      name: '張三'
    };

    const mockUser = {
      id: 'user123',
      username: 'oldusername',
      email: 'old@example.com',
      role: 'employee',
      password: 'oldpassword',
      save: jest.fn().mockResolvedValue(true)
    };

    const mockUpdatedUser = {
      id: 'user123',
      name: '張三',
      username: 'newusername',
      email: 'new@example.com',
      role: 'admin'
    };

    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedGetEmployeeUser.mockResolvedValue(mockUser as any);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('newHashedPassword' as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });
    });

    it('應該成功更新員工帳號', async () => {
      const updateData = {
        username: 'newusername',
        email: 'new@example.com',
        password: 'newpassword',
        role: 'admin'
      };

      const result = await updateEmployeeAccount('emp123', updateData);

      expect(mockedIsUsernameExists).toHaveBeenCalledWith('newusername', 'user123');
      expect(mockedIsEmailExists).toHaveBeenCalledWith('new@example.com', 'user123');
      expect(mockedHashPassword).toHaveBeenCalledWith('newpassword');
      expect(mockUser.save).toHaveBeenCalled();
      expect(MockedUser.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('應該處理部分更新', async () => {
      // 確保新用戶名與舊用戶名不同，這樣才會調用驗證函數
      const updateData = {
        username: 'differentusername'  // 與mockUser.username: 'oldusername' 不同
      };

      const result = await updateEmployeeAccount('emp123', updateData);

      expect(mockedIsUsernameExists).toHaveBeenCalledWith('differentusername', 'user123');
      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(MockedUser.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('應該處理不更新用戶名的情況', async () => {
      // 測試當沒有提供用戶名時的情況
      const updateData = {
        role: 'admin'  // 只更新角色
      };

      const result = await updateEmployeeAccount('emp123', updateData);

      expect(mockedIsUsernameExists).not.toHaveBeenCalled(); // 不應該調用驗證
      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(MockedUser.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('應該處理相同用戶名的更新', async () => {
      // 測試當新用戶名與舊用戶名相同時的情況
      const updateData = {
        username: 'oldusername'  // 與mockUser.username相同
      };

      const result = await updateEmployeeAccount('emp123', updateData);

      // 實際上仍會調用驗證函數來檢查其他用戶是否使用相同用戶名
      expect(mockedIsUsernameExists).toHaveBeenCalledWith('oldusername', 'user123');
      expect(mockedIsEmailExists).not.toHaveBeenCalled();
      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(MockedUser.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('應該在用戶名已存在時拋出錯誤', async () => {
      mockedIsUsernameExists.mockResolvedValue(true);

      const updateData = { username: 'existingusername' };

      await expect(updateEmployeeAccount('emp123', updateData))
        .rejects.toThrow('此用戶名已被使用');
      
      expect(mockedIsUsernameExists).toHaveBeenCalledWith('existingusername', 'user123');
    });

    it('應該在電子郵件已存在時拋出錯誤', async () => {
      mockedIsEmailExists.mockResolvedValue(true);

      const updateData = { email: 'existing@example.com' };

      await expect(updateEmployeeAccount('emp123', updateData))
        .rejects.toThrow('此電子郵件已被使用');
      
      expect(mockedIsEmailExists).toHaveBeenCalledWith('existing@example.com', 'user123');
    });
  });

  describe('deleteEmployeeAccount', () => {
    const mockEmployee = {
      id: 'emp123',
      name: '張三',
      userId: 'user123',
      save: jest.fn().mockResolvedValue(true)
    };

    const mockUser = {
      id: 'user123',
      name: '張三'
    };

    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedGetEmployeeUser.mockResolvedValue(mockUser as any);
      MockedUser.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);
    });

    it('應該成功刪除員工帳號', async () => {
      await deleteEmployeeAccount('emp123');

      expect(mockedFindEmployeeById).toHaveBeenCalledWith('emp123');
      expect(mockedGetEmployeeUser).toHaveBeenCalledWith(mockEmployee, false);
      expect(MockedUser.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(mockEmployee.userId).toBeNull();
      expect(mockEmployee.save).toHaveBeenCalled();
    });
  });

  describe('unbindEmployeeAccount', () => {
    const mockEmployee = {
      id: 'emp123',
      name: '張三',
      userId: 'user123',
      save: jest.fn().mockResolvedValue(true)
    };

    const mockUser = {
      id: 'user123',
      name: '張三',
      username: 'zhangsan'
    };

    beforeEach(() => {
      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      MockedUser.findById = jest.fn().mockResolvedValue(mockUser);
    });

    it('應該成功解除員工帳號綁定', async () => {
      const result = await unbindEmployeeAccount('emp123');

      expect(mockedFindEmployeeById).toHaveBeenCalledWith('emp123');
      expect(MockedUser.findById).toHaveBeenCalledWith('user123');
      expect(mockEmployee.userId).toBeNull();
      expect(mockEmployee.save).toHaveBeenCalled();

      expect(result).toEqual({
        employee: {
          id: 'emp123',
          name: '張三'
        },
        user: {
          id: 'user123',
          name: '張三',
          username: 'zhangsan'
        }
      });
    });

    it('應該在員工沒有帳號時拋出錯誤', async () => {
      const employeeWithoutAccount = {
        ...mockEmployee,
        userId: null
      };
      mockedFindEmployeeById.mockResolvedValue(employeeWithoutAccount as any);

      await expect(unbindEmployeeAccount('emp123'))
        .rejects.toThrow('此員工尚未綁定帳號');
    });

    it('應該處理用戶不存在的情況', async () => {
      // 設置員工有userId但用戶不存在的情況
      const employeeWithUserId = {
        ...mockEmployee,
        userId: 'user123'
      };
      mockedFindEmployeeById.mockResolvedValue(employeeWithUserId as any);
      MockedUser.findById = jest.fn().mockResolvedValue(null);

      const result = await unbindEmployeeAccount('emp123');

      expect(result).toEqual({
        employee: {
          id: 'emp123',
          name: '張三'
        }
      });
      expect(employeeWithUserId.userId).toBeNull();
      expect(employeeWithUserId.save).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    it('應該處理員工查找錯誤', async () => {
      mockedFindEmployeeById.mockRejectedValue(new Error('員工不存在'));

      await expect(createEmployeeAccount({
        employeeId: 'nonexistent',
        username: 'test',
        password: 'test',
        role: 'employee'
      })).rejects.toThrow('員工不存在');
    });

    it('應該處理密碼哈希錯誤', async () => {
      const mockEmployee = {
        id: 'emp123',
        name: '張三'
      };

      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockRejectedValue(new Error('密碼哈希失敗'));

      await expect(createEmployeeAccount({
        employeeId: 'emp123',
        username: 'test',
        password: 'test',
        role: 'employee'
      })).rejects.toThrow('密碼哈希失敗');
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理極長的用戶名', async () => {
      const mockEmployee = {
        id: 'emp123',
        name: '張三',
        save: jest.fn().mockResolvedValue(true)
      };

      const longUsername = 'a'.repeat(100);

      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashedPassword' as any);

      const mockUserInstance = {
        id: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };
      MockedUser.mockImplementation(() => mockUserInstance as any);

      await createEmployeeAccount({
        employeeId: 'emp123',
        username: longUsername,
        password: 'test',
        role: 'employee'
      });

      expect(MockedUser).toHaveBeenCalled();
    });

    it('應該處理特殊字符的電子郵件', async () => {
      const mockEmployee = {
        id: 'emp123',
        name: '張三',
        save: jest.fn().mockResolvedValue(true)
      };

      const specialEmail = 'test+special@example.com';

      mockedFindEmployeeById.mockResolvedValue(mockEmployee as any);
      mockedIsUsernameExists.mockResolvedValue(false);
      mockedIsEmailExists.mockResolvedValue(false);
      mockedHasEmployeeAccount.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashedPassword' as any);

      const mockUserInstance = {
        id: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };
      MockedUser.mockImplementation = jest.fn(() => mockUserInstance as any);

      await createEmployeeAccount({
        employeeId: 'emp123',
        username: 'test',
        email: specialEmail,
        password: 'test',
        role: 'employee'
      });

      expect(MockedUser).toHaveBeenCalled();
    });
  });
});