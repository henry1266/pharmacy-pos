/**
 * 主題服務 V2 - 使用統一 API 客戶端
 * 基於 shared 模組的主題管理服務
 */

import axios from 'axios';
import { createThemeApiClient, HttpClient } from '@pharmacy-pos/shared';
import type { 
  UserTheme, 
  CreateUserThemeRequest, 
  UpdateUserThemeRequest,
  UserThemeQueryParams,
  DuplicateThemeRequest,
  DEFAULT_THEME_COLORS 
} from '@pharmacy-pos/shared';

/**
 * Axios 適配器 - 實現 HttpClient 介面
 */
const axiosAdapter: HttpClient = {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete,
};

/**
 * 創建主題 API 客戶端實例
 */
const themeApiClient = createThemeApiClient(axiosAdapter);

/**
 * 主題服務 V2 - 前端適配器
 * 使用方法綁定實現零重複代碼
 */
export const themeServiceV2 = {
  // 基本 CRUD 操作
  getUserThemes: themeApiClient.getUserThemes.bind(themeApiClient),
  getUserDefaultTheme: themeApiClient.getUserDefaultTheme.bind(themeApiClient),
  getThemeById: themeApiClient.getThemeById.bind(themeApiClient),
  createTheme: themeApiClient.createTheme.bind(themeApiClient),
  updateTheme: themeApiClient.updateTheme.bind(themeApiClient),
  deleteTheme: themeApiClient.deleteTheme.bind(themeApiClient),
  
  // 進階功能
  duplicateTheme: themeApiClient.duplicateTheme.bind(themeApiClient),
  getDefaultColors: themeApiClient.getDefaultColors.bind(themeApiClient),
  searchUserThemes: themeApiClient.searchUserThemes.bind(themeApiClient),
  getUserThemesByMode: themeApiClient.getUserThemesByMode.bind(themeApiClient),
  
  // 批量操作
  bulkDeleteThemes: themeApiClient.bulkDeleteThemes.bind(themeApiClient),
  exportUserThemes: themeApiClient.exportUserThemes.bind(themeApiClient),
  importUserThemes: themeApiClient.importUserThemes.bind(themeApiClient),
  resetUserThemes: themeApiClient.resetUserThemes.bind(themeApiClient),
  
  // 統計功能
  getThemeStats: themeApiClient.getThemeStats.bind(themeApiClient),
};

/**
 * 便利函數：獲取當前用戶的主題
 */
export const getCurrentUserThemes = async (): Promise<UserTheme[]> => {
  // 這裡應該從認證服務獲取當前用戶 ID
  // 暫時使用硬編碼，實際應用中需要整合認證系統
  const currentUserId = localStorage.getItem('userId') || 'default-user';
  return themeServiceV2.getUserThemes(currentUserId);
};

/**
 * 便利函數：獲取當前用戶的預設主題
 */
export const getCurrentUserDefaultTheme = async (): Promise<UserTheme | null> => {
  try {
    const currentUserId = localStorage.getItem('userId') || 'default-user';
    return await themeServiceV2.getUserDefaultTheme(currentUserId);
  } catch (error) {
    console.warn('無法獲取預設主題，可能用戶尚未設定主題:', error);
    return null;
  }
};

/**
 * 便利函數：為當前用戶建立主題
 */
export const createThemeForCurrentUser = async (
  themeData: Omit<CreateUserThemeRequest, 'userId'>
): Promise<UserTheme> => {
  const currentUserId = localStorage.getItem('userId') || 'default-user';
  return themeServiceV2.createTheme({
    ...themeData,
    userId: currentUserId
  });
};

/**
 * 便利函數：搜尋當前用戶的主題
 */
export const searchCurrentUserThemes = async (searchTerm: string): Promise<UserTheme[]> => {
  const currentUserId = localStorage.getItem('userId') || 'default-user';
  return themeServiceV2.searchUserThemes(currentUserId, searchTerm);
};

/**
 * 便利函數：獲取當前用戶指定模式的主題
 */
export const getCurrentUserThemesByMode = async (
  mode: 'light' | 'dark' | 'auto'
): Promise<UserTheme[]> => {
  const currentUserId = localStorage.getItem('userId') || 'default-user';
  return themeServiceV2.getUserThemesByMode(currentUserId, mode);
};

/**
 * 便利函數：重設當前用戶的主題
 */
export const resetCurrentUserThemes = async (): Promise<{ success: boolean; message?: string }> => {
  const currentUserId = localStorage.getItem('userId') || 'default-user';
  return themeServiceV2.resetUserThemes(currentUserId);
};

/**
 * 便利函數：獲取當前用戶的主題統計
 */
export const getCurrentUserThemeStats = async () => {
  const currentUserId = localStorage.getItem('userId') || 'default-user';
  return themeServiceV2.getThemeStats(currentUserId);
};

/**
 * 預設匯出
 */
export default themeServiceV2;

// 型別匯出
export type { 
  UserTheme, 
  CreateUserThemeRequest, 
  UpdateUserThemeRequest,
  UserThemeQueryParams,
  DuplicateThemeRequest 
};

// 常數匯出
export { DEFAULT_THEME_COLORS };