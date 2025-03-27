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
    
    res.json({
      data: inventoryData,
      summary: {
        totalItems: inventoryData.length,
        totalInventoryValue,
        totalPotentialRevenue,
        totalPotentialProfit,
        lowStockCount
      },
      categoryGroups: Object.values(categoryGroups)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/customers
// @desc    Get customer report data
// @access  Public
router.get('/customers', async (req, res) => {
  try {
    // 獲取客戶數據
    const customers = await Customer.find();
    
    // 獲取銷售數據
    const sales = await Sale.find().populate('customer');
    
    // 處理客戶購買數據
    const customerPurchases = {};
    sales.forEach(sale => {
      if (sale.customer) {
        const customerId = sale.customer._id.toString();
        if (!customerPurchases[customerId]) {
          customerPurchases[customerId] = {
            totalSpent: 0,
            orderCount: 0,
            lastPurchase: null
          };
        }
        
        customerPurchases[customerId].totalSpent += sale.totalAmount;
        customerPurchases[customerId].orderCount += 1;
        
        if (!customerPurchases[customerId].lastPurchase || 
            new Date(sale.date) > new Date(customerPurchases[customerId].lastPurchase)) {
          customerPurchases[customerId].lastPurchase = sale.date;
        }
      }
    });
    
    // 合併數據
    const customerData = customers.map(customer => {
      const purchases = customerPurchases[customer._id.toString()] || {
        totalSpent: 0,
        orderCount: 0,
        lastPurchase: null
      };
      
      return {
        id: customer._id,
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        membershipLevel: customer.membershipLevel,
        points: customer.points,
        totalSpent: purchases.totalSpent,
        orderCount: purchases.orderCount,
        averageOrderValue: purchases.orderCount > 0 ? purchases.totalSpent / purchases.orderCount : 0,
        lastPurchase: purchases.lastPurchase
      };
    });
    
    // 按消費金額排序
    customerData.sort((a, b) => b.totalSpent - a.totalSpent);
    
    // 計算總計
    const totalCustomers = customerData.length;
    const totalSpent = customerData.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const totalOrders = customerData.reduce((sum, customer) => sum + customer.orderCount, 0);
    const averageSpentPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
    
    res.json({
      data: customerData,
      summary: {
        totalCustomers,
        totalSpent,
        totalOrders,
        averageSpentPerCustomer
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
