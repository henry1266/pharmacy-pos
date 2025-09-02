import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import Inventory from '../models/Inventory';
import Sale from '../models/Sale';
import ShippingOrder from '../models/ShippingOrder';
import { calculateProductFIFO, matchFIFOBatches, prepareInventoryForFIFO } from '../utils/fifoCalculator';
import logger from '../utils/logger';
const BaseProduct = require('../models/BaseProduct');

const router: express.Router = express.Router();

// 定義介面
interface FIFOSimulationRequest {
  productId: string;
  quantity: number;
}

// 使用 @ts-ignore 註釋來忽略未使用的介面
// @ts-ignore
interface FIFOHealthInsuranceSimulationRequest {
  healthInsuranceCode: string;
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
    
    if (product.excludeFromStock) {
      
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
    //logger.debug('一般產品 FIFO 計算完成');
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
    
    const itemsWithProfit: any[] = [];
    let totalProfit = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    
    for (const item of (sale as any).items) {
      
      const itemRevenue = item.price * item.quantity;
      
      // 檢查是否為「不扣庫存」產品
      if (item.product.excludeFromStock) {
        //logger.debug('不扣庫存產品，直接計算毛利');
        
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
        
        continue;
      }
      
      // 一般產品使用 FIFO 計算
      const inventories = await Inventory.find({ product: new Types.ObjectId(item.product._id) })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      //logger.debug(`找到庫存記錄數量: ${inventories.length}`);
      
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
      
      // 查找與此銷售訂單相關的毛利記錄
      const profitRecords = fifoResult.profitMargins?.filter((p: any) =>
        p.orderType === 'sale' &&
        p.orderId === req.params.saleId
      ) || [];
      
      //logger.debug(`找到相關毛利記錄: ${profitRecords.length}`);
      
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
 * 計算產品庫存統計
 * @param inventories - 庫存記錄
 * @returns 庫存統計
 */
function calculateInventoryStats(inventories: any[]): {
  purchaseQuantity: number;
  shippingQuantity: number;
  saleQuantity: number;
  currentStock: number;
} {
  let purchaseQuantity = 0;
  let shippingQuantity = 0;
  let saleQuantity = 0;

  inventories.forEach(inv => {
    const quantity = Math.abs(inv.quantity);
    
    if (inv.type === 'purchase') {
      purchaseQuantity += quantity;
    } else if (inv.type === 'ship') {
      shippingQuantity += quantity;
    } else if (inv.type === 'sale') {
      saleQuantity += quantity;
    }
  });

  // 計算現有庫存
  const currentStock = purchaseQuantity - shippingQuantity - saleQuantity;

  return {
    purchaseQuantity,
    shippingQuantity,
    saleQuantity,
    currentStock
  };
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

/**
 * @swagger
 * /api/fifo/simulate-by-health-insurance/{healthInsuranceCode}/{quantity}:
 *   get:
 *     summary: 根據健保碼模擬FIFO成本計算
 *     description: 根據健保碼和數量，使用FIFO邏輯計算出這個數量的成本並返回
 *     tags: [FIFO]
 *     parameters:
 *       - in: path
 *         name: healthInsuranceCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 產品健保碼
 *       - in: path
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *         description: 數量
 *     responses:
 *       200:
 *         description: 成功計算FIFO成本
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalCost:
 *                       type: number
 *                       description: 總成本
 *                     totalRevenue:
 *                       type: number
 *                       description: 總收入
 *                     totalProfit:
 *                       type: number
 *                       description: 總毛利
 *                     averageProfitMargin:
 *                       type: string
 *                       description: 平均毛利率
 *                 inventoryStats:
 *                   type: object
 *                   description: 庫存統計信息
 *                   properties:
 *                     purchaseQuantity:
 *                       type: number
 *                       description: 進貨總數量
 *                     shippingQuantity:
 *                       type: number
 *                       description: 出貨總數量
 *                     saleQuantity:
 *                       type: number
 *                       description: 銷售總數量
 *                     currentStock:
 *                       type: number
 *                       description: 當前庫存數量
 *                     availableQuantity:
 *                       type: number
 *                       description: 可用庫存數量（考慮已發生的出貨和銷售後）
 *                 fifoMatches:
 *                   type: array
 *                   description: FIFO匹配結果
 *                   items:
 *                     type: object
 *                 profitMargins:
 *                   type: array
 *                   description: 毛利率計算結果
 *                   items:
 *                     type: object
 *                 costInfo:
 *                   type: object
 *                   description: 成本計算信息
 *                   properties:
 *                     currentTotalCost:
 *                       type: number
 *                       description: 當前已出貨數量的總成本
 *                     simulatedTotalCost:
 *                       type: number
 *                       description: 當前已出貨數量+模擬數量的總成本
 *                     additionalCost:
 *                       type: number
 *                       description: 額外數量的成本（simulatedTotalCost - currentTotalCost）
 *                 hasNegativeInventory:
 *                   type: boolean
 *                   description: 是否有負庫存
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 請提供健保碼和數量
 *       404:
 *         description: 找不到產品或庫存記錄
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 找不到該健保碼對應的產品
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server Error
 *                 error:
 *                   type: string
 */
router.get('/simulate-by-health-insurance/:healthInsuranceCode/:quantity', async (req: Request, res: Response): Promise<void> => {
  try {
    const { healthInsuranceCode, quantity } = req.params;
    if (!healthInsuranceCode || !quantity) {
      res.status(400).json({ msg: '請提供健保碼和數量' });
      return;
    }

    // 根據健保碼查詢產品
    const product = await BaseProduct.findOne({ healthInsuranceCode: healthInsuranceCode.trim() });
    if (!product) {
      res.status(404).json({ msg: '找不到該健保碼對應的產品' });
      return;
    }

    const productId = product._id.toString();

    // 檢查產品是否為「不扣庫存」
    if (product.excludeFromStock) {
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

    // 獲取產品庫存記錄
    const inventories = await Inventory.find({ product: new Types.ObjectId(productId) })
      .populate('product')
      .sort({ lastUpdated: 1 });
    
    if (inventories.length === 0) {
      res.status(404).json({ msg: '找不到該產品的庫存記錄' });
      return;
    }

    // 計算庫存統計
    const stats = calculateInventoryStats(inventories);
    
    // 創建兩個獨立的模擬計算
    
    // 1. 只考慮當前已出貨的庫存記錄
    const currentInventories = [...inventories];
    
    // 2. 考慮當前已出貨 + 模擬出貨的庫存記錄
    const simulatedInventories = [...inventories];
    
    // 創建模擬出貨記錄
    const simulatedStockOut = new Inventory({
      _id: new Types.ObjectId(),
      product: new Types.ObjectId(productId),
      quantity: -parseInt(quantity),
      type: 'ship',
      lastUpdated: new Date(),
      shippingOrderNumber: 'SIMULATED-SHIPPING',
      shippingOrderId: new Types.ObjectId()
    });
    
    // 只將模擬出貨記錄添加到模擬庫存中
    simulatedInventories.push(simulatedStockOut);
    
    // 計算當前FIFO成本
    const currentFifoResult = calculateProductFIFO(currentInventories);
    
    // 計算模擬FIFO成本
    const simulatedFifoResult = calculateProductFIFO(simulatedInventories);
    
    // 計算差異
    const currentTotalCost = currentFifoResult.summary?.totalCost || 0;
    const simulatedTotalCost = simulatedFifoResult.summary?.totalCost || 0;
    const additionalCost = simulatedTotalCost - currentTotalCost;

    // 返回結果，格式與 /api/fifo/product/:productId 一致，但添加了庫存統計和成本信息
    res.json({
      success: true,
      productId,
      productName: product.name,
      productCode: product.code,
      healthInsuranceCode,
      quantity: parseInt(quantity),
      additionalCost
    });
  } catch (err: any) {
    logger.error(`FIFO健保碼模擬計算錯誤: ${err.message}`);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

export default router;