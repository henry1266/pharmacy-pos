/**
 * 主題服務 V2 - 使用統一的 shared API 客戶端
 * 整合 BaseApiClient 架構
 */

import {
  UserTheme,
  DEFAULT_THEME_COLORS,
  EnhancedGeneratedPalette
} from '@pharmacy-pos/shared';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';
import {
  generateThemePalette,
  enhancePaletteWithMaterial3,
  Material3SchemeType
} from '@pharmacy-pos/shared/utils';

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
    // 優先使用環境變數，如果沒有則動態生成
    if (process.env.REACT_APP_API_URL) {
      this.baseUrl = process.env.REACT_APP_API_URL;
    } else {
      const host = process.env.REACT_APP_API_HOST || '192.168.68.90';
      const port = process.env.REACT_APP_API_PORT || '5000';
      this.baseUrl = `http://${host}:${port}`;
    }
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

  // === Material 3 增強功能 ===

  // 使用 Material 3 生成主題
  async createMaterial3Theme(
    primaryColor: string,
    themeName: string,
    schemeType: Material3SchemeType = 'tonalSpot'
  ): Promise<UserTheme> {
    try {
      // 生成基礎調色板
      const basePalette = generateThemePalette(primaryColor);
      
      // 增強為 Material 3 調色板
      const enhancedPalette = enhancePaletteWithMaterial3(basePalette, primaryColor, schemeType);
      
      const themeData: Partial<UserTheme> = {
        themeName,
        primaryColor,
        generatedPalette: enhancedPalette,
        mode: 'light'
      };

      return this.createTheme(themeData);
    } catch (error) {
      throw new Error('Material 3 主題建立失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  }

  // 升級現有主題為 Material 3
  async upgradeToMaterial3(themeId: string, schemeType: Material3SchemeType = 'tonalSpot'): Promise<UserTheme> {
    try {
      const themes = await this.getUserThemes();
      const existingTheme = themes.find(theme => theme._id === themeId);
      
      if (!existingTheme) {
        throw new Error('找不到指定的主題');
      }

      // 生成 Material 3 增強調色板
      const enhancedPalette = enhancePaletteWithMaterial3(
        existingTheme.generatedPalette,
        existingTheme.primaryColor,
        schemeType
      );

      const updatedTheme: Partial<UserTheme> = {
        ...existingTheme,
        generatedPalette: enhancedPalette
      };

      return this.updateTheme(themeId, updatedTheme);
    } catch (error) {
      throw new Error('主題升級失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  }

  // 獲取 Material 3 調色方案選項
  getMaterial3SchemeOptions(): Array<{ value: Material3SchemeType; label: string; description: string }> {
    return [
      {
        value: 'tonalSpot',
        label: '色調點',
        description: '預設方案，平衡色彩與可用性'
      },
      {
        value: 'content',
        label: '內容導向',
        description: '保持原色忠實度，適合品牌色彩'
      },
      {
        value: 'fidelity',
        label: '忠實度',
        description: '平衡色彩忠實度與可用性'
      },
      {
        value: 'vibrant',
        label: '鮮豔',
        description: '高飽和度，適合活潑的設計'
      },
      {
        value: 'neutral',
        label: '中性',
        description: '低飽和度，適合專業的設計'
      },
      {
        value: 'monochrome',
        label: '單色',
        description: '黑白灰調色板，極簡風格'
      }
    ];
  }

  // 預覽 Material 3 主題效果
  async previewMaterial3Theme(
    primaryColor: string,
    schemeType: Material3SchemeType = 'tonalSpot'
  ): Promise<EnhancedGeneratedPalette> {
    try {
      const basePalette = generateThemePalette(primaryColor);
      return enhancePaletteWithMaterial3(basePalette, primaryColor, schemeType);
    } catch (error) {
      throw new Error('主題預覽失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  }

  // 批量升級主題為 Material 3
  async batchUpgradeToMaterial3(
    themeIds: string[],
    schemeType: Material3SchemeType = 'tonalSpot'
  ): Promise<UserTheme[]> {
    const results: UserTheme[] = [];
    const errors: string[] = [];

    for (const themeId of themeIds) {
      try {
        const upgraded = await this.upgradeToMaterial3(themeId, schemeType);
        results.push(upgraded);
      } catch (error) {
        errors.push(`主題 ${themeId}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('部分主題升級失敗:', errors);
    }

    return results;
  }
}

export const themeServiceV2 = new ThemeServiceV2();