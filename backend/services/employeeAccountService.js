const User = require('../models/User');
const Employee = require('../models/Employee');
const { hashPassword } = require('../utils/passwordUtils');
const {
  findEmployeeById,
  isUsernameExists,
  isEmailExists,
  hasEmployeeAccount,
  getEmployeeUser
} = require('../utils/employeeAccountValidation');

/**
 * 員工帳號服務層
 * 處理員工帳號的業務邏輯
 */

/**
 * 創建員工帳號
 * @param {Object} accountData - 帳號數據
 * @returns {Promise<Object>} 創建結果
 */
const createEmployeeAccount = async (accountData) => {
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

  // 創建新用戶
  const userData = {
    name: employee.name,
    username,
    password: await hashPassword(password),
    role
  };

  // 只有當email有值且不為空字符串時才設置
  if (email && email.trim() !== '') {
    userData.email = email;
  }

  const user = new User(userData);
  await user.save();

  // 更新員工記錄，關聯到新用戶
  employee.userId = user.id;
  await employee.save();

  return {
    employee: {
      id: employee.id,
      name: employee.name
    },
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  };
};

/**
 * 獲取員工帳號信息
 * @param {string} employeeId - 員工ID
 * @returns {Promise<Object>} 用戶信息
 */
const getEmployeeAccount = async (employeeId) => {
  const employee = await findEmployeeById(employeeId);
  const user = await getEmployeeUser(employee, false);
  return user;
};

/**
 * 更新員工帳號
 * @param {string} employeeId - 員工ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新結果
 */
/**
 * 更新用戶名
 * @param {Object} user - 用戶對象
 * @param {string} newUsername - 新用戶名
 * @returns {Promise<void>}
 */
const updateUsername = async (user, newUsername) => {
  if (!newUsername || newUsername === user.username) {
    return; // 如果沒有提供新用戶名或與當前用戶名相同，則不更新
  }
  
  if (await isUsernameExists(newUsername, user.id)) {
    throw new Error('此用戶名已被使用');
  }
  
  user.username = newUsername;
};

/**
 * 更新電子郵件
 * @param {Object} user - 用戶對象
 * @param {string} newEmail - 新電子郵件
 * @returns {Promise<void>}
 */
const updateEmail = async (user, newEmail) => {
  if (newEmail === undefined || newEmail === user.email) {
    return; // 如果沒有提供新電子郵件或與當前電子郵件相同，則不更新
  }
  
  if (newEmail && newEmail.trim() !== '') {
    if (await isEmailExists(newEmail, user.id)) {
      throw new Error('此電子郵件已被使用');
    }
    user.email = newEmail;
  } else {
    // 如果email為空或空字符串，則從用戶文檔中移除email字段
    user.email = undefined;
    if (user.email !== undefined) {
      await User.updateOne(
        { _id: user._id },
        { $unset: { email: 1 } }
      );
    }
  }
};

/**
 * 更新員工帳號
 * @param {string} employeeId - 員工ID
 * @param {Object} updateData - 更新數據
 * @returns {Promise<Object>} 更新結果
 */
const updateEmployeeAccount = async (employeeId, updateData) => {
  const { username, email, password, role } = updateData;

  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);
  
  // 獲取用戶資訊
  let user = await getEmployeeUser(employee, true);

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
    user.password = await hashPassword(password);
  }

  // 保存更新
  await user.save();

  // 返回更新後的用戶資訊（不包含密碼）
  const updatedUser = await User.findById(user.id).select('-password');
  return updatedUser;
};

/**
 * 刪除員工帳號
 * @param {string} employeeId - 員工ID
 * @returns {Promise<void>}
 */
const deleteEmployeeAccount = async (employeeId) => {
  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);
  
  // 獲取用戶資訊
  const user = await getEmployeeUser(employee, false);

  // 刪除用戶
  await User.findByIdAndRemove(user.id);

  // 更新員工記錄，移除用戶關聯
  employee.userId = null;
  await employee.save();
};

/**
 * 解除員工帳號綁定
 * @param {string} employeeId - 員工ID
 * @returns {Promise<Object>} 解綁結果
 */
const unbindEmployeeAccount = async (employeeId) => {
  // 檢查員工是否存在
  const employee = await findEmployeeById(employeeId);

  // 檢查員工是否有帳號
  if (!employee.userId) {
    throw new Error('此員工尚未綁定帳號');
  }

  // 獲取用戶資訊
  const user = await User.findById(employee.userId);
  
  let result = {
    employee: {
      id: employee.id,
      name: employee.name
    }
  };

  if (user) {
    result.user = {
      id: user.id,
      name: user.name,
      username: user.username
    };
  }

  // 解除綁定（不刪除用戶帳號）
  employee.userId = null;
  await employee.save();

  return result;
};

module.exports = {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
};