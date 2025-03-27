const express = require('express');
const router = express.Router();
const { BaseProduct } = require('../models/BaseProduct');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');

// @route   GET api/dashboard/summary
// @desc    Get dashboard summary data
// @access  Public
router.get('/summary', async (req, res) => {
  try {
    // 獲取總銷售額
    const sales = await Sale.find();
    const totalSales = sales.reduce((total, sale) => total + sale.totalAmount, 0);
    
    // 獲取今日銷售額
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await Sale.find({ date: { $gte: today } });
    const todaySalesAmount = todaySales.reduce((total, sale) => total + sale.totalAmount, 0);
    
    // 獲取本月銷售額
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await Sale.find({ date: { $gte: firstDayOfMonth } });
    const monthSalesAmount = monthSales.reduce((total, sale) => total + sale.totalAmount, 0);
    
    // 獲取庫存警告（低於最低庫存量的產品）
    const lowStockProducts = await Inventory.find().populate('product');
    const lowStockWarnings = lowStockProducts.filter(item => {
      return item.product && item.quantity < item.product.minStock;
    }).map(item => ({
      productId: item.product._id,
      productCode: item.product.code,
      productName: item.product.name,
      currentStock: item.quantity,
      minStock: item.product.minStock
    }));
    
    // 獲取各種統計數據
    const productCount = await BaseProduct.countDocuments();
    const customerCount = await Customer.countDocuments();
    const supplierCount = await Supplier.countDocuments();
    const orderCount = sales.length;
    
    // 獲取最暢銷產品
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.subtotal;
      });
    });
    
    const topProductsPromises = Object.keys(productSales)
      .sort((a, b) => productSales[b].quantity - productSales[a].quantity)
      .slice(0, 5)
      .map(async (productId) => {
        const product = await BaseProduct.findById(productId);
        return {
          productId,
          productCode: product ? product.code : 'Unknown',
          productName: product ? product.name : 'Unknown',
          quantity: productSales[productId].quantity,
          revenue: productSales[productId].revenue
        };
      });
    
    const topProducts = await Promise.all(topProductsPromises);
    
    // 獲取最近的銷售記錄
    const recentSales = await Sale.find()
      .populate('customer')
      .sort({ date: -1 })
      .limit(5)
      .select('invoiceNumber customer totalAmount date paymentStatus');
    
    const formattedRecentSales = recentSales.map(sale => ({
      id: sale._id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customer ? sale.customer.name : '一般客戶',
      totalAmount: sale.totalAmount,
      date: sale.date,
      paymentStatus: sale.paymentStatus
    }));
    
    // 返回儀表板數據
    res.json({
      salesSummary: {
        total: totalSales,
        today: todaySalesAmount,
        month: monthSalesAmount
      },
      counts: {
        products: productCount,
        customers: customerCount,
        suppliers: supplierCount,
        orders: orderCount
      },
      lowStockWarnings,
      topProducts,
      recentSales: formattedRecentSales
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/dashboard/sales-trend
// @desc    Get sales trend data for charts
// @access  Public
router.get('/sales-trend', async (req, res) => {
  try {
    // 獲取過去30天的銷售數據
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sales = await Sale.find({
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    // 按日期分組
    const salesByDate = {};
    sales.forEach(sale => {
      const dateStr = sale.date.toISOString().split('T')[0];
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = {
          amount: 0,
          count: 0
        };
      }
      salesByDate[dateStr].amount += sale.totalAmount;
      salesByDate[dateStr].count += 1;
    });
    
    // 填充缺失的日期
    const salesTrend = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      salesTrend.unshift({
        date: dateStr,
        amount: salesByDate[dateStr] ? salesByDate[dateStr].amount : 0,
        count: salesByDate[dateStr] ? salesByDate[dateStr].count : 0
      });
    }
    
    // 獲取按產品類別分組的銷售數據
    const productIds = [...new Set(sales.flatMap(sale => sale.items.map(item => item.product.toString())))];
    const products = await BaseProduct.find({ _id: { $in: productIds } });
    
    const salesByCategory = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product) {
          const category = product.category;
          if (!salesByCategory[category]) {
            salesByCategory[category] = 0;
          }
          salesByCategory[category] += item.subtotal;
        }
      });
    });
    
    const categorySales = Object.keys(salesByCategory).map(category => ({
      category,
      amount: salesByCategory[category]
    })).sort((a, b) => b.amount - a.amount);
    
    res.json({
      salesTrend,
      categorySales
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
