import mongoose, { Types } from 'mongoose';
import { Response } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import { EmployeeAccountData, AccountUpdateData, EmployeeAccountValidation } from '../src/types/business';

/**
 * 員工帳號相關驗證工具函數
 * 提供統一的驗證邏輯，減少代碼重複
 */

// 用戶文檔介面
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
  settings: Record<string, any>;
  date: Date;
}

// 員工文檔介面
export interface IEmployee {
  _id: Types.ObjectId;
  name: string;
  gender: 'male' | 'female';
  birthDate: Date;
  idNumber: string;
  education?: string;
  nativePlace?: string;
  address: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  insuranceDate?: Date;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string;
  idCardBack?: string;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 查詢選項介面
export interface QueryOptions {
  _id?: { $ne: string | Types.ObjectId };
  username?: string;
  email?: string;
}

// 成功響應介面
export interface SuccessResponse {
  msg: string;
  [key: string]: any;
}

// 錯誤處理選項
export interface ErrorHandlingOptions {
  logError?: boolean;
  includeStack?: boolean;
}

/**
 * 驗證員工ID格式是否有效
 * @param employeeId - 員工ID
 * @returns 是否有效
 */
export const validateEmployeeId = (employeeId: string): boolean => {
  if (!employeeId || typeof employeeId !== 'string') {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(employeeId);
};

/**
 * 檢查員工是否存在
 * @param employeeId - 員工ID
 * @returns 員工對象或拋出錯誤
 * @throws {Error} 當員工ID無效或找不到員工時
 */
export const findEmployeeById = async (employeeId: string): Promise<IEmployee> => {
  if (!validateEmployeeId(employeeId)) {
    throw new Error('無效的員工ID格式');
  }
  
  const employee = await Employee.findById(employeeId) as IEmployee | null;
  if (!employee) {
    throw new Error('找不到此員工資料');
  }
  
  return employee;
};

/**
 * 檢查用戶名是否已被使用
 * @param username - 用戶名
 * @param excludeUserId - 排除的用戶ID（用於更新時）
 * @returns 是否已被使用
 */
export const isUsernameExists = async (
  username: string, 
  excludeUserId: string | Types.ObjectId | null = null
): Promise<boolean> => {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return false;
  }

  const query: QueryOptions = { username: username.trim() };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  // 使用參數化查詢而非直接構建查詢對象
  const validatedQuery = { ...query }; // 創建查詢條件的副本
  const existingUser = await User.findOne(validatedQuery);
  return !!existingUser;
};

/**
 * 檢查電子郵件是否已被使用
 * @param email - 電子郵件
 * @param excludeUserId - 排除的用戶ID（用於更新時）
 * @returns 是否已被使用
 */
export const isEmailExists = async (
  email: string | undefined, 
  excludeUserId: string | Types.ObjectId | null = null
): Promise<boolean> => {
  if (!email || email.trim() === '') {
    return false;
  }
  
  const query: QueryOptions = { email: email.trim() };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  // 使用參數化查詢而非直接構建查詢對象
  const validatedQuery = { ...query }; // 創建查詢條件的副本
  const existingUser = await User.findOne(validatedQuery);
  return !!existingUser;
};

/**
 * 檢查員工是否已有帳號
 * @param employee - 員工對象
 * @returns 是否已有帳號
 */
export const hasEmployeeAccount = async (employee: IEmployee): Promise<boolean> => {
  if (!employee.userId) {
    return false;
  }
  
  const existingUser = await User.findById(employee.userId);
  return !!existingUser;
};

/**
 * 獲取員工的用戶帳號
 * @param employee - 員工對象
 * @param includePassword - 是否包含密碼
 * @returns 用戶對象或拋出錯誤
 * @throws {Error} 當員工沒有帳號或找不到帳號時
 */
export const getEmployeeUser = async (
  employee: IEmployee, 
  includePassword: boolean = false
): Promise<IUser> => {
  if (!employee.userId) {
    throw new Error('此員工尚未建立帳號');
  }
  
  const selectFields = includePassword ? '' : '-password';
  const user = await User.findById(employee.userId).select(selectFields) as IUser | null;
  
  if (!user) {
    throw new Error('找不到此員工的帳號資訊');
  }
  
  return user;
};

/**
 * 驗證角色是否有效
 * @param role - 角色
 * @returns 是否有效
 */
export const validateRole = (role: string): role is 'admin' | 'pharmacist' | 'staff' => {
  const validRoles: Array<'admin' | 'pharmacist' | 'staff'> = ['admin', 'pharmacist', 'staff'];
  return validRoles.includes(role as 'admin' | 'pharmacist' | 'staff');
};

/**
 * 驗證員工帳號數據
 * @param data - 員工帳號數據
 * @returns 驗證結果
 */
export const validateEmployeeAccountData = (data: Partial<EmployeeAccountData>): EmployeeAccountValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 驗證必填欄位
  if (!data.employeeId || data.employeeId.trim() === '') {
    errors.push('員工ID為必填欄位');
  } else if (!validateEmployeeId(data.employeeId)) {
    errors.push('員工ID格式無效');
  }

  if (!data.username || data.username.trim() === '') {
    errors.push('用戶名為必填欄位');
  } else if (data.username.length < 3) {
    errors.push('用戶名長度至少需要3個字符');
  } else if (data.username.length > 50) {
    errors.push('用戶名長度不能超過50個字符');
  }

  // 驗證角色
  if (!data.role) {
    errors.push('角色為必填欄位');
  } else if (!validateRole(data.role)) {
    errors.push('無效的角色類型');
  }

  // 驗證電子郵件格式（如果提供）
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('電子郵件格式無效');
    }
  }

  // 驗證權限陣列
  if (data.permissions && !Array.isArray(data.permissions)) {
    errors.push('權限必須是陣列格式');
  }

  // 警告檢查
  if (!data.email || data.email.trim() === '') {
    warnings.push('建議提供電子郵件以便帳號管理');
  }

  if (data.permissions && data.permissions.length === 0) {
    warnings.push('未設定任何權限，用戶可能無法執行任何操作');
  }

  const result: EmployeeAccountValidation = {
    isValid: errors.length === 0,
    errors
  };
  
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  
  return result;
};

/**
 * 驗證帳號更新數據
 * @param data - 帳號更新數據
 * @returns 驗證結果
 */
export const validateAccountUpdateData = (data: AccountUpdateData): EmployeeAccountValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 驗證用戶名（如果提供）
  if (data.username !== undefined) {
    if (typeof data.username !== 'string' || data.username.trim() === '') {
      errors.push('用戶名不能為空');
    } else if (data.username.length < 3) {
      errors.push('用戶名長度至少需要3個字符');
    } else if (data.username.length > 50) {
      errors.push('用戶名長度不能超過50個字符');
    }
  }

  // 驗證電子郵件（如果提供）
  if (data.email !== undefined && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('電子郵件格式無效');
    }
  }

  // 驗證角色（如果提供）
  if (data.role !== undefined && !validateRole(data.role)) {
    errors.push('無效的角色類型');
  }

  // 驗證權限（如果提供）
  if (data.permissions !== undefined && !Array.isArray(data.permissions)) {
    errors.push('權限必須是陣列格式');
  }

  // 驗證密碼（如果提供）
  if (data.password !== undefined) {
    if (typeof data.password !== 'string' || data.password.length < 6) {
      errors.push('密碼長度至少需要6個字符');
    }
  }

  const result: EmployeeAccountValidation = {
    isValid: errors.length === 0,
    errors
  };
  
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  
  return result;
};

/**
 * 統一的錯誤響應處理
 * @param res - Express響應對象
 * @param error - 錯誤對象
 * @param statusCode - HTTP狀態碼
 * @param options - 錯誤處理選項
 */
export const handleError = (
  res: Response, 
  error: Error, 
  statusCode: number = 500,
  options: ErrorHandlingOptions = {}
): Response => {
  const { logError = true, includeStack = false } = options;
  
  if (logError) {
    console.error('錯誤詳情:', {
      message: error.message,
      stack: includeStack ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
  
  if (statusCode === 500) {
    return res.status(500).json({ 
      msg: '伺服器錯誤',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  return res.status(statusCode).json({ 
    msg: error.message,
    ...(includeStack && process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

/**
 * 創建標準化的成功響應
 * @param message - 成功消息
 * @param data - 附加數據
 * @returns 響應對象
 */
export const createSuccessResponse = (message: string, data: Record<string, any> = {}): SuccessResponse => {
  return {
    msg: message,
    ...data
  };
};

/**
 * 檢查用戶是否有特定權限
 * @param user - 用戶對象
 * @param permission - 權限名稱
 * @returns 是否有權限
 */
export const hasPermission = (user: IUser, permission: string): boolean => {
  // 管理員擁有所有權限
  if (user.role === 'admin') {
    return true;
  }
  
  // 檢查用戶設定中的權限
  const userPermissions = user.settings?.permissions || [];
  return Array.isArray(userPermissions) && userPermissions.includes(permission);
};

/**
 * 獲取角色的預設權限
 * @param role - 角色
 * @returns 權限陣列
 */
export const getDefaultPermissionsByRole = (role: 'admin' | 'pharmacist' | 'staff'): string[] => {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'user_management',
      'employee_management', 
      'inventory_management',
      'sales_management',
      'reports_view',
      'system_settings'
    ],
    pharmacist: [
      'inventory_view',
      'inventory_update',
      'sales_management',
      'prescription_management',
      'reports_view'
    ],
    staff: [
      'inventory_view',
      'sales_basic',
      'customer_service'
    ]
  };
  
  return rolePermissions[role] || [];
};

export default {
  validateEmployeeId,
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser,
  validateRole,
  validateEmployeeAccountData,
  validateAccountUpdateData,
  handleError,
  createSuccessResponse,
  hasPermission,
  getDefaultPermissionsByRole
};