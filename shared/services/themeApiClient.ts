/**
 * 主題 API 客戶端
 * 基於 BaseApiClient 實現主題相關的 API 操作
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { 
  UserTheme, 
  CreateUserThemeRequest, 
  UpdateUserThemeRequest,
  UserThemeQueryParams,
  DuplicateThemeRequest,
  DEFAULT_THEME_COLORS 
} from '../types/theme';

/**
 * 主題 API 客戶端類
 */
export class ThemeApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient, baseUrl: string = '/api') {
    super(httpClient, `${baseUrl}/user-themes`);
  }

  /**
   * 獲取指定用戶的所有主題
   */
  async getUserThemes(userId: string, params?: UserThemeQueryParams): Promise<UserTheme[]> {
    return this.getList<UserTheme>(`/user/${userId}`, params);
  }

  /**
   * 獲取指定用戶的預設主題（最新的一個）
   */
  async getUserDefaultTheme(userId: string): Promise<UserTheme> {
    return this.get<UserTheme>(`/user/${userId}/default`);
  }

  /**
   * 根據 ID 獲取特定主題
   */
  async getThemeById(id: string): Promise<UserTheme> {
    return this.getItem<UserTheme>('', id);
  }

  /**
   * 建立新主題
   */
  async createTheme(themeData: CreateUserThemeRequest): Promise<UserTheme> {
    return this.post<UserTheme>('', themeData);
  }

  /**
   * 更新主題
   */
  async updateTheme(id: string, themeData: Partial<UpdateUserThemeRequest>): Promise<UserTheme> {
    return this.put<UserTheme>(`/${id}`, themeData);
  }

  /**
   * 刪除主題
   */
  async deleteTheme(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('', id);
  }

  /**
   * 複製主題
   */
  async duplicateTheme(id: string, duplicateData: DuplicateThemeRequest): Promise<UserTheme> {
    return this.post<UserTheme>(`/${id}/duplicate`, duplicateData);
  }

  /**
   * 獲取預設顏色選項
   */
  async getDefaultColors(): Promise<typeof DEFAULT_THEME_COLORS> {
    return this.get<typeof DEFAULT_THEME_COLORS>('/colors/defaults');
  }

  /**
   * 搜尋用戶主題
   */
  async searchUserThemes(userId: string, searchTerm: string): Promise<UserTheme[]> {
    return this.getList<UserTheme>(`/user/${userId}`, { search: searchTerm });
  }

  /**
   * 根據模式獲取用戶主題
   */
  async getUserThemesByMode(userId: string, mode: 'light' | 'dark' | 'auto'): Promise<UserTheme[]> {
    return this.getList<UserTheme>(`/user/${userId}`, { mode });
  }

  /**
   * 批量刪除主題
   */
  async bulkDeleteThemes(ids: string[]): Promise<{ success: boolean; message?: string }> {
    return this.post<{ success: boolean; message?: string }>('/bulk-delete', { ids });
  }

  /**
   * 匯出用戶主題設定
   */
  async exportUserThemes(userId: string): Promise<UserTheme[]> {
    return this.get<UserTheme[]>(`/user/${userId}/export`);
  }

  /**
   * 匯入用戶主題設定
   */
  async importUserThemes(userId: string, themes: Partial<UserTheme>[]): Promise<UserTheme[]> {
    return this.post<UserTheme[]>(`/user/${userId}/import`, { themes });
  }

  /**
   * 重設用戶主題為預設值
   */
  async resetUserThemes(userId: string): Promise<{ success: boolean; message?: string }> {
    return this.post<{ success: boolean; message?: string }>(`/user/${userId}/reset`, {});
  }

  /**
   * 獲取主題使用統計
   */
  async getThemeStats(userId: string): Promise<{
    totalThemes: number;
    favoriteColors: string[];
    mostUsedMode: 'light' | 'dark' | 'auto';
    createdThisMonth: number;
  }> {
    return this.get<{
      totalThemes: number;
      favoriteColors: string[];
      mostUsedMode: 'light' | 'dark' | 'auto';
      createdThisMonth: number;
    }>(`/user/${userId}/stats`);
  }
}

/**
 * 創建主題 API 客戶端的工廠函數
 */
export const createThemeApiClient = (httpClient: HttpClient, baseUrl?: string): ThemeApiClient => {
  return new ThemeApiClient(httpClient, baseUrl);
};

/**
 * 預設匯出
 */
export default ThemeApiClient;