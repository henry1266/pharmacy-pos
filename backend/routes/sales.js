const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const { BaseProduct } = require('../models/BaseProduct');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');

// 引入通用訂單單號生成服務
const OrderNumberService = require('../utils/OrderNumberService');

// @route   GET api/sales
// @desc    Get all sales
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer')
      .populate('items.product')
      .populate('cashier')
      .sort({ saleNumber: -1 });
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
      .populate({
        path: 'items.product',
        model: 'baseproduct'
      })
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
    const { saleNumber, customer, items, totalAmount, discount, paymentMethod, paymentStatus, note, cashier } = req.body;
    try {
      // 檢查客戶是否存在
      if (customer) {
        const customerExists = await Customer.findById(customer);
        if (!customerExists) {
          return res.status(404).json({ msg: '客戶不存在' });
        }
      }
      
      // 檢查所有產品是否存在
      for (const item of items) {
        const product = await BaseProduct.findById(item.product);
        if (!product) {
          return res.status(404).json({ msg: `產品ID ${item.product} 不存在` });
        }
        
        // 記錄當前庫存量，但不限制負庫存
        console.log(`檢查產品ID: ${item.product}, 名稱: ${product.name}`);
        
        try {
          // 獲取所有庫存記錄
          const inventories = await Inventory.find({ product: item.product }).lean();
          console.log(`找到 ${inventories.length} 個庫存記錄`);
          
          // 計算總庫存量
          let totalQuantity = 0;
          for (const inv of inventories) {
            totalQuantity += inv.quantity;
            console.log(`庫存記錄: ${inv._id}, 類型: ${inv.type || 'purchase'}, 數量: ${inv.quantity}`);
          }
          
          console.log(`產品 ${product.name} 總庫存量: ${totalQuantity}，銷售數量: ${item.quantity}`);
          
          // 不再檢查庫存是否足夠，允許負庫存
          if (totalQuantity < item.quantity) {
            console.log(`警告: 產品 ${product.name} 庫存不足，當前總庫存: ${totalQuantity}，需求: ${item.quantity}，將允許負庫存`);
          }
        } catch (err) {
          console.error(`庫存檢查錯誤:`, err);
          return res.status(500).json({ msg: `庫存檢查錯誤: ${err.message}` });
        }
      }
      
      // 生成銷貨單號（如果未提供）
      let finalSaleNumber = saleNumber;
      if (!finalSaleNumber) {
        // 使用通用訂單單號生成服務
        finalSaleNumber = await OrderNumberService.generateSaleOrderNumber();
      }
      
      // 建立銷售記錄
      const saleFields = {
        saleNumber: finalSaleNumber,
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
      
      // 為每個銷售項目創建負數庫存記錄
      for (const item of items) {
        const inventoryRecord = new Inventory({
          product: item.product,
          quantity: -item.quantity, // 負數表示庫存減少
          totalAmount: Number(item.subtotal), // 添加totalAmount字段
          saleNumber: finalSaleNumber, // 添加銷貨單號
          type: 'sale',
          saleId: sale._id,
          lastUpdated: Date.now()
        });
        
        await inventoryRecord.save();
        console.log(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal}`);
      }
      
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
// @access  Public
router.put('/:id', [
  [
    check('items', '至少需要一個銷售項目').isArray({ min: 1 }),
    check('totalAmount', '總金額為必填項').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    saleNumber,
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
    // 檢查銷售記錄是否存在
    let sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }

    // 檢查客戶是否存在
    if (customer) {
      const customerExists = await Customer.findById(customer);
      if (!customerExists) {
        return res.status(404).json({ msg: '客戶不存在' });
      }
    }

    // 獲取原始銷售項目，用於後續比較
    const originalItems = [...sale.items];
    
    // 檢查所有產品是否存在並檢查庫存是否足夠
    for (const item of items) {
      const product = await BaseProduct.findById(item.product);
      if (!product) {
        return res.status(404).json({ msg: `產品ID ${item.product} 不存在` });
      }
      
      // 查找原始項目中是否存在該產品
      const originalItem = originalItems.find(oi => oi.product.toString() === item.product.toString());
      const originalQuantity = originalItem ? originalItem.quantity : 0;
      
      // 如果新數量大於原始數量，記錄額外庫存需求但不限制負庫存
      if (item.quantity > originalQuantity) {
        const additionalQuantity = item.quantity - originalQuantity;
        console.log(`產品 ${product.name} 需要額外 ${additionalQuantity} 個庫存`);
        
        try {
          // 獲取所有庫存記錄
          const inventories = await Inventory.find({ product: item.product }).lean();
          console.log(`找到 ${inventories.length} 個庫存記錄`);
          
          // 計算總庫存量
          let totalQuantity = 0;
          for (const inv of inventories) {
            totalQuantity += inv.quantity;
            console.log(`庫存記錄: ${inv._id}, 類型: ${inv.type || 'purchase'}, 數量: ${inv.quantity}`);
          }
          
          console.log(`產品 ${product.name} 總庫存量: ${totalQuantity}，需要額外: ${additionalQuantity}`);
          
          // 不再檢查庫存是否足夠，允許負庫存
          if (totalQuantity < additionalQuantity) {
            console.log(`警告: 產品 ${product.name} 庫存不足，當前總庫存: ${totalQuantity}，需求: ${additionalQuantity}，將允許負庫存`);
          }
        } catch (err) {
          console.error(`庫存檢查錯誤:`, err);
          return res.status(500).json({ msg: `庫存檢查錯誤: ${err.message}` });
        }
      }
    }

    // 更新銷售記錄
    const saleFields = {
      saleNumber,
      items,
      totalAmount,
    };
    if (customer) saleFields.customer = customer;
    if (discount) saleFields.discount = discount;
    if (paymentMethod) saleFields.paymentMethod = paymentMethod;
    if (paymentStatus) saleFields.paymentStatus = paymentStatus;
    if (note) saleFields.note = note;
    if (cashier) saleFields.cashier = cashier;

    // 更新銷售記錄
    sale = await Sale.findByIdAndUpdate(
      req.params.id,
      { $set: saleFields },
      { new: true }
    );

    // 處理庫存變更
    // 1. 刪除與此銷售相關的所有庫存記錄
    try {
      const deletedRecords = await Inventory.deleteMany({ 
        saleId: sale._id,
        type: 'sale'
      });
      console.log(`刪除與銷售 ${sale._id} 相關的所有庫存記錄，刪除數量: ${deletedRecords.deletedCount}`);
      
      // 如果沒有刪除任何記錄，記錄警告
      if (deletedRecords.deletedCount === 0) {
        console.warn(`警告: 未找到與銷售 ${sale._id} 相關的庫存記錄進行刪除`);
      }
    } catch (err) {
      console.error(`刪除庫存記錄時出錯:`, err);
      return res.status(500).json({ msg: `刪除庫存記錄時出錯: ${err.message}` });
    }

    // 2. 為每個銷售項目創建新的負數庫存記錄
    try {
      for (const item of items) {
        const inventoryRecord = new Inventory({
          product: item.product,
          quantity: -item.quantity, // 負數表示庫存減少
          totalAmount: Number(item.subtotal), // 添加totalAmount字段
          saleNumber: sale.saleNumber, // 添加銷貨單號
          type: 'sale',
          saleId: sale._id,
          lastUpdated: Date.now()
        });
        
        await inventoryRecord.save();
        console.log(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal}`);
      }
    } catch (err) {
      console.error(`創建新庫存記錄時出錯:`, err);
      return res.status(500).json({ msg: `創建新庫存記錄時出錯: ${err.message}` });
    }

    // 處理客戶積分變更
    // 如果客戶發生變更或總金額發生變更，需要調整積分
    if (sale.customer || customer) {
      // 如果原始銷售有客戶，扣除原始積分
      if (sale.customer) {
        const originalCustomer = await Customer.findById(sale.customer);
        if (originalCustomer) {
          const pointsToDeduct = Math.floor(sale.totalAmount / 100);
          originalCustomer.points = Math.max(0, (originalCustomer.points || 0) - pointsToDeduct);
          await originalCustomer.save();
          console.log(`從客戶 ${originalCustomer._id} 扣除 ${pointsToDeduct} 積分`);
        }
      }
      
      // 如果新銷售有客戶，添加新積分
      if (customer) {
        const newCustomer = await Customer.findById(customer);
        if (newCustomer) {
          const pointsToAdd = Math.floor(totalAmount / 100);
          newCustomer.points = (newCustomer.points || 0) + pointsToAdd;
          await newCustomer.save();
          console.log(`為客戶 ${newCustomer._id} 添加 ${pointsToAdd} 積分`);
        }
      }
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
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    
    // 恢復庫存 - 創建新的庫存記錄而不是修改現有記錄
    for (const item of sale.items) {
      // 查找與此銷售相關的庫存記錄
      const saleInventory = await Inventory.findOne({ 
        saleId: sale._id,
        product: item.product,
        type: 'sale'
      });
      
      // 如果找到相關的銷售庫存記錄，則刪除它
      if (saleInventory) {
        await Inventory.deleteOne({ _id: saleInventory._id });
        console.log(`刪除產品 ${item.product} 的銷售庫存記錄`);
      } else {
        // 如果找不到相關的銷售庫存記錄，則創建一個新的庫存記錄來恢復庫存
        const inventoryRecord = new Inventory({
          product: item.product,
          quantity: item.quantity, // 正數表示庫存增加
          type: 'return',
          saleId: sale._id,
          lastUpdated: Date.now()
        });
        
        await inventoryRecord.save();
        console.log(`為產品 ${item.product} 創建退貨庫存記錄，數量: ${item.quantity}`);
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
    
    await Sale.deleteOne({ _id: sale._id });
    console.log(`銷售記錄 ${sale._id} 已刪除`);
    res.json({ msg: '銷售記錄已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sales/latest-number/:prefix
// @desc    Get latest sale number with given prefix
// @access  Public
router.get('/latest-number/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    
    // 查找以指定前綴開頭的最新銷貨單號
    const latestSale = await Sale.findOne({
      saleNumber: { $regex: `^${prefix}` }
    }).sort({ saleNumber: -1 });
    
    if (latestSale && latestSale.saleNumber) {
      return res.json({ latestNumber: latestSale.saleNumber });
    } else {
      return res.json({ latestNumber: null });
    }
  } catch (err) {
    console.error(err.message);
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
