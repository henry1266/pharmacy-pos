/**
 * 認證 API 客戶端
 * 基於 BaseApiClient 的認證管理服務
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type {
  LoginRequest,
  AuthResponse,
  LoginResponse,
  UpdateUserRequest
} from '../types/api';
import type { EmployeeAccount } from '../types/entities';

/**
 * 認證相關請求型別
 */
export interface AuthLoginRequest extends LoginRequest {}

export interface AuthUpdateRequest extends UpdateUserRequest {}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: EmployeeAccount;
  expiresAt?: string;
}

/**
 * 認證 API 客戶端類
 */
export class AuthApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient, baseUrl: string = '/api') {
    super(httpClient, `${baseUrl}/auth`);
  }

  /**
   * 用戶登入
   */
  async login(credentials: AuthLoginRequest): Promise<LoginResponse> {
    const response = await this.post<any>('', credentials);
    
    // 處理包裝格式的響應 { success: true, data: LoginResponse }
    if (response.success && response.data) {
      return response.data;
    }
    
    // 處理直接返回 LoginResponse 的響應
    if (response.token && response.user) {
      return response as LoginResponse;
    }
    
    throw new Error('登入失敗，未收到完整的驗證資訊');
  }

  /**
   * 獲取當前用戶資訊
   */
  async getCurrentUser(): Promise<EmployeeAccount> {
    const response = await this.get<{
      success: boolean;
      message?: string;
      data: EmployeeAccount;
    }>('');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('獲取用戶資訊失敗');
  }

  /**
   * 更新當前用戶資訊
   */
  async updateCurrentUser(updateData: AuthUpdateRequest): Promise<EmployeeAccount> {
    const response = await this.put<{
      success: boolean;
      message?: string;
      data: EmployeeAccount;
    }>('/update', updateData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('更新用戶資訊失敗');
  }

  /**
   * 驗證 Token 有效性
   */
  async validateToken(token?: string): Promise<TokenValidationResponse> {
    try {
      const response = await this.get<TokenValidationResponse>('/validate', 
        token ? { token } : undefined
      );
      return response;
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<{ token: string; expiresIn?: string }> {
    return this.post<{ token: string; expiresIn?: string }>('/refresh');
  }

  /**
   * 用戶登出
   */
  async logout(): Promise<{ success: boolean; message?: string }> {
    return this.post<{ success: boolean; message?: string }>('/logout');
  }

  /**
   * 修改密碼
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<{ success: boolean; message?: string }> {
    return this.put<{ success: boolean; message?: string }>('/change-password', passwordData);
  }

  /**
   * 請求密碼重設
   */
  async requestPasswordReset(resetData: PasswordResetRequest): Promise<{ success: boolean; message?: string }> {
    return this.post<{ success: boolean; message?: string }>('/reset-password', resetData);
  }

  /**
   * 確認密碼重設
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return this.post<{ success: boolean; message?: string }>('/reset-password/confirm', {
      token,
      newPassword
    });
  }

  /**
   * 檢查用戶名是否可用
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    return this.get<{ available: boolean }>('/check-username', { username });
  }

  /**
   * 檢查電子郵件是否可用
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    return this.get<{ available: boolean }>('/check-email', { email });
  }

  /**
   * 獲取用戶權限列表
   */
  async getUserPermissions(): Promise<string[]> {
    const response = await this.get<{ permissions: string[] }>('/permissions');
    return response.permissions || [];
  }

  /**
   * 檢查用戶是否有特定權限
   */
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const response = await this.get<{ hasPermission: boolean }>(`/permissions/${permission}`);
      return response.hasPermission;
    } catch (error) {
      return false;
    }
  }

  /**
   * 獲取登入歷史記錄
   */
  async getLoginHistory(params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{
    _id: string;
    loginTime: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }>> {
    return this.getList<{
      _id: string;
      loginTime: string;
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
    }>('/login-history', params);
  }
}

/**
 * 創建認證 API 客戶端實例的工廠函數
 */
export const createAuthApiClient = (httpClient: HttpClient, baseUrl?: string): AuthApiClient => {
  return new AuthApiClient(httpClient, baseUrl);
};