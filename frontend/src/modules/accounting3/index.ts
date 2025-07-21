/**
 * Accounting3 模組統一導出
 * 獨立的會計系統，不依賴 accounting2
 */

// 核心型別 (重新導出 shared 型別)
export * from '@pharmacy-pos/shared/types/accounting3';

// 階層管理型別
export type {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  HierarchyOperationResult,
  AccountHierarchyFilter,
  HierarchyExpandState,
  HierarchySelectionState,
  HierarchyRenderConfig,
  HierarchyDragOperation,
  HierarchyContextMenuItem,
  HierarchySyncState,
  HierarchyNodeId,
  HierarchyLevel,
  HierarchyPath
} from './types';

// 適配器 (預留給未來的外部系統整合)
// export * from './adapters';

// 核心服務
export { AccountHierarchyService } from './core/AccountHierarchyService';

// 業務服務
export { default as organizationService } from './services/organizationService';

// Features 導出 (新的功能模組架構)
export * from './features';

// 組件匯出 (舊的組件架構，保持向後相容)
export * from './components';

// 核心功能導出
export * from './core';

// 常數導出
export { HIERARCHY_CONSTANTS } from './types';