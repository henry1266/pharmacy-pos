/**
 * 測試模式相關的類型定義
 */

export interface TestModeUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface TestModeConfig {
  enabled: boolean;
  mockUser: TestModeUser;
  mockToken: string;
  skipDatabaseOperations: boolean;
}

export interface TestModeState {
  isTestMode: boolean;
  isTestModeEnabled: boolean;
}

export interface TestModeLoginResult {
  success: boolean;
  token: string;
  user: TestModeUser;
  message: string;
}