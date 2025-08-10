import mongoose from 'mongoose';
import Account2, { IAccount2 } from '../models/Account2';
import TransactionGroupWithEntries, { ITransactionGroupWithEntries, IEmbeddedAccountingEntry } from '../models/TransactionGroupWithEntries';
import { IPurchaseOrderDocument } from '../models/PurchaseOrder';
import logger from '../utils/logger';

/**
 * 自動會計分錄服務
 * 處理進貨單完成時的自動雙分錄記帳功能
 */
export class AutoAccountingEntryService {
  
  /**
   * 處理進貨單完成時的自動會計分錄
   * @param purchaseOrder 進貨單文檔
   * @param userId 用戶ID
   * @returns 創建的交易群組ID，如果沒有創建則返回null
   */
  static async handlePurchaseOrderCompletion(purchaseOrder: IPurchaseOrderDocument, userId?: string): Promise<mongoose.Types.ObjectId | null> {
    try {
      logger.debug(`檢查進貨單自動會計分錄條件:`, { poid: purchaseOrder.poid });
      
      // 檢查是否滿足自動分錄條件
      if (!this.shouldCreateAutoEntry(purchaseOrder)) {
        logger.warn('不滿足自動會計分錄條件，跳過');
        return null;
      }

      // 獲取會計科目詳細資訊
      const accounts = await this.getAccountDetails(purchaseOrder.selectedAccountIds!);
      
      // 根據會計分錄類型決定借貸方向，如果沒有指定則自動推斷
      let entryType = purchaseOrder.accountingEntryType;
      
      // 如果沒有指定分錄類型，根據科目類型自動推斷
      if (!entryType) {
        entryType = this.inferEntryTypeFromAccounts(accounts);
        logger.debug(`自動推斷分錄類型:`, { entryType });
        
        // 將推斷的分錄類型回寫到進貨單
        purchaseOrder.accountingEntryType = entryType;
        await purchaseOrder.save();
        logger.info(`已更新進貨單分錄類型:`, { poid: purchaseOrder.poid, entryType });
      }
      
      const { debitAccount, creditAccount } = this.determineDebitCreditAccounts(accounts, entryType);
      
      if (!debitAccount || !creditAccount) {
        logger.warn(`無法根據分錄格式找到合適的借貸科目:`, { entryType });
        return null;
      }

      // 從會計科目推斷機構ID
      const organizationId = await this.inferOrganizationFromAccounts(accounts);
      if (!organizationId) {
        logger.warn('無法從會計科目推斷機構ID，跳過自動分錄');
        return null;
      }

      // 創建嵌入式交易群組（包含分錄）
      const transactionGroup = await this.createTransactionGroupWithEntries(
        purchaseOrder,
        organizationId,
        debitAccount,
        creditAccount,
        userId
      );
      
      logger.info(`成功創建自動會計分錄:`, { poid: purchaseOrder.poid, organizationId: organizationId.toString() });
      return transactionGroup._id as mongoose.Types.ObjectId;
      
    } catch (error) {
      logger.error('創建自動會計分錄時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 刪除進貨單相關的會計分錄
   * @param transactionGroupId 交易群組ID
   */
  static async deletePurchaseOrderEntries(transactionGroupId: mongoose.Types.ObjectId): Promise<void> {
    try {
      logger.debug(`刪除交易群組會計分錄:`, { transactionGroupId: transactionGroupId.toString() });
      
      // 使用嵌入式模型直接刪除交易群組（包含內嵌的分錄）
      await TransactionGroupWithEntries.findByIdAndDelete(transactionGroupId);
      
      logger.info(`成功刪除交易群組及其相關分錄:`, { transactionGroupId: transactionGroupId.toString() });
      
    } catch (error) {
      logger.error('刪除會計分錄時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 檢查是否應該創建自動會計分錄
   * @param purchaseOrder 進貨單文檔
   * @returns 是否應該創建
   */
  private static shouldCreateAutoEntry(purchaseOrder: IPurchaseOrderDocument): boolean {
    // 檢查是否有選擇會計科目
    if (!purchaseOrder.selectedAccountIds || purchaseOrder.selectedAccountIds.length < 2) {
      logger.debug('選擇的會計科目少於2個');
      return false;
    }

    // 檢查總金額是否大於0
    if (!purchaseOrder.totalAmount || purchaseOrder.totalAmount <= 0) {
      logger.debug('進貨單總金額無效');
      return false;
    }

    // 檢查機構ID（重要：會計系統需要機構ID來過濾資料）
    if (!purchaseOrder.organizationId) {
      logger.debug('進貨單沒有機構ID，將嘗試從會計科目獲取');
    }

    logger.debug(`滿足自動會計分錄條件:`, {
      accountCount: purchaseOrder.selectedAccountIds.length,
      totalAmount: purchaseOrder.totalAmount,
      organizationId: purchaseOrder.organizationId || '未設置'
    });
    return true;
  }

  /**
   * 根據會計分錄類型決定借貸科目
   * @param accounts 會計科目陣列
   * @param entryType 分錄類型
   * @returns 借方和貸方科目
   */
  private static determineDebitCreditAccounts(
    accounts: IAccount2[],
    entryType: 'expense-asset' | 'asset-liability'
  ): { debitAccount: IAccount2 | null; creditAccount: IAccount2 | null } {
    
    // 詳細記錄所有科目資訊
    logger.debug(`分析會計科目:`, {
      count: accounts.length,
      accounts: accounts.map((account, index) => ({
        index: index + 1,
        name: account.name,
        type: account.accountType,
        id: (account._id as mongoose.Types.ObjectId).toString()
      }))
    });
    
    if (entryType === 'expense-asset') {
      // 支出-資產格式：支出科目(借方) + 資產科目(貸方)
      // 支援更靈活的科目組合：
      // 1. 標準：expense + asset
      // 2. 替代：asset + liability (當沒有expense科目時，將asset作為借方，liability作為貸方)
      
      let expenseAccount = accounts.find(account => account.accountType === 'expense');
      let assetAccount = accounts.find(account => account.accountType === 'asset');
      let liabilityAccount = accounts.find(account => account.accountType === 'liability');
      
      // 如果沒有找到expense科目，但有asset和liability科目，則使用asset-liability組合
      if (!expenseAccount && assetAccount && liabilityAccount) {
        logger.debug(`支出-資產格式替代方案:`, {
          reason: '未找到支出科目，改用資產-負債組合',
          debitAccount: assetAccount?.name,
          creditAccount: liabilityAccount?.name
        });
        return {
          debitAccount: assetAccount,
          creditAccount: liabilityAccount
        };
      }
      
      logger.debug(`支出-資產格式(標準):`, {
        debitAccount: expenseAccount?.name,
        creditAccount: assetAccount?.name
      });
      return {
        debitAccount: expenseAccount || null,
        creditAccount: assetAccount || null
      };
      
    } else if (entryType === 'asset-liability') {
      // 資產-負債格式：資產科目(借方) + 負債科目(貸方)
      const assetAccount = accounts.find(account => account.accountType === 'asset');
      const liabilityAccount = accounts.find(account => account.accountType === 'liability');
      
      logger.debug(`資產-負債格式:`, {
        debitAccount: assetAccount?.name,
        creditAccount: liabilityAccount?.name
      });
      return {
        debitAccount: assetAccount || null,
        creditAccount: liabilityAccount || null
      };
    }
    
    logger.warn(`不支援的分錄類型:`, { entryType });
    return { debitAccount: null, creditAccount: null };
  }

  /**
   * 獲取會計科目詳細資訊
   * @param accountIds 會計科目ID陣列
   * @returns 會計科目陣列
   */
  private static async getAccountDetails(accountIds: mongoose.Types.ObjectId[]): Promise<IAccount2[]> {
    const accounts = await Account2.find({ _id: { $in: accountIds } });
    
    if (accounts.length !== accountIds.length) {
      throw new Error('部分會計科目不存在');
    }
    
    return accounts;
  }

  /**
   * 從會計科目推斷機構ID
   * @param accounts 會計科目陣列
   * @returns 機構ID，如果無法推斷則返回null
   */
  private static async inferOrganizationFromAccounts(accounts: IAccount2[]): Promise<mongoose.Types.ObjectId | null> {
    try {
      // 檢查所有科目是否屬於同一機構
      const organizationIds = accounts
        .map(account => account.organizationId)
        .filter(orgId => orgId !== null && orgId !== undefined) // 過濾掉null/undefined
        .map(orgId => orgId!.toString());

      if (organizationIds.length === 0) {
        logger.warn('所有會計科目都沒有關聯的機構');
        return null;
      }

      // 檢查是否所有科目都屬於同一機構
      const uniqueOrgIds = [...new Set(organizationIds)];
      if (uniqueOrgIds.length > 1) {
        logger.warn('會計科目屬於不同機構，使用第一個科目的機構', {
          organizationIds: uniqueOrgIds
        });
      }

      const organizationId = new mongoose.Types.ObjectId(uniqueOrgIds[0]);
      logger.debug(`從會計科目推斷機構ID:`, { organizationId: organizationId.toString() });
      return organizationId;

    } catch (error) {
      logger.error('推斷機構ID時發生錯誤:', error);
      return null;
    }
  }

  /**
   * 創建交易群組（使用嵌入式模型）
   * @param purchaseOrder 進貨單文檔
   * @param organizationId 機構ID（可選，如果未提供則使用進貨單的機構ID）
   * @param debitAccount 借方科目
   * @param creditAccount 貸方科目
   * @param userId 用戶ID
   * @returns 交易群組文檔
   */
  private static async createTransactionGroupWithEntries(
    purchaseOrder: IPurchaseOrderDocument,
    organizationId: mongoose.Types.ObjectId,
    debitAccount: IAccount2,
    creditAccount: IAccount2,
    userId?: string
  ): Promise<ITransactionGroupWithEntries> {
    // 從進貨單號前八碼數字轉換日期
    const transactionDate = this.parseTransactionDateFromPoid(purchaseOrder.poid);
    
    // 創建內嵌分錄
    const entries: IEmbeddedAccountingEntry[] = [
      {
        sequence: 1,
        accountId: debitAccount._id as mongoose.Types.ObjectId,
        debitAmount: purchaseOrder.totalAmount,
        creditAmount: 0,
        description: `${debitAccount.name} (借方)`,
        fundingPath: []
      },
      {
        sequence: 2,
        accountId: creditAccount._id as mongoose.Types.ObjectId,
        debitAmount: 0,
        creditAmount: purchaseOrder.totalAmount,
        description: `${creditAccount.name} (貸方)`,
        fundingPath: []
      }
    ];
    
    const transactionGroup = new TransactionGroupWithEntries({
      description: `${purchaseOrder.poid} (${purchaseOrder.posupplier})`,
      transactionDate: transactionDate,
      organizationId: organizationId,
      invoiceNo: purchaseOrder.pobill,
      totalAmount: purchaseOrder.totalAmount,
      status: 'confirmed',
      fundingType: 'purchase',
      createdBy: userId || 'system-auto', // 優先使用傳入的用戶ID
      entries: entries
    });

    await transactionGroup.save();
    logger.debug(`創建嵌入式交易群組:`, { organizationId: organizationId.toString() });
    return transactionGroup;
  }

  /**
   * 從進貨單號前八碼數字解析交易日期
   * @param poid 進貨單號
   * @returns 解析後的日期
   */
  private static parseTransactionDateFromPoid(poid: string): Date {
    try {
      // 提取前八碼數字
      const dateString = poid.replace(/\D/g, '').substring(0, 8);
      
      if (dateString.length === 8) {
        // 假設格式為 YYYYMMDD
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1; // 月份從0開始
        const day = parseInt(dateString.substring(6, 8));
        
        const parsedDate = new Date(year, month, day);
        
        // 驗證日期是否有效
        if (!isNaN(parsedDate.getTime()) &&
            parsedDate.getFullYear() === year &&
            parsedDate.getMonth() === month &&
            parsedDate.getDate() === day) {
          logger.debug(`從進貨單號解析日期:`, {
            poid,
            date: parsedDate.toISOString().split('T')[0]
          });
          return parsedDate;
        }
      }
      
      logger.warn(`無法從進貨單號解析有效日期，使用當前日期:`, { poid });
      return new Date();
      
    } catch (error) {
      logger.error(`解析進貨單號日期時出錯，使用當前日期:`, { error });
      return new Date();
    }
  }

  /**
   * 根據科目類型自動推斷分錄類型
   * @param accounts 會計科目陣列
   * @returns 推斷的分錄類型
   */
  private static inferEntryTypeFromAccounts(accounts: IAccount2[]): 'expense-asset' | 'asset-liability' {
    const hasExpense = accounts.some(account => account.accountType === 'expense');
    const hasAsset = accounts.some(account => account.accountType === 'asset');
    const hasLiability = accounts.some(account => account.accountType === 'liability');
    
    logger.debug(`科目類型分析:`, {
      expense: hasExpense,
      asset: hasAsset,
      liability: hasLiability
    });
    
    // 嚴格根據科目組合判斷，不使用預設值
    // 如果有 asset + liability，使用 asset-liability 格式
    if (hasAsset && hasLiability && !hasExpense) {
      logger.debug(`判斷為資產-負債格式: 資產科目 + 負債科目`);
      return 'asset-liability';
    }
    
    // 如果有 expense + asset，使用 expense-asset 格式
    if (hasExpense && hasAsset) {
      logger.debug(`判斷為支出-資產格式: 支出科目 + 資產科目`);
      return 'expense-asset';
    }
    
    // 如果只有 asset + liability（即使有其他科目類型），優先使用 asset-liability
    if (hasAsset && hasLiability) {
      logger.debug(`判斷為資產-負債格式: 包含資產科目 + 負債科目`);
      return 'asset-liability';
    }
    
    // 如果只有 expense 相關科目，使用 expense-asset 格式
    if (hasExpense) {
      logger.debug(`判斷為支出-資產格式: 包含支出科目`);
      return 'expense-asset';
    }
    
    // 如果無法明確判斷，拋出錯誤而不是使用預設值
    throw new Error(`無法根據科目類型判斷分錄格式: expense=${hasExpense}, asset=${hasAsset}, liability=${hasLiability}`);
  }

  /**
   * 檢查進貨單是否已有關聯的會計分錄
   * @param purchaseOrderId 進貨單ID
   * @returns 是否已有分錄
   */
  static async hasExistingEntries(purchaseOrderId: mongoose.Types.ObjectId): Promise<boolean> {
    const transactionGroup = await TransactionGroupWithEntries.findOne({
      description: { $regex: purchaseOrderId.toString() }
    });
    
    return !!transactionGroup;
  }
}

export default AutoAccountingEntryService;