import axios from 'axios';
import { AuthResponse, LoginRequest, UpdateUserRequest } from '../types/api';

const API_URL = '/api/auth';

/**
 * Logs in a user.
 * @param {LoginRequest} credentials - The user's credentials.
 * @returns {Promise<AuthResponse>} A promise that resolves to the login response data (including token and user info).
 * @throws {Error} If the login request fails.
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    // 支持用戶名或電子郵件登入
    const response = await axios.post<AuthResponse>(API_URL, credentials);
    // The response should contain { token, user }
    if (response.data.token && response.data.user) {
      return response.data;
    } else {
      throw new Error('登入失敗，未收到完整的驗證資訊。');
    }
  } catch (err: any) {
    console.error('登入失敗 (service):', err);
    // Re-throw a more specific error message if available
    const errorMessage =
      err.response?.data?.msg ??
      (err.response?.data?.errors?.map((e: { msg: string }) => e.msg).join(', ')) ??
      '登入失敗，請檢查您的憑證或稍後再試。';
    throw new Error(errorMessage);
  }
};

/**
 * 獲取當前登入用戶的資訊
 * @returns {Promise<object>} 當前用戶資訊
 * @throws {Error} 如果請求失敗或用戶未登入
 */
export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入，無法獲取用戶資訊');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.get<any>(API_URL, config);
    return response.data;
  } catch (err: any) {
    console.error('獲取當前用戶資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '獲取用戶資訊失敗，請確認您已登入系統'
    );
  }
};

/**
 * 更新當前用戶的資訊
 * @param {UpdateUserRequest} updateData - 要更新的資料
 * @returns {Promise<object>} 更新結果
 * @throws {Error} 如果請求失敗或用戶未登入
 */
export const updateCurrentUser = async (updateData: UpdateUserRequest): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入，無法更新用戶資訊');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.put<any>(`${API_URL}/update`, updateData, config);
    return response.data;
  } catch (err: any) {
    console.error('更新用戶資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      (err.response?.data?.errors?.map((e: { msg: string }) => e.msg).join(', ')) ??
      '更新用戶資訊失敗，請稍後再試'
    );
  }
};

const authService = {
  login,
  getCurrentUser,
  updateCurrentUser
};

export default authService;