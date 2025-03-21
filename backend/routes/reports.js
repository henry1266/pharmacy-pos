const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// @route   GET api/reports/sales/daily
// @desc    Get daily sales report
// @access  Private
router.get('/sales/daily', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let startDate, endDate;
    
    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // 默認為今天
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }
    
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('items.product', ['name', 'code']);
    
    // 計算總銷售額和銷售數量
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    // 計算各產品銷售情況
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product._id.toString();
        const productName = item.product.name;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            name: productName,
            code: item.product.code,
            quantity: 0,
            amount: 0
          };
        }
        
        productSales[productId].quantity += item.quantity;
        productSales[productId].amount += item.quantity * item.price;
      });
    });
    
    res.json({
      date: startDate,
      totalSales,
      totalItems,
      salesCount: sales.length,
      productSales: Object.values(productSales)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/sales/monthly
// @desc    Get monthly sales report
// @access  Private
router.get('/sales/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    let startDate, endDate;
    
    if (year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    } else {
      // 默認為當月
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('items.product', ['name', 'code']);
    
    // 按日期分組
    const dailySales = {};
    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const dateKey = saleDate.toISOString().split('T')[0];
      
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          salesCount: 0
        };
      }
      
      dailySales[dateKey].totalAmount += sale.totalAmount;
      dailySales[dateKey].salesCount += 1;
    });
    
    // 計算總銷售額和銷售數量
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    // 計算各產品銷售情況
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product._id.toString();
        const productName = item.product.name;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            name: productName,
            code: item.product.code,
            quantity: 0,
            amount: 0
          };
        }
        
        productSales[productId].quantity += item.quantity;
        productSales[productId].amount += item.quantity * item.price;
      });
    });
    
    // 按銷售額排序產品
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    
    res.json({
      startDate,
      endDate,
      totalSales,
      totalItems,
      salesCount: sales.length,
      dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
      topProducts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/inventory/status
// @desc    Get inventory status report
// @access  Private
router.get('/inventory/status', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate('product', ['name', 'code', 'specification', 'minimumStock']);
    
    // 計算庫存狀態
    const inventoryStatus = inventory.map(item => {
      const minimumStock = item.product.minimumStock || 0;
      const status = item.quantity <= minimumStock ? '低於安全庫存' : '正常';
      
      return {
        productId: item.product._id,
        productName: item.product.name,
        productCode: item.product.code,
        specification: item.product.specification,
        currentStock: item.quantity,
        minimumStock,
        status,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        location: item.location
      };
    });
    
    // 計算庫存統計
    const totalProducts = inventoryStatus.length;
    const lowStockProducts = inventoryStatus.filter(item => item.status === '低於安全庫存').length;
    const normalStockProducts = totalProducts - lowStockProducts;
    
    res.json({
      totalProducts,
      lowStockProducts,
      normalStockProducts,
      inventoryStatus
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/inventory/expiry
// @desc    Get inventory expiry report
// @access  Private
router.get('/inventory/expiry', auth, async (req, res) => {
  try {
    const { days } = req.query;
    const daysToExpiry = parseInt(days) || 90; // 默認90天
    
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + daysToExpiry);
    
    const inventory = await Inventory.find({
      expiryDate: { $ne: null, $lte: expiryDate }
    }).populate('product', ['name', 'code', 'specification']);
    
    // 計算到期天數
    const expiryItems = inventory.map(item => {
      const daysLeft = Math.ceil((new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24));
      
      return {
        productId: item.product._id,
        productName: item.product.name,
        productCode: item.product.code,
        specification: item.product.specification,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        daysLeft,
        quantity: item.quantity,
        location: item.location
      };
    });
    
    // 按到期天數排序
    expiryItems.sort((a, b) => a.daysLeft - b.daysLeft);
    
    res.json({
      expiryItems,
      totalExpiryItems: expiryItems.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/customers/top
// @desc    Get top customers report
// @access  Private
router.get('/customers/top', auth, async (req, res) => {
  try {
    const { limit, period } = req.query;
    const topLimit = parseInt(limit) || 10; // 默認前10名
    
    let startDate;
    const endDate = new Date();
    
    // 設置時間範圍
    if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // 默認為全部時間
      startDate = new Date(0);
    }
    
    // 獲取所有銷售記錄
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate },
      customer: { $ne: null }
    }).populate('customer', ['name', 'code', 'phone']);
    
    // 按客戶分組計算銷售額
    const customerSales = {};
    sales.forEach(sale => {
      const customerId = sale.customer._id.toString();
      const customerName = sale.customer.name;
      
      if (!customerSales[customerId]) {
        customerSales[customerId] = {
          customerId,
          customerName,
          customerCode: sale.customer.code,
          customerPhone: sale.customer.phone,
          totalAmount: 0,
          salesCount: 0
        };
      }
      
      customerSales[customerId].totalAmount += sale.totalAmount;
      customerSales[customerId].salesCount += 1;
    });
    
    // 按銷售額排序客戶
    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, topLimit);
    
    res.json({
      period: period || 'all',
      topCustomers
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
