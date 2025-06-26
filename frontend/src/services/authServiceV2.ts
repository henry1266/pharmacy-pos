/**
 * 認證服務 V2
 * 基於統一 API 客戶端架構的認證管理服務
 * 升級版本，保持向後兼容性
 */

import axios from 'axios';
import {
  createAuthApiClient,
  type AuthLoginRequest,
  type AuthUpdateRequest,
  type PasswordChangeRequest,
  type PasswordResetRequest
} from '@pharmacy-pos/shared/services/authApiClient';
import type { HttpClient } from '@pharmacy-pos/shared/services/baseApiClient';
import type {
  LoginRequest,
  UpdateUserRequest,
  LoginResponse,
  JWTPayload
} from '@pharmacy-pos/shared/types/api';
import type { EmployeeAccount } from '@pharmacy-pos/shared/types/entities';

// 創建 axios 適配器，包含認證 header
const createAxiosAdapter = (): HttpClient => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'x-auth-token': token } : {};
  };

  return {
    get: async (url: string, config?: any) => {
      const response = await axios.get(url, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return { data: response.data };
    },
    post: async (url: string, data?: any, config?: any) => {
      const response = await axios.post(url, data, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return { data: response.data };
    },
    put: async (url: string, data?: any, config?: any) => {
      const response = await axios.put(url, data, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return { data: response.data };
    },
    delete: async (url: string, config?: any) => {
      const response = await axios.delete(url, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return { data: response.data };
    }
  };
};

// 創建認證 API 客戶端實例
const apiClient = createAuthApiClient(createAxiosAdapter());

// 向後兼容的 API 方法 - 保持原有介面
/**
 * Logs in a user.
 * @param {LoginRequest} credentials - The user's credentials.
 * @returns {Promise<LoginResponse>} A promise that resolves to the login response data (including token and user info).
 * @throws {Error} If the login request fails.
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiClient.login(credentials as AuthLoginRequest);
};

/**
 * 獲取當前登入用戶的資訊
 * @returns {Promise<EmployeeAccount>} 當前用戶資訊
 * @throws {Error} 如果請求失敗或用戶未登入
 */
export const getCurrentUser = async (): Promise<EmployeeAccount> => {
  return apiClient.getCurrentUser();
};

/**
 * 更新當前用戶的資訊
 * @param {UpdateUserRequest} updateData - 要更新的資料
 * @returns {Promise<EmployeeAccount>} 更新結果
 * @throws {Error} 如果請求失敗或用戶未登入
 */
export const updateCurrentUser = async (updateData: UpdateUserRequest): Promise<EmployeeAccount> => {
  return apiClient.updateCurrentUser(updateData as AuthUpdateRequest);
};

// V2 新增功能 - 直接匯出方法
export const validateToken = apiClient.validateToken.bind(apiClient);
export const refreshToken = apiClient.refreshToken.bind(apiClient);
export const logout = apiClient.logout.bind(apiClient);
export const changePassword = apiClient.changePassword.bind(apiClient);
export const requestPasswordReset = apiClient.requestPasswordReset.bind(apiClient);
export const confirmPasswordReset = apiClient.confirmPasswordReset.bind(apiClient);
export const checkUsernameAvailability = apiClient.checkUsernameAvailability.bind(apiClient);
export const checkEmailAvailability = apiClient.checkEmailAvailability.bind(apiClient);
export const getUserPermissions = apiClient.getUserPermissions.bind(apiClient);
export const hasPermission = apiClient.hasPermission.bind(apiClient);
export const getLoginHistory = apiClient.getLoginHistory.bind(apiClient);

// 業務邏輯方法
export const authService = {
  // 基本認證操作（向後兼容）
  login,
  getCurrentUser,
  updateCurrentUser,

  // V2 新增功能
  logout,
  validateToken,
  refreshToken,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  checkUsernameAvailability,
  checkEmailAvailability,
  getUserPermissions,
  hasPermission,
  getLoginHistory,

  // 業務邏輯方法
  /**
   * 檢查用戶是否已登入
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * 獲取本地存儲的用戶資訊
   */
  getStoredUser: (): EmployeeAccount | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('解析本地用戶資訊失敗:', error);
      return null;
    }
  },

  /**
   * 獲取本地存儲的 Token
   */
  getStoredToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * 儲存認證資訊到本地存儲
   */
  storeAuthData: (loginResponse: LoginResponse): void => {
    localStorage.setItem('token', loginResponse.token);
    localStorage.setItem('user', JSON.stringify(loginResponse.user));
    
    if (loginResponse.expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(loginResponse.expiresIn));
      localStorage.setItem('tokenExpiresAt', expiresAt.toISOString());
    }
  },

  /**
   * 清除本地存儲的認證資訊
   */
  clearAuthData: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
  },

  /**
   * 檢查 Token 是否即將過期
   */
  isTokenExpiringSoon: (minutesThreshold: number = 5): boolean => {
    const expiresAtStr = localStorage.getItem('tokenExpiresAt');
    if (!expiresAtStr) return false;

    const expiresAt = new Date(expiresAtStr);
    const now = new Date();
    const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    return diffMinutes <= minutesThreshold && diffMinutes > 0;
  },

  /**
   * 檢查 Token 是否已過期
   */
  isTokenExpired: (): boolean => {
    const expiresAtStr = localStorage.getItem('tokenExpiresAt');
    if (!expiresAtStr) return false;

    const expiresAt = new Date(expiresAtStr);
    const now = new Date();

    return now >= expiresAt;
  },

  /**
   * 解析 JWT Token
   */
  parseJWTToken: (token?: string): JWTPayload | null => {
    try {
      const tokenToUse = token || localStorage.getItem('token');
      if (!tokenToUse) return null;

      const base64Url = tokenToUse.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('解析 JWT Token 失敗:', error);
      return null;
    }
  },

  /**
   * 檢查用戶角色權限
   */
  hasRole: (role: string): boolean => {
    const user = authService.getStoredUser();
    return user?.role === role;
  },

  /**
   * 檢查用戶是否為管理員
   */
  isAdmin: (): boolean => {
    return authService.hasRole('admin');
  },

  /**
   * 檢查用戶是否為藥師
   */
  isPharmacist: (): boolean => {
    return authService.hasRole('pharmacist') || authService.isAdmin();
  },

  /**
   * 檢查用戶是否為員工
   */
  isStaff: (): boolean => {
    const user = authService.getStoredUser();
    return !!(user && ['admin', 'pharmacist', 'staff'].includes(user.role));
  },

  /**
   * 格式化用戶顯示名稱
   */
  formatUserDisplayName: (user?: EmployeeAccount): string => {
    const userToUse = user || authService.getStoredUser();
    if (!userToUse) return '未知用戶';
    
    return `${userToUse.username} (${authService.formatRoleDisplayName(userToUse.role)})`;
  },

  /**
   * 格式化角色顯示名稱
   */
  formatRoleDisplayName: (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: '管理員',
      pharmacist: '藥師',
      staff: '員工'
    };
    return roleMap[role] || role;
  },

  /**
   * 驗證登入表單資料
   */
  validateLoginData: (data: LoginRequest): string[] => {
    const errors: string[] = [];

    if (!data.password || data.password.trim().length === 0) {
      errors.push('密碼不能為空');
    }

    if (!data.username && !data.email) {
      errors.push('請輸入用戶名或電子郵件');
    }

    if (data.username && data.username.trim().length === 0) {
      errors.push('用戶名不能為空');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('電子郵件格式不正確');
    }

    return errors;
  },

  /**
   * 驗證密碼強度
   */
  validatePasswordStrength: (password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('密碼至少需要8個字元');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('密碼需要包含小寫字母');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('密碼需要包含大寫字母');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('密碼需要包含數字');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('密碼需要包含特殊字元');
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    };
  },

  /**
   * 自動刷新 Token（如果即將過期）
   */
  autoRefreshToken: async (): Promise<boolean> => {
    try {
      if (authService.isTokenExpiringSoon()) {
        const response = await refreshToken();
        if (response.token) {
          const currentUser = authService.getStoredUser();
          if (currentUser) {
            // 轉換 EmployeeAccount 到 LoginResponse.user 格式
            const userForStorage = {
              id: currentUser._id,
              username: currentUser.username,
              email: currentUser.email,
              role: currentUser.role,
              isAdmin: currentUser.role === 'admin',
              createdAt: currentUser.createdAt?.toString(),
              updatedAt: currentUser.updatedAt?.toString()
            };
            
            authService.storeAuthData({
              token: response.token,
              user: userForStorage,
              expiresIn: response.expiresIn
            });
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('自動刷新 Token 失敗:', error);
      return false;
    }
  },

  /**
   * 安全登出（清除所有認證資訊）
   */
  secureLogout: async (): Promise<void> => {
    try {
      // 嘗試通知後端登出
      await logout();
    } catch (error) {
      console.warn('後端登出失敗，但仍會清除本地資訊:', error);
    } finally {
      // 無論後端是否成功，都清除本地資訊
      authService.clearAuthData();
      
      // 重新導向到登入頁面
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
  }
};

// 匯出類型定義
export type {
  AuthLoginRequest,
  AuthUpdateRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  LoginRequest,
  UpdateUserRequest,
  LoginResponse,
  JWTPayload,
  EmployeeAccount
};

// 預設匯出（向後兼容）
export default authService;