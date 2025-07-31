module.exports = {
  // 測試環境
  testEnvironment: 'node',

  // TypeScript 支援
  preset: 'ts-jest',

  // 根目錄
  rootDir: '.',

  // 只測試特定的檔案 - 增加到約 164+ 個測試
  testMatch: [
    '**/routes/__tests__/basic.test.ts',                    // 5 個測試
    '**/routes/__tests__/customers.test.ts',               // 15 個測試
    '**/routes/__tests__/customers.test.ts',               // 15 個測試
    '**/routes/__tests__/dashboard.test.ts',               // 15 個測試
    '**/routes/__tests__/inventory.test.ts',               // 15 個測試
    '**/routes/__tests__/middleware.test.ts',               // 15 個測試
    '**/routes/__tests__/monitoring.test.ts',          // 測試
    '**/routes/__tests__/products.real.test.ts',       // 測試
    '**/routes/__tests__/products.shared.test.ts',          // 約 13 個測試
    '**/routes/__tests__/products.simple.test.ts',          // 約 10 個測試
    '**/routes/__tests__/products.test.ts',                 // 20 個測試
    '**/routes/__tests__/products.integration.test.ts', // 測試
    '**/routes/__tests__/sales.test.ts',               // 測試
    '**/routes/__tests__/simple.test.ts',                   // 11 個測試
    '**/routes/__tests__/standalone.test.ts',               // 8 個測試
    '**/routes/__tests__/suppliers.test.ts',                // 測試
  ],

  // 忽略的檔案和目錄
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/uploads/'
  ],

  // 轉換忽略模式
  transformIgnorePatterns: [
    'node_modules/(?!(@material/material-color-utilities|@pharmacy-pos/shared)/)'
  ],

  // 關閉覆蓋率收集以加快速度
  collectCoverage: false,

  // 模組名稱映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@pharmacy-pos/shared/(.*)$': '<rootDir>/../shared/$1',
    '^@pharmacy-pos/shared$': '<rootDir>/../shared/index.ts',
    '^@material/material-color-utilities$': '<rootDir>/__mocks__/material-color-utilities.js'
  },

  // 轉換設定
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // 模組檔案副檔名
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],

  // 測試超時時間（毫秒）- 縮短以加快速度
  testTimeout: 15000,

  // 詳細輸出
  verbose: true,

  // 清除模擬
  clearMocks: true,

  // 恢復模擬
  restoreMocks: true,

  // 強制退出以避免掛起
  forceExit: true,

  // 檢測開放的句柄
  detectOpenHandles: true,

  // 序列運行測試以避免端口衝突
  maxWorkers: 1,

  // 設置檔案
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // 全域設定
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true
    }
  }
};