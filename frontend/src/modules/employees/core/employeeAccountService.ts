/**
 * 員工帳號服務 - 核心服務層
 * 提供員工帳號管理相關的 API 操作
 */

import axios from 'axios';
import { EmployeeAccount, Role } from '@pharmacy-pos/shared/types/entities';

const API_URL = '/api/employee-accounts';

/**
 * 創建員工帳號的資料介面
 */
export interface CreateEmployeeAccountData {
  employeeId: string;
  username: string;
  email?: string;
  password: string;
  role: Role;
}

/**
 * 更新員工帳號的資料介面
 */
export interface UpdateEmployeeAccountData {
  username?: string;
  email?: string;
  password?: string;
  role?: Role;
}

/**
 * 獲取員工帳號資訊
 * @param {string} employeeId - 員工ID
 * @returns {Promise<EmployeeAccount>} 員工帳號資訊
 */
export const getEmployeeAccount = async (employeeId: string): Promise<EmployeeAccount> => {
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

    const response = await axios.get<EmployeeAccount>(`${API_URL}/${employeeId}`, config);
    return response.data;
  } catch (err: any) {
    console.error('獲取員工帳號資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '獲取員工帳號資訊失敗，請稍後再試'
    );
  }
};

/**
 * 創建員工帳號
 * @param {CreateEmployeeAccountData} accountData - 帳號資料
 * @returns {Promise<EmployeeAccount>} 創建結果
 */
export const createEmployeeAccount = async (accountData: CreateEmployeeAccountData): Promise<EmployeeAccount> => {
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

    const response = await axios.post<EmployeeAccount>(API_URL, accountData, config);
    return response.data;
  } catch (err: any) {
    console.error('創建員工帳號失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      (err.response?.data?.errors?.map((e: { msg: string }) => e.msg).join(', ')) ??
      '創建員工帳號失敗，請稍後再試'
    );
  }
};

/**
 * 更新員工帳號
 * @param {string} employeeId - 員工ID
 * @param {UpdateEmployeeAccountData} updateData - 更新資料
 * @returns {Promise<EmployeeAccount>} 更新結果
 */
export const updateEmployeeAccount = async (employeeId: string, updateData: UpdateEmployeeAccountData): Promise<EmployeeAccount> => {
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

    const response = await axios.put<EmployeeAccount>(`${API_URL}/${employeeId}`, updateData, config);
    return response.data;
  } catch (err: any) {
    console.error('更新員工帳號失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      (err.response?.data?.errors?.map((e: { msg: string }) => e.msg).join(', ')) ??
      '更新員工帳號失敗，請稍後再試'
    );
  }
};

/**
 * 刪除員工帳號
 * @param {string} employeeId - 員工ID
 * @returns {Promise<any>} 刪除結果
 */
export const deleteEmployeeAccount = async (employeeId: string): Promise<any> => {
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

    const response = await axios.delete<any>(`${API_URL}/${employeeId}`, config);
    return response.data;
  } catch (err: any) {
    console.error('刪除員工帳號失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '刪除員工帳號失敗，請稍後再試'
    );
  }
};

/**
 * 解除員工與帳號的綁定
 * @param {string} employeeId - 員工ID
 * @returns {Promise<any>} 解除綁定結果
 */
export const unbindEmployeeAccount = async (employeeId: string): Promise<any> => {
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

    const response = await axios.put<any>(`${API_URL}/${employeeId}/unbind`, {}, config);
    return response.data;
  } catch (err: any) {
    console.error('解除員工帳號綁定失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '解除員工帳號綁定失敗，請稍後再試'
    );
  }
};

/**
 * 員工帳號服務
 */
export const employeeAccountService = {
  getEmployeeAccount,
  createEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
};

export default employeeAccountService;