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
    const sale = await Sale.findOne({ _id: req.params.id.toString() })
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
    
    try {
      // 1. 驗證請求和檢查記錄
      const validationResult = await validateSaleCreationRequest(req.body);
      if (!validationResult.success) {
        return res.status(validationResult.statusCode).json({ msg: validationResult.message });
      }
      
      // 2. 創建銷售記錄
      const sale = await createSaleRecord(req.body);
      
      // 3. 處理庫存變更
      await handleInventoryForNewSale(sale);
      
      // 4. 處理客戶積分
      await updateCustomerPoints(sale);
      
      res.json(sale);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// 驗證銷售創建請求
async function validateSaleCreationRequest(requestBody) {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  if (customer) {
    const customerExists = await Customer.findOne({ _id: customer.toString() });
    if (!customerExists) {
      return { success: false, statusCode: 404, message: '客戶不存在' };
    }
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    const product = await BaseProduct.findOne({ _id: item.product.toString() });
    if (!product) {
      return { success: false, statusCode: 404, message: `產品ID ${item.product} 不存在` };
    }
    
    // 記錄當前庫存量，但不限制負庫存
    console.log(`檢查產品ID: ${item.product}, 名稱: ${product.name}`);
    
    try {
      // 獲取所有庫存記錄
      const inventories = await Inventory.find({ product: item.product.toString() }).lean();
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
      return { success: false, statusCode: 500, message: `庫存檢查錯誤: ${err.message}` };
    }
  }
  
  return { success: true };
}

// 創建銷售記錄
async function createSaleRecord(requestBody) {
  const { saleNumber, customer, items, totalAmount, discount, paymentMethod, paymentStatus, note, cashier } = requestBody;
  
  // 生成銷貨單號（如果未提供）
  let finalSaleNumber = saleNumber;
  if (!finalSaleNumber) {
    // 使用通用訂單單號生成服務
    finalSaleNumber = await OrderNumberService.generateSaleOrderNumber();
  }
  
  // 建立銷售記錄
  const saleFields = {
    saleNumber: finalSaleNumber ? finalSaleNumber.toString() : '',
    items,
    totalAmount,
  };
  if (customer) saleFields.customer = customer.toString();
  if (discount) saleFields.discount = discount;
  if (paymentMethod) saleFields.paymentMethod = paymentMethod ? paymentMethod.toString() : '';
  if (paymentStatus) saleFields.paymentStatus = paymentStatus ? paymentStatus.toString() : '';
  if (note) saleFields.note = note ? note.toString() : '';
  if (cashier) saleFields.cashier = cashier ? cashier.toString() : '';

  const sale = new Sale(saleFields);
  await sale.save();
  return sale;
}

// 處理新銷售的庫存變更
async function handleInventoryForNewSale(sale) {
  // 為每個銷售項目創建負數庫存記錄
  for (const item of sale.items) {
    const inventoryRecord = new Inventory({
      product: item.product.toString(),
      quantity: -item.quantity, // 負數表示庫存減少
      totalAmount: Number(item.subtotal), // 添加totalAmount字段
      saleNumber: sale.saleNumber.toString(), // 添加銷貨單號
      type: 'sale',
      saleId: sale._id.toString(),
      lastUpdated: Date.now()
    });
    
    await inventoryRecord.save();
    console.log(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal}`);
  }
}

// 更新客戶積分
async function updateCustomerPoints(sale) {
  // 如果有客戶，更新客戶積分
  if (sale.customer) {
    const customerToUpdate = await Customer.findOne({ _id: sale.customer.toString() });
    if (customerToUpdate) {
      // 假設每消費100元獲得1點積分
      const pointsToAdd = Math.floor(sale.totalAmount / 100);
      customerToUpdate.points = (customerToUpdate.points || 0) + pointsToAdd;
      await customerToUpdate.save();
    }
  }
}

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

  // 重構：將複雜函數拆分為更小的部分
  try {
    // 1. 驗證請求和檢查記錄是否存在
    const saleData = await validateSaleUpdateRequest(req);
    if (!saleData.success) {
      return res.status(saleData.statusCode).json({ msg: saleData.message });
    }

    // 2. 更新銷售記錄
    const updatedSale = await updateSaleRecord(req.params.id, req.body);

    // 3. 處理庫存變更
    await handleInventoryChanges(updatedSale);

    // 4. 處理客戶積分變更
    await handleCustomerPointsChanges(updatedSale, req.body);

    res.json(updatedSale);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '銷售記錄不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// 驗證銷售更新請求
async function validateSaleUpdateRequest(req) {
  const { customer, items } = req.body;

  // 檢查銷售記錄是否存在
  const sale = await Sale.findOne({ _id: req.params.id.toString() });
  if (!sale) {
    return { success: false, statusCode: 404, message: '銷售記錄不存在' };
  }

  // 檢查客戶是否存在
  if (customer) {
    const customerExists = await Customer.findOne({ _id: customer.toString() });
    if (!customerExists) {
      return { success: false, statusCode: 404, message: '客戶不存在' };
    }
  }

  // 檢查所有產品是否存在並檢查庫存
  const originalItems = [...sale.items];
  for (const item of items) {
    const product = await BaseProduct.findOne({ _id: item.product.toString() });
    if (!product) {
      return { success: false, statusCode: 404, message: `產品ID ${item.product} 不存在` };
    }
    
    // 查找原始項目中是否存在該產品
    const originalItem = originalItems.find(oi => oi.product.toString() === item.product.toString());
    const originalQuantity = originalItem ? originalItem.quantity : 0;
    
    // 如果新數量大於原始數量，檢查額外庫存
    if (item.quantity > originalQuantity) {
      const additionalQuantity = item.quantity - originalQuantity;
      console.log(`產品 ${product.name} 需要額外 ${additionalQuantity} 個庫存`);
      
      try {
        // 獲取所有庫存記錄
        const inventories = await Inventory.find({ product: item.product.toString() }).lean();
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
        return { success: false, statusCode: 500, message: `庫存檢查錯誤: ${err.message}` };
      }
    }
  }

  return { success: true, sale };
}

// 更新銷售記錄
async function updateSaleRecord(saleId, requestBody) {
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
  } = requestBody;

  // 更新銷售記錄
  const saleFields = {
    saleNumber: saleNumber ? saleNumber.toString() : '',
    items,
    totalAmount,
  };
  if (customer) saleFields.customer = customer.toString();
  if (discount) saleFields.discount = discount;
  if (paymentMethod) saleFields.paymentMethod = paymentMethod ? paymentMethod.toString() : '';
  if (paymentStatus) saleFields.paymentStatus = paymentStatus ? paymentStatus.toString() : '';
  if (note) saleFields.note = note ? note.toString() : '';
  if (cashier) saleFields.cashier = cashier ? cashier.toString() : '';

  // 更新銷售記錄
  const sale = await Sale.findOne({ _id: saleId.toString() });
  
  // 應用更新
  Object.keys(saleFields).forEach(key => {
    sale[key] = saleFields[key];
  });
  
  await sale.save();
  return sale;
}

// 處理庫存變更
async function handleInventoryChanges(sale) {
  // 1. 刪除與此銷售相關的所有庫存記錄
  try {
    const deletedRecords = await Inventory.deleteMany({ 
      saleId: sale._id.toString(),
      type: 'sale'
    });
    console.log(`刪除與銷售 ${sale._id} 相關的所有庫存記錄，刪除數量: ${deletedRecords.deletedCount}`);
    
    // 如果沒有刪除任何記錄，記錄警告
    if (deletedRecords.deletedCount === 0) {
      console.warn(`警告: 未找到與銷售 ${sale._id} 相關的庫存記錄進行刪除`);
    }
  } catch (err) {
    console.error(`刪除庫存記錄時出錯:`, err);
    throw new Error(`刪除庫存記錄時出錯: ${err.message}`);
  }

  // 2. 為每個銷售項目創建新的負數庫存記錄
  try {
    for (const item of sale.items) {
      const inventoryRecord = new Inventory({
        product: item.product.toString(),
        quantity: -item.quantity, // 負數表示庫存減少
        totalAmount: Number(item.subtotal), // 添加totalAmount字段
        saleNumber: sale.saleNumber.toString(), // 添加銷貨單號
        type: 'sale',
        saleId: sale._id.toString(),
        lastUpdated: Date.now()
      });
      
      await inventoryRecord.save();
      console.log(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal}`);
    }
  } catch (err) {
    console.error(`創建新庫存記錄時出錯:`, err);
    throw new Error(`創建新庫存記錄時出錯: ${err.message}`);
  }
}

// 處理客戶積分變更
async function handleCustomerPointsChanges(sale, requestBody) {
  const { customer, totalAmount } = requestBody;
  
  // 如果客戶發生變更或總金額發生變更，需要調整積分
  if (sale.customer || customer) {
    // 如果原始銷售有客戶，扣除原始積分
    if (sale.customer) {
      const originalCustomer = await Customer.findOne({ _id: sale.customer.toString() });
      if (originalCustomer) {
        const pointsToDeduct = Math.floor(sale.totalAmount / 100);
        originalCustomer.points = Math.max(0, (originalCustomer.points || 0) - pointsToDeduct);
        await originalCustomer.save();
        console.log(`從客戶 ${originalCustomer._id} 扣除 ${pointsToDeduct} 積分`);
      }
    }
    
    // 如果新銷售有客戶，添加新積分
    if (customer) {
      const newCustomer = await Customer.findOne({ _id: customer.toString() });
      if (newCustomer) {
        const pointsToAdd = Math.floor(totalAmount / 100);
        newCustomer.points = (newCustomer.points || 0) + pointsToAdd;
        await newCustomer.save();
        console.log(`為客戶 ${newCustomer._id} 添加 ${pointsToAdd} 積分`);
      }
    }
  }
}

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    // 1. 檢查銷售記錄是否存在
    const saleResult = await findSaleById(req.params.id);
    if (!saleResult.success) {
      return res.status(saleResult.statusCode).json({ msg: saleResult.message });
    }
    
    const sale = saleResult.sale;
    
    // 2. 處理庫存恢復
    await restoreInventoryForDeletedSale(sale);
    
    // 3. 處理客戶積分扣除
    await deductCustomerPointsForDeletedSale(sale);
    
    // 4. 刪除銷售記錄
    await Sale.deleteOne({ _id: sale._id.toString() });
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

// 查找銷售記錄
async function findSaleById(saleId) {
  const sale = await Sale.findOne({ _id: saleId.toString() });
  if (!sale) {
    return { success: false, statusCode: 404, message: '銷售記錄不存在' };
  }
  return { success: true, sale };
}

// 恢復已刪除銷售的庫存
async function restoreInventoryForDeletedSale(sale) {
  for (const item of sale.items) {
    // 查找與此銷售相關的庫存記錄
    const saleInventory = await Inventory.findOne({ 
      saleId: sale._id.toString(),
      product: item.product.toString(),
      type: 'sale'
    });
    
    // 如果找到相關的銷售庫存記錄，則刪除它
    if (saleInventory) {
      await Inventory.deleteOne({ _id: saleInventory._id.toString() });
      console.log(`刪除產品 ${item.product} 的銷售庫存記錄`);
    } else {
      // 如果找不到相關的銷售庫存記錄，則創建一個新的庫存記錄來恢復庫存
      const inventoryRecord = new Inventory({
        product: item.product.toString(),
        quantity: item.quantity, // 正數表示庫存增加
        type: 'return',
        saleId: sale._id.toString(),
        lastUpdated: Date.now()
      });
      
      await inventoryRecord.save();
      console.log(`為產品 ${item.product} 創建退貨庫存記錄，數量: ${item.quantity}`);
    }
  }
}

// 扣除已刪除銷售的客戶積分
async function deductCustomerPointsForDeletedSale(sale) {
  if (sale.customer) {
    const customer = await Customer.findOne({ _id: sale.customer.toString() });
    if (customer) {
      // 假設每消費100元獲得1點積分
      const pointsToDeduct = Math.floor(sale.totalAmount / 100);
      customer.points = Math.max(0, (customer.points || 0) - pointsToDeduct);
      await customer.save();
    }
  }
}

// @route   GET api/sales/latest-number/:prefix
// @desc    Get latest sale number with given prefix
// @access  Public
router.get('/latest-number/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    
    // 查找以指定前綴開頭的最新銷貨單號
    const latestSale = await Sale.findOne({
      saleNumber: { $regex: `^${prefix.toString()}` }
    }).sort({ saleNumber: -1 });
    
    if (latestSale?.saleNumber) {
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
    const sales = await Sale.find({ customer: req.params.customerId.toString() })
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
