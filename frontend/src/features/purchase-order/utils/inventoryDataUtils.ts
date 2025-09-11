import { InventoryRecord, ProcessedInventoryData, ChartDataItem } from '../types';

/**
 * 處理庫存數據
 * @param inventoryData 原始庫存數據
 * @returns 處理後的數據，包含圖表數據和庫存記錄
 */
export const processInventoryData = (inventoryData: InventoryRecord[]): ProcessedInventoryData => {
  // 篩選有效的庫存記錄
  const filteredInventories = inventoryData.filter((inv: InventoryRecord) => {
    const hasSaleNumber = inv.saleNumber?.trim() !== '';
    const hasPurchaseOrderNumber = inv.purchaseOrderNumber?.trim() !== '';
    const hasShippingOrderNumber = inv.shippingOrderNumber?.trim() !== '';
    return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
  });
  
  // 按類型分組並合併相同單號的記錄
  const { mergedInventories } = mergeInventoriesByType(filteredInventories);
  
  // 排序記錄
  sortInventoriesByOrderNumber(mergedInventories);
  
  // 計算庫存和損益
  const processedInventories = calculateStockAndProfitLoss(mergedInventories);
  
  // 準備圖表數據
  const chartTransactions = prepareChartData(processedInventories);
  
  return { chartTransactions, processedInventories };
};

/**
 * 按類型合併庫存記錄
 * @param inventories 庫存記錄
 * @returns 合併後的記錄
 */
export const mergeInventoriesByType = (inventories: InventoryRecord[]): { mergedInventories: InventoryRecord[] } => {
  const saleGroups: { [key: string]: InventoryRecord } = {};
  const purchaseGroups: { [key: string]: InventoryRecord } = {};
  const shipGroups: { [key: string]: InventoryRecord } = {};
  
  // 按單號分組
  inventories.forEach((inv: InventoryRecord) => {
    // 處理銷售記錄
    if (inv.saleNumber) {
      if (!saleGroups[inv.saleNumber]) {
        saleGroups[inv.saleNumber] = {
          ...inv,
          type: 'sale',
          totalQuantity: inv.quantity,
          totalAmount: inv.totalAmount ?? 0,
          batchNumber: inv.batchNumber
        };
      } else {
        saleGroups[inv.saleNumber].totalQuantity = (saleGroups[inv.saleNumber].totalQuantity ?? 0) + inv.quantity;
        saleGroups[inv.saleNumber].totalAmount = (saleGroups[inv.saleNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
        
        // 合併批號
        if (inv.batchNumber && saleGroups[inv.saleNumber].batchNumber !== inv.batchNumber) {
          saleGroups[inv.saleNumber].batchNumber = saleGroups[inv.saleNumber].batchNumber
            ? `${saleGroups[inv.saleNumber].batchNumber}, ${inv.batchNumber}`
            : inv.batchNumber;
        }
      }
    }
    // 處理進貨記錄
    else if (inv.purchaseOrderNumber) {
      if (!purchaseGroups[inv.purchaseOrderNumber]) {
        purchaseGroups[inv.purchaseOrderNumber] = {
          ...inv,
          type: 'purchase',
          totalQuantity: inv.quantity,
          totalAmount: inv.totalAmount ?? 0,
          batchNumber: inv.batchNumber
        };
      } else {
        purchaseGroups[inv.purchaseOrderNumber].totalQuantity =
          (purchaseGroups[inv.purchaseOrderNumber].totalQuantity ?? 0) + inv.quantity;
        purchaseGroups[inv.purchaseOrderNumber].totalAmount =
          (purchaseGroups[inv.purchaseOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
        
        // 合併批號
        if (inv.batchNumber && purchaseGroups[inv.purchaseOrderNumber].batchNumber !== inv.batchNumber) {
          purchaseGroups[inv.purchaseOrderNumber].batchNumber = purchaseGroups[inv.purchaseOrderNumber].batchNumber
            ? `${purchaseGroups[inv.purchaseOrderNumber].batchNumber}, ${inv.batchNumber}`
            : inv.batchNumber;
        }
      }
    }
    // 處理出貨記錄
    else if (inv.shippingOrderNumber) {
      if (!shipGroups[inv.shippingOrderNumber]) {
        shipGroups[inv.shippingOrderNumber] = {
          ...inv,
          type: 'ship',
          totalQuantity: inv.quantity,
          totalAmount: inv.totalAmount ?? 0,
          batchNumber: inv.batchNumber
        };
      } else {
        shipGroups[inv.shippingOrderNumber].totalQuantity =
          (shipGroups[inv.shippingOrderNumber].totalQuantity ?? 0) + inv.quantity;
        shipGroups[inv.shippingOrderNumber].totalAmount =
          (shipGroups[inv.shippingOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
        
        // 合併批號
        if (inv.batchNumber && shipGroups[inv.shippingOrderNumber].batchNumber !== inv.batchNumber) {
          shipGroups[inv.shippingOrderNumber].batchNumber = shipGroups[inv.shippingOrderNumber].batchNumber
            ? `${shipGroups[inv.shippingOrderNumber].batchNumber}, ${inv.batchNumber}`
            : inv.batchNumber;
        }
      }
    }
  });
  
  // 合併所有記錄
  const mergedInventories: InventoryRecord[] = [
    ...Object.values(saleGroups),
    ...Object.values(purchaseGroups),
    ...Object.values(shipGroups)
  ];
  
  return { mergedInventories };
};

/**
 * 按訂單號排序庫存記錄
 * @param inventories 庫存記錄
 */
export const sortInventoriesByOrderNumber = (inventories: InventoryRecord[]): void => {
  inventories.sort((a, b) => {
    const aValue = a.saleNumber?.trim() ||
                  a.purchaseOrderNumber?.trim() ||
                  a.shippingOrderNumber?.trim() || '';
    const bValue = b.saleNumber?.trim() ||
                  b.purchaseOrderNumber?.trim() ||
                  b.shippingOrderNumber?.trim() || '';
    
    // 提取訂單號前8位數字進行比較
    const aMatch = aValue.match(/^\d{8}/);
    const bMatch = bValue.match(/^\d{8}/);
    
    const aNumber = aMatch ? parseInt(aMatch[0]) : 0;
    const bNumber = bMatch ? parseInt(bMatch[0]) : 0;
    
    // 降序排序（新的訂單在前）
    return bNumber - aNumber;
  });
};

/**
 * 計算庫存和損益
 * @param inventories 庫存記錄
 * @returns 處理後的庫存記錄
 */
export const calculateStockAndProfitLoss = (inventories: InventoryRecord[]): InventoryRecord[] => {
  // 計算當前庫存（從舊到新）
  let stock = 0;
  const processedInventories = [...inventories].reverse().map((inv: InventoryRecord) => {
    const quantity = inv.totalQuantity ?? 0;
    stock += quantity;
    return {
      ...inv,
      currentStock: stock
    };
  });
  
  // 反轉回來，保持從新到舊的排序
  processedInventories.reverse();
  
  return processedInventories;
};

/**
 * 準備圖表數據
 * @param inventories 處理後的庫存記錄
 * @returns 圖表數據
 */
export const prepareChartData = (inventories: InventoryRecord[]): ChartDataItem[] => {
  return inventories.map((inv: InventoryRecord) => {
    // 獲取訂單號
    let orderNumber = '';
    if (inv.type === 'sale') {
      orderNumber = inv.saleNumber ?? '-';
    } else if (inv.type === 'purchase') {
      orderNumber = inv.purchaseOrderNumber ?? '-';
    } else if (inv.type === 'ship') {
      orderNumber = inv.shippingOrderNumber ?? '-';
    }
    
    // 轉換交易類型為中文
    const typeMap: { [key: string]: string } = {
      'sale': '銷售',
      'purchase': '進貨',
      'ship': '出貨',
    };
    const typeText = typeMap[inv.type || ''] || '其他';
    
    // 計算實際交易價格
    let price = 0;
    if (inv.totalAmount && inv.totalQuantity) {
      price = inv.totalAmount / Math.abs(inv.totalQuantity);
    } else if (inv.product?.sellingPrice) {
      price = inv.product.sellingPrice as number;
    } else if (inv.product?.price) {
      price = inv.product.price as number;
    }
    
    return {
      purchaseOrderNumber: inv.type === 'purchase' ? orderNumber : '-',
      shippingOrderNumber: inv.type === 'ship' ? orderNumber : '-',
      saleNumber: inv.type === 'sale' ? orderNumber : '-',
      type: typeText,
      quantity: inv.totalQuantity || 0,
      price: price,
      cumulativeStock: inv.currentStock ?? 0,
      cumulativeProfitLoss: 0 // 這個值會在SingleProductProfitLossChart中重新計算
    };
  });
};