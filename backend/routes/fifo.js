const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
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

// @route   GET api/fifo/sale/:saleId
// @desc    Calculate FIFO profit for a specific sale
// @access  Public
router.get('/sale/:saleId', async (req, res) => {
  try {
    // 獲取銷售訂單
    const sale = await Sale.findById(req.params.saleId)
      .populate('items.product');
    
    if (!sale) {
      return res.status(404).json({ msg: '找不到該銷售訂單' });
    }
    
    // 計算每個產品的FIFO毛利
    const itemsWithProfit = [];
    let totalProfit = 0;
    let totalCost = 0;
    
    for (const item of sale.items) {
      // 獲取產品的所有庫存記錄
      const inventories = await Inventory.find({ product: item.product._id })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      if (inventories.length === 0) {
        // 如果沒有庫存記錄，添加默認值
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
      
      // 計算FIFO成本和毛利
      const fifoResult = calculateProductFIFO(inventories);
      
      // 找到對應此銷售的毛利記錄
      const profitRecord = fifoResult.profitMargins.find(p => 
        p.orderType === 'sale' && 
        p.orderId === req.params.saleId
      );
      
      // 如果找到對應記錄，添加到結果中
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
        // 如果沒有找到對應記錄，添加默認值
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
    
    // 計算總毛利率
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
    
    // 獲取產品的所有庫存記錄（包括進貨、銷貨和出貨）
    const allInventories = await Inventory.find({ 
      product: productId
    })
    .populate('product')
    .sort({ lastUpdated: 1 }); // 按時間排序
    
    if (allInventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    // 準備庫存數據，包括所有類型的庫存記錄
    const { stockIn, stockOut } = prepareInventoryForFIFO(allInventories);
    
    // 計算已經消耗的庫存
    // 先處理已有的出貨記錄，計算每個批次的剩餘數量
    const processedStockIn = [...stockIn]; // 複製一份進貨記錄
    let inIndex = 0;
    
    // 處理每一筆已有的出貨記錄
    for (const out of stockOut) {
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
    
    // 過濾出還有剩餘數量的批次
    const availableStockIn = processedStockIn.filter(batch => {
      return !batch.remainingQty || batch.remainingQty > 0;
    }).map(batch => {
      // 如果有remainingQty屬性，使用它作為數量；否則使用原始數量
      return {
        ...batch,
        quantity: batch.remainingQty || batch.quantity
      };
    });
    
    console.log(`可用庫存批次數: ${availableStockIn.length}`);
    availableStockIn.forEach((batch, index) => {
      console.log(`批次[${index}]: 訂單號=${batch.orderNumber}, 剩餘數量=${batch.quantity}`);
    });
    
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
    
    // 執行FIFO匹配，使用可用的庫存
    const fifoMatches = matchFIFOBatches(availableStockIn, simulatedStockOut);
    
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
    const productInfo = allInventories[0].product;
    
    // 計算實際可用庫存數量
    const availableQuantity = availableStockIn.reduce((sum, batch) => sum + batch.quantity, 0);
    
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
      availableQuantity
    });
  } catch (err) {
    console.error('FIFO模擬計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
