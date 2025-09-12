/**
 * 員工模組 - 核心 Hooks 統一入口
 * 匯出所有核心業務邏輯 hooks
 */

// 員工帳號管理 Hook
export { useEmployeeAccounts, default as useEmployeeAccountsDefault } from './useEmployeeAccounts';

// 員工排班管理 Hook
export { useEmployeeScheduling, default as useEmployeeSchedulingDefault } from './useEmployeeScheduling';

// 加班管理 Hook
export { useOvertimeManager, default as useOvertimeManagerDefault } from './useOvertimeManager';

// 班次時間配置管理 Hook
export { useShiftTimeConfig, default as useShiftTimeConfigDefault } from './useShiftTimeConfig';

// 加班數據處理 Hook
//export { default as useOvertimeData } from './useOvertimeData';

// 統一的 hooks 集合
//export const employeeCoreHooks = {
  //useEmployeeAccounts: () => import('./useEmployeeAccounts').then(m => m.useEmployeeAccounts),
  //useEmployeeScheduling: () => import('./useEmployeeScheduling').then(m => m.useEmployeeScheduling),
  //useOvertimeManager: () => import('./useOvertimeManager').then(m => m.useOvertimeManager),
  //useShiftTimeConfig: () => import('./useShiftTimeConfig').then(m => m.useShiftTimeConfig),
  //useOvertimeData: () => import('./useOvertimeData').then(m => m.default)
//};