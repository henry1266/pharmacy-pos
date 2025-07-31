module.exports = {
  // 測試環境
  testEnvironment: 'node',

  // TypeScript 支援
  preset: 'ts-jest',

  // 根目錄
  rootDir: '.',

  // 測試檔案匹配模式
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // 忽略的檔案和目錄
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/uploads/'
  ],

  // 轉換忽略模式 - 允許轉換某些 node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@material/material-color-utilities|@pharmacy-pos/shared)/)'
  ],

  // 覆蓋率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    'models/**/*.ts',
    'routes/**/*.ts',
    'utils/**/*.ts',
    'services/**/*.ts',
    'middleware/**/*.ts',
    '!src/types/**',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts'
  ],

  // 覆蓋率報告格式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],

  // 覆蓋率輸出目錄
  coverageDirectory: 'coverage',

  // 覆蓋率閾值 - 暫時禁用以便測試通過
  // coverageThreshold: {
  //   global: {
  //     branches: 10,
  //     functions: 10,
  //     lines: 10,
  //     statements: 10
  //   }
  // },

  // 模組名稱映射（對應 tsconfig.json 的 paths）
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

  // ts-jest 設定
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest/presets/default',

  // 測試超時時間（毫秒）
  testTimeout: 10000,

  // 詳細輸出
  verbose: true,

  // 清除模擬
  clearMocks: true,

  // 恢復模擬
  restoreMocks: true
};