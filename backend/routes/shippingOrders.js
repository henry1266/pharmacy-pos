const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ShippingOrder = require('../models/ShippingOrder');
const { BaseProduct } = require('../models/BaseProduct');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// 設置文件上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// 設置上傳限制為 8MB，符合安全編碼實踐建議
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 8000000 // 8MB 限制
  }
});

// 將產品的 healthInsuranceCode 添加到 items 中的輔助函數
function addHealthInsuranceCodeToItems(orders) {
  if (!orders) return;
  
  // 處理單個訂單或訂單陣列
  const orderArray = Array.isArray(orders) ? orders : [orders];
  
  orderArray.forEach(order => {
    if (order?.items?.length > 0) {
      order.items.forEach(item => {
        if (item.product?.healthInsuranceCode) {
          item.healthInsuranceCode = item.product.healthInsuranceCode;
        }
      });
    }
  });
  
  return orders;
}

// @route   GET api/shipping-orders
// @desc    獲取所有出貨單
// @access  Public
router.get('/', async (req, res) => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ soid: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的 healthInsuranceCode 添加到 items 中
    addHealthInsuranceCodeToItems(shippingOrders);
    
    res.json(shippingOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/:id
// @desc    獲取單個出貨單
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // 避免使用 findById，改用 findOne 搭配查詢物件
    const shippingOrder = await ShippingOrder.findOne({ _id: req.params.id.toString() })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    
    // 將產品的 healthInsuranceCode 添加到 items 中
    addHealthInsuranceCodeToItems(shippingOrder);
    
    res.json(shippingOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// 生成唯一訂單號的輔助函數
async function generateUniqueOrderNumber(soid) {
  // 基本訂單號使用soid
  let orderNumber = soid;
  let counter = 1;
  let isUnique = false;
  
  // 檢查訂單號是否已存在，如果存在則添加計數器
  while (!isUnique) {
    // 使用查詢物件包裝並進行型態轉換
    const existingOrder = await ShippingOrder.findOne({ orderNumber: orderNumber.toString() });
    if (!existingOrder) {
      isUnique = true;
    } else {
      // 如果訂單號已存在，添加計數器後綴
      orderNumber = `${soid}-${counter}`;
      counter++;
    }
  }
  
  return orderNumber;
}

// 引入通用訂單單號生成服務
const OrderNumberService = require('../utils/OrderNumberService');

// 驗證藥品項目的輔助函數
async function validateMedicineItems(items) {
  const validationResults = [];
  
  for (const item of items) {
    // 檢查項目資料完整性
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      validationResults.push({
        success: false,
        message: '藥品項目資料不完整'
      });
      continue;
    }

    // 驗證藥品代碼格式
    if (typeof item.did !== 'string' || !item.did.match(/^[A-Za-z0-9_-]+$/)) {
      validationResults.push({
        success: false,
        message: `無效的藥品代碼格式: ${item.did}`
      });
      continue;
    }
    
    // 查找藥品 - 使用查詢物件包裝並進行型態轉換
    const product = await BaseProduct.findOne({ code: item.did.toString() });
    if (!product) {
      validationResults.push({
        success: false,
        message: `找不到藥品: ${item.did}`
      });
      continue;
    }
    
    // 檢查庫存是否足夠
    const inventorySum = await Inventory.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    
    const availableQuantity = inventorySum.length > 0 ? inventorySum[0].total : 0;
    
    if (availableQuantity < item.dquantity) {
      validationResults.push({
        success: false,
        message: `藥品 ${item.dname} (${item.did}) 庫存不足，目前庫存: ${availableQuantity}，需要: ${item.dquantity}`
      });
      continue;
    }
    
    // 項目驗證通過，設置產品ID
    item.product = product._id;
    validationResults.push({
      success: true,
      item
    });
  }
  
  // 檢查是否有任何驗證失敗
  const failedValidation = validationResults.find(result => !result.success);
  if (failedValidation) {
    return {
      success: false,
      message: failedValidation.message
    };
  }
  
  return {
    success: true,
    items: items
  };
}

// 查找供應商的輔助函數
async function findSupplier(sosupplier, supplier) {
  let supplierId = null;
  
  if (supplier) {
    supplierId = supplier;
  } else if (sosupplier) {
    // 使用查詢物件包裝並進行型態轉換
    const supplierDoc = await Supplier.findOne({ name: sosupplier.toString() });
    if (supplierDoc) {
      supplierId = supplierDoc._id;
    }
  }
  
  return supplierId;
}

// 創建出貨單的輔助函數
async function createShippingOrderRecord(orderData) {
  const shippingOrder = new ShippingOrder({
    soid: orderData.soid,
    orderNumber: orderData.orderNumber,
    sosupplier: orderData.sosupplier,
    supplier: orderData.supplierId,
    items: orderData.items,
    notes: orderData.notes,
    status: orderData.status || 'pending',
    paymentStatus: orderData.paymentStatus || '未收'
  });

  await shippingOrder.save();
  return shippingOrder;
}

// @route   POST api/shipping-orders
// @desc    創建新出貨單
// @access  Public
router.post('/', [
  check('sosupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { soid, sosupplier, supplier, items, notes, status, paymentStatus } = req.body;

    // 如果出貨單號為空，自動生成
    if (!soid || soid.trim() === '') {
      soid = await OrderNumberService.generateShippingOrderNumber();
    } else {
      // 檢查出貨單號是否已存在 - 使用查詢物件包裝並進行型態轉換
      const existingSO = await ShippingOrder.findOne({ soid: soid.toString() });
      if (existingSO) {
        return res.status(400).json({ msg: '該出貨單號已存在' });
      }
    }

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', soid);

    // 驗證所有藥品項目
    const itemsValidation = await validateMedicineItems(items);
    if (!itemsValidation.success) {
      return res.status(400).json({ msg: itemsValidation.message });
    }

    // 查找供應商
    const supplierId = await findSupplier(sosupplier, supplier);

    // 創建新出貨單
    const shippingOrder = await createShippingOrderRecord({
      soid,
      orderNumber,
      sosupplier,
      supplierId,
      items,
      notes,
      status,
      paymentStatus
    });

    // 如果狀態為已完成，則創建ship類型庫存記錄
    if (shippingOrder.status === 'completed') {
      await createShippingInventoryRecords(shippingOrder);
    }

    res.json(shippingOrder);
  } catch (err) {
    console.error('創建出貨單錯誤:', err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// 準備更新數據的輔助函數
function prepareUpdateData(requestBody, orderNumber) {
  const updateData = {};
  
  if (requestBody.soid) updateData.soid = requestBody.soid;
  if (orderNumber) updateData.orderNumber = orderNumber;
  if (requestBody.sosupplier) updateData.sosupplier = requestBody.sosupplier;
  if (requestBody.supplier) updateData.supplier = requestBody.supplier;
  if (requestBody.notes !== undefined) updateData.notes = requestBody.notes;
  if (requestBody.paymentStatus) updateData.paymentStatus = requestBody.paymentStatus;
  if (requestBody.status) updateData.status = requestBody.status;
  if (requestBody.items && requestBody.items.length > 0) updateData.items = requestBody.items;
  
  return updateData;
}

// 應用更新到出貨單的輔助函數
async function applyUpdateToShippingOrder(shippingOrder, updateData) {
  // 應用更新
  Object.keys(updateData).forEach(key => {
    shippingOrder[key] = updateData[key];
  });
  
  // 手動計算總金額以確保正確
  shippingOrder.totalAmount = shippingOrder.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
  
  // 保存更新後的出貨單
  await shippingOrder.save();
  return shippingOrder;
}

// 處理庫存記錄更新的輔助函數 - 拆分以降低認知複雜度
async function handleInventoryRecordsUpdate(oldStatus, shippingOrder) {
  // 如果狀態從已完成改為其他狀態，刪除相關的ship類型庫存記錄
  if (oldStatus === 'completed' && shippingOrder.status !== 'completed') {
    await deleteShippingInventoryRecords(shippingOrder._id);
  }
  // 如果狀態從非完成變為完成，則創建ship類型庫存記錄
  else if (oldStatus !== 'completed' && shippingOrder.status === 'completed') {
    await createShippingInventoryRecords(shippingOrder);
  }
}

// @route   PUT api/shipping-orders/:id
// @desc    更新出貨單
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { soid, items } = req.body;

    // 檢查出貨單是否存在 - 避免使用 findById，改用 findOne 搭配查詢物件
    let shippingOrder = await ShippingOrder.findOne({ _id: req.params.id.toString() });
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }

    // 處理出貨單號變更
    let orderNumber = null;
    if (soid && soid !== shippingOrder.soid) {
      // 使用查詢物件包裝並進行型態轉換
      const existingSO = await ShippingOrder.findOne({ soid: soid.toString() });
      if (existingSO && existingSO._id.toString() !== req.params.id.toString()) {
        return res.status(400).json({ msg: '該出貨單號已存在' });
      }
      
      // 如果出貨單號變更，生成新的唯一訂單號
      orderNumber = await generateUniqueOrderNumber(soid);
    }

    // 處理狀態變更
    const oldStatus = shippingOrder.status;
    
    // 如果有項目更新，驗證所有藥品
    if (items && items.length > 0) {
      const itemsValidation = await validateMedicineItems(items);
      if (!itemsValidation.success) {
        return res.status(400).json({ msg: itemsValidation.message });
      }
    }

    // 準備更新數據
    const updateData = prepareUpdateData(req.body, orderNumber);
    
    // 更新出貨單 - 避免使用 findById，改用 findOne 搭配查詢物件
    shippingOrder = await ShippingOrder.findOne({ _id: req.params.id.toString() });
    shippingOrder = await applyUpdateToShippingOrder(shippingOrder, updateData);
    
    // 拆分複雜度高的函數，降低認知複雜度
    // 處理庫存記錄 - 拆分為獨立函數以降低認知複雜度
    await handleInventoryRecordsUpdate(oldStatus, shippingOrder);

    res.json(shippingOrder);
  } catch (err) {
    console.error('更新出貨單錯誤:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/shipping-orders/:id
// @desc    刪除出貨單
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    // 避免使用 findById，改用 findOne 搭配查詢物件
    const shippingOrder = await ShippingOrder.findOne({ _id: req.params.id.toString() });
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }

    // 如果出貨單已完成，刪除相關的ship類型庫存記錄
    if (shippingOrder.status === 'completed') {
      await deleteShippingInventoryRecords(shippingOrder._id);
    }

    await shippingOrder.deleteOne();
    res.json({ msg: '出貨單已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/supplier/:supplierId
// @desc    獲取特定供應商的出貨單
// @access  Public
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    // 使用查詢物件包裝並進行型態轉換
    const shippingOrders = await ShippingOrder.find({ supplier: req.params.supplierId.toString() })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的 healthInsuranceCode 添加到 items 中
    addHealthInsuranceCodeToItems(shippingOrders);
    
    res.json(shippingOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/search
// @desc    搜索出貨單
// @access  Public
router.get('/search/query', async (req, res) => {
  try {
    const { soid, sosupplier } = req.query;
    
    const query = {};
    // 使用查詢物件包裝並進行型態轉換，避免正規表達式注入
    if (soid) query.soid = { $regex: soid.toString(), $options: 'i' };
    if (sosupplier) query.sosupplier = { $regex: sosupplier.toString(), $options: 'i' };
    
    const shippingOrders = await ShippingOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的 healthInsuranceCode 添加到 items 中
    addHealthInsuranceCodeToItems(shippingOrders);
    
    res.json(shippingOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/product/:productId
// @desc    獲取特定產品的出貨單
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    // 使用查詢物件包裝並進行型態轉換
    const shippingOrders = await ShippingOrder.find({
      'items.product': req.params.productId.toString(),
      'status': 'completed'
    })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的 healthInsuranceCode 添加到 items 中
    addHealthInsuranceCodeToItems(shippingOrders);
    
    res.json(shippingOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/recent
// @desc    獲取最近的出貨單
// @access  Public
router.get('/recent/list', async (req, res) => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的 healthInsuranceCode 添加到 items 中
    addHealthInsuranceCodeToItems(shippingOrders);
    
    res.json(shippingOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// 為出貨單創建新的ship類型庫存記錄的輔助函數
async function createShippingInventoryRecords(shippingOrder) {
  try {
    for (const item of shippingOrder.items) {
      if (!item.product) continue;
      
      // 為每個出貨單項目創建新的庫存記錄
      const inventory = new Inventory({
        product: item.product,
        quantity: -parseInt(item.dquantity), // 負數表示庫存減少
        totalAmount: Number(item.dtotalCost),
        shippingOrderId: shippingOrder._id, // 使用出貨單ID
        shippingOrderNumber: shippingOrder.orderNumber, // 使用出貨單號
        type: 'ship' // 設置類型為'ship'
      });
      
      await inventory.save();
      console.log(`已為產品 ${item.product} 創建新庫存記錄，出貨單號: ${shippingOrder.orderNumber}, 數量: -${item.dquantity}, 總金額: ${item.dtotalCost}, 類型: ship`);
    }
    
    console.log(`已成功為出貨單 ${shippingOrder._id} 創建所有ship類型庫存記錄`);
  } catch (err) {
    console.error(`創建ship類型庫存記錄時出錯: ${err.message}`);
    throw err; // 重新拋出錯誤，讓調用者知道出了問題
  }
}

// 刪除與出貨單相關的ship類型庫存記錄
async function deleteShippingInventoryRecords(shippingOrderId) {
  try {
    const result = await Inventory.deleteMany({ 
      shippingOrderId: shippingOrderId.toString(), 
      type: 'ship' 
    });
    console.log(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的ship類型庫存記錄`);
    return result;
  } catch (err) {
    console.error(`刪除ship類型庫存記錄時出錯: ${err.message}`);
    throw err;
  }
}

// 驗證CSV基本資訊必填欄位
function validateBasicCsvFields(row) {
  if (!row['出貨單號'] || !row['客戶']) {
    return {
      success: false,
      message: '出貨單號和客戶為必填項'
    };
  }
  return { success: true };
}

// 驗證CSV項目必填欄位
function validateItemsCsvFields(row) {
  if (!row['出貨單號'] || !row['藥品代碼'] || !row['藥品名稱'] || !row['數量'] || !row['總金額']) {
    return {
      success: false,
      message: '出貨單號、藥品代碼、藥品名稱、數量和總金額為必填項'
    };
  }
  return { success: true };
}

// 處理基本資訊CSV行
async function processBasicCsvRow(row) {
  // 檢查出貨單號是否已存在 - 使用查詢物件包裝並進行型態轉換
  const existingSO = await ShippingOrder.findOne({ soid: row['出貨單號'].toString() });
  if (existingSO) {
    return {
      success: false,
      message: `出貨單號 ${row['出貨單號']} 已存在`
    };
  }
  
  // 查找供應商 - 使用查詢物件包裝並進行型態轉換
  let supplierId = null;
  const supplierName = row['客戶'];
  const supplier = await Supplier.findOne({ name: supplierName.toString() });
  if (supplier) {
    supplierId = supplier._id;
  }
  
  // 創建新出貨單
  const shippingOrder = new ShippingOrder({
    soid: row['出貨單號'],
    orderNumber: await OrderNumberService.generateUniqueOrderNumber('shipping', row['出貨單號']),
    sosupplier: supplierName,
    supplier: supplierId,
    notes: row['備註'] || '',
    status: row['狀態'] || 'pending',
    paymentStatus: row['付款狀態'] || '未收',
    items: []
  });
  
  await shippingOrder.save();
  return {
    success: true,
    message: `成功導入出貨單 ${row['出貨單號']}`
  };
}

// 處理項目CSV行
async function processItemsCsvRow(row) {
  // 檢查出貨單是否存在 - 使用查詢物件包裝並進行型態轉換
  const shippingOrder = await ShippingOrder.findOne({ soid: row['出貨單號'].toString() });
  if (!shippingOrder) {
    return {
      success: false,
      message: `找不到出貨單 ${row['出貨單號']}`
    };
  }
  
  // 查找藥品 - 使用查詢物件包裝並進行型態轉換
  const product = await BaseProduct.findOne({ code: row['藥品代碼'].toString() });
  if (!product) {
    return {
      success: false,
      message: `找不到藥品 ${row['藥品代碼']}`
    };
  }
  
  // 創建新項目
  const newItem = {
    did: row['藥品代碼'],
    dname: row['藥品名稱'],
    dquantity: parseInt(row['數量']),
    dtotalCost: parseFloat(row['總金額']),
    product: product._id
  };
  
  // 更新出貨單項目
  await updateShippingOrderItems(shippingOrder, newItem);
  
  return {
    success: true,
    message: `成功將藥品 ${row['藥品名稱']} 添加到出貨單 ${row['出貨單號']}`
  };
}

// 更新出貨單項目
async function updateShippingOrderItems(shippingOrder, newItem) {
  // 檢查項目是否已存在
  const existingItemIndex = shippingOrder.items.findIndex(item => 
    item.did === newItem.did && item.dname === newItem.dname
  );
  
  if (existingItemIndex >= 0) {
    // 更新現有項目
    shippingOrder.items[existingItemIndex] = newItem;
  } else {
    // 添加新項目
    shippingOrder.items.push(newItem);
  }
  
  // 更新總金額
  shippingOrder.totalAmount = shippingOrder.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
  
  await shippingOrder.save();
}

// 處理CSV行數據的輔助函數
async function processCsvRow(row, type) {
  try {
    // 驗證必填欄位
    let validation;
    if (type === 'basic') {
      validation = validateBasicCsvFields(row);
    } else if (type === 'items') {
      validation = validateItemsCsvFields(row);
    } else {
      return {
        success: false,
        message: '未知的導入類型'
      };
    }
    
    if (!validation.success) {
      return validation;
    }
    
    // 根據類型處理不同的導入邏輯
    if (type === 'basic') {
      return await processBasicCsvRow(row);
    } else if (type === 'items') {
      return await processItemsCsvRow(row);
    }
    
    return {
      success: false,
      message: '未知的導入類型'
    };
  } catch (err) {
    console.error(`處理CSV行時出錯: ${err.message}`);
    return {
      success: false,
      message: `處理CSV行時出錯: ${err.message}`
    };
  }
}

// 處理CSV導入的輔助函數
async function processCsvImport(req, res, type) {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: '請上傳CSV文件' });
    }
    const results = [];
    const errors = [];
    let successCount = 0;
    // 讀取並解析CSV文件
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // 刪除上傳的文件
        fs.unlinkSync(req.file.path);
        // 處理每一行數據
        for (const row of results) {
          const result = await processCsvRow(row, type);
          if (result.success) {
            successCount++;
          } else {
            errors.push(`行 ${results.indexOf(row) + 1}: ${result.message}`);
          }
        }
        res.json({
          success: true,
          message: `成功導入 ${successCount} 筆${type === 'basic' ? '出貨單基本資訊' : '出貨單項目'}`,
          errors: errors.length > 0 ? errors : null
        });
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
}

// @route   POST api/shipping-orders/import/basic
// @desc    導入出貨單基本資訊CSV
// @access  Public
router.post('/import/basic', upload.single('file'), async (req, res) => {
  await processCsvImport(req, res, 'basic');
});

// @route   POST api/shipping-orders/import/items
// @desc    導入出貨單項目CSV
// @access  Public
router.post('/import/items', upload.single('file'), async (req, res) => {
  await processCsvImport(req, res, 'items');
});

module.exports = router;
