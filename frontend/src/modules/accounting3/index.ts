/**
 * Accounting3 模組統一導出
 * 
 * 此文件將導出所有 accounting3 模組的公共 API
 */

// 導出核心功能
export * from './core';

// 導出共用 UI 元件
export * from './ui';

// 導出共享資源
export * from './shared';

// 導出功能模組
export * from './accounts';
export * from './organizations';
export * from './transactions';

// 向後兼容 (臨時)
// 當完全遷移後，這些導出將被移除
export * as features from './features';
export * as components from './components';
export * as pages from './pages';