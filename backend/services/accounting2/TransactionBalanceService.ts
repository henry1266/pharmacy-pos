import TransactionGroupWithEntries from '../../models/TransactionGroupWithEntries';
import logger from '../../utils/logger';
import { NotFoundError, TransactionError } from './TransactionErrorTypes';
import { TransactionBalance, TransactionBalanceResult } from './TransactionTypes';

/**
 * 交易餘額服務
 * 負責所有與交易餘額計算相關的功能
 */
export class TransactionBalanceService {
  /**
   * 計算交易的真實餘額
   * @param transactionId 交易群組ID
   * @param userId 使用者ID
   * @returns 交易餘額資訊
   */
  static async calculateTransactionBalance(
    transactionId: string,
    userId: string
  ): Promise<TransactionBalance> {
    try {
      // 1. 獲取原始交易
      const sourceTransaction = await TransactionGroupWithEntries.findOne({
        _id: transactionId,
        createdBy: userId,
        status: 'confirmed' // 只計算已確認的交易
      }).lean();

      if (!sourceTransaction) {
        throw new NotFoundError('交易不存在、未確認或無權限存取');
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

      const result: TransactionBalance = {
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
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '計算交易餘額時發生未知錯誤');
    }
  }

  /**
   * 批次計算多筆交易的餘額
   * @param transactionIds 交易群組ID陣列
   * @param userId 使用者ID
   * @param concurrencyLimit 並發限制（預設為 5）
   * @returns 交易餘額資訊陣列
   */
  static async calculateMultipleTransactionBalances(
    transactionIds: string[],
    userId: string,
    concurrencyLimit: number = 5
  ): Promise<TransactionBalanceResult[]> {
    try {
      logger.debug(`開始批次計算餘額:`, { 
        count: transactionIds.length, 
        concurrencyLimit 
      });
      
      // 分批處理，控制並發數量
      const results: Array<TransactionBalanceResult & { referencedByTransactions?: any[] }> = [];
      
      // 將交易 ID 分組，每組最多 concurrencyLimit 個
      const chunks: string[][] = [];
      for (let i = 0; i < transactionIds.length; i += concurrencyLimit) {
        chunks.push(transactionIds.slice(i, i + concurrencyLimit));
      }
      
      // 逐批處理
      for (const chunk of chunks) {
        // 並行處理每一批
        const chunkPromises = chunk.map(async (transactionId) => {
          try {
            const balance = await this.calculateTransactionBalance(transactionId, userId);
            return {
              ...balance,
              success: true
            };
          } catch (error) {
            return {
              transactionId,
              totalAmount: 0,
              usedAmount: 0,
              availableAmount: 0,
              referencedByCount: 0,
              success: false,
              error: error instanceof Error ? error.message : '計算失敗'
            };
          }
        });
        
        // 等待當前批次完成
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
      
      // 移除不需要的 referencedByTransactions 屬性，減少返回資料量
      const cleanResults = results.map(({ referencedByTransactions, ...rest }) => rest);

      logger.debug(`批次餘額計算完成:`, { 
        count: cleanResults.length,
        successCount: cleanResults.filter(r => r.success).length
      });
      
      return cleanResults;
    } catch (error) {
      logger.error('批次計算交易餘額錯誤:', error);
      throw new TransactionError(error instanceof Error ? error.message : '批次計算交易餘額時發生未知錯誤');
    }
  }
}

export default TransactionBalanceService;