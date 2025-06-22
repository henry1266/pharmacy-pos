import express, { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Inventory from '../models/Inventory';
import Sale from '../models/Sale';
import ShippingOrder from '../models/ShippingOrder';
import { 
  calculateProductFIFO, 
  matchFIFOBatches, 
  prepareInventoryForFIFO,
  InventoryRecord,
  FIFOCalculationResult,
  StockInRecord,
  StockOutRecord,
  OutgoingUsage
} from '../utils/fifoCalculator';

const router = express.Router();

// 定義介面
interface FIFOProductResponse extends FIFOCalculationResult {
  productId?: string;
  productName?: string;
  productCode?: string;
}

interface FIFOSaleResponse {
  success: boolean;
  items: Array<{
    product: any;
    productName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discount?: number;
    fifoProfit: {
      totalCost: number;
      grossProfit: number;
      profitMargin: string;
    };
    [key: string]: any;
  }>;
  summary: {
    totalCost: number;
    totalRevenue: number;
    totalProfit: number;
    totalProfitMargin: string;
  };
}

interface SimulateRequest {
  productId: string;
  quantity: string | number;
}

interface FIFOCostResult {
  totalCost: number;
  hasNegativeInventory: boolean;
  remainingNegativeQuantity: number;
}

interface SimulateResponse {
  success: boolean;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  fifoMatches: OutgoingUsage[];
  totalCost: number;
  hasNegativeInventory: boolean;
  remainingNegativeQuantity: number;
  availableQuantity: number;
}

interface ProcessedInventory {
  availableStockIn: StockInRecord[];
  availableQuantity: number;
}

// @route   GET api/fifo/product/:productId
// @desc    Calculate FIFO cost and profit margins for a product
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const inventories = await Inventory.find({ product: new Types.ObjectId(req.params.productId) })
      .populate('product')
      .sort({ lastUpdated: 1 });
    
    if (inventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    const fifoResult = calculateProductFIFO(inventories as unknown as InventoryRecord[]);
    res.json(fifoResult);
  } catch (err) {
    console.error('FIFO計算錯誤:', err instanceof Error ? err.message : '未知錯誤');
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err instanceof Error ? err.message : '未知錯誤' 
    });
  }
});

// @route   GET api/fifo/sale/:saleId
// @desc    Calculate FIFO profit for a specific sale
// @access  Public
router.get('/sale/:saleId', async (req: Request, res: Response) => {
  try {
    const sale = await Sale.findOne({ _id: new Types.ObjectId(req.params.saleId) })
      .populate('items.product');
    
    if (!sale) {
      return res.status(404).json({ msg: '找不到該銷售訂單' });
    }
    
    const itemsWithProfit = [];
    let totalProfit = 0;
    let totalCost = 0;
    
    for (const item of sale.items) {
      const inventories = await Inventory.find({ product: new Types.ObjectId(item.product._id) })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      if (inventories.length === 0) {
        itemsWithProfit.push({
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        continue;
      }
      
      const fifoResult = calculateProductFIFO(inventories as unknown as InventoryRecord[]);
      const profitRecord = fifoResult.profitMargins?.find(p => 
        p.orderType === 'sale' && 
        p.orderId === req.params.saleId
      );
      
      if (profitRecord) {
        const itemProfit = {
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: profitRecord.totalCost,
            grossProfit: profitRecord.grossProfit,
            profitMargin: profitRecord.profitMargin
          }
        };
        itemsWithProfit.push(itemProfit);
        totalProfit += profitRecord.grossProfit;
        totalCost += profitRecord.totalCost;
      } else {
        itemsWithProfit.push({
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
      }
    }
    
    const totalRevenue = sale.totalAmount || 0;
    const totalProfitMargin = totalRevenue > 0 
      ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    const response: FIFOSaleResponse = {
      success: true,
      items: itemsWithProfit,
      summary: {
        totalCost,
        totalRevenue,
        totalProfit,
        totalProfitMargin
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error('銷售訂單FIFO計算錯誤:', err instanceof Error ? err.message : '未知錯誤');
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err instanceof Error ? err.message : '未知錯誤' 
    });
  }
});

// @route   GET api/fifo/shipping-order/:shippingOrderId
// @desc    Calculate FIFO profit for a specific shipping order
// @access  Public
router.get('/shipping-order/:shippingOrderId', async (req: Request, res: Response) => {
  try {
    const shippingOrder = await ShippingOrder.findOne({ _id: new Types.ObjectId(req.params.shippingOrderId) })
      .populate('items.product');
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    
    const itemsWithProfit = [];
    let totalProfit = 0;
    let totalCost = 0;

    for (const item of shippingOrder.items) {
      const productId = item.product?._id || null; 
      if (!productId) {
        itemsWithProfit.push({
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        continue;
      }

      const inventories = await Inventory.find({ product: new Types.ObjectId(productId) })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      if (inventories.length === 0) {
        itemsWithProfit.push({
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        continue;
      }
      
      const fifoResult = calculateProductFIFO(inventories as unknown as InventoryRecord[]);
      const profitRecord = fifoResult.profitMargins?.find(p => 
        (p.orderType === 'shipping') &&
        p.orderId === req.params.shippingOrderId
      );
      
      if (profitRecord) {
        const itemProfit = {
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: profitRecord.totalCost,
            grossProfit: profitRecord.grossProfit,
            profitMargin: profitRecord.profitMargin
          }
        };
        itemsWithProfit.push(itemProfit);
        totalProfit += profitRecord.grossProfit;
        totalCost += profitRecord.totalCost;
      } else {
        itemsWithProfit.push({
          ...(item as any).toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
      }
    }
    
    const totalRevenue = shippingOrder.totalAmount || 0; 
    
    const totalProfitMargin = totalRevenue > 0 
      ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    const response: FIFOSaleResponse = {
      success: true,
      items: itemsWithProfit,
      summary: {
        totalCost,
        totalRevenue,
        totalProfit,
        totalProfitMargin
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error('出貨單FIFO計算錯誤:', err instanceof Error ? err.message : '未知錯誤');
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err instanceof Error ? err.message : '未知錯誤' 
    });
  }
});


// @route   GET api/fifo/all
// @desc    Calculate FIFO cost and profit margins for all products
// @access  Public
router.get('/all', async (req: Request, res: Response) => {
  try {
    const productIds = await Inventory.distinct('product');
    const results: FIFOProductResponse[] = [];
    
    for (const productId of productIds) {
      const inventories = await Inventory.find({ product: new Types.ObjectId(productId) })
        .populate('product')
        .sort({ lastUpdated: 1 });
        
      if (inventories.length > 0) {
        const fifoResult = calculateProductFIFO(inventories as unknown as InventoryRecord[]);
        const productInfo = inventories[0].product;
        results.push({
          productId: productId.toString(),
          productName: (productInfo as any).name,
          productCode: (productInfo as any).code,
          ...fifoResult
        });
      }
    }
    
    const overallSummary = results.reduce((sum, result) => {
      if (result.success && result.summary) {
        sum.totalCost += result.summary.totalCost || 0;
        sum.totalRevenue += result.summary.totalRevenue || 0;
        sum.totalProfit += result.summary.totalProfit || 0;
      }
      return sum;
    }, { totalCost: 0, totalRevenue: 0, totalProfit: 0, averageProfitMargin: '0.00%' });
    
    overallSummary.averageProfitMargin = overallSummary.totalRevenue > 0 
      ? ((overallSummary.totalProfit / overallSummary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
      
    res.json({ results, overallSummary });
  } catch (err) {
    console.error('FIFO計算錯誤:', err instanceof Error ? err.message : '未知錯誤');
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err instanceof Error ? err.message : '未知錯誤' 
    });
  }
});

/**
 * 獲取產品庫存記錄
 * @param productId - 產品ID
 * @returns 庫存記錄
 */
async function getProductInventories(productId: string): Promise<InventoryRecord[]> {
  return await Inventory.find({ product: new Types.ObjectId(productId) })
    .populate('product')
    .sort({ lastUpdated: 1 });
}

/**
 * 處理庫存記錄並計算可用庫存
 * @param allInventories - 所有庫存記錄
 * @returns 處理後的庫存資訊
 */
function processInventoryRecords(allInventories: InventoryRecord[]): ProcessedInventory {
  const { stockIn, stockOut: existingStockOut } = prepareInventoryForFIFO(allInventories);
  const processedStockIn = [...stockIn];
  let inIndex = 0;
  
  // 處理已存在的出庫記錄
  for (const out of existingStockOut) {
    let remaining = out.quantity;
    while (remaining > 0 && inIndex < processedStockIn.length) {
      const batch = processedStockIn[inIndex];
      if (!batch.remainingQty) batch.remainingQty = batch.quantity;
      if (batch.remainingQty > 0) {
        const used = Math.min(batch.remainingQty, remaining);
        batch.remainingQty -= used;
        remaining -= used;
      }
      if (batch.remainingQty === 0) inIndex++;
    }
  }
  
  // 計算可用庫存
  const availableStockIn = processedStockIn.filter(batch => !batch.remainingQty || batch.remainingQty > 0)
    .map(batch => ({ ...batch, quantity: batch.remainingQty || batch.quantity }));
    
  return {
    availableStockIn,
    availableQuantity: availableStockIn.reduce((sum, batch) => sum + batch.quantity, 0)
  };
}

/**
 * 創建模擬出庫記錄
 * @param productId - 產品ID
 * @param quantity - 數量
 * @returns 模擬出庫記錄
 */
function createSimulatedStockOut(productId: string, quantity: number): StockOutRecord[] {
  return [{
    timestamp: new Date(),
    quantity: parseInt(quantity.toString()),
    drug_id: productId,
    source_id: 'simulation',
    type: 'sale',
    orderNumber: 'SIMULATION',
    orderId: null,
    orderType: 'sale'
  }];
}

/**
 * 計算FIFO成本
 * @param fifoMatches - FIFO匹配結果
 * @returns 成本計算結果
 */
function calculateFifoCost(fifoMatches: OutgoingUsage[]): FIFOCostResult {
  if (fifoMatches.length === 0) {
    return {
      totalCost: 0,
      hasNegativeInventory: false,
      remainingNegativeQuantity: 0
    };
  }
  
  const match = fifoMatches[0];
  return {
    totalCost: match.costParts.reduce((sum: number, part) => sum + (part.unit_price * part.quantity), 0),
    hasNegativeInventory: match.hasNegativeInventory,
    remainingNegativeQuantity: match.remainingNegativeQuantity || 0
  };
}

// @route   POST api/fifo/simulate
// @desc    Simulate FIFO cost for a product with given quantity
// @access  Public
router.post('/simulate', async (req: Request<{}, {}, SimulateRequest>, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ msg: '請提供產品ID和數量' });
    }
    
    // 獲取產品庫存記錄
    const allInventories = await getProductInventories(productId);
    if (allInventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    // 處理庫存記錄並計算可用庫存
    const { availableStockIn, availableQuantity } = processInventoryRecords(allInventories as unknown as InventoryRecord[]);
    
    // 創建模擬出庫記錄
    const simulatedStockOut = createSimulatedStockOut(productId, Number(quantity));
    
    // 匹配FIFO批次
    const fifoMatches = matchFIFOBatches(availableStockIn, simulatedStockOut);
    
    // 計算FIFO成本
    const { totalCost, hasNegativeInventory, remainingNegativeQuantity } = calculateFifoCost(fifoMatches);
    
    // 獲取產品信息
    const productInfo = (allInventories[0] as any).product;
    
    // 返回結果
    const response: SimulateResponse = {
      success: true,
      productId,
      productName: productInfo.name,
      productCode: productInfo.code,
      quantity: parseInt(quantity.toString()),
      fifoMatches,
      totalCost,
      hasNegativeInventory,
      remainingNegativeQuantity,
      availableQuantity
    };
    
    res.json(response);
  } catch (err) {
    console.error('FIFO模擬計算錯誤:', err instanceof Error ? err.message : '未知錯誤');
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err instanceof Error ? err.message : '未知錯誤' 
    });
  }
});

export default router;