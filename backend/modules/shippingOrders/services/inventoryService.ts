import { Types } from 'mongoose';
import BaseProduct from '../../../models/BaseProduct';
import Inventory from '../../../models/Inventory';
import logger from '../../../utils/logger';
import { ShippingOrderDocument, ShippingOrderItem } from '../types';

/**
 * 處理狀態變更的輔助函數
 * @param newStatus - 新狀態
 * @param oldStatus - 舊狀態
 * @param orderId - 訂單ID
 * @returns 處理結果
 */
export async function handleStatusChange(
  newStatus?: string, 
  oldStatus?: string, 
  orderId?: Types.ObjectId
): Promise<{ changed: boolean; needCreateInventory?: boolean }> {
  if (!newStatus || newStatus === oldStatus) {
    return { changed: false };
  }
  
  // 如果狀態從已完成改為其他狀態，刪除相關的ship類型庫存記錄
  if (oldStatus === 'completed' && newStatus !== 'completed') {
    await deleteShippingInventoryRecords(orderId);
  }
  
  return {
    changed: true,
    needCreateInventory: oldStatus !== 'completed' && newStatus === 'completed'
  };
}

/**
 * 為出貨單創建新的ship類型庫存記錄的輔助函數
 * @param shippingOrder - 出貨單
 */
export async function createShippingInventoryRecords(shippingOrder: ShippingOrderDocument): Promise<void> {
  try {
    for (const item of shippingOrder.items) {
      if (!item.product) continue;
      
      // 檢查產品是否設定為「不扣庫存」
      try {
        const product = await BaseProduct.findById(item.product);
        if (!product) {
          logger.error(`找不到產品ID: ${item.product}`);
          continue;
        }

        const productDoc = product as any;
        if (productDoc.excludeFromStock === true) {
          logger.debug(`產品 ${item.dname} (${item.did}) 設定為不扣庫存，創建特殊庫存記錄`);
          await createNoStockShippingRecord(item, shippingOrder, productDoc);
          continue;
        }
      } catch (err) {
        logger.error(`檢查產品 ${item.product} 的不扣庫存設定時出錯: ${(err as Error).message}`);
        // 如果檢查失敗，為了安全起見，仍然創建庫存記錄
      }
      
      // 為每個出貨單項目創建新的庫存記錄
      const inventoryData: any = {
        product: item.product,
        quantity: -parseInt(item.dquantity.toString()), // 負數表示庫存減少
        totalAmount: Number(item.dtotalCost),
        shippingOrderId: shippingOrder._id, // 使用出貨單ID
        shippingOrderNumber: shippingOrder.orderNumber, // 使用出貨單號
        type: 'ship' // 設置類型為'ship'
      };
      
      // 添加大包裝相關屬性 - 使用條件運算符處理空字符串，將其轉換為 undefined
      inventoryData.packageQuantity = item.packageQuantity ? Number(item.packageQuantity) : undefined;
      inventoryData.boxQuantity = item.boxQuantity ? Number(item.boxQuantity) : undefined;
      inventoryData.unit = item.unit ? item.unit : undefined;
      
      if (item.batchNumber) {
        inventoryData.batchNumber = item.batchNumber;
      }
      
      const inventory = new Inventory(inventoryData);
      
      await inventory.save();
      logger.debug(`已為產品 ${item.product} 創建新庫存記錄，出貨單號: ${shippingOrder.orderNumber}, 數量: -${item.dquantity}, 總金額: ${item.dtotalCost}, 類型: ship`);
    }
    
    logger.info(`已成功為出貨單 ${shippingOrder._id} 創建所有ship類型庫存記錄`);
  } catch (err) {
    logger.error(`創建ship類型庫存記錄時出錯: ${(err as Error).message}`);
    throw err; // 重新拋出錯誤，讓調用者知道出了問題
  }
}

/**
 * 為「不扣庫存」產品創建特殊的出貨記錄
 * @param item - 出貨單項目
 * @param shippingOrder - 出貨單
 * @param product - 產品
 */
export async function createNoStockShippingRecord(
  item: ShippingOrderItem, 
  shippingOrder: ShippingOrderDocument, 
  product: any
): Promise<void> {
  try {
    // 計算單價（售價）
    const unitPrice = item.dtotalCost ? item.dtotalCost / item.dquantity : 0;
    
    // 獲取產品的進價（成本價）
    const costPrice = product.purchasePrice || 0;
    
    // 計算毛利：數量 × (售價 - 進價)
    const grossProfit = item.dquantity * (unitPrice - costPrice);
    
    // 創建特殊的庫存記錄，用於毛利計算
    const inventoryRecord = new Inventory({
      product: item.product,
      quantity: item.dquantity, // 保持實際出貨數量，不扣庫存的邏輯在 FIFO 計算時處理
      totalAmount: Number(item.dtotalCost), // 出貨總額
      shippingOrderNumber: shippingOrder.orderNumber,
      type: 'ship-no-stock', // 特殊類型標記
      shippingOrderId: shippingOrder._id,
      lastUpdated: new Date(),
      // 添加毛利計算相關欄位
      costPrice: costPrice,
      unitPrice: unitPrice,
      grossProfit: grossProfit
    });
    
    await inventoryRecord.save();
    logger.debug(`為不扣庫存產品 ${product.name ?? '未知'} 創建毛利記錄，數量: ${item.dquantity}, 售價: ${unitPrice}, 進價: ${costPrice}, 毛利: ${grossProfit}`);
  } catch (err) {
    logger.error(`創建不扣庫存產品的毛利記錄時出錯: ${(err as Error).message}`);
  }
}

/**
 * 刪除與出貨單相關的ship類型庫存記錄
 * @param shippingOrderId - 出貨單ID
 * @returns 刪除結果
 */
export async function deleteShippingInventoryRecords(shippingOrderId?: Types.ObjectId): Promise<any> {
  try {
    const result = await Inventory.deleteMany({
      shippingOrderId: shippingOrderId,
      type: { $in: ['ship', 'ship-no-stock'] }
    });
    logger.info(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的庫存記錄（包括 ship 和 ship-no-stock 類型）`);
    return result;
  } catch (err) {
    logger.error(`刪除ship類型庫存記錄時出錯: ${(err as Error).message}`);
    throw err;
  }
}