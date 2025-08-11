/**
 * @module accounting3to2
 * @description Accounting3 資料結構到 Accounting2 介面格式的反向適配器
 * @summary 確保 Accounting3 內嵌分錄資料能在 Accounting2 科目管理介面中正確顯示
 */

import {
  Account2,
  TransactionGroupWithEntries,
  EmbeddedAccountingEntry,
  AccountingEntry,
  TransactionGroup
} from '../types/accounting2';

/**
 * @description Accounting3 到 Accounting2 反向適配器
 * @class Accounting3To2Adapter
 * @classdesc 將內嵌分錄結構轉換為科目管理介面可用的格式
 */
export class Accounting3To2Adapter {
  /**
   * @description 將內嵌分錄轉換為獨立分錄格式
   * @method convertEmbeddedEntryToStandalone
   * @static
   * @param {EmbeddedAccountingEntry} embeddedEntry - 內嵌分錄
   * @param {TransactionGroupWithEntries} transactionGroup - 交易群組
   * @returns {AccountingEntry} 獨立分錄格式
   */
  static convertEmbeddedEntryToStandalone(
    embeddedEntry: EmbeddedAccountingEntry,
    transactionGroup: TransactionGroupWithEntries
  ): AccountingEntry {
    return {
      _id: embeddedEntry._id || `${transactionGroup._id}-${embeddedEntry.sequence}`,
      transactionGroupId: transactionGroup._id,
      sequence: embeddedEntry.sequence,
      accountId: embeddedEntry.accountId,
      debitAmount: embeddedEntry.debitAmount,
      creditAmount: embeddedEntry.creditAmount,
      ...(embeddedEntry.categoryId && { categoryId: embeddedEntry.categoryId }),
      description: embeddedEntry.description,
      ...(embeddedEntry.sourceTransactionId && { sourceTransactionId: embeddedEntry.sourceTransactionId }),
      ...(embeddedEntry.fundingPath && { fundingPath: embeddedEntry.fundingPath }),
      ...(transactionGroup.organizationId && { organizationId: transactionGroup.organizationId }),
      createdBy: transactionGroup.createdBy || 'system',
      createdAt: transactionGroup.createdAt,
      updatedAt: transactionGroup.updatedAt
    };
  }

  /**
   * @description 將 TransactionGroupWithEntries 轉換為傳統 TransactionGroup
   * @method convertToLegacyTransactionGroup
   * @static
   * @param {TransactionGroupWithEntries} transactionWithEntries - 包含內嵌分錄的交易群組
   * @returns {TransactionGroup} 傳統交易群組格式
   */
  static convertToLegacyTransactionGroup(
    transactionWithEntries: TransactionGroupWithEntries
  ): TransactionGroup {
    return {
      _id: transactionWithEntries._id,
      groupNumber: transactionWithEntries.groupNumber,
      description: transactionWithEntries.description,
      transactionDate: transactionWithEntries.transactionDate,
      organizationId: transactionWithEntries.organizationId || '',
      ...(transactionWithEntries.receiptUrl && { receiptUrl: transactionWithEntries.receiptUrl }),
      ...(transactionWithEntries.invoiceNo && { invoiceNo: transactionWithEntries.invoiceNo }),
      totalAmount: transactionWithEntries.totalAmount,
      status: transactionWithEntries.status,
      linkedTransactionIds: transactionWithEntries.linkedTransactionIds,
      sourceTransactionId: transactionWithEntries.sourceTransactionId || '',
      fundingType: transactionWithEntries.fundingType,
      createdBy: transactionWithEntries.createdBy,
      createdAt: transactionWithEntries.createdAt,
      updatedAt: transactionWithEntries.updatedAt
    };
  }

  /**
   * @description 批量轉換內嵌分錄為獨立分錄
   * @method extractAllEntriesFromTransactions
   * @static
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {AccountingEntry[]} 獨立分錄陣列
   */
  static extractAllEntriesFromTransactions(
    transactions: TransactionGroupWithEntries[]
  ): AccountingEntry[] {
    const entries: AccountingEntry[] = [];

    transactions.forEach(transaction => {
      if (transaction.entries && Array.isArray(transaction.entries)) {
        transaction.entries.forEach(embeddedEntry => {
          entries.push(
            this.convertEmbeddedEntryToStandalone(embeddedEntry, transaction)
          );
        });
      }
    });

    return entries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * @description 為特定科目提取分錄資料
   * @method extractEntriesForAccount
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {AccountingEntry[]} 特定科目的分錄陣列
   */
  static extractEntriesForAccount(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): AccountingEntry[] {
    const entries: AccountingEntry[] = [];

    transactions.forEach(transaction => {
      if (transaction.entries && Array.isArray(transaction.entries)) {
        transaction.entries.forEach(embeddedEntry => {
          const entryAccountId = typeof embeddedEntry.accountId === 'string' 
            ? embeddedEntry.accountId 
            : embeddedEntry.accountId?._id;

          if (entryAccountId === accountId) {
            entries.push(
              this.convertEmbeddedEntryToStandalone(embeddedEntry, transaction)
            );
          }
        });
      }
    });

    return entries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * @description 轉換為科目管理介面的顯示格式
   * @method convertForAccountManagementDisplay
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Array<AccountingEntry & Object>} 擴展的分錄陣列，包含額外的顯示資訊
   */
  static convertForAccountManagementDisplay(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): Array<AccountingEntry & {
    groupNumber: string;
    transactionDate: Date | string;
    transactionStatus: 'draft' | 'confirmed' | 'cancelled';
    amount: number; // 正負值顯示
    runningBalance?: number; // 累計餘額
  }> {
    const entries = this.extractEntriesForAccount(accountId, transactions);
    
    return entries.map(entry => {
      const transaction = transactions.find(t => t._id === entry.transactionGroupId);
      const amount = entry.debitAmount > 0 ? entry.debitAmount : -entry.creditAmount;
      
      return {
        ...entry,
        groupNumber: transaction?.groupNumber || '',
        transactionDate: transaction?.transactionDate || entry.createdAt,
        transactionStatus: transaction?.status || 'draft',
        amount
      };
    });
  }

  /**
   * @description 驗證轉換的完整性
   * @method validateConversion
   * @static
   * @param {TransactionGroupWithEntries} original - 原始交易群組
   * @param {TransactionGroup} convertedGroup - 轉換後的交易群組
   * @param {AccountingEntry[]} convertedEntries - 轉換後的分錄陣列
   * @returns {Object} 驗證結果，包含是否有效和錯誤訊息
   */
  static validateConversion(
    original: TransactionGroupWithEntries,
    convertedGroup: TransactionGroup,
    convertedEntries: AccountingEntry[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 檢查基本欄位
    if (original._id !== convertedGroup._id) {
      errors.push('交易群組 ID 不匹配');
    }

    if (original.description !== convertedGroup.description) {
      errors.push('交易描述不匹配');
    }

    if (original.totalAmount !== convertedGroup.totalAmount) {
      errors.push(`總金額不匹配: 原始 ${original.totalAmount}, 轉換後 ${convertedGroup.totalAmount}`);
    }

    // 檢查分錄數量
    const originalEntriesCount = original.entries?.length || 0;
    if (originalEntriesCount !== convertedEntries.length) {
      errors.push(`分錄數量不匹配: 原始 ${originalEntriesCount}, 轉換後 ${convertedEntries.length}`);
    }

    // 檢查借貸平衡
    const totalDebit = convertedEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = convertedEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference >= 0.01) {
      errors.push(`轉換後借貸不平衡: 借方 ${totalDebit}, 貸方 ${totalCredit}, 差額 ${difference}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * @description 科目管理介面資料格式化器
 * @class AccountManagementFormatter
 * @classdesc 專門處理科目管理介面需要的特殊格式
 */
export class AccountManagementFormatter {
  /**
   * @description 格式化科目餘額資訊
   * @method formatAccountBalance
   * @static
   * @param {Account2} account - 科目資料
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Account2 & Object} 擴展的科目資料，包含餘額資訊
   */
  static formatAccountBalance(
    account: Account2,
    transactions: TransactionGroupWithEntries[]
  ): Account2 & {
    currentBalance: number;
    totalTransactions: number;
    lastTransactionDate?: Date | string;
    balanceChange: number; // 相對於初始餘額的變化
  } {
    const entries = Accounting3To2Adapter.extractEntriesForAccount(
      account._id,
      transactions
    );

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const balanceChange = totalDebit - totalCredit;
    const currentBalance = account.initialBalance + balanceChange;

    const lastTransactionDate = entries.length > 0 
      ? entries[0].createdAt // 已按日期排序
      : undefined;

    return {
      ...account,
      currentBalance,
      totalTransactions: entries.length,
      ...(lastTransactionDate && { lastTransactionDate }),
      balanceChange
    };
  }

  /**
   * @description 格式化分錄明細為表格顯示格式
   * @method formatEntriesForDataGrid
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Array<Object>} 表格顯示格式的分錄資料陣列
   */
  static formatEntriesForDataGrid(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): Array<{
    id: string;
    index: number;
    transactionDate: Date | string;
    groupNumber: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    amount: number;
    runningBalance: number;
    transactionStatus: 'draft' | 'confirmed' | 'cancelled';
    sourceTransactionId?: string;
    fundingPath?: string[];
  }> {
    const entries = Accounting3To2Adapter.convertForAccountManagementDisplay(
      accountId,
      transactions
    );

    // 計算累計餘額
    let runningBalance = 0;
    return entries.map((entry, index) => {
      runningBalance += entry.amount;
      
      return {
        id: entry._id,
        index: index + 1,
        transactionDate: entry.transactionDate,
        groupNumber: entry.groupNumber,
        description: entry.description,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        amount: entry.amount,
        runningBalance,
        transactionStatus: entry.transactionStatus,
        ...(entry.sourceTransactionId && { sourceTransactionId: entry.sourceTransactionId }),
        ...(entry.fundingPath && { fundingPath: entry.fundingPath })
      };
    });
  }

  /**
   * @description 格式化科目統計資訊
   * @method formatAccountStatistics
   * @static
   * @param {string} accountId - 科目ID
   * @param {TransactionGroupWithEntries[]} transactions - 交易群組陣列
   * @returns {Object} 科目統計資訊，包含各種統計數據
   */
  static formatAccountStatistics(
    accountId: string,
    transactions: TransactionGroupWithEntries[]
  ): {
    totalEntries: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    confirmedEntries: number;
    draftEntries: number;
    cancelledEntries: number;
    lastTransactionDate?: Date | string;
  } {
    const entries = Accounting3To2Adapter.extractEntriesForAccount(
      accountId,
      transactions
    );

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const balance = totalDebit - totalCredit;

    // 按狀態分類統計
    const confirmedEntries = entries.filter(entry => {
      const transaction = transactions.find(t => t._id === entry.transactionGroupId);
      return transaction?.status === 'confirmed';
    }).length;

    const draftEntries = entries.filter(entry => {
      const transaction = transactions.find(t => t._id === entry.transactionGroupId);
      return transaction?.status === 'draft';
    }).length;

    const cancelledEntries = entries.filter(entry => {
      const transaction = transactions.find(t => t._id === entry.transactionGroupId);
      return transaction?.status === 'cancelled';
    }).length;

    const lastTransactionDate = entries.length > 0 
      ? entries[0].createdAt
      : undefined;

    return {
      totalEntries: entries.length,
      totalDebit,
      totalCredit,
      balance,
      confirmedEntries,
      draftEntries,
      cancelledEntries,
      ...(lastTransactionDate && { lastTransactionDate })
    };
  }
}

/**
 * @description 匯出主要轉換函數供向後相容
 * @exports convertEmbeddedEntryToStandalone
 * @exports convertToLegacyTransactionGroup
 * @exports extractEntriesForAccount
 */
export const convertEmbeddedEntryToStandalone = Accounting3To2Adapter.convertEmbeddedEntryToStandalone;
export const convertToLegacyTransactionGroup = Accounting3To2Adapter.convertToLegacyTransactionGroup;
export const extractEntriesForAccount = Accounting3To2Adapter.extractEntriesForAccount;