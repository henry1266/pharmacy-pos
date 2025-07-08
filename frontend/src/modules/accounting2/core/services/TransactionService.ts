import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { transactionGroupWithEntriesService } from '../../../../services/transactionGroupWithEntriesService';

// 交易相關介面定義
interface TransactionSummary {
  totalDebit: number;
  totalCredit: number;
  transactionCount: number;
  balanceDifference: number;
  isBalanced: boolean;
}

interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: TransactionSummary;
}

interface TransactionSearchOptions {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  accountIds?: string[];
  status?: 'draft' | 'confirmed' | 'cancelled';
  amountRange?: {
    min: number;
    max: number;
  };
  description?: string;
}

/**
 * TransactionService - 交易業務邏輯服務
 * 
 * 負責處理交易相關的前端業務邏輯，包括：
 * - 交易數據驗證
 * - 交易搜索和過濾
 * - 交易統計計算
 * - 借貸平衡檢查
 * - 交易狀態管理
 */
export class TransactionService {
  /**
   * 驗證交易群組的借貸平衡
   * @param entries 分錄陣列
   * @returns 驗證結果
   */
  static validateDebitCreditBalance(entries: any[]): TransactionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    // 計算借貸總額
    entries.forEach((entry, index) => {
      const debit = Number(entry.debitAmount) || 0;
      const credit = Number(entry.creditAmount) || 0;
      
      totalDebit += debit;
      totalCredit += credit;
      
      // 檢查分錄基本規則
      if (debit === 0 && credit === 0) {
        errors.push(`分錄 ${index + 1}: 借方和貸方金額不能同時為零`);
      }
      
      if (debit > 0 && credit > 0) {
        warnings.push(`分錄 ${index + 1}: 建議借方或貸方其中一方為零`);
      }
      
      if (debit < 0 || credit < 0) {
        errors.push(`分錄 ${index + 1}: 金額不能為負數`);
      }
      
      if (!entry.accountId) {
        errors.push(`分錄 ${index + 1}: 必須選擇會計科目`);
      }
      
      if (!entry.description || entry.description.trim() === '') {
        warnings.push(`分錄 ${index + 1}: 建議填寫分錄說明`);
      }
    });
    
    const balanceDifference = Math.abs(totalDebit - totalCredit);
    const isBalanced = balanceDifference < 0.01; // 允許小數點誤差
    
    if (!isBalanced) {
      errors.push(`借貸不平衡：借方總額 ${totalDebit.toFixed(2)}，貸方總額 ${totalCredit.toFixed(2)}，差額 ${balanceDifference.toFixed(2)}`);
    }
    
    if (entries.length < 2) {
      errors.push('至少需要兩筆分錄才能構成完整的交易');
    }
    
    const summary: TransactionSummary = {
      totalDebit,
      totalCredit,
      transactionCount: entries.length,
      balanceDifference,
      isBalanced
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary
    };
  }
  
  /**
   * 搜索交易
   * @param options 搜索選項
   * @returns 搜索結果
   */
  static async searchTransactions(options: TransactionSearchOptions) {
    try {
      const params: any = {};
      
      // 日期範圍過濾
      if (options.dateRange) {
        params.startDate = options.dateRange.startDate.toISOString().split('T')[0];
        params.endDate = options.dateRange.endDate.toISOString().split('T')[0];
      }
      
      // 狀態過濾
      if (options.status) {
        params.status = options.status;
      }
      
      const response = await transactionGroupWithEntriesService.getAll(params);
      let transactions = response.data.groups;
      
      // 前端過濾（API 不支援的過濾條件）
      if (options.accountIds && options.accountIds.length > 0) {
        transactions = transactions.filter(transaction =>
          transaction.entries?.some(entry =>
            options.accountIds!.includes(
              typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id
            )
          )
        );
      }
      
      // 金額範圍過濾
      if (options.amountRange) {
        transactions = transactions.filter(transaction =>
          transaction.totalAmount >= options.amountRange!.min &&
          transaction.totalAmount <= options.amountRange!.max
        );
      }
      
      // 描述過濾
      if (options.description) {
        const searchTerm = options.description.toLowerCase();
        transactions = transactions.filter(transaction =>
          transaction.description.toLowerCase().includes(searchTerm) ||
          transaction.entries?.some(entry =>
            entry.description.toLowerCase().includes(searchTerm)
          )
        );
      }
      
      return {
        success: true,
        data: transactions,
        total: transactions.length
      };
    } catch (error) {
      console.error('搜索交易失敗:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '搜索交易時發生未知錯誤',
        data: [],
        total: 0
      };
    }
  }
  
  /**
   * 計算交易統計
   * @param transactions 交易陣列
   * @returns 統計結果
   */
  static calculateTransactionStatistics(transactions: any[]) {
    const stats = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      totalDebit: 0,
      totalCredit: 0,
      confirmedTransactions: 0,
      draftTransactions: 0,
      cancelledTransactions: 0,
      balancedTransactions: 0,
      unbalancedTransactions: 0,
      averageAmount: 0,
      dateRange: {
        earliest: null as Date | null,
        latest: null as Date | null
      }
    };
    
    transactions.forEach(transaction => {
      // 狀態統計
      switch (transaction.status) {
        case 'confirmed':
          stats.confirmedTransactions++;
          break;
        case 'draft':
          stats.draftTransactions++;
          break;
        case 'cancelled':
          stats.cancelledTransactions++;
          break;
      }
      
      // 金額統計
      stats.totalAmount += transaction.totalAmount || 0;
      
      // 借貸統計
      if (transaction.entries) {
        transaction.entries.forEach((entry: any) => {
          stats.totalDebit += entry.debitAmount || 0;
          stats.totalCredit += entry.creditAmount || 0;
        });
        
        // 平衡檢查
        const validation = this.validateDebitCreditBalance(transaction.entries);
        if (validation.isValid) {
          stats.balancedTransactions++;
        } else {
          stats.unbalancedTransactions++;
        }
      }
      
      // 日期範圍
      const transactionDate = new Date(transaction.transactionDate);
      if (!stats.dateRange.earliest || transactionDate < stats.dateRange.earliest) {
        stats.dateRange.earliest = transactionDate;
      }
      if (!stats.dateRange.latest || transactionDate > stats.dateRange.latest) {
        stats.dateRange.latest = transactionDate;
      }
    });
    
    // 計算平均金額
    stats.averageAmount = stats.totalTransactions > 0 
      ? stats.totalAmount / stats.totalTransactions 
      : 0;
    
    return stats;
  }
  
  /**
   * 格式化交易顯示數據
   * @param transaction 交易數據
   * @returns 格式化後的顯示數據
   */
  static formatTransactionForDisplay(transaction: any) {
    return {
      id: transaction._id,
      groupNumber: transaction.groupNumber,
      description: transaction.description,
      date: new Date(transaction.transactionDate).toLocaleDateString('zh-TW'),
      amount: transaction.totalAmount?.toLocaleString('zh-TW', {
        style: 'currency',
        currency: 'TWD'
      }) || 'N/A',
      status: this.getStatusLabel(transaction.status),
      statusColor: this.getStatusColor(transaction.status),
      entryCount: transaction.entries?.length || 0,
      isBalanced: transaction.entries ? 
        this.validateDebitCreditBalance(transaction.entries).isValid : false,
      fundingType: transaction.fundingType,
      fundingTypeLabel: this.getFundingTypeLabel(transaction.fundingType)
    };
  }
  
  /**
   * 獲取狀態標籤
   * @param status 狀態值
   * @returns 狀態標籤
   */
  static getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'confirmed': '已確認',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }
  
  /**
   * 獲取狀態顏色
   * @param status 狀態值
   * @returns 狀態顏色
   */
  static getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'draft': '#ff9800',
      'confirmed': '#4caf50',
      'cancelled': '#f44336'
    };
    return colorMap[status] || '#757575';
  }
  
  /**
   * 獲取資金類型標籤
   * @param fundingType 資金類型
   * @returns 資金類型標籤
   */
  static getFundingTypeLabel(fundingType: string): string {
    const typeMap: Record<string, string> = {
      'original': '原始資金',
      'extended': '延伸使用',
      'transfer': '資金轉移'
    };
    return typeMap[fundingType] || fundingType;
  }
  
  /**
   * 檢查交易是否可以編輯
   * @param transaction 交易數據
   * @returns 是否可編輯
   */
  static canEditTransaction(transaction: any): boolean {
    // 已確認或已取消的交易不能編輯
    if (transaction.status === 'confirmed' || transaction.status === 'cancelled') {
      return false;
    }
    
    // 有被其他交易引用的交易不能編輯
    if (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 檢查交易是否可以刪除
   * @param transaction 交易數據
   * @returns 是否可刪除
   */
  static canDeleteTransaction(transaction: any): boolean {
    // 已確認的交易不能刪除
    if (transaction.status === 'confirmed') {
      return false;
    }
    
    // 有被其他交易引用的交易不能刪除
    if (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0) {
      return false;
    }
    
    // 作為資金來源的交易不能刪除
    if (transaction.fundingType === 'original' && transaction.linkedTransactionIds) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 生成交易群組編號
   * @returns 新的交易群組編號
   */
  static generateTransactionGroupNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `TXN-${dateStr}-${timeStr}-${randomStr}`;
  }
  
  /**
   * 驗證交易表單數據
   * @param formData 表單數據
   * @returns 驗證結果
   */
  static validateTransactionForm(formData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 基本欄位驗證
    if (!formData.description || formData.description.trim() === '') {
      errors.push('交易描述不能為空');
    }
    
    if (!formData.transactionDate) {
      errors.push('交易日期不能為空');
    }
    
    if (!formData.entries || formData.entries.length === 0) {
      errors.push('至少需要一筆分錄');
    } else {
      // 分錄驗證
      const entryValidation = this.validateDebitCreditBalance(formData.entries);
      if (!entryValidation.isValid) {
        errors.push(...entryValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default TransactionService;