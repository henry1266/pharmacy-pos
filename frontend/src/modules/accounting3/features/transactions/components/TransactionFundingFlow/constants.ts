/**
 * Chip 樣式常量
 */
export const CHIP_STYLES = {
  fontSize: '0.75rem',
  height: 24,
  maxWidth: 80,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.75rem'
  }
};

/**
 * 表格標題常量
 */
export const TABLE_HEADERS = ['日期', '交易描述', '本次', '餘額/總額'];

/**
 * 交易類型常量
 */
export const TRANSACTION_TYPES = {
  SOURCE: 'source' as const,
  LINKED: 'linked' as const,
  REFERENCED: 'referenced' as const,
  CURRENT: 'current' as const
};

/**
 * 顏色常量
 */
export const COLORS = {
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
  HOVER_BG: '#f5f5f5'
};

/**
 * 表格行樣式常量
 */
export const TABLE_ROW_STYLES = {
  cursor: 'pointer',
  '&:hover': { backgroundColor: COLORS.HOVER_BG }
};