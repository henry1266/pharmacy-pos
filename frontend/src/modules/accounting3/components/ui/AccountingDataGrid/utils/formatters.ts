/**
 * 格式化日期為本地日期字符串
 * @param dateString 日期字符串或日期對象
 * @returns 格式化後的日期字符串
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('zh-TW');
};

/**
 * 格式化數字為台幣貨幣格式
 * @param amount 金額
 * @returns 格式化後的貨幣字符串
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD'
  }).format(amount);
};