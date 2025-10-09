import TransactionGroupWithEntries from '../../accounting-old/models/TransactionGroupWithEntries';

/**
 * Accounting2 資金服務層
 * 提供資金追蹤和管理功能，與 Accounting3 資料結構相容
 */
export class FundingService {
  
  /**
   * 追蹤資金來源使用情況
   * @param sourceTransactionId 來源交易ID
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @returns 資金使用明細
   */
  static async trackFundingUsage(
    sourceTransactionId: string,
    userId: string,
    organizationId?: string
  ): Promise<{
    sourceTransaction: any;
    totalAmount: number;
    usedAmount: number;
    remainingAmount: number;
    usageDetails: Array<{
      transactionId: string;
      groupNumber: string;
      description: string;
      usedAmount: number;
      transactionDate: Date;
      status: string;
    }>;
  }> {
    try {
      // 取得來源交易
      const sourceTransaction = await TransactionGroupWithEntries.findOne({
        _id: sourceTransactionId,
        createdBy: userId,
        ...(organizationId ? { organizationId } : {})
      }).lean();

      if (!sourceTransaction) {
        throw new Error('來源交易不存在或無權限存取');
      }

      // 查找所有引用此交易的分錄
      const referencingTransactions = await TransactionGroupWithEntries.find({
        'entries.sourceTransactionId': sourceTransactionId,
        createdBy: userId,
        ...(organizationId ? { organizationId } : {}),
        status: { $ne: 'cancelled' }
      }).lean();

      // 計算使用明細
      const usageDetails: Array<{
        transactionId: string;
        groupNumber: string;
        description: string;
        usedAmount: number;
        transactionDate: Date;
        status: string;
      }> = [];

      let totalUsedAmount = 0;

      referencingTransactions.forEach(transaction => {
        if (transaction.entries) {
          transaction.entries.forEach(entry => {
            if (entry.sourceTransactionId === sourceTransactionId) {
              const usedAmount = entry.debitAmount || entry.creditAmount || 0;
              totalUsedAmount += usedAmount;
              
              usageDetails.push({
                transactionId: transaction._id.toString(),
                groupNumber: transaction.groupNumber,
                description: transaction.description,
                usedAmount,
                transactionDate: transaction.transactionDate,
                status: transaction.status
              });
            }
          });
        }
      });

      const totalAmount = sourceTransaction.totalAmount || 0;
      const remainingAmount = totalAmount - totalUsedAmount;

      console.log(`📊 資金追蹤完成: ${sourceTransaction.groupNumber} 總額 ${totalAmount}，已使用 ${totalUsedAmount}，剩餘 ${remainingAmount}`);

      return {
        sourceTransaction,
        totalAmount,
        usedAmount: totalUsedAmount,
        remainingAmount,
        usageDetails: usageDetails.sort((a, b) => 
          new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        )
      };
    } catch (error) {
      console.error('追蹤資金使用情況錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得可用資金來源
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param accountId 指定會計科目ID（可選）
   * @returns 可用資金來源列表
   */
  static async getAvailableFundingSources(
    userId: string,
    organizationId?: string,
    accountId?: string
  ): Promise<Array<{
    transactionId: string;
    groupNumber: string;
    description: string;
    transactionDate: Date;
    totalAmount: number;
    usedAmount: number;
    availableAmount: number;
    accountInfo: {
      accountId: string;
      accountName: string;
      accountCode: string;
    };
  }>> {
    try {
      const query: any = {
        createdBy: userId,
        status: 'confirmed',
        ...(organizationId ? { organizationId } : {})
      };

      // 如果指定會計科目，只查找該科目的交易
      if (accountId) {
        query['entries.accountId'] = accountId;
      }

      const transactions = await TransactionGroupWithEntries.find(query)
        .populate('entries.accountId', 'name code accountType')
        .lean();

      const fundingSources: Array<{
        transactionId: string;
        groupNumber: string;
        description: string;
        transactionDate: Date;
        totalAmount: number;
        usedAmount: number;
        availableAmount: number;
        accountInfo: {
          accountId: string;
          accountName: string;
          accountCode: string;
        };
      }> = [];

      for (const transaction of transactions) {
        // 計算此交易的使用情況
        const usage = await this.trackFundingUsage(
          transaction._id.toString(),
          userId,
          organizationId
        );

        if (usage.remainingAmount > 0) {
          // 取得主要會計科目資訊（通常是第一個分錄的科目）
          const primaryEntry = transaction.entries?.[0];
          const accountInfo = primaryEntry?.accountId as any;

          fundingSources.push({
            transactionId: transaction._id.toString(),
            groupNumber: transaction.groupNumber,
            description: transaction.description,
            transactionDate: transaction.transactionDate,
            totalAmount: usage.totalAmount,
            usedAmount: usage.usedAmount,
            availableAmount: usage.remainingAmount,
            accountInfo: {
              accountId: accountInfo?._id?.toString() || '',
              accountName: accountInfo?.name || '',
              accountCode: accountInfo?.code || ''
            }
          });
        }
      }

      // 按可用金額排序（由大到小）
      fundingSources.sort((a, b) => b.availableAmount - a.availableAmount);

      console.log(`📊 查詢可用資金來源: 找到 ${fundingSources.length} 個來源`);
      return fundingSources;
    } catch (error) {
      console.error('取得可用資金來源錯誤:', error);
      throw error;
    }
  }

  /**
   * 建立資金使用記錄
   * @param targetTransactionId 目標交易ID
   * @param fundingAllocations 資金分配
   * @param userId 使用者ID
   * @returns 資金使用記錄
   */
  static async createFundingAllocation(
    targetTransactionId: string,
    fundingAllocations: Array<{
      sourceTransactionId: string;
      amount: number;
      entryIndex?: number;
    }>,
    userId: string
  ): Promise<{
    success: boolean;
    allocations: Array<{
      sourceTransactionId: string;
      amount: number;
      sourceDescription: string;
      remainingAmount: number;
    }>;
  }> {
    try {
      // 取得目標交易
      const targetTransaction = await TransactionGroupWithEntries.findOne({
        _id: targetTransactionId,
        createdBy: userId
      });

      if (!targetTransaction) {
        throw new Error('目標交易不存在或無權限存取');
      }

      if (targetTransaction.status === 'confirmed') {
        throw new Error('已確認的交易無法修改資金分配');
      }

      const allocations: Array<{
        sourceTransactionId: string;
        amount: number;
        sourceDescription: string;
        remainingAmount: number;
      }> = [];

      // 處理每個資金分配
      for (const allocation of fundingAllocations) {
        // 驗證來源交易的可用金額
        const usage = await this.trackFundingUsage(
          allocation.sourceTransactionId,
          userId
        );

        if (allocation.amount > usage.remainingAmount) {
          throw new Error(
            `資金分配金額 ${allocation.amount} 超過可用金額 ${usage.remainingAmount} (來源: ${usage.sourceTransaction.groupNumber})`
          );
        }

        // 更新目標交易的分錄，添加資金來源資訊
        if (targetTransaction.entries && targetTransaction.entries.length > 0) {
          const entryIndex = allocation.entryIndex || 0;
          if (targetTransaction.entries[entryIndex]) {
            targetTransaction.entries[entryIndex].sourceTransactionId = allocation.sourceTransactionId;
            
            // 建立資金路徑
            const fundingPath = targetTransaction.entries[entryIndex].fundingPath || [];
            fundingPath.push(allocation.sourceTransactionId);
            targetTransaction.entries[entryIndex].fundingPath = fundingPath;
          }
        }

        allocations.push({
          sourceTransactionId: allocation.sourceTransactionId,
          amount: allocation.amount,
          sourceDescription: usage.sourceTransaction.description,
          remainingAmount: usage.remainingAmount - allocation.amount
        });
      }

      // 儲存更新後的交易
      await targetTransaction.save();

      console.log(`✅ 資金分配完成: 交易 ${targetTransaction.groupNumber} 分配了 ${fundingAllocations.length} 個資金來源`);

      return {
        success: true,
        allocations
      };
    } catch (error) {
      console.error('建立資金分配錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得資金流向分析
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param dateRange 日期範圍
   * @returns 資金流向分析
   */
  static async getFundingFlowAnalysis(
    userId: string,
    organizationId?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    totalFundingSources: number;
    totalFundingAmount: number;
    totalUsedAmount: number;
    totalAvailableAmount: number;
    utilizationRate: number;
    flowDetails: Array<{
      sourceTransactionId: string;
      sourceGroupNumber: string;
      sourceDescription: string;
      totalAmount: number;
      usedAmount: number;
      availableAmount: number;
      usageCount: number;
      utilizationRate: number;
    }>;
  }> {
    try {
      const query: any = {
        createdBy: userId,
        status: 'confirmed',
        ...(organizationId ? { organizationId } : {})
      };

      if (dateRange) {
        query.transactionDate = {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        };
      }

      const transactions = await TransactionGroupWithEntries.find(query).lean();

      let totalFundingAmount = 0;
      let totalUsedAmount = 0;
      const flowDetails: Array<{
        sourceTransactionId: string;
        sourceGroupNumber: string;
        sourceDescription: string;
        totalAmount: number;
        usedAmount: number;
        availableAmount: number;
        usageCount: number;
        utilizationRate: number;
      }> = [];

      for (const transaction of transactions) {
        const usage = await this.trackFundingUsage(
          transaction._id.toString(),
          userId,
          organizationId
        );

        totalFundingAmount += usage.totalAmount;
        totalUsedAmount += usage.usedAmount;

        const utilizationRate = usage.totalAmount > 0 
          ? (usage.usedAmount / usage.totalAmount) * 100 
          : 0;

        flowDetails.push({
          sourceTransactionId: transaction._id.toString(),
          sourceGroupNumber: transaction.groupNumber,
          sourceDescription: transaction.description,
          totalAmount: usage.totalAmount,
          usedAmount: usage.usedAmount,
          availableAmount: usage.remainingAmount,
          usageCount: usage.usageDetails.length,
          utilizationRate: Math.round(utilizationRate * 100) / 100
        });
      }

      const totalAvailableAmount = totalFundingAmount - totalUsedAmount;
      const overallUtilizationRate = totalFundingAmount > 0 
        ? (totalUsedAmount / totalFundingAmount) * 100 
        : 0;

      // 按使用率排序
      flowDetails.sort((a, b) => b.utilizationRate - a.utilizationRate);

      console.log(`📊 資金流向分析完成: ${transactions.length} 個資金來源，總使用率 ${overallUtilizationRate.toFixed(2)}%`);

      return {
        totalFundingSources: transactions.length,
        totalFundingAmount,
        totalUsedAmount,
        totalAvailableAmount,
        utilizationRate: Math.round(overallUtilizationRate * 100) / 100,
        flowDetails
      };
    } catch (error) {
      console.error('取得資金流向分析錯誤:', error);
      throw error;
    }
  }

  /**
   * 驗證資金分配的合理性
   * @param transactionId 交易ID
   * @param userId 使用者ID
   * @returns 驗證結果
   */
  static async validateFundingAllocation(
    transactionId: string,
    userId: string
  ): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const transaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId
      }).lean();

      if (!transaction) {
        throw new Error('交易不存在或無權限存取');
      }

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!transaction.entries || transaction.entries.length === 0) {
        issues.push('交易沒有分錄');
        return { isValid: false, issues, recommendations };
      }

      // 檢查每個分錄的資金來源
      for (let i = 0; i < transaction.entries.length; i++) {
        const entry = transaction.entries[i];
        
        if (entry && entry.sourceTransactionId) {
          try {
            const usage = await this.trackFundingUsage(
              entry.sourceTransactionId.toString(),
              userId
            );

            const entryAmount = (entry.debitAmount || 0) + (entry.creditAmount || 0);
            
            if (entryAmount > usage.remainingAmount) {
              issues.push(
                `分錄 ${i + 1} 使用金額 ${entryAmount} 超過來源可用金額 ${usage.remainingAmount}`
              );
            }

            if (usage.sourceTransaction.status !== 'confirmed') {
              issues.push(
                `分錄 ${i + 1} 的資金來源 ${usage.sourceTransaction.groupNumber} 尚未確認`
              );
            }
          } catch (error) {
            issues.push(`分錄 ${i + 1} 的資金來源驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
          }
        } else if (entry) {
          // 沒有指定資金來源的分錄
          const entryAmount = (entry.debitAmount || 0) + (entry.creditAmount || 0);
          if (entryAmount > 0) {
            recommendations.push(
              `建議為分錄 ${i + 1} (金額: ${entryAmount}) 指定資金來源以便追蹤`
            );
          }
        }
      }

      // 檢查是否有循環引用
      const sourceIds = transaction.entries
        .map(e => e.sourceTransactionId)
        .filter(Boolean);
      
      if (sourceIds.includes(transaction._id.toString())) {
        issues.push('檢測到循環引用：交易不能引用自己作為資金來源');
      }

      const isValid = issues.length === 0;

      console.log(`🔍 資金分配驗證完成: ${transaction.groupNumber} - ${isValid ? '通過' : `發現 ${issues.length} 個問題`}`);

      return {
        isValid,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('驗證資金分配錯誤:', error);
      throw error;
    }
  }
}

export default FundingService;