import { EmbeddedAccountingEntry } from '@pharmacy-pos/shared';
import { ExtendedTransactionGroupWithEntries } from '../types';

/**
 * 計算交易群組總金額
 * @param entries 會計分錄數組
 * @returns 總金額
 */
export const calculateTotalAmount = (entries: EmbeddedAccountingEntry[]): number => {
  return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
};

/**
 * 檢查借貸平衡
 * @param entries 會計分錄數組
 * @returns 是否平衡
 */
export const isBalanced = (entries: EmbeddedAccountingEntry[]): boolean => {
  const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差
};

/**
 * 計算剩餘可用金額
 * @param group 交易群組
 * @returns 剩餘可用金額
 */
export const calculateAvailableAmount = (group: ExtendedTransactionGroupWithEntries): number => {
  const totalAmount = calculateTotalAmount(group.entries);
  
  if (!group.referencedByInfo || group.referencedByInfo.length === 0) {
    return totalAmount; // 沒有被引用，全額可用
  }
  
  // 使用後端提供的精確已使用金額資料
  // 計算實際已使用金額（從 referencedByInfo 中獲取，排除已取消的交易）
  const actualUsedAmount = group.referencedByInfo
    .filter(ref => ref.status !== 'cancelled') // 排除已取消的交易
    .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0);
  
  // 剩餘可用金額 = 總金額 - 實際已使用金額
  const availableAmount = totalAmount - actualUsedAmount;
  
  // 確保不會是負數
  return Math.max(0, availableAmount);
};

/**
 * 取得剩餘可用狀態顏色
 * @param availableAmount 可用金額
 * @param totalAmount 總金額
 * @returns 顏色代碼
 */
export const getAvailableAmountColor = (availableAmount: number, totalAmount: number): 'success' | 'warning' | 'error' | 'default' => {
  if (totalAmount === 0) return 'default';
  const percentage = (availableAmount / totalAmount) * 100;
  if (percentage >= 100) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
};

/**
 * 提取帳戶ID的工具函數
 * @param accountId 帳戶ID（可能是字符串或對象）
 * @returns 提取的帳戶ID
 */
export const extractAccountId = (accountId: string | any): string | null => {
  if (typeof accountId === 'string') {
    return accountId;
  }
  if (typeof accountId === 'object' && accountId?._id) {
    return accountId._id;
  }
  return null;
};