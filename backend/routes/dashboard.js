const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// @route   GET api/dashboard/summary
// @desc    Get dashboard summary data
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    // 獲取今日日期範圍
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // 獲取昨日日期範圍
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    
    // 獲取本月日期範圍
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // 獲取今日銷售數據
    const todaySales = await Sale.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    });
    
    // 獲取昨日銷售數據
    const yesterdaySales = await Sale.find({
      date: { $gte: startOfYesterday, $lte: endOfYesterday }
    });
    
    // 獲取本月銷售數據
    const monthSales = await Sale.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    // 計算今日銷售總額
    const todaySalesTotal = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // 計算昨日銷售總額
    const yesterdaySalesTotal = yesterdaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // 計算本月銷售總額
    const monthSalesTotal = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // 計算今日訂單數
    const todayOrderCount = todaySales.length;
    
    // 計算昨日訂單數
    const yesterdayOrderCount = yesterdaySales.length;
    
    // 計算本月訂單數
    const monthOrderCount = monthSales.length;
    
    // 獲取庫存數據
    const inventory = await Inventory.find().populate('product', ['minimumStock']);
    
    // 計算庫存總數量
    const totalInventoryCount = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    // 計算低庫存產品數量
    const lowStockCount = inventory.filter(item => {
      const minimumStock = item.product.minimumStock || 0;
      return item.quantity <= minimumStock;
    }).length;
    
    // 獲取客戶數據
    const customerCount = await Customer.countDocuments();
    
    // 獲取供應商數據
    const supplierCount = await Supplier.countDocuments();
    
    // 獲取產品數據
    const productCount = await Product.countDocuments();
    
    // 計算銷售增長率
    const salesGrowthRate = yesterdaySalesTotal > 0 
      ? ((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal * 100).toFixed(2)
      : 0;
    
    // 計算訂單增長率
    const orderGrowthRate = yesterdayOrderCount > 0
      ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount * 100).toFixed(2)
      : 0;
    
    // 獲取熱門產品
    const productSales = {};
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.toString();
        
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            quantity: 0,
            amount: 0
          };
        }
        
        productSales[productId].quantity += item.quantity;
        productSales[productId].amount += item.quantity * item.price;
      });
    });
    
    // 獲取產品詳情
    const productIds = Object.keys(productSales);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // 合併產品詳情
    products.forEach(product => {
      const productId = product._id.toString();
      if (productSales[productId]) {
        productSales[productId].name = product.name;
        productSales[productId].code = product.code;
      }
    });
    
    // 按銷售額排序熱門產品
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    res.json({
      date: today,
      sales: {
        today: todaySalesTotal,
        yesterday: yesterdaySalesTotal,
        month: monthSalesTotal,
        growth: salesGrowthRate
      },
      orders: {
        today: todayOrderCount,
        yesterday: yesterdayOrderCount,
        month: monthOrderCount,
        growth: orderGrowthRate
      },
      inventory: {
        total: totalInventoryCount,
        lowStock: lowStockCount
      },
      counts: {
        customers: customerCount,
        suppliers: supplierCount,
        products: productCount
      },
      topProducts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/dashboard/sales-trend
// @desc    Get sales trend data for dashboard
// @access  Private
router.get('/sales-trend', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const today = new Date();
    let startDate, endDate, format;
    
    // 設置時間範圍和格式
    if (period === 'week') {
      // 過去7天
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      format = 'day';
    } else if (period === 'month') {
      // 過去30天
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      format = 'day';
    } else if (period === 'year') {
      // 過去12個月
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      format = 'month';
    } else {
      // 默認為過去7天
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      format = 'day';
    }
    
    // 獲取銷售數據
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    // 按日期分組
    const salesByDate = {};
    
    if (format === 'day') {
      // 初始化日期範圍內的每一天
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        salesByDate[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          orderCount: 0
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 填充銷售數據
      sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dateKey = saleDate.toISOString().split('T')[0];
        
        if (salesByDate[dateKey]) {
          salesByDate[dateKey].totalAmount += sale.totalAmount;
          salesByDate[dateKey].orderCount += 1;
        }
      });
    } else if (format === 'month') {
      // 初始化日期範圍內的每個月
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        salesByDate[yearMonth] = {
          date: yearMonth,
          totalAmount: 0,
          orderCount: 0
        };
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // 填充銷售數據
      sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const yearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (salesByDate[yearMonth]) {
          salesByDate[yearMonth].totalAmount += sale.totalAmount;
          salesByDate[yearMonth].orderCount += 1;
        }
      });
    }
    
    // 轉換為數組並排序
    const salesTrend = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      period: period || 'week',
      format,
      startDate,
      endDate,
      salesTrend
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/dashboard/product-categories
// @desc    Get product categories distribution for dashboard
// @access  Private
router.get('/product-categories', auth, async (req, res) => {
  try {
    // 獲取所有產品
    const products = await Product.find();
    
    // 按類別分組
    const categoryCounts = {};
    products.forEach(product => {
      const category = product.category || '未分類';
      
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      
      categoryCounts[category] += 1;
    });
    
    // 轉換為數組
    const categories = Object.keys(categoryCounts).map(category => ({
      name: category,
      count: categoryCounts[category]
    }));
    
    res.json({
      totalProducts: products.length,
      categories
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
