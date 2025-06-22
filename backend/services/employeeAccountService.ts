import User from '../models/User';
import Employee from '../models/Employee';
import { hashPassword } from '../utils/passwordUtils';
import {
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser,
  IUser as ValidationIUser,
  IEmployee as ValidationIEmployee
} from '../utils/employeeAccountValidation';
import { Types } from 'mongoose';

/**
 * 員工帳號服務層
 * 處理員工帳號的業務邏輯
 */

// 定義服務層相關的介面
interface EmployeeAccountData {
  employeeId: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
}

interface AccountUpdateData {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'pharmacist' | 'staff';
}

interface CreateAccountResult {
  employee: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
}

interface UnbindAccountResult {
  employee: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    username: string;
  };
}

/**
 * 創建員工帳號
 * @param accountData - 帳號數據
 * @returns 創建結果
 */
const createEmployeeAccount = async (accountData: EmployeeAccountData): Promise<CreateAccountResult> => {
  const { employeeId, username, email, password, role } = accountData;

  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);

  // 檢查用戶名是否已被使用
  if (await isUsernameExists(username)) {
    throw new Error('此用戶名已被使用');
  }

  // 檢查員工是否已有帳號
  if (await hasEmployeeAccount(employee)) {
    throw new Error('此員工已有帳號');
  }

  // 檢查電子郵件是否已被使用（如果提供）
  if (email && await isEmailExists(email)) {
    throw new Error('此電子郵件已被使用');
  }

  // 加密密碼
  const hashResult = await hashPassword(password);
  if (!hashResult.success || !hashResult.hash) {
    throw new Error(hashResult.error || '密碼加密失敗');
  }

  // 創建新用戶
  const userData: any = {
    name: employee.name,
    username,
    password: hashResult.hash,
    role,
    settings: {},
    date: new Date()
  };

  // 只有當email有值且不為空字符串時才設置
  if (email && email.trim() !== '') {
    userData.email = email;
  }

  const user = new User(userData);
  await user.save();

  // 更新員工記錄，關聯到新用戶
  const employeeDoc = await Employee.findById(employeeId);
  if (employeeDoc) {
    (employeeDoc as any).userId = user._id;
    await employeeDoc.save();
  }

  return {
    employee: {
      id: employee._id.toString(),
      name: employee.name
    },
    user: {
      id: user._id.toString(),
      name: (user as any).name,
      username: user.username,
      role: user.role
    }
  };
};

/**
 * 獲取員工帳號信息
 * @param employeeId - 員工ID
 * @returns 用戶信息
 */
const getEmployeeAccount = async (employeeId: string): Promise<ValidationIUser | null> => {
  const employee = await findEmployeeById(employeeId);
  const user = await getEmployeeUser(employee, false);
  return user;
};

/**
 * 更新用戶名
 * @param user - 用戶對象
 * @param newUsername - 新用戶名
 */
const updateUsername = async (user: ValidationIUser, newUsername?: string): Promise<void> => {
  if (!newUsername || newUsername === user.username) {
    return; // 如果沒有提供新用戶名或與當前用戶名相同，則不更新
  }
  
  if (await isUsernameExists(newUsername, user._id.toString())) {
    throw new Error('此用戶名已被使用');
  }
  
  user.username = newUsername;
};

/**
 * 更新電子郵件
 * @param user - 用戶對象
 * @param newEmail - 新電子郵件
 */
const updateEmail = async (user: ValidationIUser, newEmail?: string): Promise<void> => {
  if (newEmail === undefined || newEmail === user.email) {
    return; // 如果沒有提供新電子郵件或與當前電子郵件相同，則不更新
  }
  
  if (newEmail && newEmail.trim() !== '') {
    if (await isEmailExists(newEmail, user._id.toString())) {
      throw new Error('此電子郵件已被使用');
    }
    user.email = newEmail;
  } else {
    // 如果email為空或空字符串，則從用戶文檔中移除email字段
    delete user.email;
    await User.updateOne(
      { _id: user._id },
      { $unset: { email: 1 } }
    );
  }
};

/**
 * 更新員工帳號
 * @param employeeId - 員工ID
 * @param updateData - 更新數據
 * @returns 更新結果
 */
const updateEmployeeAccount = async (employeeId: string, updateData: AccountUpdateData): Promise<ValidationIUser | null> => {
  const { username, email, password, role } = updateData;

  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);
  
  // 獲取用戶資訊
  const user = await getEmployeeUser(employee, true);
  if (!user) {
    throw new Error('找不到員工帳號');
  }

  // 更新用戶名
  await updateUsername(user, username);
  
  // 更新電子郵件
  await updateEmail(user, email);

  // 更新角色
  if (role) {
    user.role = role;
  }

  // 更新密碼
  if (password) {
    const hashResult = await hashPassword(password);
    if (!hashResult.success || !hashResult.hash) {
      throw new Error(hashResult.error || '密碼加密失敗');
    }
    user.password = hashResult.hash;
  }

  // 保存更新
  await User.findByIdAndUpdate(user._id, user);

  // 返回更新後的用戶資訊（不包含密碼）
  const updatedUser = await User.findById(user._id).select('-password') as ValidationIUser | null;
  return updatedUser;
};

/**
 * 刪除員工帳號
 * @param employeeId - 員工ID
 */
const deleteEmployeeAccount = async (employeeId: string): Promise<void> => {
  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);
  
  // 獲取用戶資訊
  const user = await getEmployeeUser(employee, false);
  if (!user) {
    throw new Error('找不到員工帳號');
  }

  // 刪除用戶
  await User.findByIdAndDelete(user._id);

  // 更新員工記錄，移除用戶關聯
  const employeeDoc = await Employee.findById(employeeId);
  if (employeeDoc) {
    (employeeDoc as any).userId = null;
    await employeeDoc.save();
  }
};

/**
 * 解除員工帳號綁定
 * @param employeeId - 員工ID
 * @returns 解綁結果
 */
const unbindEmployeeAccount = async (employeeId: string): Promise<UnbindAccountResult> => {
  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);

  // 檢查員工是否有帳號
  if (!employee.userId) {
    throw new Error('此員工尚未綁定帳號');
  }

  // 獲取用戶資訊
  const user = await User.findById(employee.userId) as ValidationIUser | null;
  
  const result: UnbindAccountResult = {
    employee: {
      id: employee._id.toString(),
      name: employee.name
    }
  };

  if (user) {
    result.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username
    };
  }

  // 解除綁定（不刪除用戶帳號）
  const employeeDoc = await Employee.findById(employeeId);
  if (employeeDoc) {
    (employeeDoc as any).userId = null;
    await employeeDoc.save();
  }

  return result;
};

export {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
};

export type {
  EmployeeAccountData,
  AccountUpdateData,
  CreateAccountResult,
  UnbindAccountResult
};