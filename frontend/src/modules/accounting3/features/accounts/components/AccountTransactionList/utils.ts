import { EmbeddedAccountingEntry } from '@pharmacy-pos/shared/types/accounting2';
import { ExtendedTransactionGroupWithEntries, TransactionStatus, ChipColor } from './types';

/**
 * 格式化日期為台灣本地格式
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW');
};

/**
 * 格式化貨幣為台幣格式
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD'
  }).format(amount);
};

/**
 * 計算交易群組總金額（借方金額總和）
 */
export const calculateTotalAmount = (entries: any[]): number => {
  return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
};

/**
 * 取得狀態標籤的中文顯示
 */
export const getStatusLabel = (status: TransactionStatus): string => {
  switch (status) {
    case 'confirmed': return '已確認';
    case 'draft': return '草稿';
    case 'cancelled': return '已取消';
    default: return status;
  }
};

/**
 * 取得狀態對應的顏色
 */
export const getStatusColor = (status: TransactionStatus): ChipColor => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'draft': return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

/**
 * 檢查交易分錄是否借貸平衡
 */
export const isBalanced = (entries: EmbeddedAccountingEntry[]): boolean => {
  const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差
};

/**
 * 複製交易資料到剪貼簿
 */
export const copyTransactionToClipboard = async (transaction: ExtendedTransactionGroupWithEntries): Promise<void> => {
  try {
    const transactionData = {
      編號: (transaction as any).groupNumber || 'N/A',
      描述: transaction.description,
      日期: formatDate(transaction.transactionDate),
      狀態: getStatusLabel(transaction.status),
      金額: formatCurrency(calculateTotalAmount(transaction.entries || []))
    };
    
    const textToCopy = Object.entries(transactionData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    await navigator.clipboard.writeText(textToCopy);
    console.log('交易資料已複製到剪貼簿');
  } catch (err) {
    console.error('複製失敗:', err);
    throw err;
  }
};

/**
 * 計算剩餘可用金額（使用後端提供的精確資料）
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
  
  console.log(`💰 交易 ${(group as any).groupNumber} 剩餘可用金額計算:`, {
    totalAmount,
    actualUsedAmount,
    availableAmount,
    referencedByCount: group.referencedByInfo.length,
    referencedBy: group.referencedByInfo.map(ref => ({
      groupNumber: ref.groupNumber,
      amount: ref.totalAmount,
      status: ref.status
    }))
  });
  
  // 確保不會是負數
  return Math.max(0, availableAmount);
};

/**
 * 取得剩餘可用狀態顏色
 */
export const getAvailableAmountColor = (availableAmount: number, totalAmount: number): ChipColor => {
  if (totalAmount === 0) return 'default';
  const percentage = (availableAmount / totalAmount) * 100;
  if (percentage >= 100) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
};