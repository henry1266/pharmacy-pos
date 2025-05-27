const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { BaseProduct } = require('../models/BaseProduct');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

// @route   GET api/reports/sales
// @desc    Get sales report data
// @access  Public
router.get('/sales', async (req, res) => {
  try {
    // 獲取查詢參數
    const { startDate, endDate, groupBy } = req.query;
    
    // 設置日期範圍
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
      // 設置結束日期為當天的最後一毫秒
      dateFilter.$lte.setHours(23, 59, 59, 999);
    }
    
    // 構建查詢條件
    const query = {};
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    // 獲取銷售數據
    const sales = await Sale.find(query)
      .populate('customer')
      .populate('items.product')
      .populate('cashier')
      .sort({ date: 1 });
    
    // 處理分組
    let groupedData = [];
    
    if (groupBy === 'day') {
      // 按日分組
      const salesByDay = {};
      sales.forEach(sale => {
        const dateStr = sale.date.toISOString().split('T')[0];
        if (!salesByDay[dateStr]) {
          salesByDay[dateStr] = {
            date: dateStr,
            totalAmount: 0,
            orderCount: 0,
            items: []
          };
        }
        salesByDay[dateStr].totalAmount += sale.totalAmount;
        salesByDay[dateStr].orderCount += 1;
        sale.items.forEach(item => {
          salesByDay[dateStr].items.push({
            productId: item.product._id.toString(), // 修正：確保轉換為字串
            productName: item.product.name ? item.product.name.toString() : "", // 修正：確保轉換為字串
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          });
        });
      });
      
      groupedData = Object.values(salesByDay);
    } else if (groupBy === 'month') {
      // 按月分組
      const salesByMonth = {};
      sales.forEach(sale => {
        const date = new Date(sale.date);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!salesByMonth[monthStr]) {
          salesByMonth[monthStr] = {
            month: monthStr,
            totalAmount: 0,
            orderCount: 0,
            items: []
          };
        }
        salesByMonth[monthStr].totalAmount += sale.totalAmount;
        salesByMonth[monthStr].orderCount += 1;
        sale.items.forEach(item => {
          salesByMonth[monthStr].items.push({
            productId: item.product._id.toString(), // 修正：確保轉換為字串
            productName: item.product.name ? item.product.name.toString() : "", // 修正：確保轉換為字串
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          });
        });
      });
      
      groupedData = Object.values(salesByMonth);
    } else if (groupBy === 'product') {
      // 按產品分組
      const salesByProduct = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const productId = item.product._id.toString(); // 已經正確轉換為字串
          if (!salesByProduct[productId]) {
            salesByProduct[productId] = {
              productId,
              productCode: item.product.code ? item.product.code.toString() : "", // 修正：確保轉換為字串
              productName: item.product.name ? item.product.name.toString() : "", // 修正：確保轉換為字串
              quantity: 0,
              revenue: 0,
              orderCount: 0
            };
          }
          salesByProduct[productId].quantity += item.quantity;
          salesByProduct[productId].revenue += item.subtotal;
          salesByProduct[productId].orderCount += 1;
        });
      });
      
      groupedData = Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue);
    } else if (groupBy === 'customer') {
      // 按客戶分組
      const salesByCustomer = {};
      sales.forEach(sale => {
        // 修正：提取巢狀三元運算子為獨立陳述式
        let customerId = 'anonymous';
        if (sale.customer) {
          customerId = sale.customer._id.toString();
        }
        
        // 修正：提取巢狀三元運算子為獨立陳述式
        let customerName = '一般客戶';
        if (sale.customer) {
          if (sale.customer.name) {
            customerName = sale.customer.name.toString();
          }
        }
        
        if (!salesByCustomer[customerId]) {
          salesByCustomer[customerId] = {
            customerId,
            customerName,
            totalAmount: 0,
            orderCount: 0
          };
        }
        salesByCustomer[customerId].totalAmount += sale.totalAmount;
        salesByCustomer[customerId].orderCount += 1;
      });
      
      groupedData = Object.values(salesByCustomer).sort((a, b) => b.totalAmount - a.totalAmount);
    } else {
      // 不分組，返回所有銷售記錄
      groupedData = sales.map(sale => {
        // 修正：提取巢狀三元運算子為獨立陳述式
        let customerName = '一般客戶';
        if (sale.customer) {
          if (sale.customer.name) {
            customerName = sale.customer.name.toString();
          }
        }
        
        return {
          id: sale._id.toString(), // 修正：確保轉換為字串
          invoiceNumber: sale.invoiceNumber ? sale.invoiceNumber.toString() : "", // 修正：確保轉換為字串
          date: sale.date,
          customerName: customerName,
          totalAmount: sale.totalAmount,
          discount: sale.discount,
          tax: sale.tax,
          paymentMethod: sale.paymentMethod ? sale.paymentMethod.toString() : "", // 修正：確保轉換為字串
          paymentStatus: sale.paymentStatus ? sale.paymentStatus.toString() : "", // 修正：確保轉換為字串
          items: sale.items.map(item => ({
            productId: item.product._id.toString(), // 修正：確保轉換為字串
            productName: item.product.name ? item.product.name.toString() : "", // 修正：確保轉換為字串
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.subtotal
          }))
        };
      });
    }
    
    // 計算總計
    const summary = {
      totalSales: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      orderCount: sales.length,
      averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0
    };
    
    res.json({
      data: groupedData,
      summary
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/inventory
// @desc    Get inventory report data
// @access  Public
router.get('/inventory', async (req, res) => {
  try {
    // 獲取查詢參數
    const { productType, category, supplier, productCode, productName } = req.query;
    
    // 構建產品查詢條件
    const productQuery = {};
    if (productType && (productType === 'product' || productType === 'medicine')) {
      productQuery.productType = productType.toString(); // 修正：確保轉換為字串
    }
    if (category) {
      productQuery.category = category.toString(); // 修正：確保轉換為字串
    }
    if (supplier) {
      // 修正：確保使用查詢物件包裝參數並轉換為字串
      productQuery.supplier = mongoose.Types.ObjectId(supplier.toString());
    }
    if (productCode) {
      // 修正：確保轉換為字串並安全處理 $regex
      productQuery.code = { $regex: productCode.toString(), $options: 'i' };
    }
    if (productName) {
      // 修正：確保轉換為字串並安全處理 $regex
      productQuery.name = { $regex: productName.toString(), $options: 'i' };
    }
    
    // 獲取符合條件的產品
    const products = await BaseProduct.find(productQuery).populate('supplier');
    const productIds = products.map(product => product._id.toString()); // 修正：確保轉換為字串
    
    // 獲取這些產品的庫存數據
    // 修正：確保使用查詢物件包裝參數
    const inventory = await Inventory.find({ 
      product: { $in: productIds.map(id => id.toString()) } // 修正：確保轉換為字串
    }).populate({
      path: 'product',
      populate: { path: 'supplier' }
    });
    
    // 處理數據
    const inventoryData = inventory.map(item => {
      if (!item.product) {
        return null;
      }
      
      return {
        id: item._id.toString(), // 修正：確保轉換為字串
        productId: item.product._id.toString(), // 修正：確保轉換為字串
        productCode: item.product.code ? item.product.code.toString() : "", // 修正：確保轉換為字串
        productName: item.product.name ? item.product.name.toString() : "", // 修正：確保轉換為字串
        category: item.product.category ? item.product.category.toString() : "", // 修正：確保轉換為字串
        productType: item.product.productType ? item.product.productType.toString() : 'product', // 修正：確保轉換為字串
        supplier: item.product.supplier ? {
          id: item.product.supplier._id.toString(), // 修正：確保轉換為字串
          name: item.product.supplier.name ? item.product.supplier.name.toString() : "" // 修正：確保轉換為字串
        } : null,
        quantity: item.quantity,
        unit: item.product.unit ? item.product.unit.toString() : "", // 修正：確保轉換為字串
        purchasePrice: item.product.purchasePrice,
        sellingPrice: item.product.sellingPrice,
        inventoryValue: item.quantity * item.product.purchasePrice,
        potentialRevenue: item.quantity * item.product.sellingPrice,
        potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
        totalAmount: item.totalAmount || 0, // 添加 totalAmount 欄位
        minStock: item.product.minStock,
        status: item.quantity <= item.product.minStock ? 'low' : 'normal',
        batchNumber: item.batchNumber ? item.batchNumber.toString() : "", // 修正：確保轉換為字串
        expiryDate: item.expiryDate,
        location: item.location ? item.location.toString() : "", // 修正：確保轉換為字串
        lastUpdated: item.lastUpdated,
        purchaseOrderNumber: item.purchaseOrderNumber ? item.purchaseOrderNumber.toString() : "", // 修正：確保轉換為字串
        shippingOrderNumber: item.shippingOrderNumber ? item.shippingOrderNumber.toString() : "", // 修正：確保轉換為字串
        saleNumber: item.saleNumber ? item.saleNumber.toString() : "", // 修正：確保轉換為字串
        type: item.type ? item.type.toString() : "" // 修正：確保轉換為字串
      };
    }).filter(Boolean);
    
    // 計算總計
    const totalInventoryValue = inventoryData.reduce((sum, item) => sum + item.inventoryValue, 0);
    const totalPotentialRevenue = inventoryData.reduce((sum, item) => sum + item.potentialRevenue, 0);
    const totalPotentialProfit = inventoryData.reduce((sum, item) => sum + item.potentialProfit, 0);
    const lowStockCount = inventoryData.filter(item => item.status === 'low').length;
    
    // 按類別分組
    const categoryGroups = {};
    inventoryData.forEach(item => {
      if (!categoryGroups[item.category]) {
        categoryGroups[item.category] = {
          category: item.category,
          itemCount: 0,
          totalQuantity: 0,
          inventoryValue: 0,
          potentialRevenue: 0,
          potentialProfit: 0
        };
      }
      
      categoryGroups[item.category].itemCount += 1;
      categoryGroups[item.category].totalQuantity += item.quantity;
      categoryGroups[item.category].inventoryValue += item.inventoryValue;
      categoryGroups[item.category].potentialRevenue += item.potentialRevenue;
      categoryGroups[item.category].potentialProfit += item.potentialProfit;
    });
    
    // 按產品類型分組
    const productTypeGroups = {
      product: {
        type: 'product',
        label: '商品',
        itemCount: 0,
        totalQuantity: 0,
        inventoryValue: 0,
        potentialRevenue: 0,
        potentialProfit: 0
      },
      medicine: {
        type: 'medicine',
        label: '藥品',
        itemCount: 0,
        totalQuantity: 0,
        inventoryValue: 0,
        potentialRevenue: 0,
        potentialProfit: 0
      }
    };
    
    inventoryData.forEach(item => {
      const type = item.productType || 'product';
      if (productTypeGroups[type]) {
        productTypeGroups[type].itemCount += 1;
        productTypeGroups[type].totalQuantity += item.quantity;
        productTypeGroups[type].inventoryValue += item.inventoryValue;
        productTypeGroups[type].potentialRevenue += item.potentialRevenue;
        productTypeGroups[type].potentialProfit += item.potentialProfit;
      }
    });
    
    // 獲取所有供應商和類別，用於前端篩選器
    const allSuppliers = await Supplier.find({}, 'name');
    const allCategories = [...new Set(products.map(product => product.category))].filter(Boolean);
    
    res.json({
      data: inventoryData,
      summary: {
        totalItems: inventoryData.length,
        totalInventoryValue,
        totalPotentialRevenue,
        totalPotentialProfit,
        lowStockCount
      },
      categoryGroups: Object.values(categoryGroups),
      productTypeGroups: Object.values(productTypeGroups),
      filters: {
        suppliers: allSuppliers,
        categories: allCategories
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/inventory/profit-loss
// @desc    Get inventory profit-loss data by purchase order
// @access  Public
router.get('/inventory/profit-loss', async (req, res) => {
  try {
    // 獲取查詢參數
    const { productType, category, supplier, productCode, productName } = req.query;
    
    // 構建產品查詢條件
    const productQuery = {};
    if (productType && (productType === 'product' || productType === 'medicine')) {
      productQuery.productType = productType.toString(); // 修正：確保轉換為字串
    }
    if (category) {
      productQuery.category = category.toString(); // 修正：確保轉換為字串
    }
    if (supplier) {
      // 修正：確保使用查詢物件包裝參數並轉換為字串
      productQuery.supplier = mongoose.Types.ObjectId(supplier.toString());
    }
    if (productCode) {
      // 修正：確保轉換為字串並安全處理 $regex
      productQuery.code = { $regex: productCode.toString(), $options: 'i' };
    }
    if (productName) {
      // 修正：確保轉換為字串並安全處理 $regex
      productQuery.name = { $regex: productName.toString(), $options: 'i' };
    }
    
    // 獲取符合條件的產品
    const products = await BaseProduct.find(productQuery);
    const productIds = products.map(product => product._id.toString()); // 修正：確保轉換為字串
    
    // 獲取這些產品的庫存數據
    // 修正：確保使用查詢物件包裝參數
    const inventory = await Inventory.find({ 
      product: { $in: productIds.map(id => id.toString()) }, // 修正：確保轉換為字串
      purchaseOrderNumber: { $exists: true, $ne: null }
    }).populate('product');
    
    // 重構：將處理邏輯拆分為更小的函數，降低複雜度
    const profitLossByPO = processProfitLossByPurchaseOrder(inventory);
    
    // 轉換為數組並排序
    const profitLossData = Object.values(profitLossByPO).sort((a, b) => {
      // 按照貨單單號排序
      return a.purchaseOrderNumber.localeCompare(b.purchaseOrderNumber);
    });
    
    // 計算總計
    const summary = calculateProfitLossSummary(profitLossData);
    
    res.json({
      data: profitLossData,
      summary
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 輔助函數：處理按照貨單單號分組並計算盈虧
function processProfitLossByPurchaseOrder(inventory) {
  const profitLossByPO = {};
  
  inventory.forEach(item => {
    if (!item.product) return;
    
    const poNumber = item.purchaseOrderNumber ? item.purchaseOrderNumber.toString() : null; // 修正：確保轉換為字串
    if (!poNumber) return;
    
    if (!profitLossByPO[poNumber]) {
      profitLossByPO[poNumber] = {
        purchaseOrderNumber: poNumber,
        totalQuantity: 0,
        totalCost: 0,
        totalRevenue: 0,
        profitLoss: 0,
        items: []
      };
    }
    
    const cost = item.quantity * item.product.purchasePrice;
    const revenue = item.quantity * item.product.sellingPrice;
    const profit = revenue - cost;
    
    profitLossByPO[poNumber].totalQuantity += item.quantity;
    profitLossByPO[poNumber].totalCost += cost;
    profitLossByPO[poNumber].totalRevenue += revenue;
    profitLossByPO[poNumber].profitLoss += profit;
    
    profitLossByPO[poNumber].items.push({
      productId: item.product._id.toString(), // 修正：確保轉換為字串
      productCode: item.product.code ? item.product.code.toString() : "", // 修正：確保轉換為字串
      productName: item.product.name ? item.product.name.toString() : "", // 修正：確保轉換為字串
      quantity: item.quantity,
      purchasePrice: item.product.purchasePrice,
      sellingPrice: item.product.sellingPrice,
      cost,
      revenue,
      profit
    });
  });
  
  return profitLossByPO;
}

// 輔助函數：計算盈虧總計
function calculateProfitLossSummary(profitLossData) {
  return {
    totalPurchaseOrders: profitLossData.length,
    totalQuantity: profitLossData.reduce((sum, po) => sum + po.totalQuantity, 0),
    totalCost: profitLossData.reduce((sum, po) => sum + po.totalCost, 0),
    totalRevenue: profitLossData.reduce((sum, po) => sum + po.totalRevenue, 0),
    totalProfitLoss: profitLossData.reduce((sum, po) => sum + po.profitLoss, 0)
  };
}

module.exports = router;
