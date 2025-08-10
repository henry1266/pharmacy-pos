import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import Inventory from '../models/Inventory';
import Sale from '../models/Sale';
import ShippingOrder from '../models/ShippingOrder';
import { calculateProductFIFO, matchFIFOBatches, prepareInventoryForFIFO } from '../utils/fifoCalculator';
import logger from '../utils/logger';

const router: express.Router = express.Router();

// 定義介面
interface FIFOSimulationRequest {
  productId: string;
  quantity: number;
}

interface StockOutRecord {
  timestamp: Date;
  quantity: number;
  drug_id: string;
  source_id: string;
  type: 'sale' | 'ship';
  orderNumber: string;
  orderId: string | null;
  orderType: 'sale' | 'shipping';
}

interface CostPart {
  unit_price: number;
  quantity: number;
}

interface FIFOMatch {
  costParts: CostPart[];
  hasNegativeInventory: boolean;
  remainingNegativeQuantity?: number;
}

interface ProcessedInventory {
  availableStockIn: any[];
  availableQuantity: number;
}

// @route   GET api/fifo/product/:productId
// @desc    Calculate FIFO cost and profit margins for a product
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const inventories = await Inventory.find({ product: new Types.ObjectId(req.params.productId) })
      .populate('product')
      .sort({ lastUpdated: 1 });
    
    if (inventories.length === 0) {
      res.status(404).json({ msg: '找不到該產品的庫存記錄' });
      return;
    }
    
    // 檢查產品是否為「不扣庫存」
    const product = (inventories[0] as any).product;
    logger.debug('產品詳情頁面 FIFO 計算:', {
      productId: req.params.productId,
      productName: product.name,
      excludeFromStock: product.excludeFromStock
    });
    
    if (product.excludeFromStock) {
      logger.debug('不扣庫存產品，返回空的 FIFO 結果');
      
      // 對於「不扣庫存」產品，返回空的 FIFO 結果
      res.json({
        success: true,
        summary: {
          totalCost: 0,
          totalRevenue: 0,
          totalProfit: 0,
          averageProfitMargin: '0.00%'
        },
        profitMargins: [],
        fifoMatches: [],
        message: '此產品設定為「不扣庫存」，毛利以數量×(售價-進價)計算，不使用 FIFO 成本計算'
      });
      return;
    }
    
    // 一般產品使用 FIFO 計算
    const fifoResult = calculateProductFIFO(inventories);
    logger.debug('一般產品 FIFO 計算完成');
    res.json(fifoResult);
  } catch (err: any) {
    logger.error(`FIFO計算錯誤: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/sale/:saleId
// @desc    Calculate FIFO profit for a specific sale
// @access  Public
router.get('/sale/:saleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await Sale.findOne({ _id: new Types.ObjectId(req.params.saleId) })
      .populate('items.product');
    
    if (!sale) {
      res.status(404).json({ msg: '找不到該銷售訂單' });
      return;
    }
    
    logger.debug(`處理銷售訂單: ${req.params.saleId}`);
    
    const itemsWithProfit: any[] = [];
    let totalProfit = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    
    for (const item of (sale as any).items) {
      logger.debug(`處理銷售項目: ${item.product._id}, 數量: ${item.quantity}`);
      logger.debug('產品資訊:', {
        name: item.product.name,
        excludeFromStock: item.product.excludeFromStock,
        purchasePrice: item.product.purchasePrice,
        sellingPrice: item.price
      });
      
      const itemRevenue = item.price * item.quantity;
      
      // 檢查是否為「不扣庫存」產品
      if (item.product.excludeFromStock) {
        logger.debug('不扣庫存產品，直接計算毛利');
        
        const purchasePrice = item.product.purchasePrice || 0;
        const itemTotalCost = purchasePrice * item.quantity;
        const itemTotalProfit = itemRevenue - itemTotalCost;
        
        const itemProfit = {
          ...item.toObject(),
          fifoProfit: {
            totalCost: itemTotalCost,
            grossProfit: itemTotalProfit,
            profitMargin: itemRevenue > 0 ? ((itemTotalProfit / itemRevenue) * 100).toFixed(2) + '%' : '0.00%'
          }
        };
        
        itemsWithProfit.push(itemProfit);
        totalProfit += itemTotalProfit;
        totalCost += itemTotalCost;
        totalRevenue += itemRevenue;
        
        logger.debug('不扣庫存產品毛利計算完成:', {
          itemTotalCost,
          itemTotalProfit,
          itemRevenue,
          profitMargin: itemProfit.fifoProfit.profitMargin
        });
        
        continue;
      }
      
      // 一般產品使用 FIFO 計算
      const inventories = await Inventory.find({ product: new Types.ObjectId(item.product._id) })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      logger.debug(`找到庫存記錄數量: ${inventories.length}`);
      
      if (inventories.length === 0) {
        itemsWithProfit.push({
          ...item.toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        totalRevenue += itemRevenue;
        continue;
      }
      
      // 使用 calculateProductFIFO 計算該產品的完整 FIFO 結果
      const fifoResult = calculateProductFIFO(inventories);
      logger.debug('FIFO 計算結果:', {
        success: fifoResult.success,
        profitMarginsCount: fifoResult.profitMargins?.length || 0,
        summary: fifoResult.summary
      });
      
      // 查找與此銷售訂單相關的毛利記錄
      const profitRecords = fifoResult.profitMargins?.filter((p: any) =>
        p.orderType === 'sale' &&
        p.orderId === req.params.saleId
      ) || [];
      
      logger.debug(`找到相關毛利記錄: ${profitRecords.length}`);
      
      if (profitRecords.length > 0) {
        // 計算該產品在此銷售中的總毛利
        const itemTotalCost = profitRecords.reduce((sum, p) => sum + p.totalCost, 0);
        const itemTotalProfit = profitRecords.reduce((sum, p) => sum + p.grossProfit, 0);
        
        const itemProfit = {
          ...item.toObject(),
          fifoProfit: {
            totalCost: itemTotalCost,
            grossProfit: itemTotalProfit,
            profitMargin: itemRevenue > 0 ? ((itemTotalProfit / itemRevenue) * 100).toFixed(2) + '%' : '0.00%'
          }
        };
        
        itemsWithProfit.push(itemProfit);
        totalProfit += itemTotalProfit;
        totalCost += itemTotalCost;
        totalRevenue += itemRevenue;
        
        logger.debug('FIFO 產品毛利計算完成:', {
          itemTotalCost,
          itemTotalProfit,
          itemRevenue
        });
      } else {
        // 沒有找到相關記錄，可能是數據問題
        logger.warn('未找到相關毛利記錄，使用預設值');
        itemsWithProfit.push({
          ...item.toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        totalRevenue += itemRevenue;
      }
    }
    
    const calculatedTotalRevenue = (sale as any).totalAmount ?? totalRevenue;
    const totalProfitMargin = calculatedTotalRevenue > 0
      ? ((totalProfit / calculatedTotalRevenue) * 100).toFixed(2) + '%'
      : '0.00%';
    
    logger.debug('最終計算結果:', {
      totalCost,
      totalProfit,
      calculatedTotalRevenue,
      totalProfitMargin
    });
    
    res.json({
      success: true,
      items: itemsWithProfit,
      summary: {
        totalCost,
        totalRevenue: calculatedTotalRevenue,
        totalProfit, // 保持原有欄位
        grossProfit: totalProfit, // 新增 grossProfit 欄位以兼容前端
        totalProfitMargin
      }
    });
  } catch (err: any) {
    logger.error(`銷售訂單FIFO計算錯誤: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/shipping-order/:shippingOrderId
// @desc    Calculate FIFO profit for a specific shipping order
// @access  Public
router.get('/shipping-order/:shippingOrderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const shippingOrder = await ShippingOrder.findOne({ _id: new Types.ObjectId(req.params.shippingOrderId) })
      .populate('items.product');
    
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }
    
    const itemsWithProfit: any[] = [];
    let totalProfit = 0;
    let totalCost = 0;

    for (const item of (shippingOrder as any).items) {
      const productId = item.product?._id ?? null;
      if (!productId) {
        itemsWithProfit.push({
          ...item.toObject(),
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
          ...item.toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        continue;
      }
      
      const fifoResult = calculateProductFIFO(inventories);
      const profitRecord = fifoResult.profitMargins?.find((p: any) =>
        (p.orderType === 'shipping' || p.orderType === 'ship') &&
        p.orderId === req.params.shippingOrderId
      );
      
      if (profitRecord) {
        const itemProfit = {
          ...item.toObject(),
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
          ...item.toObject(),
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
      }
    }
    
    const totalRevenue = (shippingOrder as any).totalAmount ?? 0;
    
    const totalProfitMargin = totalRevenue > 0 
      ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    res.json({
      success: true,
      items: itemsWithProfit,
      summary: {
        totalCost,
        totalRevenue,
        totalProfit,
        totalProfitMargin
      }
    });
  } catch (err: any) {
    logger.error(`出貨單FIFO計算錯誤: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/all
// @desc    Calculate FIFO cost and profit margins for all products
// @access  Public
router.get('/all', async (_req: Request, res: Response): Promise<void> => {
  try {
    const productIds = await Inventory.distinct('product');
    const results: any[] = [];
    
    for (const productId of productIds) {
      const inventories = await Inventory.find({ product: new Types.ObjectId(productId) })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      if (inventories.length > 0) {
        const fifoResult = calculateProductFIFO(inventories);
        const productInfo = (inventories[0] as any).product;
        results.push({
          productId,
          productName: productInfo.name,
          productCode: productInfo.code,
          ...fifoResult
        });
      }
    }
    
    const overallSummary = results.reduce((sum, result) => {
      if (result.success && result.summary) {
        sum.totalCost += result.summary.totalCost ?? 0;
        sum.totalRevenue += result.summary.totalRevenue ?? 0;
        sum.totalProfit += result.summary.totalProfit ?? 0;
      }
      return sum;
    }, { totalCost: 0, totalRevenue: 0, totalProfit: 0 });
    
    overallSummary.averageProfitMargin = overallSummary.totalRevenue > 0
      ? ((overallSummary.totalProfit / overallSummary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    res.json({ results, overallSummary });
  } catch (err: any) {
    logger.error(`FIFO計算錯誤: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

/**
 * 獲取產品庫存記錄
 * @param productId - 產品ID
 * @returns 庫存記錄
 */
async function getProductInventories(productId: string): Promise<any[]> {
  return await Inventory.find({ product: new Types.ObjectId(productId) })
    .populate('product')
    .sort({ lastUpdated: 1 });
}

/**
 * 處理庫存記錄並計算可用庫存
 * @param allInventories - 所有庫存記錄
 * @returns 處理後的庫存資訊
 */
function processInventoryRecords(allInventories: any[]): ProcessedInventory {
  const { stockIn, stockOut: existingStockOut } = prepareInventoryForFIFO(allInventories);
  const processedStockIn = [...stockIn];
  let inIndex = 0;
  
  // 處理已存在的出庫記錄
  for (const out of existingStockOut) {
    let remaining = out.quantity;
    while (remaining > 0 && inIndex < processedStockIn.length) {
      const batch = processedStockIn[inIndex];
      if (!batch) break;
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
function calculateFifoCost(fifoMatches: FIFOMatch[]): {
  totalCost: number;
  hasNegativeInventory: boolean;
  remainingNegativeQuantity: number;
} {
  if (fifoMatches.length === 0) {
    return {
      totalCost: 0,
      hasNegativeInventory: false,
      remainingNegativeQuantity: 0
    };
  }
  
  const match = fifoMatches[0];
  if (!match) {
    return {
      totalCost: 0,
      hasNegativeInventory: false,
      remainingNegativeQuantity: 0
    };
  }
  
  return {
    totalCost: match.costParts?.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0) || 0,
    hasNegativeInventory: match.hasNegativeInventory || false,
    remainingNegativeQuantity: match.remainingNegativeQuantity ?? 0
  };
}

// @route   POST api/fifo/simulate
// @desc    Simulate FIFO cost for a product with given quantity
// @access  Public
router.post('/simulate', async (req: Request<{}, {}, FIFOSimulationRequest>, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      res.status(400).json({ msg: '請提供產品ID和數量' });
      return;
    }
    
    // 獲取產品庫存記錄
    const allInventories = await getProductInventories(productId);
    if (allInventories.length === 0) {
      res.status(404).json({ msg: '找不到該產品的庫存記錄' });
      return;
    }
    
    // 處理庫存記錄並計算可用庫存
    const { availableStockIn, availableQuantity } = processInventoryRecords(allInventories);
    
    // 創建模擬出庫記錄
    const simulatedStockOut = createSimulatedStockOut(productId, quantity);
    
    // 匹配FIFO批次
    const fifoMatches = matchFIFOBatches(availableStockIn, simulatedStockOut);
    
    // 計算FIFO成本
    const { totalCost, hasNegativeInventory, remainingNegativeQuantity } = calculateFifoCost(fifoMatches);
    
    // 獲取產品信息
    const productInfo = allInventories[0].product;
    
    // 返回結果
    res.json({
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
    });
  } catch (err: any) {
    logger.error(`FIFO模擬計算錯誤: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

export default router;