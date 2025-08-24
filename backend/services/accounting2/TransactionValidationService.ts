import Account2 from '../../models/Account2';
import TransactionGroupWithEntries from '../../models/TransactionGroupWithEntries';
import logger from '../../utils/logger';
import { ValidationError } from './TransactionErrorTypes';
import { ValidationResult, PaymentData } from './TransactionTypes';

/**
 * 交易驗證服務
 * 負責所有與交易驗證相關的功能
 */
export class TransactionValidationService {
  /**
   * 驗證分錄資料
   * @param entries 分錄陣列
   * @param userId 使用者ID
   * @private
   */
  static async validateEntries(entries: any[], userId: string): Promise<void> {
    logger.debug('開始驗證分錄資料:', { entriesCount: entries.length });
    
    const accountIds = entries.map((entry, index) => {
      // 安全地提取 accountId，使用 any 類型避免類型錯誤
      let accountId: any;
      
      if (typeof entry.accountId === 'string') {
        accountId = entry.accountId;
      } else if (entry.accountId && typeof entry.accountId === 'object') {
        // 處理 ObjectId 或包含 _id 的物件
        if ('_id' in entry.accountId) {
          accountId = entry.accountId._id;
        } else {
          accountId = entry.accountId;
        }
      }
      
      logger.debug(`分錄 ${index + 1} 資料:`, {
        accountId: accountId ? String(accountId) : undefined,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount
      });
      
      return accountId;
    }).filter(Boolean);

    logger.debug('提取的科目 ID:', accountIds);

    if (accountIds.length === 0) {
      throw new ValidationError('分錄必須指定會計科目');
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
      details: accounts.map(a => ({ id: String(a._id), code: a.code, name: a.name }))
    });

    if (accounts.length !== uniqueAccountIds.length) {
      const existingAccountIds = accounts.map(a => String(a._id));
      const missingAccountIds = uniqueAccountIds.filter(id => !existingAccountIds.includes(String(id)));
      
      logger.error('缺少的科目 ID:', {
        missingAccountIds,
        existingAccountIds,
        queryConditions: { uniqueAccountIds, userId }
      });
      
      throw new ValidationError(`以下會計科目不存在或無權限存取: ${missingAccountIds.join(', ')}`);
    }

    // 驗證分錄金額
    for (const entry of entries) {
      const debitAmount = entry.debitAmount || 0;
      const creditAmount = entry.creditAmount || 0;

      if (debitAmount < 0 || creditAmount < 0) {
        throw new ValidationError('分錄金額不能為負數');
      }

      if (debitAmount === 0 && creditAmount === 0) {
        throw new ValidationError('分錄必須有借方或貸方金額');
      }

      if (debitAmount > 0 && creditAmount > 0) {
        throw new ValidationError('分錄不能同時有借方和貸方金額');
      }
    }

    logger.debug('分錄驗證完成');
  }

  /**
   * 驗證付款交易資料
   * @param paymentData 付款資料
   * @param userId 使用者ID
   * @returns 驗證結果
   */
  static async validatePaymentTransaction(
    paymentData: PaymentData,
    userId: string
  ): Promise<ValidationResult> {
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

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors
      };
      return result;
    } catch (error) {
      logger.error('驗證付款交易錯誤:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        errors: ['驗證過程發生錯誤']
      };
      return errorResult;
    }
  }

  /**
   * 計算交易的已付金額
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
}

export default TransactionValidationService;