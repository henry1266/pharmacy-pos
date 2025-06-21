const bcrypt = require('bcryptjs');

/**
 * 密碼處理工具函數
 * 提供密碼加密和驗證功能
 */

/**
 * 加密密碼
 * @param {string} password - 原始密碼
 * @param {number} saltRounds - 鹽值輪數，默認為10
 * @returns {Promise<string>} 加密後的密碼
 */
const hashPassword = async (password, saltRounds = 10) => {
  if (!password) {
    throw new Error('密碼不能為空');
  }
  
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('密碼加密失敗:', error);
    throw new Error(`密碼加密失敗: ${error.message}`);
  }
};

/**
 * 驗證密碼
 * @param {string} password - 原始密碼
 * @param {string} hashedPassword - 加密後的密碼
 * @returns {Promise<boolean>} 密碼是否匹配
 */
const verifyPassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    throw new Error('密碼或雜湊密碼不能為空');
  }
  
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('密碼驗證失敗:', error);
    throw new Error(`密碼驗證失敗: ${error.message}`);
  }
};

/**
 * 驗證密碼強度
 * @param {string} password - 密碼
 * @returns {Object} 驗證結果
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!password) {
    result.isValid = false;
    result.errors.push('密碼不能為空');
    return result;
  }

  if (password.length < 6) {
    result.isValid = false;
    result.errors.push('密碼長度至少需要6個字符');
  }

  if (password.length > 128) {
    result.isValid = false;
    result.errors.push('密碼長度不能超過128個字符');
  }

  // 可以添加更多密碼強度檢查
  // 例如：包含大小寫字母、數字、特殊字符等

  return result;
};

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength
};