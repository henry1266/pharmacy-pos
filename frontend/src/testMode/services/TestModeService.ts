import axios from 'axios';
import TestModeConfig from '../config/TestModeConfig';
import type { TestModeLoginResult, TestModeUser } from '../types/TestModeTypes';

/**
 * 測試模式服務類
 * 處理測試模式相關的業務邏輯
 */
class TestModeServiceClass {
  /**
   * 檢查測試模式是否啟用
   */
  isEnabled(): boolean {
    return TestModeConfig.isEnabled();
  }

  /**
   * 執行測試模式登入
   */
  async performTestLogin(): Promise<TestModeLoginResult> {
    if (!this.isEnabled()) {
      throw new Error('測試模式未啟用');
    }

    const mockUser = TestModeConfig.getMockUser();
    const mockToken = TestModeConfig.getMockToken();

    // 模擬登入延遲
    await new Promise(resolve => setTimeout(resolve, 300));

    // 設置本地存儲
    this.setTestModeStorage(mockToken, mockUser);

    return {
      success: true,
      token: mockToken,
      user: mockUser,
      message: '測試模式登入成功'
    };
  }

  /**
   * 設置 axios 認證 headers
   */
  private setAuthToken(token: string | null): void {
    if (token) {
      // 同時設定兩種認證方式以確保相容性
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🧪 測試模式：已設置 axios 認證 headers');
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
      console.log('🧪 測試模式：已清除 axios 認證 headers');
    }
  }

  /**
   * 設置測試模式的本地存儲
   */
  private setTestModeStorage(token: string, user: TestModeUser): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isTestMode', 'true');
    localStorage.setItem('loginTime', Math.floor(Date.now() / 1000).toString());
    
    // 設置 axios 認證 headers
    this.setAuthToken(token);
  }

  /**
   * 清除測試模式的本地存儲
   */
  clearTestModeStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isTestMode');
    localStorage.removeItem('loginTime');
    
    // 清除 axios 認證 headers
    this.setAuthToken(null);
  }

  /**
   * 檢查當前是否處於測試模式會話
   */
  isInTestModeSession(): boolean {
    return localStorage.getItem('isTestMode') === 'true';
  }

  /**
   * 獲取測試模式用戶資料
   */
  getTestModeUser(): TestModeUser | null {
    if (!this.isInTestModeSession()) {
      return null;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr) as TestModeUser;
    } catch {
      return null;
    }
  }

  /**
   * 執行測試模式登出
   */
  performTestLogout(): void {
    this.clearTestModeStorage();
    console.log('🧪 測試模式：已登出');
  }

  /**
   * 檢查是否應該跳過資料庫操作
   */
  shouldSkipDatabaseOperations(): boolean {
    return this.isEnabled() && TestModeConfig.shouldSkipDatabaseOperations();
  }

  /**
   * 獲取模擬 API 響應
   */
  getMockApiResponse(endpoint: string, method: string = 'GET'): any {
    console.log(`🧪 測試模式：模擬 API 調用 ${method} ${endpoint}`);
    
    // 根據不同的端點返回模擬數據
    if (endpoint.includes('/dashboard')) {
      return {
        success: true,
        data: {
          totalSales: 0,
          totalPurchases: 0,
          totalInventory: 0,
          lowStockItems: [],
          recentTransactions: []
        }
      };
    }

    // 預設響應
    return {
      success: true,
      message: '測試模式模擬響應',
      data: []
    };
  }
}

// 導出單例實例
const TestModeService = new TestModeServiceClass();
export default TestModeService;