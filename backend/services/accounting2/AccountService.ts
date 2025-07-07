import Account2, { IAccount2 } from '../../models/Account2';
import TransactionGroupWithEntries from '../../models/TransactionGroupWithEntries';
import { AccountManagementAdapter, AccountManagementDataProvider } from '../../../shared/adapters/accounting2to3';
import { VersionCompatibilityManager } from '../../../shared/services/compatibilityService';
import { Account2 as Account2Type, TransactionGroupWithEntries as TransactionGroupType } from '../../../shared/types/accounting2';
import { Types } from 'mongoose';

/**
 * Accounting2 帳戶服務層
 * 提供帳戶管理功能，與 Accounting3 資料結構相容
 */
export class AccountService {
  
  /**
   * 建立新帳戶
   * @param accountData 帳戶資料
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 建立的帳戶資料
   */
  static async createAccount(
    accountData: Partial<IAccount2>,
    userId: string,
    organizationId?: string
  ): Promise<IAccount2> {
    try {
      // 驗證帳戶代碼唯一性
      const existingAccount = await Account2.findOne({
        code: accountData.code,
        createdBy: userId,
        ...(organizationId ? { organizationId } : {}),
        isActive: true
      });

      if (existingAccount) {
        throw new Error(`帳戶代碼 ${accountData.code} 已存在`);
      }

      // 建立帳戶資料
      const account = new Account2({
        ...accountData,
        createdBy: userId,
        ...(organizationId ? { organizationId } : {}),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedAccount = await account.save();

      // 使用適配器確保與 Accounting3 相容性
      const savedAccountData = savedAccount.toObject() as Account2Type;
      const normalizedAccount = AccountManagementAdapter.normalizeAccount(savedAccountData);
      
      console.log(`✅ 帳戶建立成功: ${savedAccount.name} (${savedAccount.code})`);
      return savedAccount;
    } catch (error) {
      console.error('建立帳戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得帳戶列表
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param filters 篩選條件
   * @returns 帳戶列表
   */
  static async getAccounts(
    userId: string,
    organizationId?: string,
    filters?: {
      accountType?: string;
      isActive?: boolean;
      search?: string;
    }
  ): Promise<IAccount2[]> {
    try {
      const query: any = {
        createdBy: userId,
        ...(organizationId ? { organizationId } : {}),
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : { isActive: true })
      };

      if (filters?.accountType) {
        query.accountType = filters.accountType;
      }

      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { code: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const accounts = await Account2.find(query)
        .sort({ code: 1, name: 1 })
        .lean();

      // 使用資料提供者格式化帳戶資料（需要交易資料）
      // 這裡暫時跳過格式化，直接返回帳戶資料
      // 如需完整格式化，需要傳入相關交易資料
      
      console.log(`📊 查詢帳戶數量: ${accounts.length}`);
      return accounts;
    } catch (error) {
      console.error('取得帳戶列表錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得單一帳戶詳細資料
   * @param accountId 帳戶ID
   * @param userId 使用者ID
   * @param includeStatistics 是否包含統計資料
   * @returns 帳戶詳細資料
   */
  static async getAccountById(
    accountId: string,
    userId: string,
    includeStatistics: boolean = false
  ): Promise<IAccount2 & { statistics?: any }> {
    try {
      const account = await Account2.findOne({
        _id: accountId,
        createdBy: userId,
        isActive: true
      }).lean();

      if (!account) {
        throw new Error('帳戶不存在或無權限存取');
      }

      let result: any = account;

      if (includeStatistics) {
        // 需要取得相關交易資料來計算統計
        const transactionResults = await TransactionGroupWithEntries.find({
          'entries.accountId': accountId,
          createdBy: userId
        }).lean();
        
        const transactions = transactionResults.map(t => ({
          ...t,
          _id: t._id.toString()
        })) as TransactionGroupType[];
        
        // 使用適配器計算帳戶統計資料
        const statistics = AccountManagementAdapter.calculateAccountStatistics(accountId, transactions);
        result = { ...account, statistics };
      }

      return result;
    } catch (error) {
      console.error('取得帳戶詳細資料錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新帳戶
   * @param accountId 帳戶ID
   * @param updateData 更新資料
   * @param userId 使用者ID
   * @returns 更新後的帳戶資料
   */
  static async updateAccount(
    accountId: string,
    updateData: Partial<IAccount2>,
    userId: string
  ): Promise<IAccount2> {
    try {
      // 檢查帳戶是否存在且有權限
      const existingAccount = await Account2.findOne({
        _id: accountId,
        createdBy: userId,
        isActive: true
      });

      if (!existingAccount) {
        throw new Error('帳戶不存在或無權限存取');
      }

      // 如果更新帳戶代碼，檢查唯一性
      if (updateData.code && updateData.code !== existingAccount.code) {
        const duplicateAccount = await Account2.findOne({
          code: updateData.code,
          createdBy: userId,
          _id: { $ne: accountId },
          isActive: true
        });

        if (duplicateAccount) {
          throw new Error(`帳戶代碼 ${updateData.code} 已存在`);
        }
      }

      // 更新帳戶
      const updatedAccount = await Account2.findByIdAndUpdate(
        accountId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedAccount) {
        throw new Error('更新帳戶失敗');
      }

      console.log(`✅ 帳戶更新成功: ${updatedAccount.name} (${updatedAccount.code})`);
      return updatedAccount;
    } catch (error) {
      console.error('更新帳戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 軟刪除帳戶
   * @param accountId 帳戶ID
   * @param userId 使用者ID
   * @returns 刪除結果
   */
  static async deleteAccount(accountId: string, userId: string): Promise<boolean> {
    try {
      // 檢查帳戶是否存在且有權限
      const account = await Account2.findOne({
        _id: accountId,
        createdBy: userId,
        isActive: true
      });

      if (!account) {
        throw new Error('帳戶不存在或無權限存取');
      }

      // 檢查帳戶是否有相關交易
      const transactionResults = await TransactionGroupWithEntries.find({
        'entries.accountId': accountId,
        createdBy: userId
      }).lean();
      
      const transactions = transactionResults.map(t => ({
        ...t,
        _id: t._id.toString()
      })) as TransactionGroupType[];

      const deleteValidation = AccountManagementAdapter.canDeleteAccount(accountId, transactions);
      
      if (!deleteValidation.canDelete) {
        throw new Error(`無法刪除帳戶：${deleteValidation.reason}`);
      }

      // 軟刪除帳戶
      await Account2.findByIdAndUpdate(accountId, {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ 帳戶軟刪除成功: ${account.name} (${account.code})`);
      return true;
    } catch (error) {
      console.error('刪除帳戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得帳戶類型統計
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 帳戶類型統計
   */
  static async getAccountTypeStatistics(
    userId: string,
    organizationId?: string
  ): Promise<Array<{ accountType: string; count: number; accounts: IAccount2[] }>> {
    try {
      const query: any = {
        createdBy: userId,
        isActive: true,
        ...(organizationId ? { organizationId } : {})
      };

      const accounts = await Account2.find(query).lean();

      // 按帳戶類型分組統計
      const typeGroups = accounts.reduce((groups: any, account) => {
        const type = account.accountType;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(account);
        return groups;
      }, {});

      const statistics = Object.entries(typeGroups).map(([accountType, accounts]: [string, any]) => ({
        accountType,
        count: accounts.length,
        accounts
      }));

      console.log(`📊 帳戶類型統計完成，共 ${statistics.length} 種類型`);
      return statistics;
    } catch (error) {
      console.error('取得帳戶類型統計錯誤:', error);
      throw error;
    }
  }

  /**
   * 批量建立帳戶
   * @param accountsData 帳戶資料陣列
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 建立結果
   */
  static async createMultipleAccounts(
    accountsData: Partial<IAccount2>[],
    userId: string,
    organizationId?: string
  ): Promise<{ success: IAccount2[]; failed: Array<{ data: Partial<IAccount2>; error: string }> }> {
    const success: IAccount2[] = [];
    const failed: Array<{ data: Partial<IAccount2>; error: string }> = [];

    for (const accountData of accountsData) {
      try {
        const account = await this.createAccount(accountData, userId, organizationId);
        success.push(account);
      } catch (error) {
        failed.push({
          data: accountData,
          error: error instanceof Error ? error.message : '未知錯誤'
        });
      }
    }

    console.log(`📊 批量建立帳戶完成: 成功 ${success.length} 筆，失敗 ${failed.length} 筆`);
    return { success, failed };
  }

  /**
   * 驗證帳戶資料完整性
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 驗證結果
   */
  static async validateAccountIntegrity(
    userId: string,
    organizationId?: string
  ): Promise<{
    isValid: boolean;
    issues: Array<{ accountId: string; accountName: string; issue: string }>;
  }> {
    try {
      const accounts = await this.getAccounts(userId, organizationId);
      const compatibilityManager = VersionCompatibilityManager.getInstance();
      
      const issues: Array<{ accountId: string; accountName: string; issue: string }> = [];

      // 取得相關交易資料進行完整驗證
      const transactionResults = await TransactionGroupWithEntries.find({
        createdBy: userId,
        ...(organizationId ? { organizationId } : {})
      }).lean();
      
      const transactions = transactionResults.map(t => ({
        ...t,
        _id: t._id.toString()
      })) as TransactionGroupType[];

      const accountsData = accounts as Account2Type[];
      const compatibilityResult = await compatibilityManager.checkSystemCompatibility(accountsData, transactions);
      
      if (!compatibilityResult.isCompatible) {
        compatibilityResult.issues.forEach((issue: string) => {
          issues.push({
            accountId: 'system',
            accountName: 'System Validation',
            issue
          });
        });
      }

      const isValid = issues.length === 0;
      console.log(`🔍 帳戶資料完整性驗證完成: ${isValid ? '通過' : `發現 ${issues.length} 個問題`}`);
      
      return { isValid, issues };
    } catch (error) {
      console.error('驗證帳戶資料完整性錯誤:', error);
      throw error;
    }
  }
}

export default AccountService;