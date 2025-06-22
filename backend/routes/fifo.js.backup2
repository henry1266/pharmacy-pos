const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // 新增：導入 mongoose
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
const ShippingOrder = require('../models/ShippingOrder'); // Added ShippingOrder model
const { calculateProductFIFO, matchFIFOBatches, prepareInventoryForFIFO } = require('../utils/fifoCalculator');

// @route   GET api/fifo/product/:productId
// @desc    Calculate FIFO cost and profit margins for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const inventories = await Inventory.find({ product: new mongoose.Types.ObjectId(req.params.productId) })
      .populate('product')
      .sort({ lastUpdated: 1 });
    
    if (inventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    const fifoResult = calculateProductFIFO(inventories);
    res.json(fifoResult);
  } catch (err) {
    console.error('FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/sale/:saleId
// @desc    Calculate FIFO profit for a specific sale
// @access  Public
router.get('/sale/:saleId', async (req, res) => {
  try {
    // 修正：使用 findOne 搭配查詢物件，並使用 new mongoose.Types.ObjectId
    const sale = await Sale.findOne({ _id: new mongoose.Types.ObjectId(req.params.saleId) })
      .populate('items.product');
    
    if (!sale) {
      return res.status(404).json({ msg: '找不到該銷售訂單' });
    }
    
    const itemsWithProfit = [];
    let totalProfit = 0;
    let totalCost = 0;
    
    for (const item of sale.items) {
      const inventories = await Inventory.find({ product: new mongoose.Types.ObjectId(item.product._id) })
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
      const profitRecord = fifoResult.profitMargins.find(p => 
        p.orderType === 'sale' && 
        p.orderId === req.params.saleId // 不需要轉換，因為 profitRecord 中的 orderId 已經是字串
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
    
    const totalRevenue = sale.totalAmount || 0;
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
  } catch (err) {
    console.error('銷售訂單FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/shipping-order/:shippingOrderId
// @desc    Calculate FIFO profit for a specific shipping order
// @access  Public
router.get('/shipping-order/:shippingOrderId', async (req, res) => {
  try {
    // 修正：使用 findOne 搭配查詢物件，並使用 new mongoose.Types.ObjectId
    const shippingOrder = await ShippingOrder.findOne({ _id: new mongoose.Types.ObjectId(req.params.shippingOrderId) })
      .populate('items.product'); // Assuming items.product exists and needs population
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    
    const itemsWithProfit = [];
    let totalProfit = 0;
    let totalCost = 0;

    // Ensure items are populated and product details are available
    // The product ID in shippingOrder.items is 'did', and name is 'dname'
    // The 'product' field in shippingOrder.items might not be a direct ref like in Sale model
    // We need to ensure we get the correct product._id for inventory lookup.

    for (const item of shippingOrder.items) {
      // Assuming item.did is the product code and we need to find the product._id
      // Or, if item.product is already populated with the product object containing _id:
      const productId = item.product?._id || null; 
      if (!productId) {
        // If product ID cannot be determined, push item with no profit
        itemsWithProfit.push({
          ...item.toObject(), // Convert Mongoose document to plain object
          fifoProfit: {
            totalCost: 0,
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
        continue;
      }

      const inventories = await Inventory.find({ product: new mongoose.Types.ObjectId(productId) })
        .populate('product') // This might be redundant if item.product is already populated
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
      // fifoCalculator's profitMargins are linked by orderId and orderType
      // For shipping orders, orderType should be 'shipping' (or 'ship' as seen in prepareInventoryForFIFO)
      const profitRecord = fifoResult.profitMargins.find(p => 
        (p.orderType === 'shipping' || p.orderType === 'ship') && 
        p.orderId === req.params.shippingOrderId // 不需要轉換，因為 profitRecord 中的 orderId 已經是字串
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
        // If no specific profit record for this shipping order item, assume zero profit/cost for now
        // This might happen if the shipping event hasn't been fully processed by fifoCalculator logic
        // or if the item was not considered 'sold' in a way that generates profit (e.g., internal transfer)
        itemsWithProfit.push({
          ...item.toObject(),
          fifoProfit: {
            totalCost: 0, // Or derive cost if possible, but profit is unknown
            grossProfit: 0,
            profitMargin: '0.00%'
          }
        });
      }
    }
    
    // For shipping orders, 'revenue' is typically the dtotalCost of items
    // However, the frontend for SalesDetailPage uses sale.totalAmount for revenue.
    // We should align with how totalAmount is calculated for shipping orders.
    const totalRevenue = shippingOrder.totalAmount || 0; 
    
    const totalProfitMargin = totalRevenue > 0 
      ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    res.json({
      success: true,
      items: itemsWithProfit,
      summary: {
        totalCost,
        totalRevenue, // This is the total amount of the shipping order
        totalProfit,
        totalProfitMargin
      }
    });
  } catch (err) {
    console.error('出貨單FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});


// @route   GET api/fifo/all
// @desc    Calculate FIFO cost and profit margins for all products
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const productIds = await Inventory.distinct('product');
    const results = [];
    for (const productId of productIds) {
      const inventories = await Inventory.find({ product: new mongoose.Types.ObjectId(productId) })
        .populate('product')
        .sort({ lastUpdated: 1 });
      if (inventories.length > 0) {
        const fifoResult = calculateProductFIFO(inventories);
        const productInfo = inventories[0].product;
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
        sum.totalCost += result.summary.totalCost || 0;
        sum.totalRevenue += result.summary.totalRevenue || 0;
        sum.totalProfit += result.summary.totalProfit || 0;
      }
      return sum;
    }, { totalCost: 0, totalRevenue: 0, totalProfit: 0 });
    overallSummary.averageProfitMargin = overallSummary.totalRevenue > 0 
      ? ((overallSummary.totalProfit / overallSummary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    res.json({ results, overallSummary });
  } catch (err) {
    console.error('FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

/**
 * 獲取產品庫存記錄
 * @param {string} productId - 產品ID
 * @returns {Promise<Array>} - 庫存記錄
 */
async function getProductInventories(productId) {
  return await Inventory.find({ product: new mongoose.Types.ObjectId(productId) })
    .populate('product')
    .sort({ lastUpdated: 1 });
}

/**
 * 處理庫存記錄並計算可用庫存
 * @param {Array} allInventories - 所有庫存記錄
 * @returns {Object} - 處理後的庫存資訊
 */
function processInventoryRecords(allInventories) {
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
 * @param {string} productId - 產品ID
 * @param {number} quantity - 數量
 * @returns {Array} - 模擬出庫記錄
 */
function createSimulatedStockOut(productId, quantity) {
  return [{
    timestamp: new Date(),
    quantity: parseInt(quantity),
    drug_id: productId,
    source_id: 'simulation',
    type: 'simulation',
    orderNumber: 'SIMULATION',
    orderId: null,
    orderType: 'simulation'
  }];
}

/**
 * 計算FIFO成本
 * @param {Array} fifoMatches - FIFO匹配結果
 * @returns {Object} - 成本計算結果
 */
function calculateFifoCost(fifoMatches) {
  if (fifoMatches.length === 0) {
    return {
      totalCost: 0,
      hasNegativeInventory: false,
      remainingNegativeQuantity: 0
    };
  }
  
  const match = fifoMatches[0];
  return {
    totalCost: match.costParts.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0),
    hasNegativeInventory: match.hasNegativeInventory,
    remainingNegativeQuantity: match.remainingNegativeQuantity || 0
  };
}

// @route   POST api/fifo/simulate
// @desc    Simulate FIFO cost for a product with given quantity
// @access  Public
router.post('/simulate', async (req, res) => {
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
      quantity: parseInt(quantity),
      fifoMatches,
      totalCost,
      hasNegativeInventory,
      remainingNegativeQuantity,
      availableQuantity
    });
  } catch (err) {
    console.error('FIFO模擬計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
