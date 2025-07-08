/**
 * 格式化工具函數
 */

/**
 * 格式化金額顯示
 */
export const formatCurrency = (amount: number, currency = 'TWD'): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * 格式化數字（千分位）
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-TW').format(num);
};

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM/DD':
      return `${month}/${day}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * 格式化時間
 */
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 格式化日期時間
 */
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};