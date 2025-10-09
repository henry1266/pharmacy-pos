import mongoose from 'mongoose';
import Inventory from '../../../models/Inventory';
import BaseProduct from '../../../models/BaseProduct';
import { IPurchaseOrderDocument } from '../purchaseOrders.types';
import AccountingIntegrationService from '../../accounting-old/services/AccountingIntegrationService';
import logger from '../../../utils/logger';

/**
 * 更新庫存的輔助函數
 * @param purchaseOrder 進貨單文檔
 * @param userId 用戶ID（可選）
 */
export async function updateInventory(purchaseOrder: IPurchaseOrderDocument, userId?: string): Promise<void> {
  for (const item of purchaseOrder.items) {
    if (!item.product) continue;
    
    try {
      // 為每個進貨單項目創建新的庫存記錄，而不是更新現有記錄
      // 這樣可以保留每個批次的信息
      const inventory = new Inventory({
        product: item.product.toString(),
        quantity: parseInt(item.dquantity.toString()),
        totalAmount: Number(item.dtotalCost), // 添加totalAmount字段
        purchaseOrderId: purchaseOrder._id.toString(), // 保存進貨單ID
        purchaseOrderNumber: purchaseOrder.orderNumber.toString(), // 保存進貨單號
        batchNumber: item.batchNumber || undefined // 加入批號欄位
      });
      
      await inventory.save();
      logger.debug(`已為產品 ${item.product} 創建新庫存記錄，進貨單號: ${purchaseOrder.orderNumber}, 數量: ${item.dquantity}, 總金額: ${item.dtotalCost}`);
      
      // 更新藥品的採購價格
      await BaseProduct.findOne({ _id: item.product.toString() })
        .then((product) => {
          if (product) {
            product.purchasePrice = item.unitPrice ?? (item.dquantity > 0 ? item.dtotalCost / item.dquantity : 0);
            return product.save();
          }
          return null;
        });
    } catch (err) {
      logger.error(`更新庫存時出錯: ${(err as Error).message}`);
      // 繼續處理其他項目
    }
  }

  // 庫存更新完成後，處理會計整合（包含自動會計分錄）
  try {
    const transactionGroupId = await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder, userId);
    
    // 如果創建了自動會計分錄，更新進貨單的關聯交易群組ID
    if (transactionGroupId) {
      purchaseOrder.relatedTransactionGroupId = transactionGroupId;
      await purchaseOrder.save();
      logger.info(`進貨單 ${purchaseOrder.poid} 已關聯交易群組 ${transactionGroupId}`);
    }
  } catch (err) {
    logger.error(`處理會計整合時出錯: ${(err as Error).message}`);
    // 不拋出錯誤，避免影響庫存更新流程
  }
}

/**
 * 刪除與進貨單相關的庫存記錄
 * @param purchaseOrderId 進貨單ID
 * @returns 刪除結果
 */
export async function deleteInventoryRecords(purchaseOrderId: string): Promise<mongoose.mongo.DeleteResult> {
  try {
    const result = await Inventory.deleteMany({ purchaseOrderId: purchaseOrderId.toString() });
    logger.info(`已刪除 ${result.deletedCount} 筆與進貨單 ${purchaseOrderId} 相關的庫存記錄`);
    return result;
  } catch (err) {
    logger.error(`刪除庫存記錄時出錯: ${(err as Error).message}`);
    throw err;
  }
}