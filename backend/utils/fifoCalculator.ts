import { Types } from 'mongoose';

/**
 * FIFO庫存計算工具
 * 根據先進先出原則計算庫存成本和銷售毛利
 */

// FIFO 計算相關型別定義
export interface StockInRecord {
  timestamp: Date;
  quantity: number;
  unit_price: number;
  drug_id: string;
  source_id: string;
  orderNumber: string;
  orderId: string | null;
  orderType: 'purchase';
  remainingQty?: number;
}

export interface StockOutRecord {
  timestamp: Date;
  quantity: number;
  drug_id: string;
  source_id: string;
  type: 'sale' | 'ship';
  orderNumber: string;
  orderId: string | null;
  orderType: 'sale' | 'shipping';
}

export interface CostPart {
  batchTime: Date;
  unit_price: number;
  quantity: number;
  orderNumber: string;
  orderId: string | null;
  orderType: 'purchase';
}

export interface OutgoingUsage {
  outTime: Date;
  drug_id: string;
  totalQuantity: number;
  costParts: CostPart[];
  orderNumber: string;
  orderId: string | null;
  orderType: 'sale' | 'shipping';
  hasNegativeInventory: boolean;
  remainingNegativeQuantity: number;
}

export interface SaleRecord {
  drug_id: string;
  timestamp: Date;
  unit_price: number;
}

export interface ProfitMarginResult {
  drug_id: string;
  saleTime: Date;
  totalQuantity: number;
  totalCost: number;
  totalRevenue: number;
  grossProfit: number;
  profitMargin: string;
  costBreakdown: CostPart[];
  orderNumber: string;
  orderId: string | null;
  orderType: 'sale' | 'shipping';
  hasNegativeInventory: boolean;
  remainingNegativeQuantity?: number;
  pendingProfitCalculation?: boolean;
}

export interface InventoryRecord {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  totalAmount?: number;
  type: 'purchase' | 'sale' | 'ship' | 'return' | 'adjustment';
  lastUpdated?: Date;
  purchaseOrderNumber?: string;
  purchaseOrderId?: Types.ObjectId;
  saleNumber?: string;
  saleId?: Types.ObjectId;
  shippingOrderNumber?: string;
  shippingOrderId?: Types.ObjectId;
}

export interface FIFOSummary {
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: string;
}

export interface FIFOCalculationResult {
  success: boolean;
  fifoMatches?: OutgoingUsage[];
  profitMargins?: ProfitMarginResult[];
  summary?: FIFOSummary;
  hasNegativeInventory?: boolean;
  error?: string;
}

export interface MatchResult {
  costParts: CostPart[];
  hasNegativeInventory: boolean;
  remaining: number;
  newInIndex: number;
}

export interface ProcessResult {
  result: OutgoingUsage;
  newInIndex: number;
}

export interface PreparedInventoryData {
  stockIn: StockInRecord[];
  stockOut: StockOutRecord[];
}

/**
 * 根據FIFO原則匹配進貨批次和出貨記錄
 * @param stockIn - 進貨記錄數組，每個記錄包含timestamp、quantity和unit_price
 * @param stockOut - 出貨記錄數組，每個記錄包含timestamp、quantity和drug_id
 * @returns 出貨成本分佈結果
 */
export const matchFIFOBatches = (stockIn: StockInRecord[], stockOut: StockOutRecord[]): OutgoingUsage[] => {
  // 移除未使用的 batches 變數
  const usageLog: OutgoingUsage[] = []; // 每筆出貨成本分佈結果

  // 重構：將複雜的匹配邏輯拆分為更小的函數
  return processBatchMatching(stockIn, stockOut, usageLog);
};

/**
 * 處理批次匹配的核心邏輯
 * @param stockIn - 進貨記錄
 * @param stockOut - 出貨記錄
 * @param usageLog - 使用記錄
 * @returns 更新後的使用記錄
 */
function processBatchMatching(stockIn: StockInRecord[], stockOut: StockOutRecord[], usageLog: OutgoingUsage[]): OutgoingUsage[] {
  let inIndex = 0;
  
  for (const out of stockOut) {
    const outUsage = processOutgoingItem(out, stockIn, inIndex);
    inIndex = outUsage.newInIndex;
    usageLog.push(outUsage.result);
  }

  return usageLog;
}

/**
 * 處理單個出貨項目
 * @param out - 出貨記錄
 * @param stockIn - 進貨記錄
 * @param inIndex - 當前進貨索引
 * @returns 處理結果和更新的索引
 */
function processOutgoingItem(out: StockOutRecord, stockIn: StockInRecord[], inIndex: number): ProcessResult {
  let remaining = out.quantity;
  
  // 處理匹配邏輯
  const matchResult = matchOutgoingWithIncoming(remaining, stockIn, inIndex);
  
  // 構建出貨使用記錄
  const outUsage: OutgoingUsage = {
    outTime: out.timestamp,
    drug_id: out.drug_id,
    totalQuantity: out.quantity,
    costParts: matchResult.costParts,
    orderNumber: out.orderNumber,
    orderId: out.orderId,
    orderType: out.orderType,
    hasNegativeInventory: matchResult.hasNegativeInventory,
    remainingNegativeQuantity: matchResult.hasNegativeInventory ? matchResult.remaining : 0
  };
  
  return {
    result: outUsage,
    newInIndex: matchResult.newInIndex
  };
}

/**
 * 匹配出貨與進貨記錄
 * @param remaining - 剩餘數量
 * @param stockIn - 進貨記錄
 * @param inIndex - 當前進貨索引
 * @returns 匹配結果
 */
function matchOutgoingWithIncoming(remaining: number, stockIn: StockInRecord[], inIndex: number): MatchResult {
  const costParts: CostPart[] = [];
  let hasNegativeInventory = false;
  let currentInIndex = inIndex;
  
  while (remaining > 0) {
    // 若還沒進貨或進貨批次都用完，標記為負庫存並跳出循環
    if (currentInIndex >= stockIn.length) {
      hasNegativeInventory = true;
      break; // 不再拋出錯誤，而是標記為負庫存並繼續處理
    }

    const batch = stockIn[currentInIndex];
    if (!batch) {
      hasNegativeInventory = true;
      break;
    }
    
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

    if (batch.remainingQty === 0) {
      currentInIndex++; // 此批扣完，移至下一批
    }
  }
  
  return {
    costParts,
    hasNegativeInventory,
    remaining,
    newInIndex: currentInIndex
  };
}

/**
 * 計算銷售毛利
 * @param usageLog - FIFO匹配結果
 * @param sales - 銷售記錄，包含售價信息
 * @returns 銷售毛利計算結果
 */
export const calculateProfitMargins = (usageLog: OutgoingUsage[], sales: SaleRecord[]): ProfitMarginResult[] => {
  const results = usageLog.map((usage, index) => {
    // 找到對應的銷售記錄
    const sale = sales.find(s => 
      s.drug_id === usage.drug_id && 
      new Date(s.timestamp).getTime() === new Date(usage.outTime).getTime()
    );
    
    if (!sale) {
      return null;
    }
    
    // 計算銷售總額
    const totalRevenue = sale.unit_price * usage.totalQuantity;
    
    // 處理負庫存情況
    if (usage.hasNegativeInventory) {
      return calculateNegativeInventoryProfit(usage, sale, totalRevenue);
    } else {
      return calculateNormalProfit(usage, totalRevenue);
    }
  }).filter((result): result is ProfitMarginResult => result !== null);
  
  return results;
};

/**
 * 計算負庫存情況下的毛利
 * @param usage - 使用記錄
 * @param sale - 銷售記錄
 * @param totalRevenue - 總收入
 * @returns 毛利計算結果
 */
function calculateNegativeInventoryProfit(usage: OutgoingUsage, sale: SaleRecord, totalRevenue: number): ProfitMarginResult {
  // 計算已匹配部分的成本
  const matchedCost = usage.costParts.reduce((sum, part) => {
    return sum + (part.unit_price * part.quantity);
  }, 0);
  
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
}

/**
 * 計算正常庫存情況下的毛利
 * @param usage - 使用記錄
 * @param totalRevenue - 總收入
 * @returns 毛利計算結果
 */
function calculateNormalProfit(usage: OutgoingUsage, totalRevenue: number): ProfitMarginResult {
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

/**
 * 將庫存記錄轉換為FIFO計算所需的格式
 * @param inventories - 庫存記錄
 * @returns 包含stockIn和stockOut的對象
 */
export const prepareInventoryForFIFO = (inventories: InventoryRecord[]): PreparedInventoryData => {
  const stockIn: StockInRecord[] = [];
  const stockOut: StockOutRecord[] = [];
  
  inventories.forEach((inv, index) => {
    const timestamp = inv.lastUpdated || new Date();
    const quantity = Math.abs(inv.quantity);
    const unit_price = inv.totalAmount ? (inv.totalAmount / quantity) : 0;
    const drug_id = inv.product.toString();
    
    if (inv.type === 'purchase') {
      const purchaseRecord: StockInRecord = {
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
    } else if (inv.type === 'sale') {
      const saleRecord: StockOutRecord = {
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
    } else if (inv.type === 'ship') {
      const shipRecord: StockOutRecord = {
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
    }
  });
  
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
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
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
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  
  // 修正：處理先銷售後進貨的情況，允許使用後續進貨來匹配先前的銷售
  return { stockIn, stockOut };
};

/**
 * 計算產品的FIFO庫存成本和銷售毛利
 * @param inventories - 產品的庫存記錄
 * @returns FIFO計算結果
 */
export const calculateProductFIFO = (inventories: InventoryRecord[]): FIFOCalculationResult => {
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
    
    // 執行FIFO匹配
    const fifoMatches = matchFIFOBatches(stockIn, stockOut);
    
    // 計算銷售毛利
    const sales: SaleRecord[] = stockOut.map(out => ({
      drug_id: out.drug_id,
      timestamp: out.timestamp,
      unit_price: inventories.find(inv => 
        inv._id.toString() === out.source_id
      )?.totalAmount ? (inventories.find(inv => 
        inv._id.toString() === out.source_id
      )!.totalAmount! / Math.abs(out.quantity)) : 0
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
    const averageProfitMargin = summary.totalRevenue > 0 
      ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    return {
      success: true,
      fifoMatches,
      profitMargins,
      summary: {
        ...summary,
        averageProfitMargin
      },
      hasNegativeInventory // 添加負庫存標記
    };
  } catch (error) {
    console.error('FIFO計算錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

export default {
  matchFIFOBatches,
  calculateProfitMargins,
  prepareInventoryForFIFO,
  calculateProductFIFO
};