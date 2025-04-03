const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const auth = require('../middleware/auth'); // 已移除
const Sale = require('../models/Sale');
const { BaseProduct } = require('../models/BaseProduct');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');

// @route   GET api/sales
// @desc    Get all sales
// @access  Public (已改為公開)
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer')
      .populate('items.product')
      .populate('cashier')
      .sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Public (已改為公開)
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('cashier');
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
// @access  Public (已改為公開)
router.post(
  '/',
  [
    // 移除 auth
    // auth,
    [
      check('items', '至少需要一個銷售項目').isArray({ min: 1 }),
      check('totalAmount', '總金額為必填項').isNumeric(),
      check('cashier', '收銀員ID為必填項').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      customer,
      items,
      totalAmount,
      discount,
      tax,
      paymentMethod,
      paymentStatus,
      note,
      cashier
    } = req.body;
    try {
      // 移除發票號碼檢查
      
      // 檢查客戶是否存在
      if (customer) {
        const customerExists = await Customer.findById(customer);
        if (!customerExists) {
          return res.status(404).json({ msg: '客戶不存在' });
        }
      }
      
      // 檢查所有產品是否存在並更新庫存
      for (const item of items) {
        const product = await BaseProduct.findById(item.product);
        if (!product) {
          return res.status(404).json({ msg: `產品ID ${item.product} 不存在` });
        }
        
        // 更新庫存
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          if (inventory.quantity < item.quantity) {
            return res.status(400).json({ 
              msg: `產品 ${product.name} 庫存不足，當前庫存: ${inventory.quantity}，需求: ${item.quantity}` 
            });
          }
          
          inventory.quantity -= item.quantity;
          inventory.lastUpdated = Date.now();
          await inventory.save();
        } else {
          return res.status(400).json({ msg: `產品 ${product.name} 無庫存記錄` });
        }
      }
      
      // 建立銷售記錄
      const saleFields = {
        items,
        totalAmount,
        cashier
      };
      if (customer) saleFields.customer = customer;
      if (discount) saleFields.discount = discount;
      if (tax) saleFields.tax = tax;
      if (paymentMethod) saleFields.paymentMethod = paymentMethod;
      if (paymentStatus) saleFields.paymentStatus = paymentStatus;
      if (note) saleFields.note = note;

      const sale = new Sale(saleFields);
      await sale.save();
      
      // 如果有客戶，更新客戶積分
      if (customer) {
        const customerToUpdate = await Customer.findById(customer);
        if (customerToUpdate) {
          // 假設每消費100元獲得1點積分
          const pointsToAdd = Math.floor(totalAmount / 100);
          customerToUpdate.points = (customerToUpdate.points || 0) + pointsToAdd;
          await customerToUpdate.save();
        }
      }
      
      res.json(sale);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
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
    let sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    // 建立更新欄位物件
    const saleFields = {};
    if (invoiceNumber && invoiceNumber !== sale.invoiceNumber) {
      // 檢查新發票號碼是否已存在
      const existingSale = await Sale.findOne({ invoiceNumber });
      if (existingSale) {
        return res.status(400).json({ msg: '發票號碼已存在' });
      }
      saleFields.invoiceNumber = invoiceNumber;
    }
    
    // 只允許更新部分欄位，不允許更新項目和總金額以避免庫存問題
    if (customer) saleFields.customer = customer;
    if (discount !== undefined) saleFields.discount = discount;
    if (tax !== undefined) saleFields.tax = tax;
    if (paymentMethod) saleFields.paymentMethod = paymentMethod;
    if (paymentStatus) saleFields.paymentStatus = paymentStatus;
    if (note !== undefined) saleFields.note = note;
    
    // 更新
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
// @access  Public (已改為公開)
router.delete('/:id', async (req, res) => {
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
    
    // 如果有客戶，扣除積分
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        // 假設每消費100元獲得1點積分
        const pointsToDeduct = Math.floor(sale.totalAmount / 100);
        customer.points = Math.max(0, (customer.points || 0) - pointsToDeduct);
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

// @route   GET api/sales/customer/:customerId
// @desc    Get sales by customer ID
// @access  Public (已改為公開)
router.get('/customer/:customerId', async (req, res) => {
  try {
    const sales = await Sale.find({ customer: req.params.customerId })
      .populate('customer')
      .populate('items.product')
      .populate('cashier')
      .sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
