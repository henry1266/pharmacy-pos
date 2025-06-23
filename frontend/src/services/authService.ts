import axios from 'axios';
import { ApiResponse, ErrorResponse, AuthResponse, LoginRequest, UpdateUserRequest, LoginResponse } from '../types/api';

const API_URL = '/api/auth';

/**
 * Logs in a user.
 * @param {LoginRequest} credentials - The user's credentials.
 * @returns {Promise<AuthResponse>} A promise that resolves to the login response data (including token and user info).
 * @throws {Error} If the login request fails.
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // 支持用戶名或電子郵件登入
    const response = await axios.post<AuthResponse>(API_URL, credentials);
    
    // 檢查 API 響應格式 - AuthResponse 已經是完整的 API 響應格式
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('登入失敗，未收到完整的驗證資訊。');
    }
  } catch (err: any) {
    console.error('登入失敗 (service):', err);
    
    // 處理新的錯誤響應格式
    const errorResponse = err.response?.data as ErrorResponse;
    const errorMessage =
      errorResponse?.message ??
      errorResponse?.error ??
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

    const response = await axios.get<ApiResponse<any>>(API_URL, config);
    
    // 檢查 API 響應格式
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('獲取用戶資訊失敗');
    }
  } catch (err: any) {
    console.error('獲取當前用戶資訊失敗:', err);
    
    // 處理新的錯誤響應格式
    const errorResponse = err.response?.data as ErrorResponse;
    const errorMessage =
      errorResponse?.message ??
      errorResponse?.error ??
      err.response?.data?.msg ??
      '獲取用戶資訊失敗，請確認您已登入系統';
    throw new Error(errorMessage);
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

    const response = await axios.put<ApiResponse<any>>(`${API_URL}/update`, updateData, config);
    
    // 檢查 API 響應格式
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('更新用戶資訊失敗');
    }
  } catch (err: any) {
    console.error('更新用戶資訊失敗:', err);
    
    // 處理新的錯誤響應格式
    const errorResponse = err.response?.data as ErrorResponse;
    const errorMessage =
      errorResponse?.message ??
      errorResponse?.error ??
      err.response?.data?.msg ??
      (err.response?.data?.errors?.map((e: { msg: string }) => e.msg).join(', ')) ??
      '更新用戶資訊失敗，請稍後再試';
    throw new Error(errorMessage);
  }
};

const authService = {
  login,
  getCurrentUser,
  updateCurrentUser
};

export default authService;