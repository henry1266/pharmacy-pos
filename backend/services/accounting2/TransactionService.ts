import { Document } from 'mongoose';
import TransactionGroupWithEntries, { ITransactionGroupWithEntries } from '../../models/TransactionGroupWithEntries';
import { Accounting3To2Adapter } from '../../../shared/adapters/accounting3to2';
import { TransactionGroupWithEntries as TransactionGroupType } from '../../../shared/types/accounting2';
import logger from '../../utils/logger';

import { NotFoundError, PermissionError, TransactionError, ValidationError } from './TransactionErrorTypes';
import { 
  PaginatedResult, 
  PaginationOptions, 
  PaginationResult, 
  PaymentData, 
  QueryParams, 
  TransactionFilters, 
  TransactionStatistics 
} from './TransactionTypes';
import TransactionValidationService from './TransactionValidationService';
import TransactionBalanceService from './TransactionBalanceService';
import TransactionPaymentService from './TransactionPaymentService';

/**
 * Accounting2 交易服務層
 * 提供交易管理功能，與 Accounting3 資料結構相容
 */
export class TransactionService {
  
  /**
   * 通用方法：取得交易並檢查權限
   * @param transactionId 交易ID
   * @param userId 使用者ID
   * @param options 選項
   * @returns 交易群組或 null（僅當 throwIfNotFound 為 false 時）
   */
  private static async getTransactionWithPermissionCheck<T = ITransactionGroupWithEntries>(
    transactionId: string,
    userId: string,
    options: {
      throwIfNotFound?: boolean;
      populateFields?: string;
      statusFilter?: 'draft' | 'confirmed' | 'cancelled' | Array<'draft' | 'confirmed' | 'cancelled'>;
      lean?: boolean;
    } = {}
  ): Promise<T> {
    const {
      throwIfNotFound = true,
      populateFields = 'entries.accountId',
      statusFilter,
      lean = true
    } = options;
    
    const query: any = {
      _id: transactionId,
      createdBy: userId
    };
    
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        query.status = { $in: statusFilter };
      } else {
        query.status = statusFilter;
      }
    }
    
    logger.debug('查詢交易:', { transactionId, userId, statusFilter });
    
    try {
      let transaction;
      
      if (lean) {
        transaction = await TransactionGroupWithEntries.findOne(query)
          .populate(populateFields)
          .lean();
      } else {
        transaction = await TransactionGroupWithEntries.findOne(query)
          .populate(populateFields);
      }
      
      if (!transaction && throwIfNotFound) {
        throw new NotFoundError('交易群組不存在或無權限存取');
      }
      
      return transaction as T;
    } catch (error) {
      logger.error('查詢交易失敗:', error);
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof PermissionError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '查詢交易時發生未知錯誤');
    }
  }
  
  /**
   * 通用方法：應用分頁邏輯到查詢
   * @param options 分頁選項
   * @returns 分頁結果
   */
  private static applyPaginationToQuery(
    options: PaginationOptions,
    totalItems: number
  ): PaginationResult {
    const defaultLimit = options.defaultLimit || 25;
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : defaultLimit;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);
    
    logger.debug(`分頁參數:`, { page, limit, skip, totalItems, totalPages });
    
    return {
      skip,
      limit,
      page,
      totalPages
    };
  }
  
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
          throw new ValidationError(`交易群組編號 ${transactionData.groupNumber} 已存在`);
        }
      }

      // 驗證分錄資料
      if (transactionData.entries && transactionData.entries.length > 0) {
        await TransactionValidationService.validateEntries(transactionData.entries, userId);
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
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof PermissionError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '建立交易群組時發生未知錯誤');
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
    filters?: TransactionFilters
  ): Promise<PaginatedResult<ITransactionGroupWithEntries>> {
    try {
      // 建立查詢條件
      const query: QueryParams = {
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

      // 先獲取總數
      const total = await TransactionGroupWithEntries.countDocuments(query);

      // 使用通用方法處理分頁
      const pagination = this.applyPaginationToQuery(
        {
          page: filters?.page,
          limit: filters?.limit,
          defaultLimit: 25
        },
        total
      );

      // 查詢交易列表
      const transactions = await TransactionGroupWithEntries.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('entries.accountId', 'name code accountType')
        .lean();

      logger.debug(`查詢交易群組數量: ${transactions.length}/${total}, 分頁: ${pagination.page}/${pagination.totalPages}`);
      
      return {
        items: transactions,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages
      };
    } catch (error) {
      logger.error('取得交易群組列表錯誤:', error);
      throw new TransactionError(error instanceof Error ? error.message : '取得交易群組列表時發生未知錯誤');
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
      // 使用通用方法取得交易
      const transaction = await this.getTransactionWithPermissionCheck<ITransactionGroupWithEntries>(
        transactionId,
        userId,
        {
          populateFields: 'entries.accountId',
          lean: true
        }
      );

      if (!transaction) {
        throw new NotFoundError('交易群組不存在或無權限存取');
      }

      let result: any = transaction;

      if (includeCompatibilityInfo) {
        // 轉換為相容性格式進行驗證
        const transactionData = {
          ...transaction,
          _id: String(transaction._id)
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
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof PermissionError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '取得交易群組詳細資料時發生未知錯誤');
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
        throw new NotFoundError('交易群組不存在或無權限存取');
      }

      // 檢查交易狀態是否允許修改
      if (existingTransaction.status === 'confirmed') {
        throw new ValidationError('已確認的交易無法修改');
      }

      // 如果更新群組編號，檢查唯一性
      if (updateData.groupNumber && updateData.groupNumber !== existingTransaction.groupNumber) {
        const duplicateTransaction = await TransactionGroupWithEntries.findOne({
          groupNumber: updateData.groupNumber,
          createdBy: userId,
          _id: { $ne: transactionId }
        });

        if (duplicateTransaction) {
          throw new ValidationError(`交易群組編號 ${updateData.groupNumber} 已存在`);
        }
      }

      // 驗證分錄資料
      if (updateData.entries && updateData.entries.length > 0) {
        await TransactionValidationService.validateEntries(updateData.entries, userId);
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
        throw new TransactionError('更新交易群組失敗');
      }

      logger.info(`交易群組更新成功: ${updatedTransaction.groupNumber}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('更新交易群組錯誤:', error);
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof PermissionError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '更新交易群組時發生未知錯誤');
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
      // 使用通用方法取得交易，不使用 lean() 以便直接操作 document
      const transaction = await this.getTransactionWithPermissionCheck<ITransactionGroupWithEntries & Document>(
        transactionId,
        userId,
        { lean: false }
      );

      if (transaction.status === 'confirmed') {
        throw new ValidationError('交易群組已經確認');
      }

      if (transaction.status === 'cancelled') {
        throw new ValidationError('已取消的交易無法確認');
      }

      // 驗證交易完整性
      if (!transaction.entries || transaction.entries.length === 0) {
        throw new ValidationError('交易群組必須包含分錄才能確認');
      }

      // 驗證借貸平衡
      const totalDebit = transaction.entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = transaction.entries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new ValidationError(`交易借貸不平衡：借方 ${totalDebit}，貸方 ${totalCredit}`);
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
        throw new TransactionError('確認交易群組失敗');
      }

      logger.info(`交易群組確認成功: ${confirmedTransaction.groupNumber}`);
      return confirmedTransaction;
    } catch (error) {
      logger.error('確認交易群組錯誤:', error);
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof PermissionError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '確認交易群組時發生未知錯誤');
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
      // 使用通用方法取得交易
      const transaction = await this.getTransactionWithPermissionCheck<ITransactionGroupWithEntries & Document>(
        transactionId,
        userId,
        { lean: false }
      );

      if (transaction.status === 'cancelled') {
        throw new ValidationError('交易群組已經取消');
      }

      // 檢查是否有其他交易引用此交易
      const referencingTransactions = await TransactionGroupWithEntries.find({
        'entries.sourceTransactionId': transactionId,
        createdBy: userId,
        status: { $ne: 'cancelled' }
      });

      if (referencingTransactions.length > 0) {
        throw new ValidationError(`無法取消交易：有 ${referencingTransactions.length} 筆交易引用此交易`);
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
        throw new TransactionError('取消交易群組失敗');
      }

      logger.info(`交易群組取消成功: ${cancelledTransaction.groupNumber}`);
      return cancelledTransaction;
    } catch (error) {
      logger.error('取消交易群組錯誤:', error);
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof PermissionError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '取消交易群組時發生未知錯誤');
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
  ): Promise<TransactionStatistics> {
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
      throw new TransactionError(error instanceof Error ? error.message : '取得交易統計資訊時發生未知錯誤');
    }
  }

  // 餘額計算相關方法
  static calculateTransactionBalance = TransactionBalanceService.calculateTransactionBalance;
  static calculateMultipleTransactionBalances = TransactionBalanceService.calculateMultipleTransactionBalances;

  // 付款相關方法
  static async createPaymentTransaction(
    paymentData: PaymentData,
    userId: string
  ) {
    return TransactionPaymentService.createPaymentTransaction(paymentData, userId, this.createTransactionGroup);
  }
  
  static getPayableTransactions = TransactionPaymentService.getPayableTransactions;
  static updatePayablePaymentStatus = TransactionPaymentService.updatePayablePaymentStatus;
  static checkPurchaseOrderPaymentStatus = TransactionPaymentService.checkPurchaseOrderPaymentStatus;
  static batchCheckPurchaseOrderPaymentStatus = TransactionPaymentService.batchCheckPurchaseOrderPaymentStatus;
  static updateRelatedPurchaseOrderPaymentStatus = TransactionPaymentService.updateRelatedPurchaseOrderPaymentStatus;
}

export default TransactionService;