const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { BaseProduct } = require('../models/BaseProduct');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

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
            productId: item.product._id,
            productName: item.product.name,
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
            productId: item.product._id,
            productName: item.product.name,
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
          const productId = item.product._id.toString();
          if (!salesByProduct[productId]) {
            salesByProduct[productId] = {
              productId,
              productCode: item.product.code,
              productName: item.product.name,
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
        const customerId = sale.customer ? sale.customer._id.toString() : 'anonymous';
        const customerName = sale.customer ? sale.customer.name : '一般客戶';
        
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
      groupedData = sales.map(sale => ({
        id: sale._id,
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        customerName: sale.customer ? sale.customer.name : '一般客戶',
        totalAmount: sale.totalAmount,
        discount: sale.discount,
        tax: sale.tax,
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        items: sale.items.map(item => ({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.subtotal
        }))
      }));
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
    const { productType } = req.query;
    
    // 獲取庫存數據
    const inventory = await Inventory.find().populate('product');
    
    // 處理數據
    const inventoryData = inventory.map(item => {
      if (!item.product) {
        return null;
      }
      
      return {
        id: item._id,
        productId: item.product._id,
        productCode: item.product.code,
        productName: item.product.name,
        category: item.product.category,
        productType: item.product.productType || 'product', // 確保有產品類型
        quantity: item.quantity,
        unit: item.product.unit,
        purchasePrice: item.product.purchasePrice,
        sellingPrice: item.product.sellingPrice,
        inventoryValue: item.quantity * item.product.purchasePrice,
        potentialRevenue: item.quantity * item.product.sellingPrice,
        potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
        minStock: item.product.minStock,
        status: item.quantity <= item.product.minStock ? 'low' : 'normal',
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        location: item.location,
        lastUpdated: item.lastUpdated
      };
    }).filter(Boolean);
    
    // 如果指定了產品類型，則過濾數據
    let filteredData = inventoryData;
    if (productType && (productType === 'product' || productType === 'medicine')) {
      filteredData = inventoryData.filter(item => item.productType === productType);
    }
    
    // 計算總計
    const totalInventoryValue = filteredData.reduce((sum, item) => sum + item.inventoryValue, 0);
    const totalPotentialRevenue = filteredData.reduce((sum, item) => sum + item.potentialRevenue, 0);
    const totalPotentialProfit = filteredData.reduce((sum, item) => sum + item.potentialProfit, 0);
    const lowStockCount = filteredData.filter(item => item.status === 'low').length;
    
    // 按類別分組
    const categoryGroups = {};
    filteredData.forEach(item => {
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
    
    res.json({
      data: filteredData,
      summary: {
        totalItems: filteredData.length,
        totalInventoryValue,
        totalPotentialRevenue,
        totalPotentialProfit,
        lowStockCount
      },
      categoryGroups: Object.values(categoryGroups),
      productTypeGroups: Object.values(productTypeGroups)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/accounting
// @desc    Get accounting report data
// @access  Public
router.get('/accounting', async (req, res) => {
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
    
    // 獲取記帳數據
    const accounting = await Accounting.find(query).sort({ date: 1 });
    
    // 處理分組
    let groupedData = [];
    
    if (groupBy === 'day') {
      // 按日分組
      const accountingByDay = {};
      accounting.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        if (!accountingByDay[dateStr]) {
          accountingByDay[dateStr] = {
            date: dateStr,
            totalAmount: 0,
            items: []
          };
        }
        
        record.items.forEach(item => {
          accountingByDay[dateStr].totalAmount += Number(item.amount);
          accountingByDay[dateStr].items.push({
            category: item.category,
            amount: Number(item.amount),
            note: item.note
          });
        });
      });
      
      groupedData = Object.values(accountingByDay);
    } else if (groupBy === 'category') {
      // 按類別分組
      const accountingByCategory = {};
      accounting.forEach(record => {
        record.items.forEach(item => {
          if (!accountingByCategory[item.category]) {
            accountingByCategory[item.category] = {
              category: item.category,
              totalAmount: 0,
              count: 0
            };
          }
          
          accountingByCategory[item.category].totalAmount += Number(item.amount);
          accountingByCategory[item.category].count += 1;
        });
      });
      
      groupedData = Object.values(accountingByCategory).sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (groupBy === 'shift') {
      // 按班別分組
      const accountingByShift = {
        '早': { shift: '早班', totalAmount: 0, count: 0, items: [] },
        '中': { shift: '中班', totalAmount: 0, count: 0, items: [] },
        '晚': { shift: '晚班', totalAmount: 0, count: 0, items: [] }
      };
      
      accounting.forEach(record => {
        if (accountingByShift[record.shift]) {
          record.items.forEach(item => {
            accountingByShift[record.shift].totalAmount += Number(item.amount);
            accountingByShift[record.shift].count += 1;
            accountingByShift[record.shift].items.push({
              category: item.category,
              amount: Number(item.amount),
              note: item.note
            });
          });
        }
      });
      
      groupedData = Object.values(accountingByShift);
    } else {
      // 不分組，返回所有記帳記錄
      groupedData = accounting.map(record => ({
        id: record._id,
        date: record.date,
        shift: record.shift,
        totalAmount: record.items.reduce((sum, item) => sum + Number(item.amount), 0),
        items: record.items.map(item => ({
          category: item.category,
          amount: Number(item.amount),
          note: item.note
        }))
      }));
    }
    
    // 計算總計
    let totalAmount = 0;
    let totalCount = 0;
    
    accounting.forEach(record => {
      record.items.forEach(item => {
        totalAmount += Number(item.amount);
        totalCount += 1;
      });
    });
    
    // 按類別統計
    const categoryStats = {};
    accounting.forEach(record => {
      record.items.forEach(item => {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = {
            category: item.category,
            totalAmount: 0,
            count: 0
          };
        }
        
        categoryStats[item.category].totalAmount += Number(item.amount);
        categoryStats[item.category].count += 1;
      });
    });
    
    res.json({
      data: groupedData,
      summary: {
        totalAmount,
        totalCount,
        recordCount: accounting.length
      },
      categoryStats: Object.values(categoryStats).sort((a, b) => b.totalAmount - a.totalAmount)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
