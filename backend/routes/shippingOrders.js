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
      .populate('items.product', 'name code');
    
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
      .populate('items.product', 'name code');
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
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

// 生成日期格式的出貨單號
async function generateDateBasedOrderNumber() {
  // 獲取當前日期，格式為YYYYMMDD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `SO${year}${month}${day}`;
  
  // 查找今天已有的出貨單，以確定序號
  const regex = new RegExp(`^${datePrefix}\\d{5}$`);
  const existingOrders = await ShippingOrder.find({ soid: regex }).sort({ soid: -1 });
  
  let sequenceNumber = 1;
  if (existingOrders.length > 0) {
    // 從最後一個訂單號提取序號並加1
    const lastOrderNumber = existingOrders[0].soid;
    const lastSequence = parseInt(lastOrderNumber.substring(10), 10);
    sequenceNumber = lastSequence + 1;
  }
  
  // 格式化序號為5位數，例如00001, 00002, ...
  const formattedSequence = String(sequenceNumber).padStart(5, '0');
  return `${datePrefix}${formattedSequence}`;
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
      soid = await generateDateBasedOrderNumber();
    } else {
      // 檢查出貨單號是否已存在
      const existingSO = await ShippingOrder.findOne({ soid });
      if (existingSO) {
        return res.status(400).json({ msg: '該出貨單號已存在' });
      }
    }

    // 生成唯一訂單號
    const orderNumber = await generateUniqueOrderNumber(soid);

    // 驗證所有藥品ID是否存在，並檢查庫存是否足夠
    for (const item of items) {
      if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
        return res.status(400).json({ msg: '藥品項目資料不完整' });
      }

      // 嘗試查找藥品
      const product = await BaseProduct.findOne({ code: item.did });
      if (!product) {
        return res.status(400).json({ msg: `找不到藥品: ${item.did}` });
      }
      
      item.product = product._id;
      
      // 檢查庫存是否足夠
      const inventorySum = await Inventory.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]);
      
      const availableQuantity = inventorySum.length > 0 ? inventorySum[0].total : 0;
      
      if (availableQuantity < item.dquantity) {
        return res.status(400).json({ 
          msg: `藥品 ${item.dname} (${item.did}) 庫存不足，目前庫存: ${availableQuantity}，需要: ${item.dquantity}` 
        });
      }
    }

    // 嘗試查找供應商
    let supplierId = null;
    if (supplier) {
      supplierId = supplier;
    } else {
      const supplierDoc = await Supplier.findOne({ name: sosupplier });
      if (supplierDoc) {
        supplierId = supplierDoc._id;
      }
    }

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber, // 設置唯一訂單號
      sosupplier,
      supplier: supplierId,
      items,
      notes,
      status: status || 'pending',
      paymentStatus: paymentStatus || '未收'
    });

    await shippingOrder.save();

    // 如果狀態為已完成，則更新庫存
    if (shippingOrder.status === 'completed') {
      await updateInventory(shippingOrder);
      // 為出貨單創建新的ship類型庫存記錄
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
router.put('/:id', async (req, res) => {
  try {
    const { soid, sosupplier, supplier, items, notes, status, paymentStatus } = req.body;

    // 檢查出貨單是否存在
    let shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到該出貨單' });
    }

    // 如果更改了出貨單號，檢查新號碼是否已存在
    if (soid && soid !== shippingOrder.soid) {
      const existingSO = await ShippingOrder.findOne({ soid });
      if (existingSO && existingSO._id.toString() !== req.params.id) {
        return res.status(400).json({ msg: '該出貨單號已存在' });
      }
      
      // 如果出貨單號變更，生成新的唯一訂單號
      const orderNumber = await generateUniqueOrderNumber(soid);
      shippingOrder.orderNumber = orderNumber;
    }

    // 準備更新數據
    const updateData = {};
    if (soid) updateData.soid = soid;
    if (shippingOrder.orderNumber) updateData.orderNumber = shippingOrder.orderNumber;
    if (sosupplier) updateData.sosupplier = sosupplier;
    if (supplier) updateData.supplier = supplier;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    // 處理狀態變更
    const oldStatus = shippingOrder.status;
    if (status && status !== oldStatus) {
      updateData.status = status;
      
      // 如果狀態從已完成改為其他狀態，恢復庫存
      if (oldStatus === 'completed' && status !== 'completed') {
        await restoreInventory(shippingOrder._id);
        // 刪除相關的ship類型庫存記錄
        await deleteShippingInventoryRecords(shippingOrder._id);
      }
    }

    // 處理項目更新
    if (items && items.length > 0) {
      // 驗證所有藥品ID是否存在
      for (const item of items) {
        if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
          return res.status(400).json({ msg: '藥品項目資料不完整' });
        }

        // 嘗試查找藥品
        if (!item.product) {
          const product = await BaseProduct.findOne({ code: item.did });
          if (product) {
            item.product = product._id;
          } else {
            return res.status(400).json({ msg: `找不到藥品: ${item.did}` });
          }
        }
      }
      updateData.items = items;
    }

    // 更新出貨單
    // 先更新基本字段
    shippingOrder = await ShippingOrder.findById(req.params.id);
    
    // 應用更新
    Object.keys(updateData).forEach(key => {
      shippingOrder[key] = updateData[key];
    });
    
    // 手動計算總金額以確保正確
    shippingOrder.totalAmount = shippingOrder.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
    
    // 保存更新後的出貨單，這樣會觸發pre-save中間件
    await shippingOrder.save();

    // 如果狀態從非完成變為完成，則更新庫存
    if (oldStatus !== 'completed' && shippingOrder.status === 'completed') {
      await updateInventory(shippingOrder);
      // 為出貨單創建新的ship類型庫存記錄
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

    // 如果出貨單已完成，不允許刪除
    if (shippingOrder.status === 'completed') {
      // 刪除相關的ship類型庫存記錄
      await deleteShippingInventoryRecords(shippingOrder._id);
      // 恢復庫存
      await restoreInventory(shippingOrder._id);
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
    const shippingOrders = await ShippingOrder.find({ supplier: req.params.supplierId })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code');
    
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
    if (soid) query.soid = { $regex: soid, $options: 'i' };
    if (sosupplier) query.sosupplier = { $regex: sosupplier, $options: 'i' };
    
    const shippingOrders = await ShippingOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code');
    
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
    const shippingOrders = await ShippingOrder.find({
      'items.product': req.params.productId,
      'status': 'completed'
    })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code');
    
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
      .populate('items.product', 'name code');
    
    res.json(shippingOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// 更新庫存的輔助函數 - 出貨時扣減庫存
async function updateInventory(shippingOrder) {
  try {
    for (const item of shippingOrder.items) {
      if (!item.product) continue;
      
      // 獲取當前庫存記錄
      const inventoryRecords = await Inventory.find({ product: item.product })
        .sort({ createdAt: 1 }); // 先進先出原則
      
      let remainingQuantity = item.dquantity;
      
      // 檢查總庫存是否足夠
      const totalInventory = inventoryRecords.reduce((sum, record) => sum + record.quantity, 0);
      if (totalInventory < remainingQuantity) {
        throw new Error(`藥品 ${item.dname} (${item.did}) 庫存不足，目前庫存: ${totalInventory}，需要: ${remainingQuantity}`);
      }
      
      // 遍歷庫存記錄，扣減庫存
      for (const record of inventoryRecords) {
        if (remainingQuantity <= 0) break;
        
        const deductQuantity = Math.min(record.quantity, remainingQuantity);
        record.quantity -= deductQuantity;
        remainingQuantity -= deductQuantity;
        
        // 創建出貨記錄
        const shippingRecord = {
          shippingOrderId: shippingOrder._id,
          shippingOrderNumber: shippingOrder.orderNumber,
          quantity: deductQuantity
        };
        
        // 如果沒有shipping字段，創建一個新數組
        if (!record.shipping) {
          record.shipping = [];
        }
        
        record.shipping.push(shippingRecord);
        
        await record.save();
      }
      
      console.log(`已為產品 ${item.product} 扣減庫存，出貨單號: ${shippingOrder.orderNumber}, 數量: ${item.dquantity}`);
    }
    
    console.log(`已成功更新出貨單 ${shippingOrder._id} 的所有庫存`);
  } catch (err) {
    console.error(`更新庫存時出錯: ${err.message}`);
    throw err; // 重新拋出錯誤，讓調用者知道出了問題
  }
}

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

// 恢復庫存的輔助函數 - 取消出貨時恢復庫存
async function restoreInventory(shippingOrderId) {
  try {
    // 查找所有包含該出貨單ID的庫存記錄
    const inventoryRecords = await Inventory.find({
      'shipping.shippingOrderId': shippingOrderId
    });
    
    for (const record of inventoryRecords) {
      // 找出與該出貨單相關的出貨記錄
      const shippingRecords = record.shipping.filter(
        s => s.shippingOrderId.toString() === shippingOrderId.toString()
      );
      
      // 計算需要恢復的總數量
      const restoreQuantity = shippingRecords.reduce(
        (total, s) => total + s.quantity, 0
      );
      
      // 恢復庫存數量
      record.quantity += restoreQuantity;
      
      // 移除與該出貨單相關的出貨記錄
      record.shipping = record.shipping.filter(
        s => s.shippingOrderId.toString() !== shippingOrderId.toString()
      );
      
      await record.save();
      
      console.log(`已為庫存記錄 ${record._id} 恢復數量 ${restoreQuantity}`);
    }
    
    console.log(`已恢復與出貨單 ${shippingOrderId} 相關的所有庫存`);
  } catch (err) {
    console.error(`恢復庫存時出錯: ${err.message}`);
    throw err; // 重新拋出錯誤，讓調用者知道出了問題
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
            const existingSO = await ShippingOrder.findOne({ soid: row['出貨單號'] });
            if (existingSO) {
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
