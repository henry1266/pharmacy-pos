/**
 * 共享輔助函數導出
 */

// 臨時導出一些輔助函數，以便 TypeScript 將此文件視為模組
export const formatCurrency = (amount: number, currency: string = 'TWD'): string => {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency }).format(amount);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-TW');
};