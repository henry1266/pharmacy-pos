/**
 * 會計系統相容性服務
 * 統一管理 Accounting2 與 Accounting3 之間的版本同步與相容性
 */

import { Account2, TransactionGroupWithEntries } from '../types/accounting2';
import { AccountManagementAdapter } from '../adapters/accounting2to3';
import { Accounting3To2Adapter } from '../adapters/accounting3to2';

/**
 * 版本相容性管理器
 * 確保不同版本間的資料一致性
 */
export class VersionCompatibilityManager {
  private static instance: VersionCompatibilityManager;
  private compatibilityCache: Map<string, any> = new Map();
  private lastSyncTime: Date = new Date();

  private constructor() {}

  /**
   * 取得單例實例
   */
  static getInstance(): VersionCompatibilityManager {
    if (!VersionCompatibilityManager.instance) {
      VersionCompatibilityManager.instance = new VersionCompatibilityManager();
    }
    return VersionCompatibilityManager.instance;
  }

  /**
   * 檢查系統相容性
   * 驗證當前資料是否符合兩個版本的要求
   */
  async checkSystemCompatibility(
    accounts: Account2[],
    transactions: TransactionGroupWithEntries[]
  ): Promise<{
    isCompatible: boolean;
    issues: string[];
    recommendations: string[];
    accountingVersion: '2' | '3' | 'mixed';
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 檢查資料格式一致性
    const hasEmbeddedEntries = transactions.some(t => 
      t.entries && Array.isArray(t.entries) && t.entries.length > 0
    );

    const hasStandaloneEntries = transactions.some(t => 
      !t.entries || t.entries.length === 0
    );

    let accountingVersion: '2' | '3' | 'mixed' = '3';

    if (hasEmbeddedEntries && hasStandaloneEntries) {
      accountingVersion = 'mixed';
      issues.push('系統中同時存在 Accounting2 和 Accounting3 格式的資料');
      recommendations.push('建議統一轉換為 Accounting3 格式以提升效能');
    } else if (!hasEmbeddedEntries) {
      accountingVersion = '2';
      recommendations.push('建議升級至 Accounting3 格式以支援更多功能');
    }

    // 檢查科目資料完整性
    const accountIssues = this.validateAccountData(accounts);
    issues.push(...accountIssues);

    // 檢查交易資料完整性
    const transactionIssues = this.validateTransactionData(transactions);
    issues.push(...transactionIssues);

    // 檢查資料關聯性
    const relationshipIssues = this.validateDataRelationships(accounts, transactions);
    issues.push(...relationshipIssues);

    return {
      isCompatible: issues.length === 0,
      issues,
      recommendations,
      accountingVersion
    };
  }

  /**
   * 驗證科目資料
   */
  private validateAccountData(accounts: Account2[]): string[] {
    const issues: string[] = [];

    accounts.forEach(account => {
      if (!account._id) {
        issues.push(`科目缺少 ID: ${account.name || account._id}`);
      }

      if (!account.code) {
        issues.push(`科目缺少代碼: ${account.name || account._id}`);
      }

      if (!account.accountType) {
        issues.push(`科目缺少類型: ${account.name || account._id}`);
      }

      if (account.balance === undefined && account.initialBalance === undefined) {
        issues.push(`科目缺少餘額資訊: ${account.name || account._id}`);
      }
    });

    return issues;
  }

  /**
   * 驗證交易資料
   */
  private validateTransactionData(transactions: TransactionGroupWithEntries[]): string[] {
    const issues: string[] = [];

    transactions.forEach(transaction => {
      if (!transaction._id) {
        issues.push(`交易缺少 ID: ${transaction.groupNumber}`);
      }

      if (!transaction.groupNumber) {
        issues.push(`交易缺少群組編號: ${transaction._id}`);
      }

      if (!transaction.entries || transaction.entries.length === 0) {
        issues.push(`交易缺少分錄: ${transaction.groupNumber}`);
      } else {
        // 檢查分錄平衡
        const totalDebit = transaction.entries.reduce((sum, entry) => 
          sum + (entry.debitAmount || 0), 0
        );
        const totalCredit = transaction.entries.reduce((sum, entry) => 
          sum + (entry.creditAmount || 0), 0
        );

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          issues.push(`交易借貸不平衡: ${transaction.groupNumber} (借方: ${totalDebit}, 貸方: ${totalCredit})`);
        }
      }
    });

    return issues;
  }

  /**
   * 驗證資料關聯性
   */
  private validateDataRelationships(
    accounts: Account2[],
    transactions: TransactionGroupWithEntries[]
  ): string[] {
    const issues: string[] = [];
    const accountIds = new Set(accounts.map(a => a._id));

    transactions.forEach(transaction => {
      if (transaction.entries) {
        transaction.entries.forEach(entry => {
          const entryAccountId = typeof entry.accountId === 'string' 
            ? entry.accountId 
            : entry.accountId?._id;

          if (entryAccountId && !accountIds.has(entryAccountId)) {
            issues.push(`分錄引用不存在的科目: ${entryAccountId} (交易: ${transaction.groupNumber})`);
          }
        });
      }
    });

    return issues;
  }

  /**
   * 同步版本資料
   * 確保 Accounting2 介面與 Accounting3 資料的一致性
   */
  async syncVersionData(
    accounts: Account2[],
    transactions: TransactionGroupWithEntries[]
  ): Promise<{
    syncedAccounts: Account2[];
    syncedTransactions: TransactionGroupWithEntries[];
    syncReport: {
      accountsProcessed: number;
      transactionsProcessed: number;
      issuesFixed: string[];
      warnings: string[];
    };
  }> {
    const syncReport = {
      accountsProcessed: 0,
      transactionsProcessed: 0,
      issuesFixed: [] as string[],
      warnings: [] as string[]
    };

    // 標準化科目資料
    const syncedAccounts = AccountManagementAdapter.normalizeAccounts(accounts);
    syncReport.accountsProcessed = syncedAccounts.length;

    // 處理交易資料
    const syncedTransactions = transactions.map(transaction => {
      try {
        // 驗證並修復交易資料
        if (transaction.entries && transaction.entries.length > 0) {
          // 轉換為傳統格式進行驗證
          const convertedGroup = Accounting3To2Adapter.convertToLegacyTransactionGroup(transaction);
          const convertedEntries = Accounting3To2Adapter.extractAllEntriesFromTransactions([transaction]);
          
          const validation = Accounting3To2Adapter.validateConversion(
            transaction,
            convertedGroup,
            convertedEntries
          );

          if (!validation.isValid) {
            syncReport.warnings.push(
              `交易 ${transaction.groupNumber} 存在問題: ${validation.errors.join(', ')}`
            );
          }
        }

        syncReport.transactionsProcessed++;
        return transaction;
      } catch (error) {
        syncReport.warnings.push(
          `處理交易 ${transaction.groupNumber} 時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
        );
        return transaction;
      }
    });

    this.lastSyncTime = new Date();
    this.clearCompatibilityCache();

    return {
      syncedAccounts,
      syncedTransactions,
      syncReport
    };
  }

  /**
   * 取得相容性統計資訊
   */
  getCompatibilityStats(
    accounts: Account2[],
    transactions: TransactionGroupWithEntries[]
  ): {
    totalAccounts: number;
    activeAccounts: number;
    totalTransactions: number;
    embeddedTransactions: number;
    standaloneTransactions: number;
    compatibilityScore: number;
    lastSyncTime: Date;
  } {
    const activeAccounts = accounts.filter(a => a.isActive !== false).length;
    const embeddedTransactions = transactions.filter(t => 
      t.entries && t.entries.length > 0
    ).length;
    const standaloneTransactions = transactions.length - embeddedTransactions;

    // 計算相容性分數 (0-100)
    let compatibilityScore = 100;
    
    // 如果有混合格式，降低分數
    if (embeddedTransactions > 0 && standaloneTransactions > 0) {
      compatibilityScore -= 30;
    }

    // 檢查資料完整性
    const incompleteAccounts = accounts.filter(a =>
      !a.code || !a.accountType
    ).length;
    compatibilityScore -= (incompleteAccounts / accounts.length) * 20;

    const incompleteTransactions = transactions.filter(t => 
      !t.groupNumber || !t.transactionDate
    ).length;
    compatibilityScore -= (incompleteTransactions / transactions.length) * 20;

    return {
      totalAccounts: accounts.length,
      activeAccounts,
      totalTransactions: transactions.length,
      embeddedTransactions,
      standaloneTransactions,
      compatibilityScore: Math.max(0, Math.round(compatibilityScore)),
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * 清除相容性快取
   */
  clearCompatibilityCache(): void {
    this.compatibilityCache.clear();
  }

  /**
   * 取得快取的相容性資料
   */
  getCachedCompatibilityData(key: string): any {
    return this.compatibilityCache.get(key);
  }

  /**
   * 設定快取的相容性資料
   */
  setCachedCompatibilityData(key: string, data: any): void {
    this.compatibilityCache.set(key, data);
  }
}

/**
 * 資料遷移服務
 * 處理版本間的資料遷移
 */
export class DataMigrationService {
  /**
   * 遷移 Accounting2 資料到 Accounting3 格式
   */
  static async migrateToAccounting3(
    legacyTransactions: any[]
  ): Promise<{
    migratedTransactions: TransactionGroupWithEntries[];
    migrationReport: {
      totalProcessed: number;
      successfulMigrations: number;
      failedMigrations: number;
      errors: string[];
    };
  }> {
    const migrationReport = {
      totalProcessed: legacyTransactions.length,
      successfulMigrations: 0,
      failedMigrations: 0,
      errors: [] as string[]
    };

    const migratedTransactions: TransactionGroupWithEntries[] = [];

    for (const legacyTransaction of legacyTransactions) {
      try {
        // 這裡應該實作具體的遷移邏輯
        // 將 Accounting2 格式轉換為 Accounting3 格式
        const migratedTransaction: TransactionGroupWithEntries = {
          _id: legacyTransaction._id,
          groupNumber: legacyTransaction.groupNumber,
          transactionDate: legacyTransaction.transactionDate,
          description: legacyTransaction.description,
          status: legacyTransaction.status || 'draft',
          entries: legacyTransaction.entries || [],
          totalAmount: legacyTransaction.totalAmount || 0,
          linkedTransactionIds: legacyTransaction.linkedTransactionIds || [],
          fundingType: legacyTransaction.fundingType || 'general',
          createdAt: legacyTransaction.createdAt,
          updatedAt: legacyTransaction.updatedAt,
          createdBy: legacyTransaction.createdBy
        };

        migratedTransactions.push(migratedTransaction);
        migrationReport.successfulMigrations++;
      } catch (error) {
        migrationReport.failedMigrations++;
        migrationReport.errors.push(
          `遷移交易 ${legacyTransaction.groupNumber || legacyTransaction._id} 失敗: ${
            error instanceof Error ? error.message : '未知錯誤'
          }`
        );
      }
    }

    return {
      migratedTransactions,
      migrationReport
    };
  }

  /**
   * 驗證遷移結果
   */
  static validateMigration(
    originalData: any[],
    migratedData: TransactionGroupWithEntries[]
  ): {
    isValid: boolean;
    issues: string[];
    dataIntegrityScore: number;
  } {
    const issues: string[] = [];

    // 檢查資料數量
    if (originalData.length !== migratedData.length) {
      issues.push(`資料數量不符: 原始 ${originalData.length} 筆，遷移後 ${migratedData.length} 筆`);
    }

    // 檢查必要欄位
    migratedData.forEach((transaction, index) => {
      if (!transaction._id) {
        issues.push(`遷移後交易 ${index} 缺少 ID`);
      }
      if (!transaction.groupNumber) {
        issues.push(`遷移後交易 ${index} 缺少群組編號`);
      }
      if (!transaction.entries || transaction.entries.length === 0) {
        issues.push(`遷移後交易 ${transaction.groupNumber} 缺少分錄`);
      }
    });

    const dataIntegrityScore = Math.max(0, 100 - (issues.length * 10));

    return {
      isValid: issues.length === 0,
      issues,
      dataIntegrityScore
    };
  }
}

/**
 * 匯出主要服務實例
 */
export const compatibilityManager = VersionCompatibilityManager.getInstance();

/**
 * 便利函數：快速檢查系統相容性
 */
export async function quickCompatibilityCheck(
  accounts: Account2[],
  transactions: TransactionGroupWithEntries[]
): Promise<boolean> {
  const result = await compatibilityManager.checkSystemCompatibility(accounts, transactions);
  return result.isCompatible;
}

/**
 * 便利函數：取得相容性摘要
 */
export function getCompatibilitySummary(
  accounts: Account2[],
  transactions: TransactionGroupWithEntries[]
): string {
  const stats = compatibilityManager.getCompatibilityStats(accounts, transactions);
  
  return `相容性分數: ${stats.compatibilityScore}/100 | ` +
         `科目: ${stats.activeAccounts}/${stats.totalAccounts} | ` +
         `交易: ${stats.totalTransactions} (內嵌: ${stats.embeddedTransactions}, 獨立: ${stats.standaloneTransactions})`;
}