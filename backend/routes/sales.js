const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');

// @route   GET api/sales
// @desc    Get all sales
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ date: -1 })
      .populate('customer', ['name', 'code', 'phone'])
      .populate('cashier', ['name']);
    
    res.json(sales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', ['name', 'code', 'phone'])
      .populate('cashier', ['name'])
      .populate('items.product', ['name', 'code', 'specification']);
    
    if (!sale) {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/sales
// @desc    Create a sale
// @access  Private
router.post('/', [
  auth,
  [
    check('items', '銷售項目為必填項').isArray().notEmpty(),
    check('items.*.product', '產品ID為必填項').not().isEmpty(),
    check('items.*.quantity', '數量為必填項').isNumeric(),
    check('items.*.price', '價格為必填項').isNumeric(),
    check('totalAmount', '總金額為必填項').isNumeric(),
    check('paymentMethod', '付款方式為必填項').not().isEmpty(),
    check('paymentStatus', '付款狀態為必填項').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    invoiceNumber,
    customer,
    items,
    totalAmount,
    discount,
    tax,
    paymentMethod,
    paymentStatus,
    note
  } = req.body;
  
  try {
    // 檢查發票號碼是否已存在
    if (invoiceNumber) {
      const existingSale = await Sale.findOne({ invoiceNumber });
      if (existingSale) {
        return res.status(400).json({ msg: '發票號碼已存在' });
      }
    }
    
    // 檢查客戶是否存在
    if (customer) {
      const customerExists = await Customer.findById(customer);
      if (!customerExists) {
        return res.status(404).json({ msg: '客戶不存在' });
      }
    }
    
    // 檢查產品是否存在並更新庫存
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ msg: `產品ID ${item.product} 不存在` });
      }
      
      // 檢查庫存是否足夠
      const inventory = await Inventory.findOne({ product: item.product });
      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({ 
          msg: `產品 ${product.name} 庫存不足，當前庫存: ${inventory ? inventory.quantity : 0}` 
        });
      }
      
      // 更新庫存
      inventory.quantity -= item.quantity;
      inventory.lastUpdated = Date.now();
      await inventory.save();
    }
    
    // 創建新銷售記錄
    const saleFields = {
      cashier: req.user.id,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      date: Date.now()
    };
    
    if (invoiceNumber) saleFields.invoiceNumber = invoiceNumber;
    if (customer) saleFields.customer = customer;
    if (discount) saleFields.discount = discount;
    if (tax) saleFields.tax = tax;
    if (note) saleFields.note = note;
    
    // 如果沒有提供發票號碼，自動生成
    if (!invoiceNumber) {
      const saleCount = await Sale.countDocuments();
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      saleFields.invoiceNumber = `INV-${dateStr}-${String(saleCount + 1).padStart(4, '0')}`;
    }
    
    const sale = new Sale(saleFields);
    await sale.save();
    
    // 如果有客戶，更新客戶積分
    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        // 假設每消費100元獲得1點積分
        const pointsEarned = Math.floor(totalAmount / 100);
        customerDoc.points = (customerDoc.points || 0) + pointsEarned;
        await customerDoc.save();
      }
    }
    
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    invoiceNumber,
    customer,
    paymentMethod,
    paymentStatus,
    note
  } = req.body;
  
  // 建立更新對象
  const saleFields = {};
  if (invoiceNumber) saleFields.invoiceNumber = invoiceNumber;
  if (customer) saleFields.customer = customer;
  if (paymentMethod) saleFields.paymentMethod = paymentMethod;
  if (paymentStatus) saleFields.paymentStatus = paymentStatus;
  if (note) saleFields.note = note;
  
  try {
    let sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    // 如果發票號碼已更改，檢查新號碼是否已存在
    if (invoiceNumber && invoiceNumber !== sale.invoiceNumber) {
      const existingSale = await Sale.findOne({ invoiceNumber });
      if (existingSale) {
        return res.status(400).json({ msg: '發票號碼已存在' });
      }
    }
    
    // 更新銷售記錄
    sale = await Sale.findByIdAndUpdate(
      req.params.id,
      { $set: saleFields },
      { new: true }
    );
    
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    // 恢復庫存
    for (const item of sale.items) {
      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory) {
        inventory.quantity += item.quantity;
        inventory.lastUpdated = Date.now();
        await inventory.save();
      }
    }
    
    // 如果有客戶，恢復客戶積分
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer && customer.points) {
        // 假設每消費100元獲得1點積分
        const pointsToDeduct = Math.floor(sale.totalAmount / 100);
        customer.points = Math.max(0, customer.points - pointsToDeduct);
        await customer.save();
      }
    }
    
    await sale.remove();
    
    res.json({ msg: '銷售記錄已刪除' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sales/report/daily
// @desc    Get daily sales report
// @access  Private
router.get('/report/daily', auth, async (req, res) => {
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

module.exports = router;
