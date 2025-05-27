const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const PurchaseOrder = require('../models/PurchaseOrder');
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

// @route   GET api/purchase-orders
// @desc    獲取所有進貨單
// @access  Public
router.get('/', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .sort({ poid: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    res.json(purchaseOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/purchase-orders/:id
// @desc    獲取單個進貨單
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({ _id: req.params.id.toString() })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    if (!purchaseOrder) {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }
    
    res.json(purchaseOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// 生成唯一訂單號的輔助函數
async function generateUniqueOrderNumber(poid) {
  // 基本訂單號使用poid
  let orderNumber = poid;
  let counter = 1;
  let isUnique = false;
  
  // 檢查訂單號是否已存在，如果存在則添加計數器
  while (!isUnique) {
    const existingOrder = await PurchaseOrder.findOne({ orderNumber: orderNumber.toString() });
    if (!existingOrder) {
      isUnique = true;
    } else {
      // 如果訂單號已存在，添加計數器後綴
      orderNumber = `${poid}-${counter}`;
      counter++;
    }
  }
  
  return orderNumber;
}

// 引入通用訂單單號生成服務
const OrderNumberService = require('../utils/OrderNumberService');

/**
 * 檢查進貨單號是否已存在
 * @param {string} poid - 進貨單號
 * @returns {Promise<boolean>} - 是否存在
 */
async function checkPurchaseOrderExists(poid) {
  if (!poid || poid.trim() === '') {
    return false;
  }
  
  const existingPO = await PurchaseOrder.findOne({ poid: poid.toString() });
  return !!existingPO;
}

/**
 * 驗證藥品項目並設置產品ID
 * @param {Array} items - 藥品項目列表
 * @returns {Promise<Object>} - 驗證結果
 */
async function validateAndSetProductIds(items) {
  for (const item of items) {
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      return { valid: false, message: '藥品項目資料不完整' };
    }

    // 嘗試查找藥品
    const product = await BaseProduct.findOne({ code: item.did.toString() });
    if (product) {
      item.product = product._id;
    }
  }
  
  return { valid: true };
}

/**
 * 查找供應商ID
 * @param {string} posupplier - 供應商名稱
 * @param {string} supplier - 供應商ID
 * @returns {Promise<string|null>} - 供應商ID
 */
async function findSupplierId(posupplier, supplier) {
  if (supplier) {
    return supplier.toString();
  }
  
  if (posupplier) {
    const supplierDoc = await Supplier.findOne({ name: posupplier.toString() });
    if (supplierDoc) {
      return supplierDoc._id;
    }
  }
  
  return null;
}

// @route   POST api/purchase-orders
// @desc    創建新進貨單
// @access  Public
router.post('/', [
  check('posupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { poid, pobill, pobilldate, posupplier, supplier, items, notes, status, paymentStatus } = req.body;

    // 如果進貨單號為空，自動生成
    if (!poid || poid.trim() === '') {
      poid = await OrderNumberService.generatePurchaseOrderNumber();
    } else if (await checkPurchaseOrderExists(poid)) {
      return res.status(400).json({ msg: '該進貨單號已存在' });
    }

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('purchase', poid);

    // 驗證所有藥品ID是否存在
    const validationResult = await validateAndSetProductIds(items);
    if (!validationResult.valid) {
      return res.status(400).json({ msg: validationResult.message });
    }

    // 嘗試查找供應商
    const supplierId = await findSupplierId(posupplier, supplier);

    // 創建新進貨單
    const purchaseOrder = new PurchaseOrder({
      poid: poid.toString(),
      orderNumber: orderNumber.toString(), // 設置唯一訂單號
      pobill: pobill ? pobill.toString() : '',
      pobilldate,
      posupplier: posupplier.toString(),
      supplier: supplierId,
      items,
      notes: notes ? notes.toString() : '',
      status: status ? status.toString() : 'pending',
      paymentStatus: paymentStatus ? paymentStatus.toString() : '未付'
    });

    await purchaseOrder.save();

    // 如果狀態為已完成，則更新庫存
    if (purchaseOrder.status === 'completed') {
      await updateInventory(purchaseOrder);
    }

    res.json(purchaseOrder);
  } catch (err) {
    console.error('創建進貨單錯誤:', err.message);
    res.status(500).send('伺服器錯誤');
  }
});

/**
 * 檢查進貨單號變更並處理
 * @param {string} poid - 新進貨單號
 * @param {Object} purchaseOrder - 進貨單對象
 * @returns {Promise<Object>} - 處理結果
 */
async function handlePurchaseOrderIdChange(poid, purchaseOrder) {
  if (!poid || poid === purchaseOrder.poid) {
    return { success: true };
  }
  
  // 檢查新號碼是否已存在
  const existingPO = await PurchaseOrder.findOne({ poid: poid.toString() });
  if (existingPO && existingPO._id.toString() !== purchaseOrder._id.toString()) {
    return { 
      success: false, 
      error: '該進貨單號已存在'
    };
  }
  
  // 生成新的唯一訂單號
  const orderNumber = await generateUniqueOrderNumber(poid.toString());
  return {
    success: true,
    orderNumber
  };
}

/**
 * 準備進貨單更新數據
 * @param {Object} data - 請求數據
 * @param {Object} purchaseOrder - 進貨單對象
 * @returns {Object} - 更新數據
 */
function prepareUpdateData(data, purchaseOrder) {
  const { poid, pobill, pobilldate, posupplier, supplier, notes, paymentStatus } = data;
  
  const updateData = {};
  if (poid) updateData.poid = poid.toString();
  if (purchaseOrder.orderNumber) updateData.orderNumber = purchaseOrder.orderNumber.toString();
  if (pobill) updateData.pobill = pobill.toString();
  if (pobilldate) updateData.pobilldate = pobilldate;
  if (posupplier) updateData.posupplier = posupplier.toString();
  if (supplier) updateData.supplier = supplier.toString();
  if (notes !== undefined) updateData.notes = notes ? notes.toString() : '';
  if (paymentStatus) updateData.paymentStatus = paymentStatus.toString();
  
  return updateData;
}

/**
 * 處理進貨單狀態變更
 * @param {string} newStatus - 新狀態
 * @param {string} oldStatus - 舊狀態
 * @param {string} purchaseOrderId - 進貨單ID
 * @returns {Promise<Object>} - 處理結果
 */
async function handleStatusChange(newStatus, oldStatus, purchaseOrderId) {
  if (!newStatus || newStatus === oldStatus) {
    return { statusChanged: false };
  }
  
  const result = { 
    statusChanged: true,
    status: newStatus.toString()
  };
  
  // 如果狀態從已完成改為其他狀態，刪除相關庫存記錄
  if (oldStatus === 'completed' && newStatus !== 'completed') {
    await deleteInventoryRecords(purchaseOrderId);
    result.inventoryDeleted = true;
  }
  
  // 如果狀態從非完成變為完成，標記需要更新庫存
  if (oldStatus !== 'completed' && newStatus === 'completed') {
    result.needUpdateInventory = true;
  }
  
  return result;
}

// @route   PUT api/purchase-orders/:id
// @desc    更新進貨單
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { poid, status, items } = req.body;

    // 檢查進貨單是否存在
    let purchaseOrder = await PurchaseOrder.findOne({ _id: req.params.id.toString() });
    if (!purchaseOrder) {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }

    // 處理進貨單號變更
    const idChangeResult = await handlePurchaseOrderIdChange(poid, purchaseOrder);
    if (!idChangeResult.success) {
      return res.status(400).json({ msg: idChangeResult.error });
    }
    if (idChangeResult.orderNumber) {
      purchaseOrder.orderNumber = idChangeResult.orderNumber;
    }

    // 準備更新數據
    const updateData = prepareUpdateData(req.body, purchaseOrder);
    
    // 處理狀態變更
    const oldStatus = purchaseOrder.status;
    const statusResult = await handleStatusChange(status, oldStatus, purchaseOrder._id.toString());
    if (statusResult.statusChanged) {
      updateData.status = statusResult.status;
    }

    // 處理項目更新
    if (items && items.length > 0) {
      // 驗證所有藥品ID是否存在
      const validationResult = await validateAndSetProductIds(items);
      if (!validationResult.valid) {
        return res.status(400).json({ msg: validationResult.message });
      }
      updateData.items = items;
    }

    // 更新進貨單
    // 先更新基本字段
    purchaseOrder = await PurchaseOrder.findOne({ _id: req.params.id.toString() });
    
    // 應用更新
    Object.keys(updateData).forEach(key => {
      purchaseOrder[key] = updateData[key];
    });
    
    // 手動計算總金額以確保正確
    purchaseOrder.totalAmount = purchaseOrder.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
    
    // 保存更新後的進貨單，這樣會觸發pre-save中間件
    await purchaseOrder.save();

    // 如果需要更新庫存
    if (statusResult.needUpdateInventory) {
      await updateInventory(purchaseOrder);
    }

    res.json(purchaseOrder);
  } catch (err) {
    console.error('更新進貨單錯誤:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/purchase-orders/:id
// @desc    刪除進貨單
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({ _id: req.params.id.toString() });
    if (!purchaseOrder) {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }

    // 如果進貨單已完成，不允許刪除
    if (purchaseOrder.status === 'completed') {
      return res.status(400).json({ msg: '已完成的進貨單不能刪除' });
    }

    await purchaseOrder.deleteOne();
    res.json({ msg: '進貨單已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/purchase-orders/supplier/:supplierId
// @desc    獲取特定供應商的進貨單
// @access  Public
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ supplier: req.params.supplierId.toString() })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    res.json(purchaseOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/purchase-orders/search
// @desc    搜索進貨單
// @access  Public
router.get('/search/query', async (req, res) => {
  try {
    const { poid, pobill, posupplier, startDate, endDate } = req.query;
    
    const query = {};
    if (poid) query.poid = { $regex: poid.toString(), $options: 'i' };
    if (pobill) query.pobill = { $regex: pobill.toString(), $options: 'i' };
    if (posupplier) query.posupplier = { $regex: posupplier.toString(), $options: 'i' };
    
    if (startDate || endDate) {
      query.pobilldate = {};
      if (startDate) query.pobilldate.$gte = new Date(startDate);
      if (endDate) query.pobilldate.$lte = new Date(endDate);
    }
    
    const purchaseOrders = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    res.json(purchaseOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/purchase-orders/product/:productId
// @desc    獲取特定產品的進貨單
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({
      'items.product': req.params.productId.toString(),
      'status': 'completed'
    })
      .sort({ pobilldate: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    res.json(purchaseOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/purchase-orders/recent
// @desc    獲取最近的進貨單
// @access  Public
router.get('/recent/list', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    res.json(purchaseOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// 更新庫存的輔助函數
async function updateInventory(purchaseOrder) {
  for (const item of purchaseOrder.items) {
    if (!item.product) continue;
    
    try {
      // 為每個進貨單項目創建新的庫存記錄，而不是更新現有記錄
      // 這樣可以保留每個批次的信息
      const inventory = new Inventory({
        product: item.product.toString(),
        quantity: parseInt(item.dquantity),
        totalAmount: Number(item.dtotalCost), // 添加totalAmount字段
        purchaseOrderId: purchaseOrder._id.toString(), // 保存進貨單ID
        purchaseOrderNumber: purchaseOrder.orderNumber.toString() // 保存進貨單號
      });
      
      await inventory.save();
      console.log(`已為產品 ${item.product} 創建新庫存記錄，進貨單號: ${purchaseOrder.orderNumber}, 數量: ${item.dquantity}, 總金額: ${item.dtotalCost}`);
      
      // 更新藥品的採購價格
      await BaseProduct.findOne({ _id: item.product.toString() })
        .then(product => {
          if (product) {
            product.purchasePrice = item.unitPrice || (item.dquantity > 0 ? item.dtotalCost / item.dquantity : 0);
            return product.save();
          }
        });
    } catch (err) {
      console.error(`更新庫存時出錯: ${err.message}`);
      // 繼續處理其他項目
    }
  }
}

// 刪除與進貨單相關的庫存記錄
async function deleteInventoryRecords(purchaseOrderId) {
  try {
    const result = await Inventory.deleteMany({ purchaseOrderId: purchaseOrderId.toString() });
    console.log(`已刪除 ${result.deletedCount} 筆與進貨單 ${purchaseOrderId} 相關的庫存記錄`);
    return result;
  } catch (err) {
    console.error(`刪除庫存記錄時出錯: ${err.message}`);
    throw err;
  }
}

/**
 * 驗證CSV基本資訊必填字段
 * @param {Object} row - CSV行數據
 * @param {number} rowIndex - 行索引
 * @returns {Object} - 驗證結果
 */
function validateBasicInfoRow(row, rowIndex) {
  if (!row['進貨單號'] || !row['廠商']) {
    return {
      valid: false,
      error: `行 ${rowIndex + 1}: 進貨單號和廠商為必填項`
    };
  }
  return { valid: true };
}

/**
 * 創建進貨單數據對象
 * @param {Object} row - CSV行數據
 * @returns {Object} - 進貨單數據
 */
function createPurchaseOrderData(row) {
  return {
    poid: row['進貨單號'].toString(),
    pobill: row['發票號'] ? row['發票號'].toString() : '',
    pobilldate: row['發票日期'] ? new Date(row['發票日期']) : null,
    posupplier: row['廠商'].toString(),
    paymentStatus: row['付款狀態'] ? row['付款狀態'].toString() : '未付',
    items: [],
    status: 'pending'
  };
}

module.exports = router;
