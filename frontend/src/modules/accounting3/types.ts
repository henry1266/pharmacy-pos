/**
 * Accounting3 科目階層結構型別定義
 * 整合 accounting2 階層管理功能到 accounting3 系統
 */

import { Account2 } from '@pharmacy-pos/shared/types/accounting2';

// 科目階層節點介面 (基於 accounting2 的 Account2，但擴展為樹狀結構)
export interface AccountHierarchyNode extends Account2 {
  // 樹狀結構屬性
  children: AccountHierarchyNode[];
  hasChildren: boolean;
  isExpanded: boolean;
  path: string[];
  // 新增 accounting3 特有屬性
  version: 'v3';
  compatibilityMode: 'accounting2' | 'accounting3' | 'hybrid';
  
  // 階層操作權限
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canAddChild: boolean;
    canMove: boolean;
  };
  
  // 統計資訊
  statistics?: {
    totalTransactions: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    lastTransactionDate?: Date | string;
  };
}

// 科目階層配置介面
export interface AccountHierarchyConfig {
  // 顯示設定
  showBalances: boolean;
  showStatistics: boolean;
  showInactiveAccounts: boolean;
  
  // 階層設定
  maxDepth: number;
  autoExpand: boolean;
  defaultExpandLevel: number;
  
  // 相容性設定
  enableAccounting2Compatibility: boolean;
  enableAccounting3Features: boolean;
  
  // 組織設定
  organizationId?: string | null;
  multiOrganizationMode: boolean;
}

// 階層操作結果介面
export interface HierarchyOperationResult {
  success: boolean;
  operation: 'create' | 'update' | 'delete' | 'move' | 'reorder';
  affectedNodes: string[]; // 受影響的節點 ID 陣列
  message?: string;
  error?: string;
  
  // 操作前後的狀態
  before?: {
    nodeCount: number;
    structure: Record<string, string[]>; // parentId -> childIds[]
  };
  after?: {
    nodeCount: number;
    structure: Record<string, string[]>;
  };
}

// 階層搜尋過濾器
export interface AccountHierarchyFilter {
  // 基本過濾
  accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  isActive?: boolean;
  hasBalance?: boolean;
  
  // 階層過濾
  parentId?: string;
  level?: number;
  maxLevel?: number;
  
  // 文字搜尋
  searchText?: string;
  searchFields?: ('code' | 'name' | 'description')[];
  
  // 組織過濾
  organizationId?: string | null;
  
  // 統計過濾
  minBalance?: number;
  maxBalance?: number;
  hasTransactions?: boolean;
}

// 階層拖拽操作介面
export interface HierarchyDragOperation {
  sourceNodeId: string;
  targetNodeId: string;
  operation: 'move-into' | 'move-before' | 'move-after';
  
  // 驗證結果
  isValid: boolean;
  validationErrors?: string[];
  
  // 預覽資訊
  preview?: {
    newParentId?: string;
    newLevel: number;
    affectedChildren: string[];
  };
}

// 階層展開狀態管理
export interface HierarchyExpandState {
  expandedNodes: Set<string>;
  autoExpandedNodes: Set<string>; // 自動展開的節點
  
  // 展開操作
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  toggleNode: (nodeId: string) => void;
  
  // 批量操作
  expandAll: () => void;
  collapseAll: () => void;
  expandToLevel: (level: number) => void;
  
  // 智能展開
  expandToNode: (nodeId: string) => void; // 展開到特定節點的路徑
  expandByFilter: (filter: AccountHierarchyFilter) => void;
}

// 階層選擇狀態管理
export interface HierarchySelectionState {
  selectedNodeId: string | null;
  multiSelectEnabled: boolean;
  selectedNodeIds: Set<string>;
  
  // 選擇操作
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  clearSelection: () => void;
  
  // 批量選擇
  selectAll: () => void;
  selectByFilter: (filter: AccountHierarchyFilter) => void;
  selectChildren: (parentNodeId: string) => void;
  selectSiblings: (nodeId: string) => void;
}

// 階層上下文選單項目
export interface HierarchyContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  
  // 權限檢查
  requiresPermission?: keyof AccountHierarchyNode['permissions'];
  
  // 操作處理
  onClick: (nodeId: string, node: AccountHierarchyNode) => void;
  
  // 子選單
  children?: HierarchyContextMenuItem[];
}

// 階層渲染配置
export interface HierarchyRenderConfig {
  // 節點渲染
  showNodeIcons: boolean;
  showNodeCodes: boolean;
  showNodeBalances: boolean;
  showNodeStatistics: boolean;
  
  // 樣式配置
  indentSize: number;
  nodeHeight: number;
  iconSize: 'small' | 'medium' | 'large';
  
  // 互動配置
  enableDragDrop: boolean;
  enableContextMenu: boolean;
  enableKeyboardNavigation: boolean;
  
  // 虛擬化配置
  enableVirtualization: boolean;
  virtualItemHeight: number;
  overscanCount: number;
}

// 階層同步狀態
export interface HierarchySyncState {
  isSyncing: boolean;
  lastSyncTime?: Date;
  syncErrors: string[];
  
  // 衝突解決
  conflicts: Array<{
    nodeId: string;
    type: 'structure' | 'data' | 'permission';
    description: string;
    resolution?: 'accounting2' | 'accounting3' | 'manual';
  }>;
  
  // 同步統計
  syncStats: {
    totalNodes: number;
    syncedNodes: number;
    failedNodes: number;
    skippedNodes: number;
  };
}

// 型別別名
export type HierarchyNodeId = string;
export type HierarchyLevel = number;
export type HierarchyPath = string[];

// 常數定義
export const HIERARCHY_CONSTANTS = {
  MAX_DEPTH: 10,
  DEFAULT_EXPAND_LEVEL: 2,
  MIN_NODE_HEIGHT: 32,
  MAX_NODE_HEIGHT: 80,
  DEFAULT_INDENT_SIZE: 24,
  
  // 權限常數
  PERMISSIONS: {
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    CREATE_CHILD: 'createChild',
    MOVE: 'move'
  } as const,
  
  // 操作類型
  OPERATIONS: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    MOVE: 'move',
    REORDER: 'reorder'
  } as const
} as const;