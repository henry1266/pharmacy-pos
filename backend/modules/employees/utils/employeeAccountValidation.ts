import mongoose from 'mongoose';
import User from '../../../models/User';
import Employee from '../models/Employee';
import { Response } from 'express';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

/**
 * 員工帳號相關驗證工具函數
 * 提供統一的驗證邏輯，減少代碼重複
 */

/**
 * 驗證員工ID格式是否有效
 * @param employeeId - 員工ID
 * @returns 是否有效
 */
const validateEmployeeId = (employeeId: string): boolean => {
  return mongoose.Types.ObjectId.isValid(employeeId);
};

/**
 * 檢查員工是否存在
 * @param employeeId - 員工ID
 * @returns 員工對象或null
 */
const findEmployeeById = async (employeeId: string): Promise<any> => {
  if (!validateEmployeeId(employeeId)) {
    throw new Error('無效的員工ID格式');
  }
  
  const employee = await Employee.findById(employeeId);
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
const isUsernameExists = async (username: string, excludeUserId: string | null = null): Promise<boolean> => {
  const query: any = { username };
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
const isEmailExists = async (email: string, excludeUserId: string | null = null): Promise<boolean> => {
  if (!email || email.trim() === '') {
    return false;
  }
  
  const query: any = { email };
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
const hasEmployeeAccount = async (employee: any): Promise<boolean> => {
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
 * @returns 用戶對象或null
 */
const getEmployeeUser = async (employee: any, includePassword: boolean = false): Promise<any> => {
  if (!employee.userId) {
    throw new Error('此員工尚未建立帳號');
  }
  
  const selectFields = includePassword ? '' : '-password';
  const user = await User.findById(employee.userId).select(selectFields);
  
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
const validateRole = (role: string): boolean => {
  const validRoles = ['admin', 'pharmacist', 'staff'];
  return validRoles.includes(role);
};

/**
 * 統一的錯誤響應處理
 * @param res - Express響應對象
 * @param error - 錯誤對象
 * @param statusCode - HTTP狀態碼
 */
const handleError = (res: Response, error: Error, statusCode: number = 500): Response => {
  console.error(error.message);
  
  if (statusCode === 500) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    return res.status(500).json(errorResponse);
  }
  
  return res.status(statusCode).json({ msg: error.message });
};

/**
 * 創建標準化的成功響應
 * @param message - 成功消息
 * @param data - 附加數據
 * @returns 響應對象
 */
const createSuccessResponse = (message: string, data: any = {}): any => {
  return {
    msg: message,
    ...data
  };
};

export {
  validateEmployeeId,
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser,
  validateRole,
  handleError,
  createSuccessResponse
};