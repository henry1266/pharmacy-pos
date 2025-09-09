import Inventory from '../../../models/Inventory';
import BaseProduct from '../../../models/BaseProduct';
import logger from '../../../utils/logger';
import { SaleDocument, SaleItem } from '../sales.types';

// 處理新銷售的庫存變更
export async function handleInventoryForNewSale(sale: SaleDocument): Promise<void> {
  // 為每個銷售項目創建負數庫存記錄
  if (!sale.items || !Array.isArray(sale.items)) {
    logger.error('銷售記錄缺少有效的項目陣列');
    return;
  }
  
  const items = sale.items as any[];
  for (const item of items) {
    try {
      await createInventoryRecord(item, sale);
    } catch (err) {
      logger.error(`處理庫存記錄時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
      // 繼續處理其他項目，不中斷流程
    }
  }
}

// 創建庫存記錄
export async function createInventoryRecord(item: SaleItem, sale: SaleDocument): Promise<void> {
  // 確保產品ID有效
  if (!item.product) {
    logger.error('銷售項目缺少產品ID');
    return;
  }
  
  // 確保數量有效
  if (typeof item.quantity !== 'number') {
    logger.error(`產品 ${item.product} 的數量無效`);
    return;
  }

  // 檢查產品是否設定為「不扣庫存」
  try {
    const product = await BaseProduct.findById(item.product);
    if (!product) {
      logger.error(`找不到產品ID: ${item.product}`);
      return;
    }

    const productDoc = product as any;
    if (productDoc.excludeFromStock === true) {
      // 為「不扣庫存」產品創建特殊的庫存記錄，用於毛利計算
      await createNoStockSaleRecord(item, sale, productDoc);
      return;
    }
  } catch (err) {
    logger.error(`檢查產品 ${item.product} 的不扣庫存設定時出錯: ${(err as Error).message}`);
    // 如果檢查失敗，為了安全起見，仍然創建庫存記錄
  }

  const inventoryRecord = new Inventory({
    product: item.product,
    quantity: -item.quantity, // 負數表示庫存減少
    totalAmount: Number(item.subtotal), // 添加totalAmount字段
    saleNumber: sale.saleNumber, // 添加銷貨單號
    type: 'sale',
    saleId: sale._id,
    lastUpdated: new Date()
  });
  
  await inventoryRecord.save();
  logger.debug(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal || 0}`);
}

// 為「不扣庫存」產品創建特殊的銷售記錄
export async function createNoStockSaleRecord(item: SaleItem, sale: SaleDocument, product: any): Promise<void> {
  try {
    // 計算單價（售價）
    const unitPrice = item.subtotal ? item.subtotal / item.quantity : 0;
    
    // 獲取產品的進價（成本價）
    const costPrice = product.purchasePrice || 0;
    
    // 計算毛利：數量 × (售價 - 進價)
    const grossProfit = item.quantity * (unitPrice - costPrice);
    
    // 創建特殊的庫存記錄，用於毛利計算
    const inventoryRecord = new Inventory({
      product: item.product,
      quantity: item.quantity, // 保持實際銷售數量，不扣庫存的邏輯在 FIFO 計算時處理
      totalAmount: Number(item.subtotal), // 銷售總額
      saleNumber: sale.saleNumber,
      type: 'sale-no-stock', // 特殊類型標記
      saleId: sale._id,
      lastUpdated: new Date(),
      // 添加毛利計算相關欄位
      costPrice: costPrice,
      unitPrice: unitPrice,
      grossProfit: grossProfit
    });
    
    await inventoryRecord.save();
    logger.debug(`為不扣庫存產品 ${product.name ?? '未知'} 創建毛利記錄，數量: ${item.quantity}, 售價: ${unitPrice}, 進價: ${costPrice}, 毛利: ${grossProfit}`);
  } catch (err) {
    logger.error(`創建不扣庫存產品的毛利記錄時出錯: ${(err as Error).message}`);
  }
}

// 處理更新銷售的庫存變更
export async function handleInventoryForUpdatedSale(originalSale: SaleDocument, updatedSale: SaleDocument): Promise<void> {
  try {
    // 刪除原有的銷售庫存記錄（包括 sale 和 sale-no-stock 類型）
    await Inventory.deleteMany({
      saleId: originalSale._id,
      type: { $in: ['sale', 'sale-no-stock'] }
    });
    
    // 為更新後的銷售項目創建新的庫存記錄
    if (updatedSale.items && Array.isArray(updatedSale.items)) {
      const items = updatedSale.items as any[];
      for (const item of items) {
        try {
          await createInventoryRecord(item, updatedSale);
        } catch (err) {
          logger.error(`處理更新銷售的庫存記錄時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
        }
      }
    }
  } catch (err) {
    logger.error(`處理更新銷售的庫存變更時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
    // 不拋出錯誤，避免影響銷售記錄更新
  }
}

// 處理刪除銷售的庫存恢復
export async function handleInventoryForDeletedSale(sale: SaleDocument): Promise<void> {
  try {
    // 刪除與此銷售相關的所有庫存記錄（包括 sale 和 sale-no-stock 類型）
    const deletedInventories = await Inventory.deleteMany({
      saleId: sale._id,
      type: { $in: ['sale', 'sale-no-stock'] }
    });
    
    logger.info(`已刪除 ${deletedInventories.deletedCount} 個與銷售 ${sale.saleNumber} 相關的庫存記錄`);
    
    // 記錄庫存恢復日誌
    if (sale.items && Array.isArray(sale.items)) {
      const items = sale.items as any[];
      for (const item of items) {
        logger.debug(`恢復產品 ${item.product} 的庫存，數量: +${item.quantity}`);
      }
    }
  } catch (err) {
    logger.error(`處理刪除銷售的庫存恢復時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
    // 不拋出錯誤，避免影響銷售記錄刪除
  }
}