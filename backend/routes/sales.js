const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const { BaseProduct } = require('../models/BaseProduct');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');

// @route   GET api/sales
// @desc    Get all sales
// @access  Public
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
// @access  Public
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
// @access  Public
router.post(
  '/',
  [
    [
      check('items', '至少需要一個銷售項目').isArray({ min: 1 }),
      check('totalAmount', '總金額為必填項').isNumeric()
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
      paymentMethod,
      paymentStatus,
      note,
      cashier
    } = req.body;
    try {
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
        
        // 更新庫存 - 修改查詢方式，確保正確匹配產品ID
        console.log(`檢查產品ID: ${item.product}, 名稱: ${product.name}`);
        
        try {
          // 使用lean()獲取純JavaScript對象，避免Mongoose文檔轉換問題
          const inventories = await Inventory.find({}).lean();
          console.log(`找到 ${inventories.length} 個庫存記錄`);
          
          // 手動查找匹配的庫存記錄
          let inventory = null;
          for (const inv of inventories) {
            if (inv.product && inv.product.toString() === item.product.toString()) {
              inventory = inv;
              console.log(`找到匹配的庫存記錄: ${inv._id}, 數量: ${inv.quantity}`);
              break;
            }
          }
          
          if (inventory) {
            // 直接從數據庫重新獲取庫存記錄，確保數據最新
            const freshInventory = await Inventory.findById(inventory._id);
            console.log(`產品 ${product.name} 當前庫存: ${freshInventory.quantity}`);
            
            if (freshInventory.quantity < item.quantity) {
              return res.status(400).json({ 
                msg: `產品 ${product.name} 庫存不足，當前庫存: ${freshInventory.quantity}，需求: ${item.quantity}` 
              });
            }
            
            freshInventory.quantity -= item.quantity;
            freshInventory.lastUpdated = Date.now();
            await freshInventory.save();
            console.log(`更新後庫存: ${freshInventory.quantity}`);
          } else {
            console.log(`未找到產品 ${product.name} 的庫存記錄`);
            return res.status(400).json({ msg: `產品 ${product.name} 無庫存記錄` });
          }
        } catch (err) {
          console.error(`庫存檢查錯誤:`, err);
          return res.status(500).json({ msg: `庫存檢查錯誤: ${err.message}` });
        }
      }
      
      // 建立銷售記錄
      const saleFields = {
        items,
        totalAmount,
      };
      if (customer) saleFields.customer = customer;
      if (discount) saleFields.discount = discount;
      if (paymentMethod) saleFields.paymentMethod = paymentMethod;
      if (paymentStatus) saleFields.paymentStatus = paymentStatus;
      if (note) saleFields.note = note;
      if (cashier) saleFields.cashier = cashier;

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

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
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
// @access  Public
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
