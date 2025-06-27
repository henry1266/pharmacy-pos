/**
 * 主題服務 V2 - 使用統一的 shared API 客戶端
 * 整合 BaseApiClient 架構
 */

import { ThemeApiClient } from '@pharmacy-pos/shared/services/themeApiClient';
import { BaseApiClient } from '@pharmacy-pos/shared/services/baseApiClient';
import { UserTheme, CreateUserThemeRequest, UpdateUserThemeRequest, DEFAULT_THEME_COLORS } from '@pharmacy-pos/shared/types/theme';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';

/**
 * HTTP 客戶端實作
 */
class HttpClientImpl {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'x-auth-token': token } : {};
  }

  async request<T>(config: {
    method: string;
    url: string;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<{ data: T }> {
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config.headers
      },
      ...(config.data && { body: JSON.stringify(config.data) })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  }
}

/**
 * 主題服務類別 V2 - 使用認證端點
 */
export class ThemeServiceV2 {
  private baseUrl: string;
  private httpClient: HttpClientImpl;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.httpClient = new HttpClientImpl();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'x-auth-token': token } : {};
  }

  private async makeRequest<T>(method: string, url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      ...(data && { body: JSON.stringify(data) })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  // 獲取用戶主題列表
  async getUserThemes(): Promise<UserTheme[]> {
    const response = await this.makeRequest<ApiResponse<UserTheme[]>>('GET', '/api/themes');
    return response.data;
  }

  // 建立新主題
  async createTheme(themeData: Partial<UserTheme>): Promise<UserTheme> {
    const response = await this.makeRequest<ApiResponse<UserTheme>>('POST', '/api/themes', themeData);
    return response.data;
  }

  // 更新主題
  async updateTheme(themeId: string, themeData: Partial<UserTheme>): Promise<UserTheme> {
    const response = await this.makeRequest<ApiResponse<UserTheme>>('PUT', `/api/themes/${themeId}`, themeData);
    return response.data;
  }

  // 刪除主題
  async deleteTheme(themeId: string): Promise<void> {
    await this.makeRequest<ApiResponse<{ message: string }>>('DELETE', `/api/themes/${themeId}`);
  }

  // 獲取預設顏色
  async getDefaultColors(): Promise<typeof DEFAULT_THEME_COLORS> {
    const response = await this.makeRequest<ApiResponse<typeof DEFAULT_THEME_COLORS>>('GET', '/api/themes/default-colors');
    return response.data;
  }

  // 設定當前主題
  async setCurrentTheme(themeId: string): Promise<UserTheme> {
    const response = await this.makeRequest<ApiResponse<UserTheme>>('PUT', `/api/themes/current/${themeId}`, {});
    return response.data;
  }

  // 獲取當前主題
  async getCurrentTheme(): Promise<UserTheme | null> {
    try {
      const response = await this.makeRequest<ApiResponse<UserTheme | null>>('GET', '/api/themes/current');
      return response.data;
    } catch (error) {
      console.error('獲取當前主題失敗:', error);
      return null;
    }
  }

  // 獲取當前用戶資料（包含主題設定）
  async getCurrentUser(): Promise<any> {
    const response = await this.makeRequest<ApiResponse<any>>('GET', '/api/auth');
    return response.data;
  }


  // 複製主題
  async duplicateTheme(themeId: string, newName: string): Promise<UserTheme> {
    const themes = await this.getUserThemes();
    const originalTheme = themes.find(theme => theme._id === themeId);
    
    if (!originalTheme) {
      throw new Error('找不到要複製的主題');
    }

    const duplicatedTheme = {
      ...originalTheme,
      themeName: newName,
      _id: undefined, // 讓後端生成新的 ID
      createdAt: undefined,
      updatedAt: undefined
    };

    return this.createTheme(duplicatedTheme);
  }

  // 匯出主題
  async exportTheme(themeId: string): Promise<string> {
    const themes = await this.getUserThemes();
    const theme = themes.find(t => t._id === themeId);
    
    if (!theme) {
      throw new Error('找不到要匯出的主題');
    }

    // 移除不需要匯出的欄位
    const exportData = {
      ...theme,
      _id: undefined,
      userId: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };

    return JSON.stringify(exportData, null, 2);
  }

  // 匯入主題
  async importTheme(themeJson: string): Promise<UserTheme> {
    try {
      const themeData = JSON.parse(themeJson);
      
      // 驗證必要欄位
      if (!themeData.themeName || !themeData.primaryColor) {
        throw new Error('主題資料格式不正確');
      }

      return this.createTheme(themeData);
    } catch (error) {
      throw new Error('主題匯入失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  }
}

export const themeServiceV2 = new ThemeServiceV2();