import TransactionGroupWithEntries, { ITransactionGroupWithEntries } from '../../models/TransactionGroupWithEntries';
import Account2 from '../../models/Account2';
import { Accounting3To2Adapter } from '../../../shared/adapters/accounting3to2';
import { TransactionGroupWithEntries as TransactionGroupType } from '../../../shared/types/accounting2';
import logger from '../../utils/logger';

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

      logger.info(`交易群組建立成功: ${savedTransaction.groupNumber}`);
      return savedTransaction;
    } catch (error) {
      logger.error('建立交易群組錯誤:', error);
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

      // 確保分頁參數有效，並使用前端傳入的值
      const page = filters?.page && filters.page > 0 ? filters.page : 1;
      const limit = filters?.limit && filters.limit > 0 ? filters.limit : 25; // 將默認值改為25，與前端一致
      const skip = (page - 1) * limit;

      logger.debug(`分頁參數: page=${page}, limit=${limit}, skip=${skip}`);

      const [transactions, total] = await Promise.all([
        TransactionGroupWithEntries.find(query)
          .sort({ transactionDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('entries.accountId', 'name code accountType')
          .lean(),
        TransactionGroupWithEntries.countDocuments(query)
      ]);

      logger.debug(`查詢交易群組數量: ${transactions.length}/${total}, 分頁: ${page}/${Math.ceil(total/limit)}`);
      return {
        transactions,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('取得交易群組列表錯誤:', error);
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
      logger.error('取得交易群組詳細資料錯誤:', error);
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

      logger.info(`交易群組更新成功: ${updatedTransaction.groupNumber}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('更新交易群組錯誤:', error);
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

      logger.info(`交易群組確認成功: ${confirmedTransaction.groupNumber}`);
      return confirmedTransaction;
    } catch (error) {
      logger.error('確認交易群組錯誤:', error);
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

      logger.info(`交易群組取消成功: ${cancelledTransaction.groupNumber}`);
      return cancelledTransaction;
    } catch (error) {
      logger.error('取消交易群組錯誤:', error);
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
    logger.debug('開始驗證分錄資料:', { entriesCount: entries.length });
    
    const accountIds = entries.map((entry, index) => {
      const accountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id;
      logger.debug(`分錄 ${index + 1} 資料:`, {
        accountId,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount
      });
      return accountId;
    }).filter(Boolean);

    logger.debug('提取的科目 ID:', accountIds);

    if (accountIds.length === 0) {
      throw new Error('分錄必須指定會計科目');
    }

    // 去重處理，避免重複查詢
    const uniqueAccountIds = [...new Set(accountIds)];
    logger.debug('去重後的科目 ID:', uniqueAccountIds);

    // 驗證會計科目是否存在
    const accounts = await Account2.find({
      _id: { $in: uniqueAccountIds },
      createdBy: userId,
      isActive: true
    });

    logger.debug('找到的有效科目:', {
      count: accounts.length,
      details: accounts.map(a => ({ id: (a._id as any).toString(), code: a.code, name: a.name }))
    });

    if (accounts.length !== uniqueAccountIds.length) {
      const existingAccountIds = accounts.map(a => (a._id as any).toString());
      const missingAccountIds = uniqueAccountIds.filter(id => !existingAccountIds.includes(id?.toString()));
      
      logger.error('缺少的科目 ID:', {
        missingAccountIds,
        existingAccountIds,
        queryConditions: { uniqueAccountIds, userId }
      });
      
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

    logger.debug('分錄驗證完成');
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

      logger.debug(`找到引用交易:`, { count: referencingTransactions.length });

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

      logger.debug(`交易餘額計算完成:`, {
        transactionId,
        totalAmount,
        usedAmount: totalUsedAmount,
        availableAmount,
        referencedByCount: referencedByTransactions.length
      });

      return result;
    } catch (error) {
      logger.error('計算交易餘額錯誤:', error);
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

      logger.debug(`批次餘額計算完成:`, { count: results.length });
      return results;
    } catch (error) {
      logger.error('批次計算交易餘額錯誤:', error);
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

      logger.debug(`交易統計完成:`, { totalTransactions });
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
      logger.error('取得交易統計資訊錯誤:', error);
      throw error;
    }
  }

  /**
   * 🆕 取得可付款的應付帳款
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param excludePaidOff 是否排除已付清的項目
   * @returns 應付帳款列表
   */
  static async getPayableTransactions(
    userId: string,
    organizationId?: string,
    excludePaidOff: boolean = true
  ): Promise<Array<{
    _id: string;
    groupNumber: string;
    description: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: Date;
    supplierInfo?: {
      supplierId: string;
      supplierName: string;
    };
    isPaidOff: boolean;
    paymentHistory: Array<{
      paymentTransactionId: string;
      paidAmount: number;
      paymentDate: Date;
      paymentMethod?: string;
    }>;
    transactionDate: Date;
  }>> {
    try {
      // 首先查找所有應付帳款相關的科目（負債類科目）
      const payableAccounts = await Account2.find({
        createdBy: userId,
        accountType: 'liability', // 所有負債類科目都可能是應付帳款
        isActive: true,
        ...(organizationId ? { organizationId } : {})
      }).lean();

      logger.debug(`找到應付帳款科目:`, {
        count: payableAccounts.length,
        accounts: payableAccounts.map(a => `${a.code} - ${a.name}`)
      });

      if (payableAccounts.length === 0) {
        logger.warn('沒有找到應付帳款科目，返回空列表');
        return [];
      }

      const payableAccountIds = payableAccounts.map(a => a._id.toString());

      // 查找包含應付帳款科目的交易（貸方有金額的交易表示應付帳款）
      // 修改：包含 draft 和 confirmed 狀態的交易，讓編輯中的交易也能顯示
      const query: any = {
        createdBy: userId,
        status: { $in: ['draft', 'confirmed'] }, // 包含草稿和已確認的交易
        'entries': {
          $elemMatch: {
            'accountId': { $in: payableAccountIds },
            'creditAmount': { $gt: 0 } // 應付帳款在貸方
          }
        },
        ...(organizationId ? { organizationId } : {})
      };

      const transactions = await TransactionGroupWithEntries.find(query)
        .populate('entries.accountId', 'name code accountType')
        .lean();

      logger.debug(`找到包含應付帳款科目的交易:`, { count: transactions.length });

      // 計算每筆交易的付款狀態
      const payableTransactions = [];

      for (const transaction of transactions) {
        // 計算應付帳款金額（從貸方分錄中計算）
        const payableEntries = transaction.entries?.filter((entry: any) =>
          payableAccountIds.includes(entry.accountId?._id?.toString() || entry.accountId?.toString()) &&
          entry.creditAmount > 0
        ) || [];

        const payableAmount = payableEntries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);
        
        if (payableAmount <= 0) {
          continue; // 跳過沒有應付金額的交易
        }

        // 計算已付金額
        const paidAmount = await this.calculatePaidAmount(transaction._id.toString(), userId);
        const remainingAmount = Math.max(0, payableAmount - paidAmount);
        const isPaidOff = remainingAmount <= 0;

        // 如果設定排除已付清且此筆已付清，則跳過
        if (excludePaidOff && isPaidOff) {
          continue;
        }

        // 嘗試從交易描述或分錄中提取供應商資訊
        let supplierInfo = undefined;
        
        // 優先使用交易中的 payableInfo
        if (transaction.payableInfo && transaction.payableInfo.supplierName) {
          supplierInfo = {
            supplierId: transaction.payableInfo.supplierId?.toString() || '',
            supplierName: transaction.payableInfo.supplierName || ''
          };
        } else {
          // 如果沒有 payableInfo，從應付帳款分錄中找到對應的廠商子科目
          // 找到所有相關的應付帳款分錄
          const relevantPayableEntries = payableEntries.filter((entry: any) => {
            const entryAccountId = entry.accountId?._id?.toString() || entry.accountId?.toString();
            return payableAccountIds.includes(entryAccountId);
          });
          
          // 從這些分錄中找到對應的廠商子科目
          for (const entry of relevantPayableEntries) {
            // 安全地提取 accountId，使用 any 類型避免 TypeScript 錯誤
            const entryAccountId = (entry.accountId as any)?._id?.toString() || (entry.accountId as any)?.toString() || '';
            if (!entryAccountId) continue; // 跳過沒有 accountId 的分錄
            
            const payableAccount = payableAccounts.find(acc => acc._id.toString() === entryAccountId);
            
            // 優先使用廠商子科目，而不是主科目「應付帳款」
            if (payableAccount && payableAccount.name !== '應付帳款' && !payableAccount.name.startsWith('應付帳款-')) {
              supplierInfo = {
                supplierId: payableAccount._id.toString(), // 使用廠商子科目的 ID
                supplierName: payableAccount.name // 使用廠商子科目的名稱（如「嘉鏵」）
              };
              break; // 找到第一個符合條件的就停止
            }
          }
          
          // 如果還是沒找到，嘗試從交易描述中提取
          if (!supplierInfo && transaction.description) {
            // 可以在這裡加入從描述中提取供應商名稱的邏輯
            // 例如：如果描述格式是 "供應商名稱 - 其他描述"
            const descriptionParts = transaction.description.split(' - ');
            if (descriptionParts.length > 1) {
              const potentialSupplierName = descriptionParts[0].trim();
              if (potentialSupplierName && potentialSupplierName !== '應付帳款') {
                supplierInfo = {
                  supplierId: '', // 沒有具體的 ID
                  supplierName: potentialSupplierName
                };
              }
            }
          }
        }
        
        payableTransactions.push({
          _id: transaction._id.toString(),
          groupNumber: transaction.groupNumber,
          description: transaction.description,
          totalAmount: payableAmount, // 使用計算出的應付金額
          paidAmount,
          remainingAmount,
          ...(transaction.payableInfo?.dueDate && { dueDate: transaction.payableInfo.dueDate }),
          ...(supplierInfo && { supplierInfo }),
          isPaidOff,
          paymentHistory: (transaction.payableInfo?.paymentHistory || []).map((history: any) => ({
            paymentTransactionId: history.paymentTransactionId.toString(),
            paidAmount: history.paidAmount,
            paymentDate: history.paymentDate,
            ...(history.paymentMethod && { paymentMethod: history.paymentMethod })
          })),
          transactionDate: transaction.transactionDate
        });
      }

      // 排序：未付清的在前，按到期日排序
      payableTransactions.sort((a, b) => {
        if (a.isPaidOff !== b.isPaidOff) {
          return a.isPaidOff ? 1 : -1;
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      });

      logger.debug(`查詢應付帳款結果:`, {
        total: payableTransactions.length,
        unpaid: payableTransactions.filter(p => !p.isPaidOff).length
      });
      return payableTransactions;
    } catch (error) {
      logger.error('取得應付帳款錯誤:', error);
      throw error;
    }
  }

  /**
   * 🆕 計算交易的已付金額
   * @param transactionId 交易ID
   * @param userId 使用者ID
   * @returns 已付金額
   */
  static async calculatePaidAmount(transactionId: string, userId: string): Promise<number> {
    try {
      // 查找所有引用此交易的付款交易
      // 修改：計算所有狀態（draft 和 confirmed）的付款交易，讓建立付款後應付帳款立即從列表消失
      const paymentTransactions = await TransactionGroupWithEntries.find({
        createdBy: userId,
        status: { $in: ['draft', 'confirmed'] }, // 計算草稿和已確認的付款交易
        transactionType: 'payment',
        'paymentInfo.payableTransactions.transactionId': transactionId
      }).lean();

      let totalPaidAmount = 0;
      
      paymentTransactions.forEach(payment => {
        const payableTransaction = payment.paymentInfo?.payableTransactions?.find(
          p => p.transactionId?.toString() === transactionId
        );
        if (payableTransaction) {
          totalPaidAmount += payableTransaction.paidAmount;
        }
      });

      logger.debug(`計算已付金額:`, {
        transactionId,
        paymentCount: paymentTransactions.length,
        totalPaidAmount
      });
      return totalPaidAmount;
    } catch (error) {
      logger.error('計算已付金額錯誤:', error);
      return 0;
    }
  }

  /**
   * 🆕 建立付款交易
   * @param paymentData 付款資料
   * @param userId 使用者ID
   * @returns 付款交易
   */
  static async createPaymentTransaction(
    paymentData: {
      description: string;
      transactionDate: Date;
      paymentMethod: string;
      totalAmount: number;
      entries: Array<{
        sequence: number;
        accountId: string;
        debitAmount: number;
        creditAmount: number;
        description: string;
        sourceTransactionId?: string;
      }>;
      linkedTransactionIds: string[];
      organizationId?: string;
      paymentInfo: {
        paymentMethod: string;
        payableTransactions: Array<{
          transactionId: string;
          paidAmount: number;
          remainingAmount?: number;
        }>;
      };
      paymentAccountId: string; // 新增：付款帳戶ID
    },
    userId: string
  ): Promise<ITransactionGroupWithEntries> {
    try {
      // 驗證付款資料
      const validationResult = await this.validatePaymentTransaction(paymentData, userId);
      if (!validationResult.isValid) {
        throw new Error(`付款資料驗證失敗: ${validationResult.errors.join(', ')}`);
      }

      // 🆕 根據付款帳戶類型決定交易狀態
      const paymentAccount = await Account2.findOne({
        _id: paymentData.paymentAccountId,
        createdBy: userId,
        isActive: true
      });

      if (!paymentAccount) {
        throw new Error('付款帳戶不存在或無權限存取');
      }

      // 根據帳戶類型設定交易狀態和描述
      let transactionStatus: 'draft' | 'confirmed';
      let statusDescription: string;

      switch (paymentAccount.type) {
        case 'bank':
          transactionStatus = 'confirmed'; // 銀行帳戶：已匯款
          statusDescription = '已匯款';
          break;
        case 'cash':
          transactionStatus = 'confirmed'; // 現金帳戶：已下收
          statusDescription = '已下收';
          break;
        default:
          transactionStatus = 'confirmed'; // 其他類型：預設已確認
          statusDescription = '已付款';
          break;
      }

      logger.debug(`付款帳戶資訊:`, {
        type: paymentAccount.type,
        name: paymentAccount.name,
        status: statusDescription
      });

      // 建立付款交易
      const paymentTransaction = await this.createTransactionGroup({
        ...paymentData,
        description: `${paymentData.description} - ${statusDescription}`, // 在描述中加入狀態
        transactionType: 'payment',
        fundingType: 'transfer',
        linkedTransactionIds: paymentData.linkedTransactionIds,
        paymentInfo: paymentData.paymentInfo,
        status: transactionStatus
      }, userId, paymentData.organizationId);

      // 更新相關應付帳款的付款狀態
      for (const payableTransaction of paymentData.paymentInfo.payableTransactions) {
        await this.updatePayablePaymentStatus(payableTransaction.transactionId, userId);
      }

      // 🆕 更新相關進貨單的付款狀態
      await this.updateRelatedPurchaseOrderPaymentStatus(
        paymentData.paymentInfo.payableTransactions.map(p => p.transactionId),
        statusDescription
      );

      logger.info(`付款交易建立成功: ${paymentTransaction.groupNumber} - ${statusDescription}`);
      return paymentTransaction;
    } catch (error) {
      logger.error('建立付款交易錯誤:', error);
      throw error;
    }
  }

  /**
   * 🆕 驗證付款交易資料
   * @param paymentData 付款資料
   * @param userId 使用者ID
   * @returns 驗證結果
   */
  static async validatePaymentTransaction(
    paymentData: any,
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 驗證基本資料
      if (!paymentData.description) {
        errors.push('付款描述不能為空');
      }
      if (!paymentData.paymentMethod) {
        errors.push('付款方式不能為空');
      }
      if (!paymentData.entries || paymentData.entries.length < 2) {
        errors.push('付款交易至少需要兩筆分錄');
      }
      if (!paymentData.paymentInfo?.payableTransactions?.length) {
        errors.push('必須指定要付款的應付帳款');
      }

      // 驗證應付帳款是否存在且可付款
      if (paymentData.paymentInfo?.payableTransactions) {
        for (const payable of paymentData.paymentInfo.payableTransactions) {
          const transaction = await TransactionGroupWithEntries.findOne({
            _id: payable.transactionId,
            createdBy: userId,
            status: 'confirmed'
            // 移除 transactionType 限制，因為應付帳款可能沒有設定此欄位
          });

          if (!transaction) {
            errors.push(`應付帳款 ${payable.transactionId} 不存在或無權限存取`);
            continue;
          }

          // 驗證這筆交易確實包含應付帳款科目
          const payableAccounts = await Account2.find({
            createdBy: userId,
            accountType: 'liability',
            isActive: true
          }).lean();
          
          const payableAccountIds = payableAccounts.map(a => a._id.toString());
          const hasPayableEntry = transaction.entries?.some((entry: any) =>
            payableAccountIds.includes(entry.accountId?.toString()) && entry.creditAmount > 0
          );

          if (!hasPayableEntry) {
            errors.push(`交易 ${payable.transactionId} 不包含應付帳款科目`);
            continue;
          }

          // 計算應付金額（從貸方分錄中計算）
          const payableEntries = transaction.entries?.filter((entry: any) =>
            payableAccountIds.includes(entry.accountId?.toString()) && entry.creditAmount > 0
          ) || [];
          
          const payableAmount = payableEntries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);

          // 檢查付款金額是否超過剩餘應付金額
          const paidAmount = await this.calculatePaidAmount(payable.transactionId, userId);
          const remainingAmount = payableAmount - paidAmount;
          
          if (payable.paidAmount > remainingAmount) {
            errors.push(`付款金額 ${payable.paidAmount} 超過剩餘應付金額 ${remainingAmount}`);
          }
        }
      }

      // 驗證借貸平衡
      if (paymentData.entries) {
        const totalDebit = paymentData.entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
        const totalCredit = paymentData.entries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          errors.push(`借貸不平衡：借方 ${totalDebit}，貸方 ${totalCredit}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('驗證付款交易錯誤:', error);
      return {
        isValid: false,
        errors: ['驗證過程發生錯誤']
      };
    }
  }

  /**
   * 🆕 更新應付帳款的付款狀態
   * @param payableTransactionId 應付帳款交易ID
   * @param userId 使用者ID
   */
  static async updatePayablePaymentStatus(
    payableTransactionId: string,
    userId: string
  ): Promise<void> {
    try {
      const paidAmount = await this.calculatePaidAmount(payableTransactionId, userId);
      
      const payableTransaction = await TransactionGroupWithEntries.findOne({
        _id: payableTransactionId,
        createdBy: userId
      });

      if (payableTransaction) {
        const isPaidOff = paidAmount >= payableTransaction.totalAmount;
        
        // 初始化 payableInfo 如果不存在
        if (!payableTransaction.payableInfo) {
          payableTransaction.payableInfo = {
            totalPaidAmount: 0,
            isPaidOff: false,
            paymentHistory: []
          };
        }
        
        payableTransaction.payableInfo.totalPaidAmount = paidAmount;
        payableTransaction.payableInfo.isPaidOff = isPaidOff;
        payableTransaction.updatedAt = new Date();
        
        await payableTransaction.save();

        logger.debug(`更新應付帳款狀態:`, {
          groupNumber: payableTransaction.groupNumber,
          status: isPaidOff ? '已付清' : '部分付款',
          paidAmount,
          totalAmount: payableTransaction.totalAmount
        });
      }
    } catch (error) {
      logger.error('更新應付帳款狀態錯誤:', error);
      throw error;
    }
  }

  /**
   * 🆕 檢查進貨單是否有付款記錄
   * @param purchaseOrderId 進貨單ID或相關交易ID
   * @param userId 使用者ID
   * @returns 付款狀態資訊
   */
  static async checkPurchaseOrderPaymentStatus(
    purchaseOrderId: string,
    userId: string
  ): Promise<{
    hasPaidAmount: boolean;
    paidAmount: number;
    totalAmount: number;
    isPaidOff: boolean;
    paymentTransactions: Array<{
      transactionId: string;
      groupNumber: string;
      paidAmount: number;
      paymentDate: Date;
      status: string;
    }>;
  }> {
    try {
      // 查找與此進貨單相關的應付帳款交易
      const payableTransactions = await this.getPayableTransactions(userId, undefined, false);
      
      // 找到對應的應付帳款記錄
      const relatedPayable = payableTransactions.find(p =>
        p._id === purchaseOrderId ||
        p.groupNumber.includes(purchaseOrderId) ||
        purchaseOrderId.includes(p._id)
      );

      if (!relatedPayable) {
        return {
          hasPaidAmount: false,
          paidAmount: 0,
          totalAmount: 0,
          isPaidOff: false,
          paymentTransactions: []
        };
      }

      // 查找所有引用此交易的付款交易
      const paymentTransactions = await TransactionGroupWithEntries.find({
        createdBy: userId,
        status: { $in: ['draft', 'confirmed'] },
        transactionType: 'payment',
        'paymentInfo.payableTransactions.transactionId': relatedPayable._id
      }).lean();

      const paymentDetails = paymentTransactions.map(payment => {
        const payableTransaction = payment.paymentInfo?.payableTransactions?.find(
          p => p.transactionId?.toString() === relatedPayable._id
        );
        
        return {
          transactionId: payment._id.toString(),
          groupNumber: payment.groupNumber || '',
          paidAmount: payableTransaction?.paidAmount || 0,
          paymentDate: payment.transactionDate || payment.createdAt,
          status: payment.status
        };
      });

      const totalPaidAmount = paymentDetails.reduce((sum, p) => sum + p.paidAmount, 0);
      const hasPaidAmount = totalPaidAmount > 0;
      const isPaidOff = totalPaidAmount >= relatedPayable.totalAmount;

      // 只在開發環境輸出詳細日誌
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`檢查進貨單付款狀態:`, {
          purchaseOrderId,
          paidAmount: totalPaidAmount,
          totalAmount: relatedPayable.totalAmount
        });
      }

      return {
        hasPaidAmount,
        paidAmount: totalPaidAmount,
        totalAmount: relatedPayable.totalAmount,
        isPaidOff,
        paymentTransactions: paymentDetails
      };
    } catch (error) {
      logger.error('檢查進貨單付款狀態錯誤:', error);
      return {
        hasPaidAmount: false,
        paidAmount: 0,
        totalAmount: 0,
        isPaidOff: false,
        paymentTransactions: []
      };
    }
  }

  /**
   * 🆕 批量檢查多個進貨單的付款狀態
   * @param purchaseOrderIds 進貨單ID陣列
   * @param userId 使用者ID
   * @returns 付款狀態映射 { [purchaseOrderId]: boolean }
   */
  static async batchCheckPurchaseOrderPaymentStatus(
    purchaseOrderIds: string[],
    userId: string
  ): Promise<{ [key: string]: boolean }> {
    try {
      // 只記錄總數，不輸出詳細內容
      //logger.debug('批量檢查進貨單付款狀態開始', { count: purchaseOrderIds.length });
      
      // 建立付款狀態映射
      const paymentStatusMap: { [key: string]: boolean } = {};
      
      // 初始化所有進貨單為未付款
      purchaseOrderIds.forEach(id => {
        paymentStatusMap[id] = false;
      });
      
      // 首先需要找到進貨單對應的交易 ID
      const PurchaseOrder = require('../../models/PurchaseOrder').default;
      const purchaseOrders = await PurchaseOrder.find({
        _id: { $in: purchaseOrderIds }
      }).lean();
      
      // 提取所有相關的交易 ID
      const relatedTransactionIds = purchaseOrders
        .filter((po: any) => po.relatedTransactionGroupId)
        .map((po: any) => po.relatedTransactionGroupId.toString());
      
      if (relatedTransactionIds.length === 0) {
        // 只記錄一次警告，不輸出詳細內容
        logger.warn('批量檢查：沒有找到相關的交易 ID');
        return paymentStatusMap;
      }
      
      // 查找所有付款交易
      const paymentTransactions = await TransactionGroupWithEntries.find({
        createdBy: userId,
        status: { $in: ['draft', 'confirmed'] },
        transactionType: 'payment',
        'paymentInfo.payableTransactions.transactionId': {
          $in: relatedTransactionIds
        }
      }).lean();
      
      // 記錄找到的付款交易數量
      const paymentCount = paymentTransactions.length;
      
      // 處理每個進貨單
      let missingTransactionIdCount = 0;
      let missingPaymentCount = 0;
      let hasPaymentCount = 0;
      
      for (const purchaseOrder of purchaseOrders) {
        const purchaseOrderId = purchaseOrder._id.toString();
        const relatedTransactionId = purchaseOrder.relatedTransactionGroupId?.toString();
        
        if (!relatedTransactionId) {
          missingTransactionIdCount++;
          continue;
        }
        
        // 查找引用此交易的付款交易
        const relatedPayments = paymentTransactions.filter(payment =>
          payment.paymentInfo?.payableTransactions?.some(
            (p: any) => p.transactionId?.toString() === relatedTransactionId
          )
        );
        
        if (relatedPayments.length > 0) {
          // 計算總付款金額
          const totalPaidAmount = relatedPayments.reduce((sum, payment) => {
            const payableTransaction = payment.paymentInfo?.payableTransactions?.find(
              (p: any) => p.transactionId?.toString() === relatedTransactionId
            );
            return sum + (payableTransaction?.paidAmount || 0);
          }, 0);
          
          paymentStatusMap[purchaseOrderId] = totalPaidAmount > 0;
          if (totalPaidAmount > 0) {
            hasPaymentCount++;
          } else {
            missingPaymentCount++;
          }
        } else {
          missingPaymentCount++;
        }
      }
      
      // 只在最後輸出摘要信息
      //logger.debug('批量付款狀態檢查完成', {
        //totalOrders: purchaseOrders.length,
        //missingTransactionIdCount,
        //missingPaymentCount,
        //hasPaymentCount,
        //paymentTransactionsCount: paymentCount
      //});
      
      return paymentStatusMap;
    } catch (error) {
      logger.error('批量檢查進貨單付款狀態失敗:', error);
      
      // 返回所有為 false 的映射
      const errorMap: { [key: string]: boolean } = {};
      purchaseOrderIds.forEach(id => {
        errorMap[id] = false;
      });
      return errorMap;
    }
  }

  /**
   * 🆕 更新相關進貨單的付款狀態
   * @param transactionIds 交易ID陣列
   * @param paymentStatus 付款狀態 ('已下收' | '已匯款')
   * @param userId 使用者ID
   */
  static async updateRelatedPurchaseOrderPaymentStatus(
    transactionIds: string[],
    paymentStatus: string
  ): Promise<void> {
    try {
      // 只記錄開始的摘要信息
      //logger.debug(`開始更新進貨單付款狀態`, {
        //transactionCount: transactionIds.length,
        //status: paymentStatus
      //});
      
      // 查找與這些交易相關的進貨單
      const PurchaseOrder = require('../../models/PurchaseOrder').default;
      const purchaseOrders = await PurchaseOrder.find({
        relatedTransactionGroupId: { $in: transactionIds }
      });

      // 更新每個進貨單的付款狀態，不再為每個進貨單記錄日誌
      for (const purchaseOrder of purchaseOrders) {
        purchaseOrder.paymentStatus = paymentStatus;
        purchaseOrder.updatedAt = new Date();
        await purchaseOrder.save();
      }

      // 只記錄完成的摘要信息
      logger.info(`進貨單付款狀態更新完成`, {
        count: purchaseOrders.length,
        status: paymentStatus
      });
    } catch (error) {
      logger.error('更新進貨單付款狀態失敗:', error);
      // 不拋出錯誤，避免影響付款交易的建立
    }
  }
}

export default TransactionService;