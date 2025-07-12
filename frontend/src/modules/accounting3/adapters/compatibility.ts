/**
 * Accounting2 到 Accounting3 相容性適配器
 * 提供平滑的遷移路徑，逐步減少對 accounting2 的依賴
 */

import { Account2, TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared/types/accounting2';
import {
  Account3,
  TransactionGroup3,
  TransactionGroupWithEntries3,
  AccountingEntry3,
  Account3FormData,
  TransactionGroup3FormData,
  AccountingEntry3FormData
} from '@pharmacy-pos/shared/types/accounting3';

/**
 * Accounting2 到 Accounting3 資料轉換適配器
 */
export class Accounting2To3Adapter {
  /**
   * 轉換 Account2 到 Account3
   */
  static convertAccount(account2: Account2): Account3 {
    return {
      _id: account2._id,
      code: account2.code,
      name: account2.name,
      accountType: account2.accountType,
      type: account2.type, // 添加必需的 type 屬性
      parentId: account2.parentId,
      level: account2.level,
      isActive: account2.isActive,
      normalBalance: account2.normalBalance,
      balance: account2.balance,
      initialBalance: account2.initialBalance,
      currency: account2.currency,
      description: account2.description,
      organizationId: account2.organizationId,
      createdAt: account2.createdAt,
      updatedAt: account2.updatedAt,
      createdBy: account2.createdBy,
      children: account2.children?.map(child => this.convertAccount(child)),
    };
  }

  /**
   * 轉換 TransactionGroupWithEntries 到 TransactionGroupWithEntries3
   */
  static convertTransactionGroup(group2: TransactionGroupWithEntries): TransactionGroupWithEntries3 {
    return {
      _id: group2._id,
      groupNumber: group2.groupNumber,
      description: group2.description,
      transactionDate: group2.transactionDate,
      organizationId: group2.organizationId,
      receiptUrl: group2.receiptUrl,
      invoiceNo: group2.invoiceNo,
      totalAmount: group2.totalAmount,
      status: group2.status,
      linkedTransactionIds: group2.linkedTransactionIds,
      sourceTransactionId: group2.sourceTransactionId,
      fundingType: group2.fundingType,
      createdBy: group2.createdBy,
      createdAt: group2.createdAt,
      updatedAt: group2.updatedAt,
      entries: group2.entries?.map(entry => this.convertEntry(entry, group2._id, group2.createdBy)) || [],
      isBalanced: group2.isBalanced,
      balanceDifference: group2.balanceDifference,
      entryCount: group2.entryCount,
      referencedByInfo: group2.referencedByInfo?.map(ref => ({
        _id: ref._id,
        groupNumber: ref.groupNumber,
        description: ref.description,
        transactionDate: ref.transactionDate,
        totalAmount: ref.totalAmount,
        status: ref.status
      }))
    };
  }

  /**
   * 轉換 EmbeddedAccountingEntry 到 AccountingEntry3
   */
  static convertEntry(entry2: EmbeddedAccountingEntry, transactionGroupId: string = '', createdBy: string = 'system'): AccountingEntry3 {
    return {
      _id: entry2._id || '',
      transactionGroupId, // 添加必需的 transactionGroupId
      sequence: entry2.sequence,
      accountId: entry2.accountId,
      debitAmount: entry2.debitAmount,
      creditAmount: entry2.creditAmount,
      categoryId: entry2.categoryId,
      description: entry2.description,
      sourceTransactionId: entry2.sourceTransactionId,
      fundingPath: entry2.fundingPath,
      organizationId: '', // 添加必需的 organizationId
      createdBy, // 添加必需的 createdBy
      createdAt: new Date(), // 添加必需的 createdAt
      updatedAt: new Date() // 添加必需的 updatedAt
    };
  }

  /**
   * 批量轉換科目
   */
  static convertAccounts(accounts2: Account2[]): Account3[] {
    return accounts2.map(account => this.convertAccount(account));
  }

  /**
   * 批量轉換交易群組
   */
  static convertTransactionGroups(groups2: TransactionGroupWithEntries[]): TransactionGroupWithEntries3[] {
    return groups2.map(group => this.convertTransactionGroup(group));
  }
}

/**
 * Accounting3 到 Accounting2 反向適配器
 * 用於需要與舊系統相容的場景
 */
export class Accounting3To2Adapter {
  /**
   * 轉換 Account3 到 Account2
   */
  static convertAccount(account3: Account3): Account2 {
    return {
      _id: account3._id,
      code: account3.code,
      name: account3.name,
      accountType: account3.accountType,
      type: 'other', // 預設值，因為 Account3 沒有此欄位
      parentId: account3.parentId,
      level: account3.level,
      isActive: account3.isActive,
      normalBalance: account3.normalBalance,
      balance: account3.balance,
      initialBalance: account3.initialBalance,
      currency: account3.currency,
      description: account3.description,
      organizationId: account3.organizationId,
      createdAt: account3.createdAt,
      updatedAt: account3.updatedAt,
      createdBy: account3.createdBy,
      children: account3.children?.map(child => this.convertAccount(child))
    };
  }

  /**
   * 轉換 TransactionGroupWithEntries3 到 TransactionGroupWithEntries
   */
  static convertTransactionGroup(group3: TransactionGroupWithEntries3): TransactionGroupWithEntries {
    return {
      _id: group3._id,
      groupNumber: group3.groupNumber,
      description: group3.description,
      transactionDate: group3.transactionDate,
      organizationId: group3.organizationId || '',
      receiptUrl: group3.receiptUrl,
      invoiceNo: group3.invoiceNo,
      totalAmount: group3.totalAmount,
      status: group3.status,
      linkedTransactionIds: group3.linkedTransactionIds,
      sourceTransactionId: group3.sourceTransactionId,
      fundingType: group3.fundingType,
      createdBy: group3.createdBy,
      createdAt: group3.createdAt,
      updatedAt: group3.updatedAt,
      entries: group3.entries?.map(entry => ({
        _id: entry._id,
        sequence: entry.sequence,
        accountId: entry.accountId,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        categoryId: entry.categoryId,
        description: entry.description,
        sourceTransactionId: entry.sourceTransactionId,
        fundingPath: entry.fundingPath
      })) || [],
      isBalanced: group3.isBalanced,
      balanceDifference: group3.balanceDifference,
      entryCount: group3.entryCount,
      referencedByInfo: group3.referencedByInfo?.map(ref => ({
        _id: ref._id,
        groupNumber: ref.groupNumber,
        description: ref.description,
        transactionDate: ref.transactionDate,
        totalAmount: ref.totalAmount,
        status: ref.status
      }))
    };
  }

  /**
   * 轉換 AccountingEntry3 到 EmbeddedAccountingEntry
   */
  static convertEntry(entry3: AccountingEntry3): EmbeddedAccountingEntry {
    // 處理 accountId 的型別轉換
    const accountId = typeof entry3.accountId === 'string'
      ? entry3.accountId
      : this.convertAccount(entry3.accountId);

    // 處理 categoryId 的型別轉換
    const categoryId = typeof entry3.categoryId === 'string'
      ? entry3.categoryId
      : entry3.categoryId?._id;

    return {
      _id: entry3._id,
      sequence: entry3.sequence,
      accountId,
      debitAmount: entry3.debitAmount,
      creditAmount: entry3.creditAmount,
      categoryId,
      description: entry3.description,
      sourceTransactionId: entry3.sourceTransactionId,
      fundingPath: entry3.fundingPath
    };
  }
}

/**
 * 相容性檢查器
 * 驗證轉換的正確性
 */
export class CompatibilityValidator {
  /**
   * 驗證科目轉換的正確性
   */
  static validateAccountConversion(original: Account2, converted: Account3): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (original._id !== converted._id) {
      errors.push('科目 ID 不匹配');
    }

    if (original.code !== converted.code) {
      errors.push('科目代碼不匹配');
    }

    if (original.name !== converted.name) {
      errors.push('科目名稱不匹配');
    }

    if (original.accountType !== converted.accountType) {
      errors.push('科目類型不匹配');
    }

    if (Math.abs(original.balance - converted.balance) >= 0.01) {
      errors.push(`餘額不匹配: 原始 ${original.balance}, 轉換後 ${converted.balance}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證交易群組轉換的正確性
   */
  static validateTransactionGroupConversion(
    original: TransactionGroupWithEntries,
    converted: TransactionGroupWithEntries3
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (original._id !== converted._id) {
      errors.push('交易群組 ID 不匹配');
    }

    if (original.groupNumber !== converted.groupNumber) {
      errors.push('交易群組編號不匹配');
    }

    if (Math.abs(original.totalAmount - converted.totalAmount) >= 0.01) {
      errors.push(`總金額不匹配: 原始 ${original.totalAmount}, 轉換後 ${converted.totalAmount}`);
    }

    const originalEntriesCount = original.entries?.length || 0;
    const convertedEntriesCount = converted.entries?.length || 0;
    if (originalEntriesCount !== convertedEntriesCount) {
      errors.push(`分錄數量不匹配: 原始 ${originalEntriesCount}, 轉換後 ${convertedEntriesCount}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 遷移助手
 * 提供遷移過程中的實用工具
 */
export class MigrationHelper {
  /**
   * 檢查是否可以安全移除 accounting2 依賴
   */
  static canRemoveAccounting2Dependency(
    accounting2Usage: string[],
    accounting3Coverage: string[]
  ): {
    canRemove: boolean;
    missingFeatures: string[];
    recommendations: string[];
  } {
    const missingFeatures = accounting2Usage.filter(
      feature => !accounting3Coverage.includes(feature)
    );

    const recommendations: string[] = [];
    
    if (missingFeatures.length > 0) {
      recommendations.push('完成以下功能的 accounting3 實作：');
      recommendations.push(...missingFeatures.map(feature => `- ${feature}`));
    }

    if (missingFeatures.length === 0) {
      recommendations.push('可以安全移除 accounting2 依賴');
      recommendations.push('建議先進行完整測試');
    }

    return {
      canRemove: missingFeatures.length === 0,
      missingFeatures,
      recommendations
    };
  }

  /**
   * 生成遷移報告
   */
  static generateMigrationReport(
    totalFiles: number,
    migratedFiles: number,
    failedFiles: string[]
  ): {
    progress: number;
    status: 'in-progress' | 'completed' | 'failed';
    summary: string;
    nextSteps: string[];
  } {
    const progress = Math.round((migratedFiles / totalFiles) * 100);
    
    let status: 'in-progress' | 'completed' | 'failed';
    if (failedFiles.length > 0) {
      status = 'failed';
    } else if (migratedFiles === totalFiles) {
      status = 'completed';
    } else {
      status = 'in-progress';
    }

    const summary = `已遷移 ${migratedFiles}/${totalFiles} 個檔案 (${progress}%)`;
    
    const nextSteps: string[] = [];
    if (failedFiles.length > 0) {
      nextSteps.push('修復失敗的檔案：');
      nextSteps.push(...failedFiles.map(file => `- ${file}`));
    } else if (status === 'in-progress') {
      nextSteps.push('繼續遷移剩餘檔案');
    } else {
      nextSteps.push('執行完整測試');
      nextSteps.push('移除 accounting2 依賴');
    }

    return {
      progress,
      status,
      summary,
      nextSteps
    };
  }
}

// 匯出主要轉換函數
export const convertAccount2To3 = Accounting2To3Adapter.convertAccount;
export const convertTransactionGroup2To3 = Accounting2To3Adapter.convertTransactionGroup;
export const convertAccount3To2 = Accounting3To2Adapter.convertAccount;
export const convertTransactionGroup3To2 = Accounting3To2Adapter.convertTransactionGroup;