/**
 * 交易操作相關常數定義
 */

/**
 * 交易狀態常數
 */
export const TRANSACTION_STATUS = {
  DRAFT: 'draft' as const,
  CONFIRMED: 'confirmed' as const,
  CANCELLED: 'cancelled' as const,
} as const;

/**
 * 交易狀態標籤映射
 */
export const STATUS_LABELS = {
  [TRANSACTION_STATUS.CONFIRMED]: '已確認',
  [TRANSACTION_STATUS.DRAFT]: '草稿',
  [TRANSACTION_STATUS.CANCELLED]: '已取消',
} as const;

/**
 * 交易狀態顏色映射
 */
export const STATUS_COLORS = {
  [TRANSACTION_STATUS.CONFIRMED]: 'success',
  [TRANSACTION_STATUS.DRAFT]: 'warning',
  [TRANSACTION_STATUS.CANCELLED]: 'error',
} as const;

/**
 * 操作按鈕工具提示文字
 */
export const ACTION_TOOLTIPS = {
  VIEW: '查看詳情',
  EDIT: '編輯交易',
  COPY: '複製交易',
  CONFIRM: '確認交易',
  UNLOCK: '解鎖交易',
  DELETE: '刪除交易',
} as const;

/**
 * 資金狀態顯示相關常數
 */
export const FUNDING_STATUS = {
  ICONS: {
    FUNDING_SOURCE: '💰',
    REFERENCED: '🔗',
    SUCCESS: '✓',
  },
  LABELS: {
    FUNDING_SOURCE_TRACKING: '資金來源追蹤',
    REFERENCED_SITUATION: '被引用情況',
    TOTAL_AMOUNT: '總金額',
    USED_AMOUNT: '已使用',
    AVAILABLE_AMOUNT: '剩餘可用',
    TOTAL_USED_AMOUNT: '總使用金額',
    NO_AMOUNT_TRANSACTION: '無金額交易',
  },
} as const;

/**
 * 數值計算相關常數
 */
export const CALCULATION_CONSTANTS = {
  BALANCE_TOLERANCE: 0.01, // 借貸平衡允許的小數點誤差
  PERCENTAGE_THRESHOLDS: {
    HIGH: 100,
    MEDIUM: 50,
  },
} as const;

/**
 * 表格欄位標題
 */
export const TABLE_HEADERS = {
  TRANSACTION_DATE: '交易日期',
  DESCRIPTION: '交易描述',
  FLOW: '交易流向',
  ACCOUNT_AMOUNT: '本科目金額',
  RUNNING_BALANCE: '累計餘額',
  STATUS: '狀態',
  FUNDING_STATUS: '資金狀態',
  ACTIONS: '操作',
} as const;

/**
 * 複製交易資料的欄位標籤
 */
export const COPY_DATA_LABELS = {
  NUMBER: '編號',
  DESCRIPTION: '描述',
  DATE: '日期',
  STATUS: '狀態',
  AMOUNT: '金額',
} as const;