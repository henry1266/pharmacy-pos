const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { calculateProductFIFO } = require('../utils/fifoCalculator');

// @route   GET api/fifo/product/:productId
// @desc    Calculate FIFO cost and profit margins for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    // 獲取產品的所有庫存記錄
    const inventories = await Inventory.find({ product: req.params.productId })
      .populate('product');
    
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

// @route   GET api/fifo/zero-profit/:productId
// @desc    Calculate zero profit cost for a product with given quantity
// @access  Public
router.get('/zero-profit/:productId', async (req, res) => {
  try {
    const { quantity } = req.query;
    
    // 驗證數量參數
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: '請提供有效的數量參數' 
      });
    }
    
    // 獲取產品的所有庫存記錄
    const inventories = await Inventory.find({ product: req.params.productId })
      .populate('product');
    
    if (inventories.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '找不到該產品的庫存記錄' 
      });
    }
    
    // 獲取產品信息
    const productInfo = inventories[0].product;
    
    // 計算FIFO成本分佈
    const fifoDetails = calculateFIFOCostDistribution(inventories, parseInt(quantity));
    
    // 計算零毛利總成本 (總成本 = 總收入)
    const zeroProfitCost = fifoDetails.totalCost;
    
    res.json({
      success: true,
      productId: req.params.productId,
      productName: productInfo.name,
      productCode: productInfo.code,
      quantity: parseInt(quantity),
      zeroProfitCost,
      unitCost: zeroProfitCost / parseInt(quantity),
      fifoDetails
    });
  } catch (err) {
    console.error('零毛利計算錯誤:', err.message);
    res.status(500).json({ 
      success: false, 
      error: '伺服器錯誤: ' + err.message 
    });
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
        .populate('product');
      
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

/**
 * 計算FIFO成本分佈
 * @param {Array} inventories - 庫存記錄
 * @param {Number} quantity - 需要計算的數量
 * @returns {Object} FIFO成本分佈
 */
function calculateFIFOCostDistribution(inventories, quantity) {
  // 複製庫存記錄，避免修改原始數據
  const inventoryCopy = JSON.parse(JSON.stringify(inventories));
  
  // 篩選出進貨記錄
  const purchaseInventories = inventoryCopy.filter(inv => inv.type === 'purchase');
  
  // 按照貨單號從小到大排序進貨記錄
  purchaseInventories.sort((a, b) => {
    // 提取訂單號中的數字部分
    const aOrderNumber = a.purchaseOrderNumber || '';
    const bOrderNumber = b.purchaseOrderNumber || '';
    const aNum = aOrderNumber.replace(/\D/g, '');
    const bNum = bOrderNumber.replace(/\D/g, '');
    
    // 如果都有數字部分，按數字大小排序
    if (aNum && bNum) {
      return parseInt(aNum) - parseInt(bNum); // 從小到大排序
    }
    
    // 如果數字部分不完整，按完整訂單號字母順序排序
    if (aOrderNumber && bOrderNumber) {
      return aOrderNumber.localeCompare(bOrderNumber);
    }
    
    // 如果訂單號不完整，按時間排序
    return new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0);
  });
  
  // 按照FIFO原則計算成本分佈
  let remainingQuantity = quantity;
  let totalCost = 0;
  const costParts = [];
  
  for (const inventory of purchaseInventories) {
    if (remainingQuantity <= 0) break;
    
    // 獲取當前批次的可用數量
    const availableQuantity = inventory.quantity;
    
    if (availableQuantity <= 0) continue;
    
    // 計算當前批次需要使用的數量
    const usedQuantity = Math.min(availableQuantity, remainingQuantity);
    
    // 計算當前批次的成本
    const unitPrice = inventory.purchasePrice || inventory.product.purchasePrice;
    const partCost = unitPrice * usedQuantity;
    
    // 添加到成本分佈
    costParts.push({
      batchTime: inventory.lastUpdated,
      orderNumber: inventory.purchaseOrderNumber || '未知訂單',
      orderType: 'purchase',
      orderId: inventory.purchaseOrderId,
      quantity: usedQuantity,
      unit_price: unitPrice,
      cost: partCost
    });
    
    // 更新總成本和剩餘數量
    totalCost += partCost;
    remainingQuantity -= usedQuantity;
  }
  
  // 如果庫存不足，使用最後一批的單價計算剩餘數量的成本
  if (remainingQuantity > 0 && purchaseInventories.length > 0) {
    const lastInventory = purchaseInventories[purchaseInventories.length - 1];
    const unitPrice = lastInventory.purchasePrice || lastInventory.product.purchasePrice;
    const partCost = unitPrice * remainingQuantity;
    
    costParts.push({
      batchTime: new Date(),
      orderNumber: '(庫存不足，使用最後批次價格)',
      quantity: remainingQuantity,
      unit_price: unitPrice,
      cost: partCost
    });
    
    totalCost += partCost;
  }
  
  return {
    totalCost,
    costParts,
    averageUnitCost: totalCost / quantity
  };
}

module.exports = router;
