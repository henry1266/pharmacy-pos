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

const upload = multer({ storage: storage });

// @route   GET api/shipping-orders
// @desc    獲取所有出貨單
// @access  Public
router.get('/', async (req, res) => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ soid: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
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
    const shippingOrder = await ShippingOrder.findById(req.params.id)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrder.items && shippingOrder.items.length > 0) {
      shippingOrder.items.forEach(item => {
        item.healthInsuranceCode = item.product?.healthInsuranceCode;
      });
    }
    
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
    const existingOrder = await ShippingOrder.findOne({ orderNumber });
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

// @route   POST api/shipping-orders
// @desc    創建新出貨單
// @access  Public
/**
 * 檢查出貨單號是否已存在
 * @param {string} soid - 出貨單號
 * @returns {Promise<boolean>} - 是否存在
 */
async function checkShippingOrderExists(soid) {
  if (!soid || soid.trim() === '') {
    return false;
  }
  
  // 安全處理：確保soid是字符串並去除任何可能的惡意字符
  const sanitizedSoid = String(soid).trim();
  
  // 使用嚴格相等查詢而非正則表達式
  const existingSO = await ShippingOrder.findOne({ soid: sanitizedSoid });
  return !!existingSO;
}

// 處理出貨單號的輔助函數
async function handleShippingOrderId(soid) {
  if (!soid || soid.trim() === '') {
    return {
      soid: await OrderNumberService.generateShippingOrderNumber()
    };
  }
  
  // 檢查出貨單號是否已存在
  if (await checkShippingOrderExists(soid)) {
    return {
      error: '該出貨單號已存在'
    };
  }
  
  return { soid };
}

// 驗證產品項目並檢查庫存的輔助函數
async function validateProductsAndInventory(items) {
  for (const item of items) {
    // 檢查項目完整性
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      return {
        valid: false,
        error: '藥品項目資料不完整'
      };
    }

    // 驗證藥品代碼格式
    if (typeof item.did !== 'string' || !item.did.match(/^[A-Za-z0-9_-]+$/)) {
      return {
        valid: false,
        error: `無效的藥品代碼格式: ${item.did}`
      };
    }
    
    // 查找產品 - 安全處理：確保did是字符串並去除任何可能的惡意字符
    const sanitizedCode = String(item.did).trim();
    const product = await BaseProduct.findOne({ code: sanitizedCode });
    if (!product) {
      return {
        valid: false,
        error: `找不到藥品: ${sanitizedCode}`
      };
    }
    
    item.product = product._id;
    
    // 檢查庫存
    const inventorySum = await Inventory.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    
    const availableQuantity = inventorySum.length > 0 ? inventorySum[0].total : 0;
    
    if (availableQuantity < item.dquantity) {
      return {
        valid: false,
        error: `藥品 ${item.dname} (${item.did}) 庫存不足，目前庫存: ${availableQuantity}，需要: ${item.dquantity}`
      };
    }
  }
  
  return { valid: true, items };
}

/**
 * 查找供應商的輔助函數
 * @param {string|ObjectId} supplier - 供應商ID
 * @param {string} sosupplier - 供應商名稱
 * @returns {Promise<string|null>} - 供應商ID或null
 */
async function findSupplier(supplier, sosupplier) {
  if (supplier) {
    // 確保返回字符串格式的ID
    return String(supplier);
  }
  
  if (!sosupplier || typeof sosupplier !== 'string') {
    return null;
  }
  
  // 安全處理：確保sosupplier是字符串並去除任何可能的惡意字符
  const sanitizedName = sosupplier.trim();
  
  const supplierDoc = await Supplier.findOne({ name: sanitizedName });
  return supplierDoc ? supplierDoc._id.toString() : null;
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

    // 處理出貨單號
    const soidResult = await handleShippingOrderId(soid);
    if (soidResult.error) {
      return res.status(400).json({ msg: soidResult.error });
    }
    soid = soidResult.soid;

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', soid);

    // 驗證產品並檢查庫存
    const productsResult = await validateProductsAndInventory(items);
    if (!productsResult.valid) {
      return res.status(400).json({ msg: productsResult.error });
    }
    items = productsResult.items;

    // 查找供應商
    const supplierId = await findSupplier(supplier, sosupplier);

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber,
      sosupplier,
      supplier: supplierId,
      items,
      notes,
      status: status || 'pending',
      paymentStatus: paymentStatus || '未收'
    });

    await shippingOrder.save();

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

// @route   PUT api/shipping-orders/:id
// @desc    更新出貨單
// @access  Public
// 驗證出貨單項目的輔助函數
async function validateOrderItems(items) {
  for (const item of items) {
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      return {
        valid: false,
        message: '藥品項目資料不完整'
      };
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
 * 處理出貨單號變更的輔助函數
 * @param {string} newSoid - 新出貨單號
 * @param {string} currentSoid - 當前出貨單號
 * @param {string} orderId - 出貨單ID
 * @returns {Promise<Object>} - 處理結果
 */
/**
 * 處理出貨單號變更的輔助函數
 * @param {string} newSoid - 新出貨單號
 * @param {string} currentSoid - 當前出貨單號
 * @param {string} orderId - 出貨單ID
 * @returns {Promise<Object>} - 處理結果
 */
async function handleOrderNumberChange(newSoid, currentSoid, orderId) {
  // 驗證輸入
  if (!newSoid || newSoid === currentSoid) {
    return { changed: false };
  }
  
  if (!orderId || typeof orderId !== 'string') {
    return {
      changed: false,
      error: '無效的訂單ID'
    };
  }
  
  // 安全處理：確保soid是字符串並去除任何可能的惡意字符
  const sanitizedSoid = String(newSoid).trim();
  
  // 檢查新出貨單號是否已存在
  // 使用安全的方式查詢所有出貨單
  const allOrders = await ShippingOrder.find({}, { _id: 1, soid: 1 });
  
  // 在應用層面過濾，而不是直接在數據庫查詢中使用用戶輸入
  const existingSO = allOrders.find(order =>
    order.soid === sanitizedSoid && order._id.toString() !== orderId
  );
  
  if (existingSO) {
    return {
      changed: false,
      error: '該出貨單號已存在'
    };
  }
  
  // 使用安全的方式生成唯一訂單號
  const orderNumber = await generateUniqueOrderNumber(sanitizedSoid);
  return {
    changed: true,
    orderNumber
  };
}

// 處理狀態變更的輔助函數
async function handleStatusChange(newStatus, oldStatus, orderId) {
  if (!newStatus || newStatus === oldStatus) {
    return { changed: false };
  }
  
  // 如果狀態從已完成改為其他狀態，刪除相關的ship類型庫存記錄
  if (oldStatus === 'completed' && newStatus !== 'completed') {
    await deleteShippingInventoryRecords(orderId);
  }
  
  return {
    changed: true,
    needCreateInventory: oldStatus !== 'completed' && newStatus === 'completed'
  };
}

// 準備更新數據的輔助函數
function prepareUpdateData(requestBody, orderNumberResult) {
  const { soid, sosupplier, supplier, notes, paymentStatus, status } = requestBody;
  
  const updateData = {};
  if (soid) updateData.soid = soid;
  if (orderNumberResult?.orderNumber) {
    updateData.orderNumber = orderNumberResult.orderNumber;
  }
  if (sosupplier) updateData.sosupplier = sosupplier;
  if (supplier) updateData.supplier = supplier;
  if (notes !== undefined) updateData.notes = notes;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (status) updateData.status = status;
  
  return updateData;
}

// @route   PUT api/shipping-orders/:id
// @desc    更新出貨單
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { soid, items, status } = req.body;

    // 檢查出貨單是否存在
    let shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }

    // 處理出貨單號變更
    const orderNumberResult = await handleOrderNumberChange(soid, shippingOrder.soid, req.params.id);
    if (orderNumberResult.error) {
      return res.status(400).json({ msg: orderNumberResult.error });
    }

    // 處理項目更新
    if (items && items.length > 0) {
      const itemsValidation = await validateOrderItems(items);
      if (!itemsValidation.valid) {
        return res.status(400).json({ msg: itemsValidation.message });
      }
    }

    // 處理狀態變更
    const oldStatus = shippingOrder.status;
    const statusChangeResult = await handleStatusChange(status, oldStatus, shippingOrder._id);

    // 準備更新數據
    const updateData = prepareUpdateData(req.body, orderNumberResult);
    if (items && items.length > 0) {
      updateData.items = items;
    }

    // 更新出貨單
    shippingOrder = await ShippingOrder.findById(req.params.id);
    
    // 應用更新
    Object.keys(updateData).forEach(key => {
      shippingOrder[key] = updateData[key];
    });
    
    // 手動計算總金額以確保正確
    shippingOrder.totalAmount = shippingOrder.items.reduce(
      (total, item) => total + Number(item.dtotalCost), 0
    );
    
    // 保存更新後的出貨單
    await shippingOrder.save();

    // 如果需要創建庫存記錄
    if (statusChangeResult.needCreateInventory) {
      await createShippingInventoryRecords(shippingOrder);
    }

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
    const shippingOrder = await ShippingOrder.findById(req.params.id);
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
    const shippingOrders = await ShippingOrder.find({ supplier: req.params.supplierId.toString() })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
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
    const { soid, sosupplier, startDate, endDate } = req.query;
    
    const query = {};
    if (soid) query.soid = { $regex: soid.toString(), $options: 'i' };
    if (sosupplier) query.sosupplier = { $regex: sosupplier.toString(), $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const shippingOrders = await ShippingOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
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
    // 安全處理：驗證和清理productId
    if (!req.params.productId || typeof req.params.productId !== 'string') {
      return res.status(400).json({ msg: '無效的產品ID' });
    }
    
    const sanitizedProductId = req.params.productId.trim();
    
    // 使用安全的方式構建查詢條件
    const query = {
      'status': 'completed'
    };
    
    // 使用安全的方式查詢所有出貨單
    const allOrders = await ShippingOrder.find(query)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 在應用層面過濾產品，而不是直接在數據庫查詢中使用用戶輸入
    const shippingOrders = allOrders.filter(order => {
      if (!order.items || !Array.isArray(order.items)) return false;
      
      return order.items.some(item =>
        item.product?._id?.toString() === sanitizedProductId
      );
    })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
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
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
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
    const result = await Inventory.deleteMany({ shippingOrderId: shippingOrderId, type: 'ship' });
    console.log(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的ship類型庫存記錄`);
    return result;
  } catch (err) {
    console.error(`刪除ship類型庫存記錄時出錯: ${err.message}`);
    throw err;
  }
}

// @route   POST api/shipping-orders/import/basic
// @desc    導入出貨單基本資訊CSV
// @access  Public
router.post('/import/basic', upload.single('file'), async (req, res) => {
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
          try {
            // 檢查必要字段
            if (!row['出貨單號'] || !row['客戶']) {
              errors.push(`行 ${results.indexOf(row) + 1}: 出貨單號和客戶為必填項`);
              continue;
            }

            // 檢查出貨單號是否已存在
            if (await checkShippingOrderExists(row['出貨單號'])) {
              errors.push(`行 ${results.indexOf(row) + 1}: 出貨單號 ${row['出貨單號']} 已存在`);
              continue;
            }

            // 準備出貨單數據
            const shippingOrderData = {
              soid: row['出貨單號'],
              sobill: row['發票號'] || '',
              socustomer: row['客戶'],
              paymentStatus: row['付款狀態'] || '未收',
              items: [],
              status: 'pending'
            };

            // 嘗試查找客戶
            const customerDoc = await Customer.findOne({ name: row['客戶'] });
            if (customerDoc) {
              shippingOrderData.customer = customerDoc._id;
            }

            // 創建出貨單
            const shippingOrder = new ShippingOrder(shippingOrderData);
            await shippingOrder.save();
            successCount++;
          } catch (err) {
            console.error(`處理行 ${results.indexOf(row) + 1} 時出錯:`, err);
            errors.push(`行 ${results.indexOf(row) + 1}: ${err.message}`);
          }
        }

        // 返回結果
        res.json({
          msg: `成功導入 ${successCount} 筆出貨單基本資訊${errors.length > 0 ? '，但有部分錯誤' : ''}`,
          success: successCount,
          errors: errors
        });
      });
  } catch (err) {
    console.error('CSV導入錯誤:', err);
    res.status(500).json({ msg: '伺服器錯誤' });
  }
});

module.exports = router;
