/**
 * 交易驗證工具函數 - 純函數，前後端共用
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TransactionEntry {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface TransactionFormData {
  description: string;
  transactionDate: Date | string;
  entries: TransactionEntry[];
}

export class TransactionValidator {
  /**
   * 驗證交易基本資訊
   */
  static validateBasicInfo(data: Partial<TransactionFormData>): ValidationResult {
    const errors: string[] = [];

    if (!data.description?.trim()) {
      errors.push('請輸入交易描述');
    }

    if (!data.transactionDate) {
      errors.push('請選擇交易日期');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證分錄資料
   */
  static validateEntries(entries: TransactionEntry[]): ValidationResult {
    const errors: string[] = [];

    if (!entries || entries.length < 2) {
      errors.push('複式記帳至少需要兩筆分錄');
      return { isValid: false, errors };
    }

    // 檢查每筆分錄的完整性
    entries.forEach((entry, index) => {
      if (!entry.accountId) {
        errors.push(`分錄 ${index + 1}: 請選擇會計科目`);
      }
      
      if (entry.debitAmount === 0 && entry.creditAmount === 0) {
        errors.push(`分錄 ${index + 1}: 請輸入借方或貸方金額`);
      }
      
      if (entry.debitAmount > 0 && entry.creditAmount > 0) {
        errors.push(`分錄 ${index + 1}: 借方和貸方金額不能同時大於0`);
      }

      if (entry.debitAmount < 0 || entry.creditAmount < 0) {
        errors.push(`分錄 ${index + 1}: 金額不能為負數`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 檢查借貸平衡
   */
  static validateBalance(entries: TransactionEntry[]): ValidationResult {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > 0.01) {
      return {
        isValid: false,
        errors: [`借貸不平衡，差額：${difference.toFixed(2)}`]
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * 完整驗證交易資料
   */
  static validateTransaction(data: TransactionFormData): ValidationResult {
    const basicValidation = this.validateBasicInfo(data);
    const entriesValidation = this.validateEntries(data.entries);
    const balanceValidation = this.validateBalance(data.entries);

    const allErrors = [
      ...basicValidation.errors,
      ...entriesValidation.errors,
      ...balanceValidation.errors
    ];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * 計算交易總金額（借方總額）
   */
  static calculateTotalAmount(entries: TransactionEntry[]): number {
    return entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  }

  /**
   * 檢查借貸平衡詳情
   */
  static getBalanceDetails(entries: TransactionEntry[]): {
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  } {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    
    return {
      isBalanced: difference < 0.01,
      totalDebit,
      totalCredit,
      difference
    };
  }

  /**
   * 檢查是否為有效的 ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}