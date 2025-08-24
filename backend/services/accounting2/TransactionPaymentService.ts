import Account2 from '../../models/Account2';
import TransactionGroupWithEntries from '../../models/TransactionGroupWithEntries';
import logger from '../../utils/logger';
import { NotFoundError, TransactionError, ValidationError } from './TransactionErrorTypes';
import { PaymentData, PayableTransactionInfo, PaymentStatusInfo } from './TransactionTypes';
import TransactionValidationService from './TransactionValidationService';

/**
 * 交易付款服務
 * 負責所有與交易付款相關的功能
 */
export class TransactionPaymentService {
  /**
   * 建立付款交易
   * @param paymentData 付款資料
   * @param userId 使用者ID
   * @returns 付款交易
   */
  static async createPaymentTransaction(
    paymentData: PaymentData,
    userId: string,
    createTransactionGroup: Function
  ): Promise<any> {
    try {
      // 驗證付款資料
      const validationResult = await TransactionValidationService.validatePaymentTransaction(paymentData, userId);
      if (!validationResult.isValid) {
        throw new ValidationError(`付款資料驗證失敗: ${validationResult.errors.join(', ')}`);
      }

      // 根據付款帳戶類型決定交易狀態
      const paymentAccount = await Account2.findOne({
        _id: paymentData.paymentAccountId,
        createdBy: userId,
        isActive: true
      });

      if (!paymentAccount) {
        throw new NotFoundError('付款帳戶不存在或無權限存取');
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
      const paymentTransaction = await createTransactionGroup({
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

      // 更新相關進貨單的付款狀態
      await this.updateRelatedPurchaseOrderPaymentStatus(
        paymentData.paymentInfo.payableTransactions.map(p => p.transactionId),
        statusDescription
      );

      logger.info(`付款交易建立成功: ${paymentTransaction.groupNumber} - ${statusDescription}`);
      return paymentTransaction;
    } catch (error) {
      logger.error('建立付款交易錯誤:', error);
      
      // 重新拋出自定義錯誤，保留原始錯誤訊息
      if (error instanceof NotFoundError || 
          error instanceof ValidationError || 
          error instanceof TransactionError) {
        throw error;
      }
      
      // 將未知錯誤包裝為 TransactionError
      throw new TransactionError(error instanceof Error ? error.message : '建立付款交易時發生未知錯誤');
    }
  }

  /**
   * 取得可付款的應付帳款
   * @param userId 使用者ID
   * @param organizationId 機構ID（可選）
   * @param excludePaidOff 是否排除已付清的項目
   * @returns 應付帳款列表
   */
  static async getPayableTransactions(
    userId: string,
    organizationId?: string,
    excludePaidOff: boolean = true
  ): Promise<PayableTransactionInfo[]> {
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

      if (transactions.length === 0) {
        return [];
      }

      // 批量獲取所有交易的付款資訊
      const transactionIds = transactions.map(t => t._id.toString());
      
      // 一次性查詢所有相關的付款交易
      const paymentTransactions = await TransactionGroupWithEntries.find({
        createdBy: userId,
        status: { $in: ['draft', 'confirmed'] },
        transactionType: 'payment',
        'paymentInfo.payableTransactions.transactionId': { $in: transactionIds }
      }).lean();
      
      logger.debug(`找到相關付款交易:`, { count: paymentTransactions.length });
      
      // 建立交易ID到付款金額的映射
      const paidAmountMap: { [key: string]: number } = {};
      
      // 計算每筆交易的已付金額
      paymentTransactions.forEach(payment => {
        (payment.paymentInfo?.payableTransactions || []).forEach((payable: any) => {
          const transactionId = payable.transactionId?.toString();
          if (transactionId && transactionIds.includes(transactionId)) {
            paidAmountMap[transactionId] = (paidAmountMap[transactionId] || 0) + (payable.paidAmount || 0);
          }
        });
      });
      
      logger.debug(`已計算付款金額映射:`, { 
        mappedTransactions: Object.keys(paidAmountMap).length 
      });

      // 計算每筆交易的付款狀態
      const payableTransactions: PayableTransactionInfo[] = [];

      for (const transaction of transactions) {
        const transactionId = transaction._id.toString();
        
        // 計算應付帳款金額（從貸方分錄中計算）
        const payableEntries = transaction.entries?.filter((entry: any) =>
          payableAccountIds.includes(entry.accountId?._id?.toString() || entry.accountId?.toString()) &&
          entry.creditAmount > 0
        ) || [];

        const payableAmount = payableEntries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);
        
        if (payableAmount <= 0) {
          continue; // 跳過沒有應付金額的交易
        }

        // 使用映射獲取已付金額，避免單獨查詢
        const paidAmount = paidAmountMap[transactionId] || 0;
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
        
        // 收集相關的付款歷史
        const relevantPayments = paymentTransactions
          .filter(payment =>
            payment.paymentInfo?.payableTransactions?.some(
              (p: any) => p.transactionId?.toString() === transactionId
            )
          )
          .map(payment => {
            const payableTransaction = payment.paymentInfo?.payableTransactions?.find(
              (p: any) => p.transactionId?.toString() === transactionId
            );
            
            return {
              paymentTransactionId: payment._id.toString(),
              paidAmount: payableTransaction?.paidAmount || 0,
              paymentDate: payment.transactionDate || payment.createdAt,
              paymentMethod: payment.paymentInfo?.paymentMethod
            };
          });
        
        payableTransactions.push({
          _id: transactionId,
          groupNumber: transaction.groupNumber,
          description: transaction.description,
          totalAmount: payableAmount, // 使用計算出的應付金額
          paidAmount,
          remainingAmount,
          ...(transaction.payableInfo?.dueDate && { dueDate: transaction.payableInfo.dueDate }),
          ...(supplierInfo && { supplierInfo }),
          isPaidOff,
          paymentHistory: relevantPayments.length > 0 ? 
            relevantPayments : 
            (transaction.payableInfo?.paymentHistory || []).map((history: any) => ({
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
      throw new TransactionError(error instanceof Error ? error.message : '取得應付帳款時發生未知錯誤');
    }
  }

  /**
   * 更新應付帳款的付款狀態
   * @param payableTransactionId 應付帳款交易ID
   * @param userId 使用者ID
   */
  static async updatePayablePaymentStatus(
    payableTransactionId: string,
    userId: string
  ): Promise<void> {
    try {
      const paidAmount = await TransactionValidationService.calculatePaidAmount(payableTransactionId, userId);
      
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
      throw new TransactionError(error instanceof Error ? error.message : '更新應付帳款狀態時發生未知錯誤');
    }
  }

  /**
   * 檢查進貨單是否有付款記錄
   * @param purchaseOrderId 進貨單ID或相關交易ID
   * @param userId 使用者ID
   * @returns 付款狀態資訊
   */
  static async checkPurchaseOrderPaymentStatus(
    purchaseOrderId: string,
    userId: string
  ): Promise<PaymentStatusInfo> {
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
   * 批量檢查多個進貨單的付款狀態
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
      logger.debug('批量付款狀態檢查完成', {
        totalOrders: purchaseOrders.length,
        missingTransactionIdCount,
        missingPaymentCount,
        hasPaymentCount,
        paymentTransactionsCount: paymentCount
      });
      
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
   * 更新相關進貨單的付款狀態
   * @param transactionIds 交易ID陣列
   * @param paymentStatus 付款狀態 ('已下收' | '已匯款')
   */
  static async updateRelatedPurchaseOrderPaymentStatus(
    transactionIds: string[],
    paymentStatus: string
  ): Promise<void> {
    try {
      // 只記錄開始的摘要信息
      logger.debug(`開始更新進貨單付款狀態`, {
        transactionCount: transactionIds.length,
        status: paymentStatus
      });
      
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

export default TransactionPaymentService;