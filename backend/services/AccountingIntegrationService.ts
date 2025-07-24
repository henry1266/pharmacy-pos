import mongoose from 'mongoose';
import Account2, { IAccount2 } from '../models/Account2';
import { IPurchaseOrderDocument } from '../models/PurchaseOrder';

/**
 * 會計整合服務
 * 處理進貨單與會計系統的整合邏輯
 */
export class AccountingIntegrationService {
  
  /**
   * 處理進貨單完成時的會計科目創建
   * @param purchaseOrder 進貨單文檔
   */
  static async handlePurchaseOrderCompletion(purchaseOrder: IPurchaseOrderDocument): Promise<void> {
    try {
      // 檢查是否有填寫交易類型和機構
      if (!purchaseOrder.transactionType || !purchaseOrder.organizationId) {
        console.log('進貨單缺少交易類型或機構資訊，跳過會計科目創建');
        return;
      }

      console.log(`處理進貨單 ${purchaseOrder.poid} 的會計科目創建，交易類型: ${purchaseOrder.transactionType}`);

      // 根據交易類型處理
      switch (purchaseOrder.transactionType) {
        case '進貨':
          await this.handlePurchaseTransaction(purchaseOrder);
          break;
        case '支出':
          await this.handleExpenseTransaction(purchaseOrder);
          break;
        default:
          console.log(`未知的交易類型: ${purchaseOrder.transactionType}`);
      }
    } catch (error) {
      console.error('處理進貨單會計科目創建時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 處理進貨交易
   * @param purchaseOrder 進貨單文檔
   */
  private static async handlePurchaseTransaction(purchaseOrder: IPurchaseOrderDocument): Promise<void> {
    // 尋找或創建「進貨」父科目
    const purchaseParentAccount = await this.findOrCreateAccount({
      organizationId: purchaseOrder.organizationId!,
      code: '5101',
      name: '進貨',
      accountType: 'expense',
      type: 'other',
      level: 1,
      createdBy: 'system'
    });

    // 尋找或創建供應商子科目
    const supplierName = purchaseOrder.posupplier || '未知供應商';
    const supplierCode = this.generateSupplierCode(supplierName);
    
    await this.findOrCreateAccount({
      organizationId: purchaseOrder.organizationId!,
      code: supplierCode,
      name: `進貨-${supplierName}`,
      accountType: 'expense',
      type: 'other',
      level: 2,
      parentId: purchaseParentAccount._id as mongoose.Types.ObjectId,
      createdBy: 'system'
    });

    console.log(`已為進貨單 ${purchaseOrder.poid} 創建或確認進貨科目: ${supplierCode}`);
  }

  /**
   * 處理支出交易
   * @param purchaseOrder 進貨單文檔
   */
  private static async handleExpenseTransaction(purchaseOrder: IPurchaseOrderDocument): Promise<void> {
    // 尋找或創建「支出」父科目
    const expenseParentAccount = await this.findOrCreateAccount({
      organizationId: purchaseOrder.organizationId!,
      code: '6101',
      name: '支出',
      accountType: 'expense',
      type: 'other',
      level: 1,
      createdBy: 'system'
    });

    // 尋找或創建廠商子科目
    const supplierName = purchaseOrder.posupplier || '未知廠商';
    const supplierCode = this.generateExpenseSupplierCode(supplierName);
    
    await this.findOrCreateAccount({
      organizationId: purchaseOrder.organizationId!,
      code: supplierCode,
      name: `支出-${supplierName}`,
      accountType: 'expense',
      type: 'other',
      level: 2,
      parentId: expenseParentAccount._id as mongoose.Types.ObjectId,
      createdBy: 'system'
    });

    console.log(`已為進貨單 ${purchaseOrder.poid} 創建或確認支出科目: ${supplierCode}`);
  }

  /**
   * 尋找或創建會計科目
   * @param accountData 科目資料
   * @returns 會計科目文檔
   */
  private static async findOrCreateAccount(accountData: {
    organizationId: mongoose.Types.ObjectId;
    code: string;
    name: string;
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
    level: number;
    parentId?: mongoose.Types.ObjectId;
    createdBy: string;
  }): Promise<IAccount2> {
    
    // 先嘗試尋找現有科目
    let account = await Account2.findOne({
      organizationId: accountData.organizationId,
      code: accountData.code
    });

    if (account) {
      console.log(`找到現有會計科目: ${accountData.code} - ${accountData.name}`);
      return account;
    }

    // 如果不存在，則創建新科目
    account = new Account2({
      ...accountData,
      balance: 0,
      initialBalance: 0,
      currency: 'TWD',
      isActive: true,
      description: `系統自動創建 - 來自進貨單整合`
    });

    await account.save();
    console.log(`創建新會計科目: ${accountData.code} - ${accountData.name}`);
    
    return account;
  }

  /**
   * 生成供應商代碼（進貨用）
   * @param supplierName 供應商名稱
   * @returns 供應商代碼
   */
  private static generateSupplierCode(supplierName: string): string {
    // 取供應商名稱的前兩個字符，轉換為數字編碼
    const nameHash = this.hashString(supplierName);
    return `510101${nameHash.toString().padStart(2, '0')}`;
  }

  /**
   * 生成廠商代碼（支出用）
   * @param supplierName 廠商名稱
   * @returns 廠商代碼
   */
  private static generateExpenseSupplierCode(supplierName: string): string {
    // 取廠商名稱的前兩個字符，轉換為數字編碼
    const nameHash = this.hashString(supplierName);
    return `610101${nameHash.toString().padStart(2, '0')}`;
  }

  /**
   * 簡單的字符串哈希函數
   * @param str 輸入字符串
   * @returns 哈希值（0-99）
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為32位整數
    }
    return Math.abs(hash) % 100;
  }
}

export default AccountingIntegrationService;