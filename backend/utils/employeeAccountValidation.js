const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');

/**
 * 員工帳號相關驗證工具函數
 * 提供統一的驗證邏輯，減少代碼重複
 */

/**
 * 驗證員工ID格式是否有效
 * @param {string} employeeId - 員工ID
 * @returns {boolean} 是否有效
 */
const validateEmployeeId = (employeeId) => {
  return mongoose.Types.ObjectId.isValid(employeeId);
};

/**
 * 檢查員工是否存在
 * @param {string} employeeId - 員工ID
 * @returns {Promise<Object|null>} 員工對象或null
 */
const findEmployeeById = async (employeeId) => {
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
 * @param {string} username - 用戶名
 * @param {string} excludeUserId - 排除的用戶ID（用於更新時）
 * @returns {Promise<boolean>} 是否已被使用
 */
const isUsernameExists = async (username, excludeUserId = null) => {
  const query = { username };
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
 * @param {string} email - 電子郵件
 * @param {string} excludeUserId - 排除的用戶ID（用於更新時）
 * @returns {Promise<boolean>} 是否已被使用
 */
const isEmailExists = async (email, excludeUserId = null) => {
  if (!email || email.trim() === '') {
    return false;
  }
  
  const query = { email };
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
 * @param {Object} employee - 員工對象
 * @returns {Promise<boolean>} 是否已有帳號
 */
const hasEmployeeAccount = async (employee) => {
  if (!employee.userId) {
    return false;
  }
  
  const existingUser = await User.findById(employee.userId);
  return !!existingUser;
};

/**
 * 獲取員工的用戶帳號
 * @param {Object} employee - 員工對象
 * @param {boolean} includePassword - 是否包含密碼
 * @returns {Promise<Object|null>} 用戶對象或null
 */
const getEmployeeUser = async (employee, includePassword = false) => {
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
 * @param {string} role - 角色
 * @returns {boolean} 是否有效
 */
const validateRole = (role) => {
  const validRoles = ['admin', 'pharmacist', 'staff'];
  return validRoles.includes(role);
};

/**
 * 統一的錯誤響應處理
 * @param {Object} res - Express響應對象
 * @param {Error} error - 錯誤對象
 * @param {number} statusCode - HTTP狀態碼
 */
const handleError = (res, error, statusCode = 500) => {
  console.error(error.message);
  
  if (statusCode === 500) {
    return res.status(500).send('伺服器錯誤');
  }
  
  return res.status(statusCode).json({ msg: error.message });
};

/**
 * 創建標準化的成功響應
 * @param {string} message - 成功消息
 * @param {Object} data - 附加數據
 * @returns {Object} 響應對象
 */
const createSuccessResponse = (message, data = {}) => {
  return {
    msg: message,
    ...data
  };
};

module.exports = {
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