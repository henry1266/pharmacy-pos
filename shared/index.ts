/**
 * Shared 模組主要匯出檔案
 * 統一匯出所有共享的型別、常數、工具函數等
 */

// 型別定義
export * from './types/entities';
export * from './types/api';

// 列舉常數
export * from './enums';

// 常數定義
export * from './constants';

// 工具函數型別
export * from './utils';

// Schema 驗證
export * from './schemas';

/**
 * 版本資訊
 */
export const SHARED_VERSION = '1.0.0';

/**
 * 模組資訊
 */
export const SHARED_INFO = {
  name: 'Pharmacy POS Shared Types',
  version: SHARED_VERSION,
  description: '藥局 POS 系統共享型別定義',
  author: 'Development Team',
  license: 'MIT'
} as const;