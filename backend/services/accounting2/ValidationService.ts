import TransactionGroupWithEntries from '../../models/TransactionGroupWithEntries';
import Account2 from '../../models/Account2';
import { VersionCompatibilityManager } from '../../../shared/services/compatibilityService';
import { TransactionGroupWithEntries as TransactionGroupType, Account2 as Account2Type } from '../../../shared/types/accounting2';

/**
 * Accounting2 驗證服務層
 * 提供版本一致性驗證和資料完整性檢查
 *
 * 此服務負責檢查帳戶和交易資料的完整性、關聯性和版本相容性
 * 可用於系統診斷和資料品質保證
 */
export class ValidationService {
  
  /**
   * 驗證系統資料完整性
   * 全面檢查系統中的帳戶和交易資料，包括資料完整性、關聯性和版本相容性
   *
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 包含驗證結果、摘要統計和問題清單的物件
   */
  static async validateSystemIntegrity(
    userId: string,
    organizationId?: string
  ): Promise<{
    isValid: boolean;
    summary: {
      totalAccounts: number;
      totalTransactions: number;
      validAccounts: number;
      validTransactions: number;
      compatibilityScore: number;
    };
    issues: Array<{
      type: 'account' | 'transaction' | 'relationship' | 'compatibility';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }>;
  }> {
    try {
      const query: any = {
        createdBy: userId,
        ...(organizationId ? { organizationId } : {})
      };

      // 取得所有帳戶和交易
      const [accounts, transactions] = await Promise.all([
        Account2.find({ ...query, isActive: true }).lean(),
        TransactionGroupWithEntries.find(query).lean()
      ]);

      const issues: Array<{
        type: 'account' | 'transaction' | 'relationship' | 'compatibility';
        severity: 'error' | 'warning' | 'info';
        entityId: string;
        entityName: string;
        description: string;
        recommendation?: string;
      }> = [];

      // 驗證帳戶資料
      const accountValidation = await this.validateAccounts(accounts);
      issues.push(...accountValidation.issues);

      // 驗證交易資料
      const transactionValidation = await this.validateTransactions(transactions);
      issues.push(...transactionValidation.issues);

      // 驗證資料關聯性
      const relationshipValidation = await this.validateDataRelationships(accounts, transactions);
      issues.push(...relationshipValidation.issues);

      // 驗證版本相容性
      const compatibilityValidation = await this.validateVersionCompatibility(accounts, transactions);
      issues.push(...compatibilityValidation.issues);

      const validAccounts = accounts.length - accountValidation.invalidCount;
      const validTransactions = transactions.length - transactionValidation.invalidCount;
      const isValid = issues.filter(i => i.severity === 'error').length === 0;

      // 計算相容性分數
      const compatibilityManager = VersionCompatibilityManager.getInstance();
      const accountsData = accounts.map(account => ({
        ...account,
        _id: account._id.toString(),
        parentId: account.parentId?.toString() || null,
        organizationId: account.organizationId?.toString() || null
      })) as Account2Type[];
      const transactionsData = transactions.map(t => ({
        ...t,
        _id: t._id.toString()
      })) as TransactionGroupType[];
      
      const stats = compatibilityManager.getCompatibilityStats(accountsData, transactionsData);

      console.log(`🔍 系統完整性驗證完成: ${isValid ? '通過' : `發現 ${issues.length} 個問題`}`);

      return {
        isValid,
        summary: {
          totalAccounts: accounts.length,
          totalTransactions: transactions.length,
          validAccounts,
          validTransactions,
          compatibilityScore: stats.compatibilityScore
        },
        issues: issues.sort((a, b) => {
          const severityOrder = { error: 0, warning: 1, info: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        })
      };
    } catch (error) {
      console.error('驗證系統資料完整性錯誤:', error);
      throw error;
    }
  }

  /**
   * 驗證帳戶資料
   * 檢查帳戶的必要欄位、唯一性和資料完整性
   *
   * @param accounts 帳戶陣列
   * @returns 包含無效帳戶數量和問題清單的物件
   * @private
   */
  private static async validateAccounts(accounts: any[]): Promise<{
    invalidCount: number;
    issues: Array<{
      type: 'account';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }>;
  }> {
    const issues: Array<{
      type: 'account';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }> = [];

    let invalidCount = 0;
    const accountCodes = new Set<string>();
    const accountNames = new Set<string>();

    for (const account of accounts) {
      let hasError = false;

      // 檢查必要欄位
      if (!account.code) {
        issues.push({
          type: 'account',
          severity: 'error',
          entityId: account._id.toString(),
          entityName: account.name || 'Unknown',
          description: '缺少帳戶代碼',
          recommendation: '請為帳戶設定唯一的代碼'
        });
        hasError = true;
      }

      if (!account.name) {
        issues.push({
          type: 'account',
          severity: 'error',
          entityId: account._id.toString(),
          entityName: account.code || 'Unknown',
          description: '缺少帳戶名稱',
          recommendation: '請為帳戶設定描述性名稱'
        });
        hasError = true;
      }

      if (!account.accountType) {
        issues.push({
          type: 'account',
          severity: 'error',
          entityId: account._id.toString(),
          entityName: account.name || account.code || 'Unknown',
          description: '缺少帳戶類型',
          recommendation: '請設定帳戶類型（asset, liability, equity, revenue, expense）'
        });
        hasError = true;
      }

      // 檢查代碼唯一性
      if (account.code) {
        if (accountCodes.has(account.code)) {
          issues.push({
            type: 'account',
            severity: 'error',
            entityId: account._id.toString(),
            entityName: account.name || 'Unknown',
            description: `帳戶代碼重複: ${account.code}`,
            recommendation: '請使用唯一的帳戶代碼'
          });
          hasError = true;
        } else {
          accountCodes.add(account.code);
        }
      }

      // 檢查名稱唯一性（警告）
      if (account.name) {
        if (accountNames.has(account.name)) {
          issues.push({
            type: 'account',
            severity: 'warning',
            entityId: account._id.toString(),
            entityName: account.name,
            description: `帳戶名稱重複: ${account.name}`,
            recommendation: '建議使用唯一的帳戶名稱以避免混淆'
          });
        } else {
          accountNames.add(account.name);
        }
      }

      // 檢查餘額資訊
      if (account.balance === undefined && account.initialBalance === undefined) {
        issues.push({
          type: 'account',
          severity: 'warning',
          entityId: account._id.toString(),
          entityName: account.name || account.code || 'Unknown',
          description: '缺少餘額資訊',
          recommendation: '建議設定初始餘額或當前餘額'
        });
      }

      // 檢查正常餘額方向
      if (account.accountType && !account.normalBalance) {
        const defaultNormalBalance = this.getDefaultNormalBalance(account.accountType);
        issues.push({
          type: 'account',
          severity: 'info',
          entityId: account._id.toString(),
          entityName: account.name || account.code || 'Unknown',
          description: '未設定正常餘額方向',
          recommendation: `建議設定為 ${defaultNormalBalance} 方向`
        });
      }

      if (hasError) {
        invalidCount++;
      }
    }

    return { invalidCount, issues };
  }

  /**
   * 驗證交易資料
   * 檢查交易的必要欄位、唯一性、借貸平衡和分錄完整性
   *
   * @param transactions 交易陣列
   * @returns 包含無效交易數量和問題清單的物件
   * @private
   */
  private static async validateTransactions(transactions: any[]): Promise<{
    invalidCount: number;
    issues: Array<{
      type: 'transaction';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }>;
  }> {
    const issues: Array<{
      type: 'transaction';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }> = [];

    let invalidCount = 0;
    const groupNumbers = new Set<string>();

    for (const transaction of transactions) {
      let hasError = false;

      // 檢查必要欄位
      if (!transaction.groupNumber) {
        issues.push({
          type: 'transaction',
          severity: 'error',
          entityId: transaction._id.toString(),
          entityName: transaction.description || 'Unknown',
          description: '缺少交易群組編號',
          recommendation: '請為交易設定唯一的群組編號'
        });
        hasError = true;
      }

      if (!transaction.transactionDate) {
        issues.push({
          type: 'transaction',
          severity: 'error',
          entityId: transaction._id.toString(),
          entityName: transaction.groupNumber || 'Unknown',
          description: '缺少交易日期',
          recommendation: '請設定交易日期'
        });
        hasError = true;
      }

      // 檢查群組編號唯一性
      if (transaction.groupNumber) {
        if (groupNumbers.has(transaction.groupNumber)) {
          issues.push({
            type: 'transaction',
            severity: 'error',
            entityId: transaction._id.toString(),
            entityName: transaction.description || 'Unknown',
            description: `交易群組編號重複: ${transaction.groupNumber}`,
            recommendation: '請使用唯一的交易群組編號'
          });
          hasError = true;
        } else {
          groupNumbers.add(transaction.groupNumber);
        }
      }

      // 檢查分錄
      if (!transaction.entries || transaction.entries.length === 0) {
        issues.push({
          type: 'transaction',
          severity: 'error',
          entityId: transaction._id.toString(),
          entityName: transaction.groupNumber || 'Unknown',
          description: '交易沒有分錄',
          recommendation: '請為交易添加至少兩筆分錄'
        });
        hasError = true;
      } else {
        // 檢查借貸平衡
        const totalDebit = transaction.entries.reduce((sum: number, entry: any) => 
          sum + (entry.debitAmount || 0), 0
        );
        const totalCredit = transaction.entries.reduce((sum: number, entry: any) => 
          sum + (entry.creditAmount || 0), 0
        );

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          issues.push({
            type: 'transaction',
            severity: 'error',
            entityId: transaction._id.toString(),
            entityName: transaction.groupNumber || 'Unknown',
            description: `借貸不平衡: 借方 ${totalDebit}, 貸方 ${totalCredit}`,
            recommendation: '請調整分錄金額使借貸平衡'
          });
          hasError = true;
        }

        // 檢查分錄數量
        if (transaction.entries.length < 2) {
          issues.push({
            type: 'transaction',
            severity: 'warning',
            entityId: transaction._id.toString(),
            entityName: transaction.groupNumber || 'Unknown',
            description: '分錄數量少於2筆',
            recommendation: '複式記帳通常需要至少2筆分錄'
          });
        }
      }

      // 檢查交易狀態
      if (!transaction.status) {
        issues.push({
          type: 'transaction',
          severity: 'warning',
          entityId: transaction._id.toString(),
          entityName: transaction.groupNumber || 'Unknown',
          description: '未設定交易狀態',
          recommendation: '建議設定交易狀態（draft, confirmed, cancelled）'
        });
      }

      if (hasError) {
        invalidCount++;
      }
    }

    return { invalidCount, issues };
  }

  /**
   * 驗證資料關聯性
   * 檢查交易分錄中的帳戶引用是否有效、資金來源引用是否存在，以及識別孤立帳戶
   *
   * @param accounts 帳戶陣列
   * @param transactions 交易陣列
   * @returns 包含關聯性問題清單的物件
   * @private
   */
  private static async validateDataRelationships(
    accounts: any[],
    transactions: any[]
  ): Promise<{
    issues: Array<{
      type: 'relationship';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }>;
  }> {
    const issues: Array<{
      type: 'relationship';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }> = [];

    const accountIds = new Set(accounts.map(a => a._id.toString()));
    const transactionIds = new Set(transactions.map(t => t._id.toString()));

    // 檢查分錄中的帳戶引用
    for (const transaction of transactions) {
      if (transaction.entries) {
        for (const entry of transaction.entries) {
          const entryAccountId = typeof entry.accountId === 'string' 
            ? entry.accountId 
            : entry.accountId?._id?.toString();

          if (entryAccountId && !accountIds.has(entryAccountId)) {
            issues.push({
              type: 'relationship',
              severity: 'error',
              entityId: transaction._id.toString(),
              entityName: transaction.groupNumber || 'Unknown',
              description: `分錄引用不存在的帳戶: ${entryAccountId}`,
              recommendation: '請檢查帳戶是否存在或已被刪除'
            });
          }

          // 檢查資金來源引用
          if (entry.sourceTransactionId) {
            const sourceId = entry.sourceTransactionId.toString();
            if (!transactionIds.has(sourceId)) {
              issues.push({
                type: 'relationship',
                severity: 'warning',
                entityId: transaction._id.toString(),
                entityName: transaction.groupNumber || 'Unknown',
                description: `分錄引用不存在的資金來源: ${sourceId}`,
                recommendation: '請檢查資金來源交易是否存在'
              });
            }
          }
        }
      }
    }

    // 檢查孤立帳戶（沒有被任何交易使用）
    const usedAccountIds = new Set<string>();
    transactions.forEach(transaction => {
      if (transaction.entries) {
        transaction.entries.forEach((entry: any) => {
          const entryAccountId = typeof entry.accountId === 'string' 
            ? entry.accountId 
            : entry.accountId?._id?.toString();
          if (entryAccountId) {
            usedAccountIds.add(entryAccountId);
          }
        });
      }
    });

    accounts.forEach(account => {
      if (!usedAccountIds.has(account._id.toString())) {
        issues.push({
          type: 'relationship',
          severity: 'info',
          entityId: account._id.toString(),
          entityName: account.name || account.code || 'Unknown',
          description: '帳戶未被任何交易使用',
          recommendation: '考慮是否需要此帳戶或添加相關交易'
        });
      }
    });

    return { issues };
  }

  /**
   * 驗證版本相容性
   * 使用 VersionCompatibilityManager 檢查系統資料與當前版本的相容性
   *
   * @param accounts 帳戶陣列
   * @param transactions 交易陣列
   * @returns 包含相容性問題和建議的物件
   * @private
   */
  private static async validateVersionCompatibility(
    accounts: any[],
    transactions: any[]
  ): Promise<{
    issues: Array<{
      type: 'compatibility';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }>;
  }> {
    const issues: Array<{
      type: 'compatibility';
      severity: 'error' | 'warning' | 'info';
      entityId: string;
      entityName: string;
      description: string;
      recommendation?: string;
    }> = [];

    try {
      const compatibilityManager = VersionCompatibilityManager.getInstance();
      const accountsData = accounts as Account2Type[];
      const transactionsData = transactions.map(t => ({
        ...t,
        _id: t._id.toString()
      })) as TransactionGroupType[];

      const compatibilityResult = await compatibilityManager.checkSystemCompatibility(
        accountsData,
        transactionsData
      );

      if (!compatibilityResult.isCompatible) {
        compatibilityResult.issues.forEach((issue: string) => {
          issues.push({
            type: 'compatibility',
            severity: 'warning',
            entityId: 'system',
            entityName: 'System Compatibility',
            description: issue,
            recommendation: '請參考相容性建議進行調整'
          });
        });
      }

      // 添加相容性建議
      compatibilityResult.recommendations.forEach((recommendation: string) => {
        issues.push({
          type: 'compatibility',
          severity: 'info',
          entityId: 'system',
          entityName: 'System Optimization',
          description: recommendation,
          recommendation: '考慮實施此建議以提升系統效能'
        });
      });

    } catch (error) {
      issues.push({
        type: 'compatibility',
        severity: 'error',
        entityId: 'system',
        entityName: 'Compatibility Check',
        description: `相容性檢查失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        recommendation: '請檢查系統配置和資料格式'
      });
    }

    return { issues };
  }

  /**
   * 取得預設正常餘額方向
   * 根據帳戶類型判斷其預設的正常餘額方向（借方或貸方）
   *
   * @param accountType 帳戶類型 (asset, liability, equity, revenue, expense)
   * @returns 正常餘額方向 - 'debit' 借方 或 'credit' 貸方
   * @private
   */
  private static getDefaultNormalBalance(accountType: string): 'debit' | 'credit' {
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
   * 生成驗證報告
   * 執行系統完整性驗證並生成包含摘要、詳細資訊和建議的報告
   *
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 包含報告ID、生成時間、摘要、詳細資訊和建議的驗證報告
   */
  static async generateValidationReport(
    userId: string,
    organizationId?: string
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    summary: any;
    details: any;
    recommendations: string[];
  }> {
    try {
      const validation = await this.validateSystemIntegrity(userId, organizationId);
      
      const reportId = `VAL-${Date.now()}-${userId.slice(-6)}`;
      const generatedAt = new Date();

      // 生成建議
      const recommendations: string[] = [];
      
      if (validation.summary.compatibilityScore < 80) {
        recommendations.push('系統相容性分數偏低，建議進行資料格式統一');
      }
      
      const errorCount = validation.issues.filter(i => i.severity === 'error').length;
      if (errorCount > 0) {
        recommendations.push(`發現 ${errorCount} 個嚴重錯誤，請優先處理`);
      }
      
      const warningCount = validation.issues.filter(i => i.severity === 'warning').length;
      if (warningCount > 5) {
        recommendations.push(`發現 ${warningCount} 個警告，建議逐步改善`);
      }

      if (validation.summary.validAccounts / validation.summary.totalAccounts < 0.9) {
        recommendations.push('帳戶資料完整性不足，請檢查並補充必要資訊');
      }

      if (validation.summary.validTransactions / validation.summary.totalTransactions < 0.9) {
        recommendations.push('交易資料完整性不足，請檢查借貸平衡和必要欄位');
      }

      console.log(`📋 驗證報告生成完成: ${reportId}`);

      return {
        reportId,
        generatedAt,
        summary: validation.summary,
        details: validation,
        recommendations
      };
    } catch (error) {
      console.error('生成驗證報告錯誤:', error);
      throw error;
    }
  }
}

export default ValidationService;