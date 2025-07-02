import mongoose from 'mongoose';
import Account2, { IAccount2 } from '../models/Account2';
import AccountingEntry, { IAccountingEntry } from '../models/AccountingEntry';
import { DoubleEntryValidator } from '../utils/doubleEntryValidation';

/**
 * 會計科目餘額計算服務
 */
export class AccountBalanceService {

  /**
   * 計算單一科目餘額
   * @param accountId 會計科目ID
   * @param asOfDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 科目餘額資訊
   */
  static async calculateAccountBalance(
    accountId: string, 
    asOfDate?: Date,
    organizationId?: string
  ) {
    try {
      // 取得會計科目資訊
      const account = await Account2.findById(accountId);
      if (!account) {
        throw new Error('找不到指定的會計科目');
      }

      // 建立查詢條件
      const filter: any = {
        accountId: new mongoose.Types.ObjectId(accountId)
      };

      // 加入日期過濾
      if (asOfDate) {
        filter['transactionGroupId'] = {
          $in: await this.getConfirmedTransactionGroups(asOfDate, organizationId)
        };
      }

      // 加入機構過濾
      if (organizationId) {
        filter.organizationId = new mongoose.Types.ObjectId(organizationId);
      }

      // 查詢相關分錄
      const entries = await AccountingEntry.find(filter);

      // 計算餘額
      const balanceInfo = DoubleEntryValidator.calculateAccountBalance(
        accountId,
        entries,
        account.normalBalance
      );

      return {
        accountId: account._id.toString(),
        accountCode: account.code,
        accountName: account.name,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        initialBalance: account.initialBalance,
        ...balanceInfo,
        finalBalance: account.initialBalance + balanceInfo.balance,
        asOfDate: asOfDate || new Date(),
        currency: account.currency
      };

    } catch (error) {
      console.error('計算科目餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 批量計算多個科目餘額
   * @param accountIds 會計科目ID陣列
   * @param asOfDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 科目餘額陣列
   */
  static async calculateMultipleAccountBalances(
    accountIds: string[],
    asOfDate?: Date,
    organizationId?: string
  ) {
    const results: Array<{
      accountId: string;
      accountCode?: string;
      accountName?: string;
      accountType?: string;
      normalBalance?: string;
      initialBalance?: number;
      totalDebit?: number;
      totalCredit?: number;
      balance?: number;
      finalBalance?: number;
      asOfDate?: Date;
      currency?: string;
      error?: string;
    }> = [];
    
    for (const accountId of accountIds) {
      try {
        const balanceResult = await this.calculateAccountBalance(accountId, asOfDate, organizationId);
        results.push(balanceResult);
      } catch (error) {
        console.error(`計算科目 ${accountId} 餘額失敗:`, error);
        results.push({
          accountId,
          error: error instanceof Error ? error.message : '計算失敗'
        });
      }
    }

    return results;
  }

  /**
   * 計算科目類型餘額匯總
   * @param accountType 會計科目類型
   * @param asOfDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 類型餘額匯總
   */
  static async calculateAccountTypeBalance(
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
    asOfDate?: Date,
    organizationId?: string
  ) {
    try {
      // 查詢該類型的所有科目
      const filter: any = {
        accountType,
        isActive: true
      };

      if (organizationId) {
        filter.organizationId = new mongoose.Types.ObjectId(organizationId);
      }

      const accounts = await Account2.find(filter);
      const accountIds = accounts.map(account => account._id.toString());

      // 計算各科目餘額
      const balances = await this.calculateMultipleAccountBalances(
        accountIds,
        asOfDate,
        organizationId
      );

      // 計算總額
      const validBalances = balances.filter(balance => !balance.error);
      
      const totalBalance = validBalances
        .reduce((sum, balance) => sum + (balance.finalBalance || 0), 0);

      const totalDebit = validBalances
        .reduce((sum, balance) => sum + (balance.totalDebit || 0), 0);

      const totalCredit = validBalances
        .reduce((sum, balance) => sum + (balance.totalCredit || 0), 0);

      return {
        accountType,
        totalBalance,
        totalDebit,
        totalCredit,
        accountCount: accounts.length,
        balances,
        asOfDate: asOfDate || new Date()
      };

    } catch (error) {
      console.error('計算科目類型餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 生成試算表
   * @param asOfDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 試算表資料
   */
  static async generateTrialBalance(asOfDate?: Date, organizationId?: string) {
    try {
      const accountTypes: Array<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'> = 
        ['asset', 'liability', 'equity', 'revenue', 'expense'];

      const trialBalance = [];
      let totalDebit = 0;
      let totalCredit = 0;

      for (const accountType of accountTypes) {
        const typeBalance = await this.calculateAccountTypeBalance(
          accountType,
          asOfDate,
          organizationId
        );

        trialBalance.push(typeBalance);
        totalDebit += typeBalance.totalDebit;
        totalCredit += typeBalance.totalCredit;
      }

      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      return {
        trialBalance,
        summary: {
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit,
          isBalanced
        },
        asOfDate: asOfDate || new Date(),
        organizationId
      };

    } catch (error) {
      console.error('生成試算表錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得已確認的交易群組ID
   * @param asOfDate 截止日期
   * @param organizationId 機構ID（可選）
   * @returns 交易群組ID陣列
   */
  private static async getConfirmedTransactionGroups(
    asOfDate: Date,
    organizationId?: string
  ) {
    const TransactionGroup = mongoose.model('TransactionGroup');
    
    const filter: any = {
      status: 'confirmed',
      transactionDate: { $lte: asOfDate }
    };

    if (organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const groups = await TransactionGroup.find(filter, '_id');
    return groups.map(group => group._id);
  }

  /**
   * 更新科目餘額快取
   * @param accountId 會計科目ID
   * @param organizationId 機構ID（可選）
   */
  static async updateAccountBalanceCache(accountId: string, organizationId?: string) {
    try {
      const balanceInfo = await this.calculateAccountBalance(accountId, undefined, organizationId);
      
      // 更新 Account2 模型中的 balance 欄位
      await Account2.findByIdAndUpdate(accountId, {
        balance: balanceInfo.finalBalance
      });

      return balanceInfo;
    } catch (error) {
      console.error('更新科目餘額快取錯誤:', error);
      throw error;
    }
  }
}

export default AccountBalanceService;