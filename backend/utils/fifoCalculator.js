/**
 * FIFO庫存計算工具
 * 根據先進先出原則計算庫存成本和銷售毛利
 */

/**
 * 根據FIFO原則匹配進貨批次和出貨記錄
 * @param {Array} stockIn - 進貨記錄數組，每個記錄包含timestamp、quantity和unit_price
 * @param {Array} stockOut - 出貨記錄數組，每個記錄包含timestamp、quantity和drug_id
 * @returns {Array} 出貨成本分佈結果
 */
const matchFIFOBatches = (stockIn, stockOut) => {
  const batches = []; // 會被消耗的進貨批次
  const usageLog = []; // 每筆出貨成本分佈結果

  let inIndex = 0;
  for (const out of stockOut) {
    let remaining = out.quantity;
    const costParts = [];
    let hasNegativeInventory = false;

    while (remaining > 0) {
      // 若還沒進貨或進貨批次都用完，標記為負庫存並跳出循環
      if (inIndex >= stockIn.length) {
        console.log(`警告: 產品 ${out.drug_id} 庫存不足，將標記為負庫存，等待庫存補入再計算毛利`);
        hasNegativeInventory = true;
        break; // 不再拋出錯誤，而是標記為負庫存並繼續處理
      }

      const batch = stockIn[inIndex];
      if (!batch.remainingQty) batch.remainingQty = batch.quantity;

      if (batch.remainingQty > 0) {
        const used = Math.min(batch.remainingQty, remaining);
        costParts.push({
          batchTime: batch.timestamp,
          unit_price: batch.unit_price,
          quantity: used,
          orderNumber: batch.orderNumber,
          orderId: batch.orderId,
          orderType: batch.orderType
        });
        batch.remainingQty -= used;
        remaining -= used;
      }

      if (batch.remainingQty === 0) inIndex++; // 此批扣完，移至下一批
    }

    usageLog.push({
      outTime: out.timestamp,
      drug_id: out.drug_id,
      totalQuantity: out.quantity,
      costParts, // 此筆出貨的成本分佈（哪幾批扣了多少）
      orderNumber: out.orderNumber,
      orderId: out.orderId,
      orderType: out.orderType,
      hasNegativeInventory, // 標記是否為負庫存
      remainingNegativeQuantity: hasNegativeInventory ? remaining : 0 // 記錄尚未匹配的負庫存數量
    });
  }

  return usageLog;
};

/**
 * 計算銷售毛利
 * @param {Array} usageLog - FIFO匹配結果
 * @param {Array} sales - 銷售記錄，包含售價信息
 * @returns {Array} 銷售毛利計算結果
 */
const calculateProfitMargins = (usageLog, sales) => {
  return usageLog.map(usage => {
    // 找到對應的銷售記錄
    const sale = sales.find(s => 
      s.drug_id === usage.drug_id && 
      new Date(s.timestamp).getTime() === new Date(usage.outTime).getTime()
    );
    
    if (!sale) return null;
    
    // 計算銷售總額
    const totalRevenue = sale.unit_price * usage.totalQuantity;
    
    // 處理負庫存情況
    if (usage.hasNegativeInventory) {
      console.log(`產品 ${usage.drug_id} 存在負庫存情況，暫時將毛利計為0，等待庫存補入再計算`);
      
      // 計算已匹配部分的成本
      const matchedCost = usage.costParts.reduce((sum, part) => {
        return sum + (part.unit_price * part.quantity);
      }, 0);
      
      // 計算已匹配部分的數量
      const matchedQuantity = usage.totalQuantity - usage.remainingNegativeQuantity;
      
      // 計算已匹配部分的收入
      const matchedRevenue = matchedQuantity > 0 ? (sale.unit_price * matchedQuantity) : 0;
      
      // 對於負庫存部分，成本暫時設為與收入相等，使毛利為0
      const negativeInventoryRevenue = sale.unit_price * usage.remainingNegativeQuantity;
      const totalCost = matchedCost + negativeInventoryRevenue; // 負庫存部分成本等於收入，毛利為0
      
      return {
        drug_id: usage.drug_id,
        saleTime: usage.outTime,
        totalQuantity: usage.totalQuantity,
        totalCost,
        totalRevenue,
        grossProfit: 0, // 負庫存情況下，暫時將毛利計為0
        profitMargin: '0.00%', // 負庫存情況下，暫時將毛利率計為0%
        costBreakdown: usage.costParts,
        orderNumber: usage.orderNumber,
        orderId: usage.orderId,
        orderType: usage.orderType,
        hasNegativeInventory: true,
        remainingNegativeQuantity: usage.remainingNegativeQuantity,
        pendingProfitCalculation: true // 標記為待計算毛利
      };
    } else {
      // 正常庫存情況，計算總成本
      const totalCost = usage.costParts.reduce((sum, part) => {
        return sum + (part.unit_price * part.quantity);
      }, 0);
      
      // 計算毛利
      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      
      return {
        drug_id: usage.drug_id,
        saleTime: usage.outTime,
        totalQuantity: usage.totalQuantity,
        totalCost,
        totalRevenue,
        grossProfit,
        profitMargin: profitMargin.toFixed(2) + '%',
        costBreakdown: usage.costParts,
        orderNumber: usage.orderNumber,
        orderId: usage.orderId,
        orderType: usage.orderType,
        hasNegativeInventory: false
      };
    }
  }).filter(result => result !== null);
};

/**
 * 將庫存記錄轉換為FIFO計算所需的格式
 * @param {Array} inventories - 庫存記錄
 * @returns {Object} 包含stockIn和stockOut的對象
 */
const prepareInventoryForFIFO = (inventories) => {
  const stockIn = [];
  const stockOut = [];
  
  inventories.forEach(inv => {
    const timestamp = inv.lastUpdated || new Date();
    const quantity = Math.abs(inv.quantity);
    const unit_price = inv.totalAmount ? (inv.totalAmount / quantity) : 0;
    const drug_id = inv.product.toString();
    
    if (inv.type === 'purchase') {
      stockIn.push({
        timestamp,
        quantity,
        unit_price,
        drug_id,
        source_id: inv._id.toString(),
        orderNumber: inv.purchaseOrderNumber || '未知訂單',
        orderId: inv.purchaseOrderId ? inv.purchaseOrderId.toString() : null,
        orderType: 'purchase'
      });
    } else if (inv.type === 'sale') {
      stockOut.push({
        timestamp,
        quantity,
        drug_id,
        source_id: inv._id.toString(),
        type: inv.type,
        orderNumber: inv.saleNumber || '未知訂單',
        orderId: inv.saleId ? inv.saleId.toString() : null,
        orderType: 'sale'
      });
    } else if (inv.type === 'ship') {
      stockOut.push({
        timestamp,
        quantity,
        drug_id,
        source_id: inv._id.toString(),
        type: inv.type,
        orderNumber: inv.shippingOrderNumber || '未知訂單',
        orderId: inv.shippingOrderId ? inv.shippingOrderId.toString() : null,
        orderType: 'shipping'
      });
    }
  });
  
  // 按時間排序，確保先進先出
  stockIn.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  stockOut.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // 修正：處理先銷售後進貨的情況，允許使用後續進貨來匹配先前的銷售
  return { stockIn, stockOut };
};

/**
 * 計算產品的FIFO庫存成本和銷售毛利
 * @param {Array} inventories - 產品的庫存記錄
 * @returns {Object} FIFO計算結果
 */
const calculateProductFIFO = (inventories) => {
  try {
    // 準備數據
    const { stockIn, stockOut } = prepareInventoryForFIFO(inventories);
    
    // 如果沒有出貨記錄，直接返回空結果
    if (stockOut.length === 0) {
      return {
        success: true,
        fifoMatches: [],
        profitMargins: [],
        summary: {
          totalCost: 0,
          totalRevenue: 0,
          totalProfit: 0,
          averageProfitMargin: '0.00%'
        }
      };
    }
    
    // 修正：處理先銷售後進貨的情況
    // 如果有先銷售後進貨的情況，我們需要特殊處理
    // 檢查是否存在先銷售後進貨的情況
    const hasNegativeInventory = stockOut.some(out => {
      const outTime = new Date(out.timestamp);
      // 檢查是否有任何進貨在此銷售之前
      const hasPriorPurchase = stockIn.some(inp => new Date(inp.timestamp) < outTime);
      // 如果沒有先前的進貨，但有後續的進貨，則標記為負庫存
      return !hasPriorPurchase && stockIn.some(inp => new Date(inp.timestamp) >= outTime);
    });
    
    // 執行FIFO匹配
    const fifoMatches = matchFIFOBatches(stockIn, stockOut);
    
    // 計算銷售毛利
    const sales = stockOut.map(out => ({
      drug_id: out.drug_id,
      timestamp: out.timestamp,
      unit_price: inventories.find(inv => 
        inv._id.toString() === out.source_id
      )?.totalAmount / Math.abs(out.quantity) || 0
    }));
    
    const profitMargins = calculateProfitMargins(fifoMatches, sales);
    
    // 計算總結
    const summary = profitMargins.reduce((sum, item) => {
      sum.totalCost += item.totalCost;
      sum.totalRevenue += item.totalRevenue;
      sum.totalProfit += item.grossProfit;
      return sum;
    }, {
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0
    });
    
    // 計算平均毛利率
    summary.averageProfitMargin = summary.totalRevenue > 0 
      ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    return {
      success: true,
      fifoMatches,
      profitMargins,
      summary,
      hasNegativeInventory // 添加負庫存標記
    };
  } catch (error) {
    console.error('FIFO計算錯誤:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  matchFIFOBatches,
  calculateProfitMargins,
  prepareInventoryForFIFO,
  calculateProductFIFO
};
