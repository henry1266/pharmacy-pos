const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { calculateProductFIFO, matchFIFOBatches, prepareInventoryForFIFO } = require('../utils/fifoCalculator');

// @route   GET api/fifo/product/:productId
// @desc    Calculate FIFO cost and profit margins for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    // 獲取產品的所有庫存記錄
    const inventories = await Inventory.find({ product: req.params.productId })
      .populate('product')
      .sort({ lastUpdated: 1 }); // 按時間排序，確保先進先出
    
    if (inventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    // 計算FIFO成本和毛利
    const fifoResult = calculateProductFIFO(inventories);
    
    res.json(fifoResult);
  } catch (err) {
    console.error('FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/all
// @desc    Calculate FIFO cost and profit margins for all products
// @access  Public
router.get('/all', async (req, res) => {
  try {
    // 獲取所有產品ID
    const productIds = await Inventory.distinct('product');
    
    const results = [];
    
    // 為每個產品計算FIFO成本和毛利
    for (const productId of productIds) {
      const inventories = await Inventory.find({ product: productId })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      if (inventories.length > 0) {
        const fifoResult = calculateProductFIFO(inventories);
        
        // 添加產品信息
        const productInfo = inventories[0].product;
        
        results.push({
          productId,
          productName: productInfo.name,
          productCode: productInfo.code,
          ...fifoResult
        });
      }
    }
    
    // 計算總體摘要
    const overallSummary = results.reduce((sum, result) => {
      if (result.success && result.summary) {
        sum.totalCost += result.summary.totalCost || 0;
        sum.totalRevenue += result.summary.totalRevenue || 0;
        sum.totalProfit += result.summary.totalProfit || 0;
      }
      return sum;
    }, {
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0
    });
    
    // 計算總體平均毛利率
    overallSummary.averageProfitMargin = overallSummary.totalRevenue > 0 
      ? ((overallSummary.totalProfit / overallSummary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    res.json({
      results,
      overallSummary
    });
  } catch (err) {
    console.error('FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/fifo/simulate
// @desc    Simulate FIFO cost for a product with given quantity
// @access  Public
router.post('/simulate', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({ msg: '請提供產品ID和數量' });
    }
    
    // 獲取產品的所有庫存記錄
    const inventories = await Inventory.find({ 
      product: productId,
      type: 'purchase' // 只獲取進貨記錄
    })
    .populate('product')
    .sort({ lastUpdated: 1 }); // 按時間排序，確保先進先出
    
    if (inventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    // 準備庫存數據
    const { stockIn } = prepareInventoryForFIFO(inventories);
    
    // 創建模擬出貨記錄
    const simulatedStockOut = [{
      timestamp: new Date(),
      quantity: parseInt(quantity),
      drug_id: productId,
      source_id: 'simulation',
      type: 'simulation',
      orderNumber: 'SIMULATION',
      orderId: null,
      orderType: 'simulation'
    }];
    
    // 執行FIFO匹配
    const fifoMatches = matchFIFOBatches(stockIn, simulatedStockOut);
    
    // 計算總成本
    let totalCost = 0;
    let hasNegativeInventory = false;
    let remainingNegativeQuantity = 0;
    
    if (fifoMatches.length > 0) {
      const match = fifoMatches[0];
      hasNegativeInventory = match.hasNegativeInventory;
      remainingNegativeQuantity = match.remainingNegativeQuantity || 0;
      
      // 計算已匹配部分的成本
      totalCost = match.costParts.reduce((sum, part) => {
        return sum + (part.unit_price * part.quantity);
      }, 0);
    }
    
    // 獲取產品信息
    const productInfo = inventories[0].product;
    
    // 返回模擬結果
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
      availableQuantity: stockIn.reduce((sum, batch) => sum + batch.quantity, 0)
    });
  } catch (err) {
    console.error('FIFO模擬計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
