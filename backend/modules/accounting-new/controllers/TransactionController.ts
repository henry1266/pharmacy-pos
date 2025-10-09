import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { ValidationService } from '../services/ValidationService';
import { ITransactionGroupWithEntries, IPaymentInfo } from '../../accounting-old/models/TransactionGroupWithEntries';
import logger from '../../../utils/logger';

// 擴展 Request 介面以支援 user 屬性
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Accounting2 交易管理控制器
 * 處理交易相關的 HTTP 請求和回應
 */
export class TransactionController {

  /**
   * 建立新交易群組
   * POST /api/accounting2/transactions
   */
  static async createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const transactionData = req.body as Partial<ITransactionGroupWithEntries>;
      
      // 驗證必要欄位
      if (!transactionData.groupNumber || !transactionData.transactionDate || !transactionData.entries) {
        res.status(400).json({
          success: false,
          message: '缺少必要欄位：groupNumber, transactionDate, entries'
        });
        return;
      }

      if (!Array.isArray(transactionData.entries) || transactionData.entries.length < 2) {
        res.status(400).json({
          success: false,
          message: '交易至少需要兩筆分錄'
        });
        return;
      }

      const transaction = await TransactionService.createTransactionGroup(transactionData, userId);
      
      logger.info('交易建立成功', { groupNumber: transaction.groupNumber });
      
      res.status(201).json({
        success: true,
        message: '交易建立成功',
        data: transaction
      });
    } catch (error) {
      logger.error('建立交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '建立交易失敗'
      });
    }
  }

  /**
   * 更新交易群組
   * PUT /api/accounting2/transactions/:id
   */
  static async updateTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const updateData = req.body as Partial<ITransactionGroupWithEntries>;
      const transaction = await TransactionService.updateTransactionGroup(id, updateData, userId);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: '交易不存在或無權限修改'
        });
        return;
      }

      logger.info('交易更新成功', { groupNumber: transaction.groupNumber });
      
      res.json({
        success: true,
        message: '交易更新成功',
        data: transaction
      });
    } catch (error) {
      logger.error('更新交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新交易失敗'
      });
    }
  }

  /**
   * 刪除交易群組
   * DELETE /api/accounting2/transactions/:id
   */
  static async deleteTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      // TransactionService 沒有 deleteTransactionGroup 方法，使用 cancelTransactionGroup
      const transaction = await TransactionService.cancelTransactionGroup(id, userId, '使用者刪除');
      const success = !!transaction;
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: '交易不存在或無權限刪除'
        });
        return;
      }

      logger.info('交易刪除成功', { id });
      
      res.json({
        success: true,
        message: '交易刪除成功'
      });
    } catch (error) {
      logger.error('刪除交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '刪除交易失敗'
      });
    }
  }

  /**
   * 取得單一交易群組
   * GET /api/accounting2/transactions/:id
   */
  static async getTransactionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.query.userId as string;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const transaction = await TransactionService.getTransactionGroupById(id, userId);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: '交易不存在或無權限查看'
        });
        return;
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('取得交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得交易失敗'
      });
    }
  }

  /**
   * 取得使用者交易列表
   * GET /api/accounting2/transactions
   */
  static async getTransactionsByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const {
        organizationId,
        status,
        startDate,
        endDate,
        accountId,
        page = '1',
        limit = '25', // 將默認值改為25，與前端一致
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        organizationId: organizationId as string,
        status: status as string,
        dateRange: startDate && endDate ? {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        } : undefined,
        accountId: accountId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const queryOptions: {
        status?: 'draft' | 'confirmed' | 'cancelled';
        startDate?: Date;
        endDate?: Date;
        search?: string;
        page?: number;
        limit?: number;
      } = {
        page: options.page,
        limit: options.limit
      };

      if (options.status) {
        queryOptions.status = options.status as 'draft' | 'confirmed' | 'cancelled';
      }
      if (options.dateRange?.startDate) {
        queryOptions.startDate = options.dateRange.startDate;
      }
      if (options.dateRange?.endDate) {
        queryOptions.endDate = options.dateRange.endDate;
      }

      logger.debug('TransactionController.getTransactionsByUser - 查詢參數', {
        userId,
        organizationId: options.organizationId,
        page: queryOptions.page,
        limit: queryOptions.limit,
        status: queryOptions.status,
        dateRange: queryOptions.startDate && queryOptions.endDate ?
          `${queryOptions.startDate.toISOString()} - ${queryOptions.endDate.toISOString()}` : 'none'
      });

      const result = await TransactionService.getTransactionGroups(userId, options.organizationId, queryOptions);
      
      logger.debug('TransactionController.getTransactionsByUser - 查詢結果', {
        transactionsCount: result.transactions.length,
        totalRecords: result.total,
        currentPage: result.page,
        pageSize: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      });
      
      res.json({
        success: true,
        data: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('取得交易列表錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得交易列表失敗'
      });
    }
  }

  /**
   * 確認交易
   * POST /api/accounting2/transactions/:id/confirm
   */
  static async confirmTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const transaction = await TransactionService.confirmTransactionGroup(id, userId);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: '交易不存在或無權限確認'
        });
        return;
      }

      logger.info('交易確認成功', { groupNumber: transaction.groupNumber });
      
      res.json({
        success: true,
        message: '交易確認成功',
        data: transaction
      });
    } catch (error) {
      logger.error('確認交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '確認交易失敗'
      });
    }
  }

  /**
   * 取消交易
   * POST /api/accounting2/transactions/:id/cancel
   */
  static async cancelTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { reason } = req.body;
      const transaction = await TransactionService.cancelTransactionGroup(id, userId, reason);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: '交易不存在或無權限取消'
        });
        return;
      }

      logger.info('交易取消成功', { groupNumber: transaction.groupNumber });
      
      res.json({
        success: true,
        message: '交易取消成功',
        data: transaction
      });
    } catch (error) {
      logger.error('取消交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取消交易失敗'
      });
    }
  }

  /**
   * 取得交易統計
   * GET /api/accounting2/transactions/statistics
   */
  static async getTransactionStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const {
        organizationId,
        startDate,
        endDate,
        // groupBy = 'month' // 暫時註解未使用的變數
      } = req.query;

      const dateRange = startDate && endDate ? {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      } : undefined;

      const statistics = await TransactionService.getTransactionStatistics(
        userId,
        organizationId as string,
        dateRange
      );
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('取得交易統計錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得交易統計失敗'
      });
    }
  }

  /**
   * 驗證交易完整性
   * POST /api/accounting2/transactions/validate
   */
  static async validateTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { organizationId } = req.body;
      
      const validation = await ValidationService.validateSystemIntegrity(
        userId,
        organizationId
      );
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('驗證交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '驗證交易失敗'
      });
    }
  }

  /**
   * 匯出交易資料
   * GET /api/accounting2/transactions/export
   */
  static async exportTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const {
        organizationId,
        status,
        startDate,
        endDate,
        format = 'json'
      } = req.query;

      const options = {
        organizationId: organizationId as string,
        status: status as string,
        dateRange: startDate && endDate ? {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        } : undefined,
        accountId: undefined as any,
        page: 1,
        limit: 10000, // 匯出時不限制數量
        sortBy: 'transactionDate',
        sortOrder: 'desc' as const
      };

      const queryOptions: {
        status?: 'draft' | 'confirmed' | 'cancelled';
        startDate?: Date;
        endDate?: Date;
        search?: string;
        page?: number;
        limit?: number;
      } = {
        page: 1,
        limit: 10000
      };

      if (options.status) {
        queryOptions.status = options.status as 'draft' | 'confirmed' | 'cancelled';
      }
      if (options.dateRange?.startDate) {
        queryOptions.startDate = options.dateRange.startDate;
      }
      if (options.dateRange?.endDate) {
        queryOptions.endDate = options.dateRange.endDate;
      }

      const result = await TransactionService.getTransactionGroups(userId, options.organizationId, queryOptions);
      
      const transactions = result.transactions;
      
      if (format === 'csv') {
        // 設定 CSV 回應標頭
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        
        // 生成 CSV 內容
        const csvHeader = 'GroupNumber,Date,Description,Status,TotalAmount,Currency,Created\n';
        const csvRows = transactions.map((transaction: any) => 
          `"${transaction.groupNumber}","${transaction.transactionDate}","${transaction.description || ''}","${transaction.status}",${transaction.totalAmount || 0},"${transaction.currency || 'TWD'}","${transaction.createdAt}"`
        ).join('\n');
        
        res.send(csvHeader + csvRows);
      } else {
        // JSON 格式
        res.json({
          success: true,
          data: transactions,
          exportedAt: new Date(),
          totalRecords: transactions.length
        });
      }
      
      logger.info('交易資料匯出完成', { recordCount: transactions.length });
    } catch (error) {
      logger.error('匯出交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '匯出交易失敗'
      });
    }
  }

  /**
   * 取得科目統計聚合資料 - 高效能版本
   * GET /api/accounting2/transactions/account-statistics-aggregate
   */
  static async getAccountStatisticsAggregate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { organizationId } = req.query;

      // 使用 MongoDB aggregation pipeline 進行高效能統計
      const TransactionGroupWithEntries = require('../../models/TransactionGroupWithEntries').default;
      
      const pipeline = [
        // 1. 基本過濾條件
        {
          $match: {
            createdBy: userId,
            status: 'confirmed', // 只統計已確認的交易
            ...(organizationId && { organizationId: organizationId })
          }
        },
        // 2. 展開分錄陣列
        { $unwind: '$entries' },
        // 3. 按科目ID分組並統計
        {
          $group: {
            _id: '$entries.accountId',
            totalDebit: { $sum: '$entries.debitAmount' },
            totalCredit: { $sum: '$entries.creditAmount' },
            transactionCount: { $sum: 1 },
            lastTransactionDate: { $max: '$transactionDate' }
          }
        },
        // 4. 計算淨額
        {
          $addFields: {
            balance: { $subtract: ['$totalDebit', '$totalCredit'] }
          }
        },
        // 5. 排序（可選）
        { $sort: { _id: 1 } }
      ];

      logger.debug('執行科目統計聚合查詢');
      const startTime = Date.now();
      
      const aggregateResults = await TransactionGroupWithEntries.aggregate(pipeline);
      
      const endTime = Date.now();
      logger.debug('聚合查詢完成', {
        executionTime: `${endTime - startTime}ms`,
        resultCount: aggregateResults.length
      });

      // 轉換為前端期望的格式
      const statistics = aggregateResults.map((result: any) => ({
        accountId: result._id,
        totalDebit: result.totalDebit || 0,
        totalCredit: result.totalCredit || 0,
        balance: result.balance || 0,
        totalBalance: result.balance || 0, // 對於聚合結果，balance 等於 totalBalance
        transactionCount: result.transactionCount || 0,
        hasTransactions: result.transactionCount > 0,
        lastTransactionDate: result.lastTransactionDate
      }));

      res.json({
        success: true,
        data: statistics,
        meta: {
          totalAccounts: statistics.length,
          queryTime: endTime - startTime,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('取得科目統計聚合資料錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得科目統計聚合資料失敗'
      });
    }
  }

  /**
   * 計算交易餘額
   * GET /api/accounting2/transactions/:id/balance
   */
  static async calculateTransactionBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.query.userId as string;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const balance = await TransactionService.calculateTransactionBalance(id, userId);
      
      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      logger.error('計算交易餘額錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '計算交易餘額失敗'
      });
    }
  }

  /**
   * 批次計算交易餘額
   * POST /api/accounting2/transactions/calculate-balances
   */
  static async calculateMultipleTransactionBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { transactionIds } = req.body;
      
      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '請提供有效的交易ID陣列'
        });
        return;
      }

      const balances = await TransactionService.calculateMultipleTransactionBalances(transactionIds, userId);
      
      const successful = balances.filter(b => b.success);
      const failed = balances.filter(b => !b.success);
      
      logger.info('批次餘額計算完成', {
        successCount: successful.length,
        failedCount: failed.length
      });
      
      res.json({
        success: failed.length === 0,
        message: `批次餘額計算完成：成功 ${successful.length} 筆，失敗 ${failed.length} 筆`,
        data: {
          balances,
          summary: {
            total: transactionIds.length,
            successful: successful.length,
            failed: failed.length
          }
        }
      });
    } catch (error) {
      logger.error('批次計算交易餘額錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '批次計算交易餘額失敗'
      });
    }
  }

  /**
   * 批次建立交易
   * POST /api/accounting2/transactions/batch
   */
  static async batchCreateTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { transactions } = req.body;
      
      if (!Array.isArray(transactions) || transactions.length === 0) {
        res.status(400).json({
          success: false,
          message: '請提供有效的交易陣列'
        });
        return;
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < transactions.length; i++) {
        try {
          const transaction = await TransactionService.createTransactionGroup(transactions[i], userId);
          results.push({
            index: i,
            success: true,
            data: transaction
          });
        } catch (error) {
          errors.push({
            index: i,
            success: false,
            error: error instanceof Error ? error.message : '建立失敗',
            data: transactions[i]
          });
        }
      }

      logger.info('批次建立交易完成', {
        successCount: results.length,
        failedCount: errors.length
      });
      
      res.json({
        success: errors.length === 0,
        message: `批次處理完成：成功 ${results.length} 筆，失敗 ${errors.length} 筆`,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: transactions.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      logger.error('批次建立交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '批次建立交易失敗'
      });
    }
  }

  /**
   * 🆕 取得可付款的應付帳款列表
   * GET /api/accounting2/transactions/payables
   */
  static async getPayableTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { organizationId, excludePaidOff = 'true' } = req.query;

      const payableTransactions = await TransactionService.getPayableTransactions(
        userId,
        organizationId as string,
        excludePaidOff === 'true'
      );

      res.json({
        success: true,
        data: payableTransactions,
        meta: {
          total: payableTransactions.length,
          unpaidCount: payableTransactions.filter(p => !p.isPaidOff).length,
          totalUnpaidAmount: payableTransactions
            .filter(p => !p.isPaidOff)
            .reduce((sum, p) => sum + p.remainingAmount, 0)
        }
      });
    } catch (error) {
      logger.error('取得應付帳款錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得應付帳款失敗'
      });
    }
  }

  /**
   * 🆕 建立付款交易
   * POST /api/accounting2/transactions/payment
   */
  static async createPaymentTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const paymentData = req.body;

      // 驗證必要欄位
      if (!paymentData.paymentMethod) {
        res.status(400).json({
          success: false,
          message: '缺少付款方式'
        });
        return;
      }

      if (!paymentData.paymentInfo?.payableTransactions?.length) {
        res.status(400).json({
          success: false,
          message: '必須指定要付款的應付帳款'
        });
        return;
      }

      if (!paymentData.entries || paymentData.entries.length < 2) {
        res.status(400).json({
          success: false,
          message: '付款交易至少需要兩筆分錄'
        });
        return;
      }

      // 建立付款交易
      const paymentTransaction = await TransactionService.createPaymentTransaction(paymentData, userId);

      logger.info('付款交易建立成功', { groupNumber: paymentTransaction.groupNumber });
      
      res.status(201).json({
        success: true,
        message: '付款交易建立成功',
        data: paymentTransaction
      });
    } catch (error) {
      logger.error('建立付款交易錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '建立付款交易失敗'
      });
    }
  }

  /**
   * 🆕 取得應付帳款的付款歷史
   * GET /api/accounting2/transactions/:id/payment-history
   */
  static async getPaymentHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.query.userId as string;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少交易ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      // 查找所有引用此交易的付款交易
      const paymentTransactions = await TransactionService.getTransactionGroups(
        userId,
        undefined,
        {
          page: 1,
          limit: 1000
        }
      );

      const paymentHistory = paymentTransactions.transactions
        .filter((transaction: ITransactionGroupWithEntries) =>
          transaction.transactionType === 'payment' &&
          transaction.paymentInfo?.payableTransactions?.some(
            (p: IPaymentInfo['payableTransactions'][number]) => p.transactionId?.toString() === id
          )
        )
        .map((payment: ITransactionGroupWithEntries) => {
          const payableTransaction = payment.paymentInfo?.payableTransactions?.find(
            (p: IPaymentInfo['payableTransactions'][number]) => p.transactionId?.toString() === id
          );
          
          return {
            paymentTransactionId: (payment as any)._id.toString(),
            groupNumber: payment.groupNumber,
            description: payment.description,
            paymentDate: payment.transactionDate,
            paymentMethod: payment.paymentInfo?.paymentMethod,
            paidAmount: payableTransaction?.paidAmount || 0,
            status: payment.status
          };
        })
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

      const totalPaidAmount = paymentHistory
        .filter(p => p.status === 'confirmed')
        .reduce((sum, p) => sum + p.paidAmount, 0);

      res.json({
        success: true,
        data: {
          paymentHistory,
          summary: {
            totalPayments: paymentHistory.length,
            totalPaidAmount,
            confirmedPayments: paymentHistory.filter(p => p.status === 'confirmed').length
          }
        }
      });
    } catch (error) {
      logger.error('取得付款歷史錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得付款歷史失敗'
      });
    }
  }

  /**
   * 🆕 檢查進貨單付款狀態
   * GET /api/accounting2/transactions/purchase-order/:id/payment-status
   */
  static async checkPurchaseOrderPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.query.userId as string;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少進貨單ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const paymentStatus = await TransactionService.checkPurchaseOrderPaymentStatus(id, userId);

      res.json({
        success: true,
        data: paymentStatus
      });
    } catch (error) {
      logger.error('檢查進貨單付款狀態錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '檢查進貨單付款狀態失敗'
      });
    }
  }

  /**
   * 🆕 批量檢查進貨單付款狀態
   * POST /api/accounting2/transactions/purchase-orders/batch-payment-status
   */
  static async batchCheckPurchaseOrderPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { purchaseOrderIds } = req.body;

      if (!Array.isArray(purchaseOrderIds) || purchaseOrderIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '請提供有效的進貨單ID陣列'
        });
        return;
      }

      const paymentStatusMap = await TransactionService.batchCheckPurchaseOrderPaymentStatus(
        purchaseOrderIds,
        userId
      );

      // 轉換為前端期望的格式
      const paymentStatuses = purchaseOrderIds.map(purchaseOrderId => ({
        purchaseOrderId,
        hasPaidAmount: paymentStatusMap[purchaseOrderId] || false
      }));

      // 只記錄摘要信息，不輸出完整的付款狀態數組
      const paidCount = paymentStatuses.filter(status => status.hasPaidAmount).length;
      logger.debug('批量付款狀態檢查結果', {
        totalCount: paymentStatuses.length,
        paidCount,
        unpaidCount: paymentStatuses.length - paidCount
      });

      res.json({
        success: true,
        data: paymentStatuses,
        meta: {
          total: purchaseOrderIds.length,
          processed: paymentStatuses.length
        }
      });
    } catch (error) {
      logger.error('批量檢查進貨單付款狀態錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '批量檢查進貨單付款狀態失敗'
      });
    }
  }
}

export default TransactionController;
