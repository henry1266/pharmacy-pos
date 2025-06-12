import axios from 'axios';

const API_URL = '/api/employee-accounts';

/**
 * 獲取員工帳號資訊
 * @param {string} employeeId - 員工ID
 * @returns {Promise<object>} 員工帳號資訊
 */
export const getEmployeeAccount = async (employeeId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.get(`${API_URL}/${employeeId}`, config);
    return response.data;
  } catch (err) {
    console.error('獲取員工帳號資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg || 
      '獲取員工帳號資訊失敗，請稍後再試'
    );
  }
};

/**
 * 創建員工帳號
 * @param {object} accountData - 帳號資料
 * @param {string} accountData.employeeId - 員工ID
 * @param {string} accountData.username - 用戶名
 * @param {string} [accountData.email] - 電子郵件 (選填)
 * @param {string} accountData.password - 密碼
 * @param {string} accountData.role - 角色 (admin, pharmacist, staff)
 * @returns {Promise<object>} 創建結果
 */
export const createEmployeeAccount = async (accountData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.post(API_URL, accountData, config);
    return response.data;
  } catch (err) {
    console.error('創建員工帳號失敗:', err);
    throw new Error(
      err.response?.data?.msg || 
      (err.response?.data?.errors?.map(e => e.msg).join(', ')) ||
      '創建員工帳號失敗，請稍後再試'
    );
  }
};

/**
 * 更新員工帳號
 * @param {string} employeeId - 員工ID
 * @param {object} updateData - 更新資料
 * @param {string} [updateData.username] - 用戶名
 * @param {string} [updateData.email] - 電子郵件
 * @param {string} [updateData.password] - 密碼
 * @param {string} [updateData.role] - 角色 (admin, pharmacist, staff)
 * @returns {Promise<object>} 更新結果
 */
export const updateEmployeeAccount = async (employeeId, updateData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.put(`${API_URL}/${employeeId}`, updateData, config);
    return response.data;
  } catch (err) {
    console.error('更新員工帳號失敗:', err);
    throw new Error(
      err.response?.data?.msg || 
      (err.response?.data?.errors?.map(e => e.msg).join(', ')) ||
      '更新員工帳號失敗，請稍後再試'
    );
  }
};

/**
 * 刪除員工帳號
 * @param {string} employeeId - 員工ID
 * @returns {Promise<object>} 刪除結果
 */
export const deleteEmployeeAccount = async (employeeId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.delete(`${API_URL}/${employeeId}`, config);
    return response.data;
  } catch (err) {
    console.error('刪除員工帳號失敗:', err);
    throw new Error(
      err.response?.data?.msg || 
      '刪除員工帳號失敗，請稍後再試'
    );
  }
};

/**
 * 解除員工與帳號的綁定
 * @param {string} employeeId - 員工ID
 * @returns {Promise<object>} 解除綁定結果
 */
export const unbindEmployeeAccount = async (employeeId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.put(`${API_URL}/${employeeId}/unbind`, {}, config);
    return response.data;
  } catch (err) {
    console.error('解除員工帳號綁定失敗:', err);
    throw new Error(
      err.response?.data?.msg ||
      '解除員工帳號綁定失敗，請稍後再試'
    );
  }
};

const employeeAccountService = {
  getEmployeeAccount,
  createEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
};

export default employeeAccountService;