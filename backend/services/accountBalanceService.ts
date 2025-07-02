import AccountingEntry from '../models/AccountingEntry';
import Account2 from '../models/Account2';
import { IAccountingEntry } from '../models/AccountingEntry';
import { IAccount2 } from '../models/Account2';

/**
 * 會計科目餘額計算服務
 * 提供各種餘額計算和查詢功能
 */
export class AccountBalanceService {

  /**
   * 計算單一會計科目的餘額
   * @param accountId 會計科目ID
   * @param endDate 截止日期（可選，預設為當前日期）
   * @param organizationId 機構ID（可選）
   * @returns 科目餘額資訊
   */
  static async calculateAccountBalance(
    accountId: string,
    endDate?: Date,
    organizationId?: string
  ) {
    try {
      // 獲取會計科目資訊
      const account = await Account2.findById(accountId);
      if (!account) {
        throw new Error('會計科目不存在');
      }

      // 建立查詢條件
      const query: any = { accountId };
      
      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (endDate) {
        query.createdAt = { $lte: endDate };
      }

      // 獲取相關的記帳分錄
      const entries = await AccountingEntry.find(query)
        .populate('transactionGroupId', 'status transactionDate')
        .sort({ createdAt: 1 });

      // 只計算已確認的交易
      const confirmedEntries = entries.filter(entry => 
        entry.transactionGroupId && 
        (entry.transactionGroupId as any).status === 'confirmed'
      );

      // 計算借方和貸方總額
      const totalDebit = confirmedEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
      const totalCredit = confirmedEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);

      // 根據科目的正常餘額方向計算餘額
      let balance: number;
      const normalBalance = account.normalBalance;

      if (normalBalance === 'debit') {
        // 借方科目：借方增加，貸方減少
        balance = totalDebit - totalCredit;
      } else {
        // 貸方科目：貸方增加，借方減少
        balance = totalCredit - totalDebit;
      }

      return {
        accountId: account._id,
        accountName: account.name,
        accountCode: account.code,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        totalDebit,
        totalCredit,
        balance,
        entryCount: confirmedEntries.length,
        lastTransactionDate: confirmedEntries.length > 0 
          ? confirmedEntries[confirmedEntries.length - 1].createdAt 
          : null
      };
    } catch (error) {
      console.error('計算會計科目餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 批量計算多個會計科目的餘額
   * @param accountIds 會計科目ID陣列
   * @param endDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 科目餘額陣列
   */
  static async calculateMultipleAccountBalances(
    accountIds: string[],
    endDate?: Date,
    organizationId?: string
  ) {
    try {
      const balances = await Promise.all(
        accountIds.map(accountId => 
          this.calculateAccountBalance(accountId, endDate, organizationId)
        )
      );

      return balances;
    } catch (error) {
      console.error('批量計算會計科目餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 按科目類型計算餘額匯總
   * @param accountType 科目類型
   * @param endDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 科目類型餘額匯總
   */
  static async calculateBalanceByAccountType(
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
    endDate?: Date,
    organizationId?: string
  ) {
    try {
      // 獲取指定類型的所有會計科目
      const query: any = { accountType, isActive: true };
      if (organizationId) {
        query.organizationId = organizationId;
      }

      const accounts = await Account2.find(query);
      
      if (accounts.length === 0) {
        return {
          accountType,
          totalBalance: 0,
          accountCount: 0,
          accounts: []
        };
      }

      // 計算每個科目的餘額
      const accountBalances = await Promise.all(
        accounts.map(account => 
          this.calculateAccountBalance(account._id.toString(), endDate, organizationId)
        )
      );

      // 計算總餘額
      const totalBalance = accountBalances.reduce((sum, balance) => sum + balance.balance, 0);

      return {
        accountType,
        totalBalance,
        accountCount: accounts.length,
        accounts: accountBalances
      };
    } catch (error) {
      console.error('按科目類型計算餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 生成試算表
   * @param endDate 截止日期（可選）
   * @param organizationId 機構ID（可選）
   * @returns 試算表資料
   */
  static async generateTrialBalance(endDate?: Date, organizationId?: string) {
    try {
      const accountTypes: Array<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'> = 
        ['asset', 'liability', 'equity', 'revenue', 'expense'];

      // 計算各科目類型的餘額
      const typeBalances = await Promise.all(
        accountTypes.map(type => 
          this.calculateBalanceByAccountType(type, endDate, organizationId)
        )
      );

      // 計算借方和貸方總額
      let totalDebit = 0;
      let totalCredit = 0;

      const trialBalanceData = typeBalances.map(typeBalance => {
        const accounts = typeBalance.accounts.map(account => {
          // 根據餘額正負決定借貸方向
          const isDebitBalance = account.balance >= 0;
          
          if (isDebitBalance) {
            totalDebit += Math.abs(account.balance);
          } else {
            totalCredit += Math.abs(account.balance);
          }

          return {
            ...account,
            debitBalance: isDebitBalance ? Math.abs(account.balance) : 0,
            creditBalance: isDebitBalance ? 0 : Math.abs(account.balance)
          };
        });

        return {
          ...typeBalance,
          accounts
        };
      });

      return {
        trialBalanceData,
        summary: {
          totalDebit,
          totalCredit,
          difference: Math.abs(totalDebit - totalCredit),
          isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
          generatedAt: new Date(),
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      console.error('生成試算表錯誤:', error);
      throw error;
    }
  }

  /**
   * 獲取會計科目的交易歷史
   * @param accountId 會計科目ID
   * @param startDate 開始日期（可選）
   * @param endDate 結束日期（可選）
   * @param limit 限制筆數（可選，預設50）
   * @param organizationId 機構ID（可選）
   * @returns 交易歷史和餘額變化
   */
  static async getAccountTransactionHistory(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    organizationId?: string
  ) {
    try {
      // 建立查詢條件
      const query: any = { accountId };
      
      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      // 獲取交易記錄
      const entries = await AccountingEntry.find(query)
        .populate('transactionGroupId', 'groupNumber description transactionDate status')
        .populate('accountId', 'name code accountType normalBalance')
        .sort({ createdAt: -1 })
        .limit(limit);

      // 計算累計餘額
      let runningBalance = 0;
      const transactionHistory = entries.reverse().map(entry => {
        const account = entry.accountId as unknown as IAccount2;
        const normalBalance = account.normalBalance;

        // 根據正常餘額方向計算餘額變化
        let balanceChange: number;
        if (normalBalance === 'debit') {
          balanceChange = entry.debitAmount - entry.creditAmount;
        } else {
          balanceChange = entry.creditAmount - entry.debitAmount;
        }

        runningBalance += balanceChange;

        return {
          entryId: entry._id,
          transactionGroup: entry.transactionGroupId,
          description: entry.description,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          balanceChange,
          runningBalance,
          transactionDate: entry.createdAt,
          sequence: entry.sequence
        };
      });

      return {
        accountId,
        transactionHistory: transactionHistory.reverse(), // 恢復時間倒序
        totalTransactions: entries.length,
        currentBalance: runningBalance
      };
    } catch (error) {
      console.error('獲取會計科目交易歷史錯誤:', error);
      throw error;
    }
  }
}

export default AccountBalanceService;