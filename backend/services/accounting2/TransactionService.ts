import TransactionGroupWithEntries, { ITransactionGroupWithEntries } from '../../models/TransactionGroupWithEntries';
import Account2 from '../../models/Account2';
import { Accounting3To2Adapter } from '../../../shared/adapters/accounting3to2';
import { TransactionGroupWithEntries as TransactionGroupType } from '../../../shared/types/accounting2';

/**
 * Accounting2 交易服務層
 * 提供交易管理功能，與 Accounting3 資料結構相容
 */
export class TransactionService {
  
  /**
   * 建立新交易群組
   * @param transactionData 交易資料
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 建立的交易群組
   */
  static async createTransactionGroup(
    transactionData: Partial<ITransactionGroupWithEntries>,
    userId: string,
    organizationId?: string
  ): Promise<ITransactionGroupWithEntries> {
    try {
      // 驗證交易群組編號唯一性
      if (transactionData.groupNumber) {
        const existingTransaction = await TransactionGroupWithEntries.findOne({
          groupNumber: transactionData.groupNumber,
          createdBy: userId,
          ...(organizationId ? { organizationId } : {})
        });

        if (existingTransaction) {
          throw new Error(`交易群組編號 ${transactionData.groupNumber} 已存在`);
        }
      }

      // 驗證分錄資料
      if (transactionData.entries && transactionData.entries.length > 0) {
        await this.validateEntries(transactionData.entries, userId);
      }

      // 建立交易群組
      const transaction = new TransactionGroupWithEntries({
        ...transactionData,
        createdBy: userId,
        ...(organizationId ? { organizationId } : {}),
        status: transactionData.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedTransaction = await transaction.save();

      console.log(`✅ 交易群組建立成功: ${savedTransaction.groupNumber}`);
      return savedTransaction;
    } catch (error) {
      console.error('建立交易群組錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得交易群組列表
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param filters 篩選條件
   * @returns 交易群組列表
   */
  static async getTransactionGroups(
    userId: string,
    organizationId?: string,
    filters?: {
      status?: 'draft' | 'confirmed' | 'cancelled';
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    transactions: ITransactionGroupWithEntries[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const query: any = {
        createdBy: userId,
        ...(organizationId ? { organizationId } : {})
      };

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        query.transactionDate = {};
        if (filters.startDate) query.transactionDate.$gte = filters.startDate;
        if (filters.endDate) query.transactionDate.$lte = filters.endDate;
      }

      if (filters?.search) {
        query.$or = [
          { groupNumber: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        TransactionGroupWithEntries.find(query)
          .sort({ transactionDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('entries.accountId', 'name code accountType')
          .lean(),
        TransactionGroupWithEntries.countDocuments(query)
      ]);

      console.log(`📊 查詢交易群組數量: ${transactions.length}/${total}`);
      return {
        transactions,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('取得交易群組列表錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得單一交易群組詳細資料
   * @param transactionId 交易群組ID
   * @param userId 使用者ID
   * @param includeCompatibilityInfo 是否包含相容性資訊
   * @returns 交易群組詳細資料
   */
  static async getTransactionGroupById(
    transactionId: string,
    userId: string,
    includeCompatibilityInfo: boolean = false
  ): Promise<ITransactionGroupWithEntries & { compatibilityInfo?: any }> {
    try {
      const transaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId
      })
        .populate('entries.accountId', 'name code accountType normalBalance')
        .lean();

      if (!transaction) {
        throw new Error('交易群組不存在或無權限存取');
      }

      let result: any = transaction;

      if (includeCompatibilityInfo) {
        // 轉換為相容性格式進行驗證
        const transactionData = {
          ...transaction,
          _id: transaction._id.toString()
        } as TransactionGroupType;

        const legacyFormat = Accounting3To2Adapter.convertToLegacyTransactionGroup(transactionData);
        const entries = Accounting3To2Adapter.extractAllEntriesFromTransactions([transactionData]);
        
        const validation = Accounting3To2Adapter.validateConversion(
          transactionData,
          legacyFormat,
          entries
        );

        result = {
          ...transaction,
          compatibilityInfo: {
            isValid: validation.isValid,
            errors: validation.errors,
            legacyFormat,
            entriesCount: entries.length
          }
        };
      }

      return result;
    } catch (error) {
      console.error('取得交易群組詳細資料錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新交易群組
   * @param transactionId 交易群組ID
   * @param updateData 更新資料
   * @param userId 使用者ID
   * @returns 更新後的交易群組
   */
  static async updateTransactionGroup(
    transactionId: string,
    updateData: Partial<ITransactionGroupWithEntries>,
    userId: string
  ): Promise<ITransactionGroupWithEntries> {
    try {
      // 檢查交易群組是否存在且有權限
      const existingTransaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId
      });

      if (!existingTransaction) {
        throw new Error('交易群組不存在或無權限存取');
      }

      // 檢查交易狀態是否允許修改
      if (existingTransaction.status === 'confirmed') {
        throw new Error('已確認的交易無法修改');
      }

      // 如果更新群組編號，檢查唯一性
      if (updateData.groupNumber && updateData.groupNumber !== existingTransaction.groupNumber) {
        const duplicateTransaction = await TransactionGroupWithEntries.findOne({
          groupNumber: updateData.groupNumber,
          createdBy: userId,
          _id: { $ne: transactionId }
        });

        if (duplicateTransaction) {
          throw new Error(`交易群組編號 ${updateData.groupNumber} 已存在`);
        }
      }

      // 驗證分錄資料
      if (updateData.entries && updateData.entries.length > 0) {
        await this.validateEntries(updateData.entries, userId);
      }

      // 更新交易群組
      const updatedTransaction = await TransactionGroupWithEntries.findByIdAndUpdate(
        transactionId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedTransaction) {
        throw new Error('更新交易群組失敗');
      }

      console.log(`✅ 交易群組更新成功: ${updatedTransaction.groupNumber}`);
      return updatedTransaction;
    } catch (error) {
      console.error('更新交易群組錯誤:', error);
      throw error;
    }
  }

  /**
   * 確認交易群組
   * @param transactionId 交易群組ID
   * @param userId 使用者ID
   * @returns 確認結果
   */
  static async confirmTransactionGroup(
    transactionId: string,
    userId: string
  ): Promise<ITransactionGroupWithEntries> {
    try {
      const transaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId
      });

      if (!transaction) {
        throw new Error('交易群組不存在或無權限存取');
      }

      if (transaction.status === 'confirmed') {
        throw new Error('交易群組已經確認');
      }

      if (transaction.status === 'cancelled') {
        throw new Error('已取消的交易無法確認');
      }

      // 驗證交易完整性
      if (!transaction.entries || transaction.entries.length === 0) {
        throw new Error('交易群組必須包含分錄才能確認');
      }

      // 驗證借貸平衡
      const totalDebit = transaction.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = transaction.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`交易借貸不平衡：借方 ${totalDebit}，貸方 ${totalCredit}`);
      }

      // 確認交易
      const confirmedTransaction = await TransactionGroupWithEntries.findByIdAndUpdate(
        transactionId,
        {
          status: 'confirmed',
          confirmedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!confirmedTransaction) {
        throw new Error('確認交易群組失敗');
      }

      console.log(`✅ 交易群組確認成功: ${confirmedTransaction.groupNumber}`);
      return confirmedTransaction;
    } catch (error) {
      console.error('確認交易群組錯誤:', error);
      throw error;
    }
  }

  /**
   * 取消交易群組
   * @param transactionId 交易群組ID
   * @param userId 使用者ID
   * @param reason 取消原因
   * @returns 取消結果
   */
  static async cancelTransactionGroup(
    transactionId: string,
    userId: string,
    reason?: string
  ): Promise<ITransactionGroupWithEntries> {
    try {
      const transaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId
      });

      if (!transaction) {
        throw new Error('交易群組不存在或無權限存取');
      }

      if (transaction.status === 'cancelled') {
        throw new Error('交易群組已經取消');
      }

      // 檢查是否有其他交易引用此交易
      const referencingTransactions = await TransactionGroupWithEntries.find({
        'entries.sourceTransactionId': transactionId,
        createdBy: userId,
        status: { $ne: 'cancelled' }
      });

      if (referencingTransactions.length > 0) {
        throw new Error(`無法取消交易：有 ${referencingTransactions.length} 筆交易引用此交易`);
      }

      // 取消交易
      const cancelledTransaction = await TransactionGroupWithEntries.findByIdAndUpdate(
        transactionId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!cancelledTransaction) {
        throw new Error('取消交易群組失敗');
      }

      console.log(`✅ 交易群組取消成功: ${cancelledTransaction.groupNumber}`);
      return cancelledTransaction;
    } catch (error) {
      console.error('取消交易群組錯誤:', error);
      throw error;
    }
  }

  /**
   * 驗證分錄資料
   * @param entries 分錄陣列
   * @param userId 使用者ID
   * @private
   */
  private static async validateEntries(entries: any[], userId: string): Promise<void> {
    const accountIds = entries.map(entry => 
      typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id
    ).filter(Boolean);

    if (accountIds.length === 0) {
      throw new Error('分錄必須指定會計科目');
    }

    // 驗證會計科目是否存在
    const accounts = await Account2.find({
      _id: { $in: accountIds },
      createdBy: userId,
      isActive: true
    });

    if (accounts.length !== accountIds.length) {
      const existingAccountIds = accounts.map(a => a._id.toString());
      const missingAccountIds = accountIds.filter(id => !existingAccountIds.includes(id));
      throw new Error(`以下會計科目不存在或無權限存取: ${missingAccountIds.join(', ')}`);
    }

    // 驗證分錄金額
    for (const entry of entries) {
      const debitAmount = entry.debitAmount || 0;
      const creditAmount = entry.creditAmount || 0;

      if (debitAmount < 0 || creditAmount < 0) {
        throw new Error('分錄金額不能為負數');
      }

      if (debitAmount === 0 && creditAmount === 0) {
        throw new Error('分錄必須有借方或貸方金額');
      }

      if (debitAmount > 0 && creditAmount > 0) {
        throw new Error('分錄不能同時有借方和貸方金額');
      }
    }
  }

  /**
   * 計算交易的真實餘額
   * @param transactionId 交易群組ID
   * @param userId 使用者ID
   * @returns 交易餘額資訊
   */
  static async calculateTransactionBalance(
    transactionId: string,
    userId: string
  ): Promise<{
    transactionId: string;
    totalAmount: number;
    usedAmount: number;
    availableAmount: number;
    referencedByCount: number;
    referencedByTransactions: Array<{
      transactionId: string;
      groupNumber: string;
      description: string;
      usedAmount: number;
      transactionDate: Date;
    }>;
  }> {
    try {
      // 1. 獲取原始交易
      const sourceTransaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId,
        status: 'confirmed' // 只計算已確認的交易
      }).lean();

      if (!sourceTransaction) {
        throw new Error('交易不存在、未確認或無權限存取');
      }

      const totalAmount = sourceTransaction.totalAmount || 0;

      // 2. 查找所有引用此交易的其他交易
      const referencingTransactions = await TransactionGroupWithEntries.find({
        createdBy: userId,
        status: 'confirmed', // 只計算已確認的引用交易
        'entries.sourceTransactionId': transactionId
      })
      .populate('entries.accountId', 'name code')
      .lean();

      console.log(`🔍 找到 ${referencingTransactions.length} 筆引用交易`);

      // 3. 計算每筆引用交易使用的金額
      const referencedByTransactions = [];
      let totalUsedAmount = 0;

      for (const refTransaction of referencingTransactions) {
        // 找到引用原始交易的分錄
        const referencingEntries = refTransaction.entries?.filter(
          (entry: any) => entry.sourceTransactionId?.toString() === transactionId
        ) || [];

        // 計算此交易使用的金額（借方或貸方的總和）
        const usedInThisTransaction = referencingEntries.reduce((sum: number, entry: any) => {
          return sum + (entry.debitAmount || 0) + (entry.creditAmount || 0);
        }, 0);

        if (usedInThisTransaction > 0) {
          referencedByTransactions.push({
            transactionId: refTransaction._id.toString(),
            groupNumber: refTransaction.groupNumber || '',
            description: refTransaction.description || '',
            usedAmount: usedInThisTransaction,
            transactionDate: refTransaction.transactionDate || refTransaction.createdAt
          });

          totalUsedAmount += usedInThisTransaction;
        }
      }

      // 4. 計算可用餘額
      const availableAmount = Math.max(0, totalAmount - totalUsedAmount);

      const result = {
        transactionId,
        totalAmount,
        usedAmount: totalUsedAmount,
        availableAmount,
        referencedByCount: referencedByTransactions.length,
        referencedByTransactions
      };

      console.log(`💰 交易餘額計算完成:`, {
        transactionId,
        totalAmount,
        usedAmount: totalUsedAmount,
        availableAmount,
        referencedByCount: referencedByTransactions.length
      });

      return result;
    } catch (error) {
      console.error('計算交易餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 批次計算多筆交易的餘額
   * @param transactionIds 交易群組ID陣列
   * @param userId 使用者ID
   * @returns 交易餘額資訊陣列
   */
  static async calculateMultipleTransactionBalances(
    transactionIds: string[],
    userId: string
  ): Promise<Array<{
    transactionId: string;
    totalAmount: number;
    usedAmount: number;
    availableAmount: number;
    referencedByCount: number;
    success: boolean;
    error?: string;
  }>> {
    try {
      const results = [];

      for (const transactionId of transactionIds) {
        try {
          const balance = await this.calculateTransactionBalance(transactionId, userId);
          results.push({
            ...balance,
            success: true
          });
        } catch (error) {
          results.push({
            transactionId,
            totalAmount: 0,
            usedAmount: 0,
            availableAmount: 0,
            referencedByCount: 0,
            success: false,
            error: error instanceof Error ? error.message : '計算失敗'
          });
        }
      }

      console.log(`📊 批次餘額計算完成: ${results.length} 筆交易`);
      return results;
    } catch (error) {
      console.error('批次計算交易餘額錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得交易統計資訊
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param dateRange 日期範圍
   * @returns 統計資訊
   */
  static async getTransactionStatistics(
    userId: string,
    organizationId?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    totalTransactions: number;
    confirmedTransactions: number;
    draftTransactions: number;
    cancelledTransactions: number;
    totalAmount: number;
    averageAmount: number;
    transactionsByStatus: Array<{ status: string; count: number }>;
  }> {
    try {
      const query: any = {
        createdBy: userId,
        ...(organizationId ? { organizationId } : {})
      };

      if (dateRange) {
        query.transactionDate = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }

      const transactions = await TransactionGroupWithEntries.find(query).lean();

      const totalTransactions = transactions.length;
      const confirmedTransactions = transactions.filter(t => t.status === 'confirmed').length;
      const draftTransactions = transactions.filter(t => t.status === 'draft').length;
      const cancelledTransactions = transactions.filter(t => t.status === 'cancelled').length;

      const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      const statusCounts = transactions.reduce((counts: any, t) => {
        counts[t.status] = (counts[t.status] || 0) + 1;
        return counts;
      }, {});

      const transactionsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number
      }));

      console.log(`📊 交易統計完成: 總計 ${totalTransactions} 筆交易`);
      return {
        totalTransactions,
        confirmedTransactions,
        draftTransactions,
        cancelledTransactions,
        totalAmount,
        averageAmount,
        transactionsByStatus
      };
    } catch (error) {
      console.error('取得交易統計資訊錯誤:', error);
      throw error;
    }
  }
}

export default TransactionService;