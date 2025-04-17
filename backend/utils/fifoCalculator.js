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

    while (remaining > 0) {
      // 若還沒進貨或進貨批次都用完，往後拉更多進貨
      if (inIndex >= stockIn.length) {
        throw new Error("Insufficient stock to match FIFO cost");
      }

      const batch = stockIn[inIndex];
      if (!batch.remainingQty) batch.remainingQty = batch.quantity;

      if (batch.remainingQty > 0) {
        const used = Math.min(batch.remainingQty, remaining);
        costParts.push({
          batchTime: batch.timestamp,
          unit_price: batch.unit_price,
          quantity: used,
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
    
    // 計算總成本
    const totalCost = usage.costParts.reduce((sum, part) => {
      return sum + (part.unit_price * part.quantity);
    }, 0);
    
    // 計算銷售總額
    const totalRevenue = sale.unit_price * usage.totalQuantity;
    
    // 計算毛利
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = (grossProfit / totalRevenue) * 100;
    
    return {
      drug_id: usage.drug_id,
      saleTime: usage.outTime,
      totalQuantity: usage.totalQuantity,
      totalCost,
      totalRevenue,
      grossProfit,
      profitMargin: profitMargin.toFixed(2) + '%',
      costBreakdown: usage.costParts
    };
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
        source_id: inv._id.toString()
      });
    } else if (inv.type === 'sale' || inv.type === 'ship') {
      stockOut.push({
        timestamp,
        quantity,
        drug_id,
        source_id: inv._id.toString(),
        type: inv.type
      });
    }
  });
  
  // 按時間排序，確保先進先出
  stockIn.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  stockOut.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
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
      summary
    };
  } catch (error) {
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
