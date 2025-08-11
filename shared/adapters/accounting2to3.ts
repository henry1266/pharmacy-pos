/**
 * @module accounting2to3
 * @description Accounting2 科目管理介面與 Accounting3 資料結構相容性適配器
 * @summary 確保科目管理介面能完美整合 Accounting3 內嵌分錄資料結構
 */

import {
  Account2,
  TransactionGroupWithEntries
} from '../types/accounting2';

/**
 * @description 科目管理介面適配器
 * @class AccountManagementAdapter
 * @classdesc 確保 Accounting2 科目管理介面能正確處理 Accounting3 資料
 */
export class AccountManagementAdapter {
  /**
   * @description 標準化科目資料格式
   * @method normalizeAccount
   * @static
   * @param {Account2} account - 原始科目資料
   * @returns {Account2} 標準化後的科目資料
   */
  static normalizeAccount(account: Account2): Account2 {
    return {
      ...account,
      // 確保所有必要欄位都存在且格式正確
      balance: account.balance || 0,
      initialBalance: account.initialBalance || 0,
      currency: account.currency || 'TWD',
      level: account.level || 1,
      isActive: account.isActive !== undefined ? account.isActive : true,
      normalBalance: account.normalBalance || this.getDefaultNormalBalance(account.accountType),
      // 確保日期格式一致
      createdAt: typeof account.createdAt === 'string' ? new Date(account.createdAt) : account.createdAt,
      updatedAt: typeof account.updatedAt === 'string' ? new Date(account.updatedAt) : account.updatedAt
    };
  }

  /**
   * @description 根據會計科目類型取得預設正常餘額方向
   * @method getDefaultNormalBalance
   * @static
   * @private
   * @param {Account2['accountType']} accountType - 科目類型
   * @returns {'debit'|'credit'} 正常餘額方向
   */
  private static getDefaultNormalBalance(accountType: Account2['accountType']): 'debit' | 'credit' {
    switch (accountType) {
      case 'asset':
      case 'expense':
        return 'debit';
      case 'liability':
      case 'equity':
      case 'revenue':
        return 'credit';
      default:
        return 'debit';
    }
  }

  /**
   * @description 從 Accounting3 內嵌分錄中提取科目相關資訊
   * @method extractAccountEntriesFromTransactions
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Array<Object>} 科目相關分錄資訊陣列
   */
  static extractAccountEntriesFromTransactions(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): Array<{
    _id: string;
    transactionId: string;
    groupNumber: string;
    transactionDate: Date | string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    sequence: number;
    sourceTransactionId?: string;
    fundingPath?: string[];
  }> {
    const entries: Array<{
      _id: string;
      transactionId: string;
      groupNumber: string;
      transactionDate: Date | string;
      description: string;
      debitAmount: number;
      creditAmount: number;
      sequence: number;
      sourceTransactionId?: string;
      fundingPath?: string[];
    }> = [];

    transactions.forEach(transaction => {
      if (transaction.entries && Array.isArray(transaction.entries)) {
        transaction.entries.forEach(entry => {
          const entryAccountId = typeof entry.accountId === 'string' 
            ? entry.accountId 
            : entry.accountId?._id;

          if (entryAccountId === accountId) {
            entries.push({
              _id: entry._id || `${transaction._id}-${entry.sequence}`,
              transactionId: transaction._id,
              groupNumber: transaction.groupNumber,
              transactionDate: transaction.transactionDate,
              description: entry.description,
              debitAmount: entry.debitAmount || 0,
              creditAmount: entry.creditAmount || 0,
              sequence: entry.sequence,
              ...(entry.sourceTransactionId && { sourceTransactionId: entry.sourceTransactionId }),
              ...(entry.fundingPath && { fundingPath: entry.fundingPath })
            });
          }
        });
      }
    });

    return entries.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
  }

  /**
   * @description 計算科目餘額統計
   * @method calculateAccountStatistics
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Object} 科目統計資訊，包含總分錄數、總借方、總貸方、餘額和最後交易日期
   */
  static calculateAccountStatistics(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): {
    totalEntries: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    lastTransactionDate?: Date | string;
  } {
    const entries = this.extractAccountEntriesFromTransactions(accountId, transactions);
    
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const balance = totalDebit - totalCredit;
    
    const lastTransactionDate = entries.length > 0
      ? entries[0].transactionDate // 已按日期排序，第一個是最新的
      : undefined;

    return {
      totalEntries: entries.length,
      totalDebit,
      totalCredit,
      balance,
      ...(lastTransactionDate && { lastTransactionDate })
    };
  }

  /**
   * @description 驗證科目是否可以安全刪除
   * @method canDeleteAccount
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Object} 刪除驗證結果，包含是否可刪除、原因和使用次數
   */
  static canDeleteAccount(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): { canDelete: boolean; reason?: string; usageCount: number } {
    const entries = this.extractAccountEntriesFromTransactions(accountId, transactions);
    
    if (entries.length === 0) {
      return { canDelete: true, usageCount: 0 };
    }

    // 檢查是否有已確認的交易
    const confirmedTransactions = transactions.filter(t => 
      t.status === 'confirmed' && 
      t.entries?.some(e => {
        const entryAccountId = typeof e.accountId === 'string' ? e.accountId : e.accountId?._id;
        return entryAccountId === accountId;
      })
    );

    if (confirmedTransactions.length > 0) {
      return {
        canDelete: false,
        reason: `此科目已被 ${confirmedTransactions.length} 筆已確認交易使用，無法刪除`,
        usageCount: entries.length
      };
    }

    return {
      canDelete: false,
      reason: `此科目已被 ${entries.length} 筆交易使用，建議停用而非刪除`,
      usageCount: entries.length
    };
  }

  /**
   * @description 批量處理科目資料標準化
   * @method normalizeAccounts
   * @static
   * @param {Account2[]} accounts - 科目資料陣列
   * @returns {Account2[]} 標準化後的科目資料陣列
   */
  static normalizeAccounts(accounts: Account2[]): Account2[] {
    return accounts.map(account => this.normalizeAccount(account));
  }
}

/**
 * @description 科目管理介面資料提供器
 * @class AccountManagementDataProvider
 * @classdesc 專門為科目管理介面提供格式化的資料
 */
export class AccountManagementDataProvider {
  /**
   * @description 為科目管理介面準備完整的科目資料
   * @method prepareAccountDataForManagement
   * @static
   * @param {Account2[]} accounts - 科目資料陣列
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Array<Account2 & Object>} 擴展的科目資料陣列，包含統計資訊和使用狀況
   */
  static prepareAccountDataForManagement(
    accounts: Account2[],
    transactions: TransactionGroupWithEntries[]
  ): Array<Account2 & {
    statistics: {
      totalEntries: number;
      totalDebit: number;
      totalCredit: number;
      balance: number;
      lastTransactionDate?: Date | string;
    };
    canDelete: boolean;
    deleteReason?: string;
    usageCount: number;
  }> {
    return accounts.map(account => {
      const normalizedAccount = AccountManagementAdapter.normalizeAccount(account);
      const statistics = AccountManagementAdapter.calculateAccountStatistics(
        account._id,
        transactions
      );
      const deleteInfo = AccountManagementAdapter.canDeleteAccount(
        account._id,
        transactions
      );

      return {
        ...normalizedAccount,
        statistics,
        canDelete: deleteInfo.canDelete,
        ...(deleteInfo.reason && { deleteReason: deleteInfo.reason }),
        usageCount: deleteInfo.usageCount
      };
    });
  }

  /**
   * @description 為科目詳情頁面準備分錄資料
   * @method prepareAccountEntriesForDisplay
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Array<Object>} 格式化的分錄資料陣列，包含累計餘額和交易狀態
   */
  static prepareAccountEntriesForDisplay(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): Array<{
    _id: string;
    transactionId: string;
    groupNumber: string;
    transactionDate: Date | string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    amount: number; // 顯示用金額（正負值）
    runningBalance: number; // 累計餘額
    sequence: number;
    sourceTransactionId?: string;
    fundingPath?: string[];
    transactionStatus: 'draft' | 'confirmed' | 'cancelled';
  }> {
    const entries = AccountManagementAdapter.extractAccountEntriesFromTransactions(
      accountId,
      transactions
    );

    // 添加交易狀態資訊
    const entriesWithStatus = entries.map(entry => {
      const transaction = transactions.find(t => t._id === entry.transactionId);
      return {
        ...entry,
        amount: entry.debitAmount > 0 ? entry.debitAmount : -entry.creditAmount,
        transactionStatus: transaction?.status || 'draft' as const
      };
    });

    // 計算累計餘額（從最新到最舊）
    let runningBalance = 0;
    return entriesWithStatus.map(entry => {
      runningBalance += entry.amount;
      return {
        ...entry,
        runningBalance
      };
    });
  }
}

/**
 * @description 匯出主要適配器函數供向後相容
 * @exports convertAccount2ToCompatible
 * @exports convertAccountsForCompatibility
 */
export const convertAccount2ToCompatible = AccountManagementAdapter.normalizeAccount;
export const convertAccountsForCompatibility = AccountManagementAdapter.normalizeAccounts;