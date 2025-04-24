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
  //console.log('===== FIFO匹配過程開始 =====');
  //console.log(`進貨批次總數: ${stockIn.length}`);
  //console.log(`出貨記錄總數: ${stockOut.length}`);
  
  // 打印進貨批次資料
  //console.log('進貨批次資料:');
  stockIn.forEach((batch, index) => {
    //console.log(`  批次[${index}]: 訂單號=${batch.orderNumber}, 時間=${new Date(batch.timestamp).toLocaleString()}, 數量=${batch.quantity}, 單價=${batch.unit_price}`);
  });
  
  // 打印出貨記錄資料
  //console.log('出貨記錄資料:');
  stockOut.forEach((out, index) => {
    //console.log(`  出貨[${index}]: 訂單號=${out.orderNumber}, 時間=${new Date(out.timestamp).toLocaleString()}, 數量=${out.quantity}, 產品ID=${out.drug_id}`);
  });
  
  const batches = []; // 會被消耗的進貨批次
  const usageLog = []; // 每筆出貨成本分佈結果

  let inIndex = 0;
  for (const out of stockOut) {
    //console.log(`\n處理出貨記錄: 訂單號=${out.orderNumber}, 數量=${out.quantity}`);
    
    let remaining = out.quantity;
    const costParts = [];
    let hasNegativeInventory = false;

    //console.log(`  初始剩餘數量: ${remaining}`);
    
    while (remaining > 0) {
      // 若還沒進貨或進貨批次都用完，標記為負庫存並跳出循環
      if (inIndex >= stockIn.length) {
        //console.log(`  警告: 產品 ${out.drug_id} 庫存不足，將標記為負庫存，等待庫存補入再計算毛利`);
        //console.log(`  剩餘未匹配數量: ${remaining}`);
        hasNegativeInventory = true;
        break; // 不再拋出錯誤，而是標記為負庫存並繼續處理
      }

      const batch = stockIn[inIndex];
      if (!batch.remainingQty) batch.remainingQty = batch.quantity;

      //console.log(`  使用批次[${inIndex}]: 訂單號=${batch.orderNumber}, 剩餘數量=${batch.remainingQty}`);
      
      if (batch.remainingQty > 0) {
        const used = Math.min(batch.remainingQty, remaining);
        //console.log(`  從批次[${inIndex}]扣除: ${used}個, 單價=${batch.unit_price}, 小計=${used * batch.unit_price}`);
        
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
        
        //console.log(`  批次[${inIndex}]剩餘: ${batch.remainingQty}, 出貨剩餘未匹配: ${remaining}`);
      }

      if (batch.remainingQty === 0) {
        //console.log(`  批次[${inIndex}]已用完，移至下一批`);
        inIndex++; // 此批扣完，移至下一批
      }
    }

    const outUsage = {
      outTime: out.timestamp,
      drug_id: out.drug_id,
      totalQuantity: out.quantity,
      costParts, // 此筆出貨的成本分佈（哪幾批扣了多少）
      orderNumber: out.orderNumber,
      orderId: out.orderId,
      orderType: out.orderType,
      hasNegativeInventory, // 標記是否為負庫存
      remainingNegativeQuantity: hasNegativeInventory ? remaining : 0 // 記錄尚未匹配的負庫存數量
    };
    
    usageLog.push(outUsage);
    
    //console.log(`出貨記錄處理完成: 訂單號=${out.orderNumber}`);
    //console.log(`  成本分佈明細數: ${costParts.length}`);
    //console.log(`  是否有負庫存: ${hasNegativeInventory}`);
    if (hasNegativeInventory) {
      //console.log(`  負庫存數量: ${remaining}`);
    }
  }

  //console.log('===== FIFO匹配過程結束 =====');
  return usageLog;
};

/**
 * 計算銷售毛利
 * @param {Array} usageLog - FIFO匹配結果
 * @param {Array} sales - 銷售記錄，包含售價信息
 * @returns {Array} 銷售毛利計算結果
 */
const calculateProfitMargins = (usageLog, sales) => {
  //console.log('===== 計算銷售毛利開始 =====');
  //console.log(`FIFO匹配結果數: ${usageLog.length}`);
  //console.log(`銷售記錄數: ${sales.length}`);
  
  const results = usageLog.map((usage, index) => {
    //console.log(`\n處理FIFO匹配結果[${index}]: 訂單號=${usage.orderNumber}, 數量=${usage.totalQuantity}`);
    
    // 找到對應的銷售記錄
    const sale = sales.find(s => 
      s.drug_id === usage.drug_id && 
      new Date(s.timestamp).getTime() === new Date(usage.outTime).getTime()
    );
    
    if (!sale) {
      //console.log(`  未找到對應的銷售記錄，跳過`);
      return null;
    }
    
    //console.log(`  找到對應銷售記錄: 單價=${sale.unit_price}`);
    
    // 計算銷售總額
    const totalRevenue = sale.unit_price * usage.totalQuantity;
    //console.log(`  銷售總額: ${totalRevenue} (${sale.unit_price} x ${usage.totalQuantity})`);
    
    // 處理負庫存情況
    if (usage.hasNegativeInventory) {
      //console.log(`  產品 ${usage.drug_id} 存在負庫存情況，暫時將毛利計為0，等待庫存補入再計算`);
      
      // 計算已匹配部分的成本
      const matchedCost = usage.costParts.reduce((sum, part) => {
        return sum + (part.unit_price * part.quantity);
      }, 0);
      
      //console.log(`  已匹配部分成本: ${matchedCost}`);
      
      // 計算已匹配部分的數量
      const matchedQuantity = usage.totalQuantity - usage.remainingNegativeQuantity;
      //console.log(`  已匹配數量: ${matchedQuantity}, 未匹配數量: ${usage.remainingNegativeQuantity}`);
      
      // 計算已匹配部分的收入
      const matchedRevenue = matchedQuantity > 0 ? (sale.unit_price * matchedQuantity) : 0;
      //console.log(`  已匹配部分收入: ${matchedRevenue}`);
      
      // 對於負庫存部分，成本暫時設為與收入相等，使毛利為0
      const negativeInventoryRevenue = sale.unit_price * usage.remainingNegativeQuantity;
      //console.log(`  負庫存部分收入: ${negativeInventoryRevenue}`);
      
      const totalCost = matchedCost + negativeInventoryRevenue; // 負庫存部分成本等於收入，毛利為0
      //console.log(`  總成本: ${totalCost} (已匹配: ${matchedCost} + 負庫存: ${negativeInventoryRevenue})`);
      
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
      
      //console.log(`  總成本: ${totalCost}`);
      //console.log(`  成本明細:`);
      usage.costParts.forEach((part, i) => {
        //console.log(`    批次[${i}]: 訂單號=${part.orderNumber}, 數量=${part.quantity}, 單價=${part.unit_price}, 小計=${part.quantity * part.unit_price}`);
      });
      
      // 計算毛利
      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      
      //console.log(`  毛利: ${grossProfit} (${totalRevenue} - ${totalCost})`);
      //console.log(`  毛利率: ${profitMargin.toFixed(2)}%`);
      
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
  
  //console.log(`\n計算結果數: ${results.length}`);
  //console.log('===== 計算銷售毛利結束 =====');
  
  return results;
};

/**
 * 將庫存記錄轉換為FIFO計算所需的格式
 * @param {Array} inventories - 庫存記錄
 * @returns {Object} 包含stockIn和stockOut的對象
 */
const prepareInventoryForFIFO = (inventories) => {
  //console.log('===== 準備FIFO計算數據開始 =====');
  //console.log(`庫存記錄總數: ${inventories.length}`);
  
  const stockIn = [];
  const stockOut = [];
  
  inventories.forEach((inv, index) => {
    const timestamp = inv.lastUpdated || new Date();
    const quantity = Math.abs(inv.quantity);
    const unit_price = inv.totalAmount ? (inv.totalAmount / quantity) : 0;
    const drug_id = inv.product.toString();
    
    //console.log(`處理庫存記錄[${index}]: 類型=${inv.type}, 數量=${quantity}, 總金額=${inv.totalAmount || 0}`);
    
    if (inv.type === 'purchase') {
      const purchaseRecord = {
        timestamp,
        quantity,
        unit_price,
        drug_id,
        source_id: inv._id.toString(),
        orderNumber: inv.purchaseOrderNumber || '未知訂單',
        orderId: inv.purchaseOrderId ? inv.purchaseOrderId.toString() : null,
        orderType: 'purchase'
      };
      
      stockIn.push(purchaseRecord);
      //console.log(`  添加進貨記錄: 訂單號=${purchaseRecord.orderNumber}, 數量=${purchaseRecord.quantity}, 單價=${purchaseRecord.unit_price}`);
    } else if (inv.type === 'sale') {
      const saleRecord = {
        timestamp,
        quantity,
        drug_id,
        source_id: inv._id.toString(),
        type: inv.type,
        orderNumber: inv.saleNumber || '未知訂單',
        orderId: inv.saleId ? inv.saleId.toString() : null,
        orderType: 'sale'
      };
      
      stockOut.push(saleRecord);
      //console.log(`  添加銷售記錄: 訂單號=${saleRecord.orderNumber}, 數量=${saleRecord.quantity}`);
    } else if (inv.type === 'ship') {
      const shipRecord = {
        timestamp,
        quantity,
        drug_id,
        source_id: inv._id.toString(),
        type: inv.type,
        orderNumber: inv.shippingOrderNumber || '未知訂單',
        orderId: inv.shippingOrderId ? inv.shippingOrderId.toString() : null,
        orderType: 'shipping'
      };
      
      stockOut.push(shipRecord);
      //console.log(`  添加出貨記錄: 訂單號=${shipRecord.orderNumber}, 數量=${shipRecord.quantity}`);
    }
  });
  
  //console.log(`\n進貨記錄總數: ${stockIn.length}`);
  //console.log(`出貨記錄總數: ${stockOut.length}`);
  
  // 進貨記錄按訂單號排序，而非時間
  stockIn.sort((a, b) => {
    // 先按貨單號小到大排序
    if (a.orderNumber && b.orderNumber) {
      // 提取數字部分進行比較
      const aNum = a.orderNumber.replace(/\D/g, '');
      const bNum = b.orderNumber.replace(/\D/g, '');
      
      if (aNum && bNum) {
        const numComparison = parseInt(aNum) - parseInt(bNum); // 小到大排序
        if (numComparison !== 0) return numComparison;
      }
      
      // 如果數字部分相同或無法比較，則按完整貨單號字母順序排序
      const strComparison = a.orderNumber.localeCompare(b.orderNumber);
      if (strComparison !== 0) return strComparison;
    }
    
    // 如果貨單號相同或無法比較，則按時間排序
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  //console.log('\n進貨記錄排序後:');
  stockIn.forEach((record, index) => {
    //console.log(`  進貨[${index}]: 訂單號=${record.orderNumber}, 時間=${new Date(record.timestamp).toLocaleString()}`);
  });
  
  // 出貨記錄按貨單號小到大排序，再按時間排序
  stockOut.sort((a, b) => {
    // 先按貨單號小到大排序
    if (a.orderNumber && b.orderNumber) {
      // 提取數字部分進行比較
      const aNum = a.orderNumber.replace(/\D/g, '');
      const bNum = b.orderNumber.replace(/\D/g, '');
      
      if (aNum && bNum) {
        const numComparison = parseInt(aNum) - parseInt(bNum); // 小到大排序
        if (numComparison !== 0) return numComparison;
      }
      
      // 如果數字部分相同或無法比較，則按完整貨單號字母順序排序
      const strComparison = a.orderNumber.localeCompare(b.orderNumber);
      if (strComparison !== 0) return strComparison;
    }
    
    // 如果貨單號相同或無法比較，則按時間排序
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  //console.log('\n出貨記錄排序後:');
  stockOut.forEach((record, index) => {
    //console.log(`  出貨[${index}]: 訂單號=${record.orderNumber}, 時間=${new Date(record.timestamp).toLocaleString()}`);
  });
  
  //console.log('===== 準備FIFO計算數據結束 =====');
  
  // 修正：處理先銷售後進貨的情況，允許使用後續進貨來匹配先前的銷售
  return { stockIn, stockOut };
};

/**
 * 計算產品的FIFO庫存成本和銷售毛利
 * @param {Array} inventories - 產品的庫存記錄
 * @returns {Object} FIFO計算結果
 */
const calculateProductFIFO = (inventories) => {
  //console.log('===== 開始計算產品FIFO =====');
  //console.log(`庫存記錄總數: ${inventories.length}`);
  
  try {
    // 準備數據
    const { stockIn, stockOut } = prepareInventoryForFIFO(inventories);
    
    // 如果沒有出貨記錄，直接返回空結果
    if (stockOut.length === 0) {
      console.log('沒有出貨記錄，返回空結果');
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
    
    if (hasNegativeInventory) {
      //console.log('檢測到先銷售後進貨的情況，將標記為負庫存');
    }
    
    // 執行FIFO匹配
    const fifoMatches = matchFIFOBatches(stockIn, stockOut);
    //console.log(`FIFO匹配結果數: ${fifoMatches.length}`);
    
    // 計算銷售毛利
    const sales = stockOut.map(out => ({
      drug_id: out.drug_id,
      timestamp: out.timestamp,
      unit_price: inventories.find(inv => 
        inv._id.toString() === out.source_id
      )?.totalAmount / Math.abs(out.quantity) || 0
    }));
    
    //console.log(`銷售記錄數: ${sales.length}`);
    
    const profitMargins = calculateProfitMargins(fifoMatches, sales);
    //console.log(`毛利計算結果數: ${profitMargins.length}`);
    
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
    
    //console.log('\n計算總結:');
    //console.log(`  總成本: ${summary.totalCost}`);
    //console.log(`  總收入: ${summary.totalRevenue}`);
    //console.log(`  總毛利: ${summary.totalProfit}`);
    
    // 計算平均毛利率
    summary.averageProfitMargin = summary.totalRevenue > 0 
      ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    //console.log(`  平均毛利率: ${summary.averageProfitMargin}`);
    //console.log('===== 產品FIFO計算完成 =====');
    
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
