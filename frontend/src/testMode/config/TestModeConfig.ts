import type { TestModeConfig as ITestModeConfig, TestModeUser } from '../types/TestModeTypes';

/**
 * 測試模式的預設配置
 */
const DEFAULT_TEST_USER: TestModeUser = {
  id: 'test-user-id',
  name: '測試用戶',
  username: 'testuser',
  email: 'test@example.com',
  role: '測試模式'
};

const DEFAULT_TEST_TOKEN = 'test-mode-token';

/**
 * 測試模式配置類
 */
class TestModeConfigClass {
  private config: ITestModeConfig;

  constructor() {
    this.config = {
      enabled: process.env.REACT_APP_TEST_MODE === 'true',
      mockUser: DEFAULT_TEST_USER,
      mockToken: DEFAULT_TEST_TOKEN,
      skipDatabaseOperations: true
    };
  }

  /**
   * 檢查測試模式是否啟用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 獲取模擬用戶資料
   */
  getMockUser(): TestModeUser {
    return { ...this.config.mockUser };
  }

  /**
   * 獲取模擬 Token
   */
  getMockToken(): string {
    return this.config.mockToken;
  }

  /**
   * 檢查是否跳過資料庫操作
   */
  shouldSkipDatabaseOperations(): boolean {
    return this.config.skipDatabaseOperations;
  }

  /**
   * 獲取完整配置
   */
  getConfig(): ITestModeConfig {
    return { ...this.config };
  }

  /**
   * 更新配置（僅用於測試）
   */
  updateConfig(newConfig: Partial<ITestModeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 導出單例實例
const TestModeConfig = new TestModeConfigClass();
export default TestModeConfig;