// AccountManagement 組件常數定義

export const ACCOUNT_MANAGEMENT_CONSTANTS = {
  // 預設值
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_SEARCH_DEBOUNCE: 300,
  DEFAULT_TREE_HEIGHT: 650,
  DEFAULT_CURRENCY: 'TWD',
  
  // 科目層級限制
  MAX_ACCOUNT_LEVEL: 4,
  
  // 對話框設定
  DIALOG_MAX_WIDTH: 'md' as const,
  
  // 搜尋設定
  SEARCH_MIN_LENGTH: 0,
  
  // 分頁設定
  PAGE_SIZE_OPTIONS: [10, 25, 50] as const,
  
  // 統計摘要網格配置
  STATS_GRID_CONFIG: {
    ENTRIES_COL: 3,
    DEBIT_COL: 3,
    CREDIT_COL: 3,
    BALANCE_COL: 3,
  },
  
  // 樹狀結構配置
  TREE_CONFIG: {
    INDENT_MULTIPLIER: 2,
    ICON_MIN_WIDTH: 32,
    EXPAND_ICON_WIDTH: 24,
  },
} as const;

// 會計科目類型選項
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'asset', label: '資產', color: '#4caf50' },
  { value: 'liability', label: '負債', color: '#f44336' },
  { value: 'equity', label: '權益', color: '#2196f3' },
  { value: 'revenue', label: '收入', color: '#ff9800' },
  { value: 'expense', label: '費用', color: '#9c27b0' }
] as const;

// 科目類型選項
export const TYPE_OPTIONS = [
  { value: 'cash', label: '現金' },
  { value: 'bank', label: '銀行' },
  { value: 'credit', label: '信用' },
  { value: 'investment', label: '投資' },
  { value: 'other', label: '其他' }
] as const;

// DataGrid 本地化文字
export const DATA_GRID_LOCALE_TEXT = {
  noRowsLabel: '暫無分錄資料',
  footerRowSelected: (count: number) => `已選擇 ${count} 行`,
  footerTotalRows: '總行數:',
  footerTotalVisibleRows: (visibleCount: number, totalCount: number) =>
    `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
  columnMenuLabel: '選單',
  columnMenuShowColumns: '顯示欄位',
  columnMenuFilter: '篩選',
  columnMenuHideColumn: '隱藏',
  columnMenuUnsort: '取消排序',
  columnMenuSortAsc: '升序排列',
  columnMenuSortDesc: '降序排列'
} as const;