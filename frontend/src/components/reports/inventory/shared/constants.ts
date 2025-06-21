/**
 * 庫存報表模組共用常數定義
 */

// 圖表顏色配置
export const CHART_COLORS = {
  profit: '#00d97e',  // 綠色 - 正值
  loss: '#e53f3c',    // 紅色 - 負值
  stock: '#624bff'    // 藍色 - 庫存
} as const;

// 交易類型顏色配置
export const TRANSACTION_TYPE_COLORS = {
  進貨: 'var(--primary-color)',
  出貨: 'var(--warning-color)',
  銷售: 'var(--danger-color)',
  default: 'var(--text-secondary)'
} as const;

// 交易類型背景色配置
export const TRANSACTION_TYPE_BG_COLORS = {
  進貨: 'rgba(98, 75, 255, 0.1)',
  出貨: 'rgba(245, 166, 35, 0.1)',
  銷售: 'rgba(229, 63, 60, 0.1)',
  default: 'rgba(0, 0, 0, 0.05)'
} as const;

// 交易類型映射
export const TRANSACTION_TYPE_MAPPING = {
  purchase: '進貨',
  ship: '出貨',
  sale: '銷售',
  default: '其他'
} as const;

// 狀態顏色配置
export const STATUS_COLORS = {
  low: {
    bg: 'rgba(229, 63, 60, 0.1)',
    color: 'var(--danger-color)',
    text: '低庫存'
  },
  normal: {
    bg: 'rgba(0, 217, 126, 0.1)',
    color: 'var(--success-color)',
    text: '正常'
  }
} as const;

// 卡片共用樣式
export const CARD_STYLES = {
  borderRadius: 'var(--border-radius)',
  boxShadow: 'var(--card-shadow)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
} as const;

// 連接符號共用樣式
export const CONNECTOR_STYLES = {
  display: { xs: 'none', md: 'flex' },
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%'
} as const;

// 表格分頁選項
export const TABLE_PAGINATION_OPTIONS = [5, 10, 25, 50] as const;

// 圖表邊距配置
export const CHART_MARGINS = {
  top: 20,
  right: 30,
  left: 20,
  bottom: 60
} as const;

// 圖表高度
export const CHART_HEIGHT = 400;

// 懸浮視窗樣式
export const TOOLTIP_STYLES = {
  position: 'fixed',
  transform: 'translateX(-50%)',
  padding: '10px 15px',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(5px)',
  borderRadius: 'var(--border-radius)',
  boxShadow: 'var(--card-shadow)',
  zIndex: 1500,
  transition: 'opacity 0.2s ease-in-out'
} as const;