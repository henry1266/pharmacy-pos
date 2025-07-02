import { IAccountingEntry } from '../models/AccountingEntry';

/**
 * 借貸平衡驗證工具
 */
export class DoubleEntryValidator {
  
  /**
   * 驗證借貸平衡
   * @param entries 記帳分錄陣列
   * @returns 驗證結果
   */
  static validateDebitCreditBalance(entries: IAccountingEntry[]) {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // 容許小數點誤差
    
    return {
      totalDebit,
      totalCredit,
      difference,
      isBalanced,
      message: isBalanced ? '借貸平衡' : `借貸不平衡，差額：${difference.toFixed(2)}`
    };
  }

  /**
   * 驗證單筆分錄
   * @param entry 記帳分錄
   * @returns 驗證結果
   */
  static validateSingleEntry(entry: IAccountingEntry) {
    const errors: string[] = [];

    // 檢查借方或貸方金額必須有一個大於0
    if (entry.debitAmount === 0 && entry.creditAmount === 0) {
      errors.push('借方金額或貸方金額至少要有一個大於0');
    }

    // 檢查借方和貸方金額不能同時大於0
    if (entry.debitAmount > 0 && entry.creditAmount > 0) {
      errors.push('借方金額和貸方金額不能同時大於0');
    }

    // 檢查金額不能為負數
    if (entry.debitAmount < 0 || entry.creditAmount < 0) {
      errors.push('借方金額和貸方金額不能為負數');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證交易群組的完整性
   * @param entries 同一交易群組的所有分錄
   * @returns 驗證結果
   */
  static validateTransactionGroup(entries: IAccountingEntry[]) {
    const errors: string[] = [];

    // 檢查是否至少有兩筆分錄
    if (entries.length < 2) {
      errors.push('交易群組至少需要兩筆分錄');
    }

    // 檢查每筆分錄的有效性
    entries.forEach((entry, index) => {
      const entryValidation = this.validateSingleEntry(entry);
      if (!entryValidation.isValid) {
        errors.push(`第 ${index + 1} 筆分錄：${entryValidation.errors.join(', ')}`);
      }
    });

    // 檢查借貸平衡
    const balanceValidation = this.validateDebitCreditBalance(entries);
    if (!balanceValidation.isBalanced) {
      errors.push(balanceValidation.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
      balanceInfo: balanceValidation
    };
  }

  /**
   * 計算會計科目餘額
   * @param accountId 會計科目ID
   * @param entries 相關的記帳分錄
   * @param normalBalance 正常餘額方向
   * @returns 科目餘額
   */
  static calculateAccountBalance(
    accountId: string, 
    entries: IAccountingEntry[], 
    normalBalance: 'debit' | 'credit'
  ) {
    const accountEntries = entries.filter(entry => 
      entry.accountId.toString() === accountId
    );

    const totalDebit = accountEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = accountEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);

    // 根據正常餘額方向計算餘額
    let balance: number;
    if (normalBalance === 'debit') {
      // 借方科目：借方增加，貸方減少
      balance = totalDebit - totalCredit;
    } else {
      // 貸方科目：貸方增加，借方減少
      balance = totalCredit - totalDebit;
    }

    return {
      totalDebit,
      totalCredit,
      balance,
      normalBalance
    };
  }

  /**
   * 生成標準會計分錄範本
   */
  static getStandardTemplates() {
    return {
      // 現金收入
      cashIncome: {
        name: '現金收入',
        entries: [
          { accountType: 'asset', description: '現金', side: 'debit' },
          { accountType: 'revenue', description: '營業收入', side: 'credit' }
        ]
      },
      // 現金支出
      cashExpense: {
        name: '現金支出',
        entries: [
          { accountType: 'expense', description: '營業費用', side: 'debit' },
          { accountType: 'asset', description: '現金', side: 'credit' }
        ]
      },
      // 銀行轉帳
      bankTransfer: {
        name: '銀行轉帳',
        entries: [
          { accountType: 'asset', description: '銀行存款（轉入）', side: 'debit' },
          { accountType: 'asset', description: '銀行存款（轉出）', side: 'credit' }
        ]
      },
      // 薪資發放
      salaryPayment: {
        name: '薪資發放',
        entries: [
          { accountType: 'expense', description: '薪資費用', side: 'debit' },
          { accountType: 'asset', description: '現金', side: 'credit' }
        ]
      }
    };
  }
}

export default DoubleEntryValidator;