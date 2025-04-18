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

const upload = multer({ storage: storage });

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
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
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
    const existingOrder = await PurchaseOrder.findOne({ orderNumber });
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
    } else {
      // 檢查進貨單號是否已存在
      const existingPO = await PurchaseOrder.findOne({ poid });
      if (existingPO) {
        return res.status(400).json({ msg: '該進貨單號已存在' });
      }
    }

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('purchase', poid);

    // 驗證所有藥品ID是否存在
    for (const item of items) {
      if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
        return res.status(400).json({ msg: '藥品項目資料不完整' });
      }

      // 嘗試查找藥品
      const product = await BaseProduct.findOne({ code: item.did });
      if (product) {
        item.product = product._id;
      }
    }

    // 嘗試查找供應商
    let supplierId = null;
    if (supplier) {
      supplierId = supplier;
    } else {
      const supplierDoc = await Supplier.findOne({ name: posupplier });
      if (supplierDoc) {
        supplierId = supplierDoc._id;
      }
    }

    // 創建新進貨單
    const purchaseOrder = new PurchaseOrder({
      poid,
      orderNumber, // 設置唯一訂單號
      pobill,
      pobilldate,
      posupplier,
      supplier: supplierId,
      items,
      notes,
      status: status || 'pending',
      paymentStatus: paymentStatus || '未付'
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

// @route   PUT api/purchase-orders/:id
// @desc    更新進貨單
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { poid, pobill, pobilldate, posupplier, supplier, items, notes, status, paymentStatus } = req.body;

    // 檢查進貨單是否存在
    let purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ msg: '找不到該進貨單' });
    }

    // 如果更改了進貨單號，檢查新號碼是否已存在
    if (poid && poid !== purchaseOrder.poid) {
      const existingPO = await PurchaseOrder.findOne({ poid });
      if (existingPO && existingPO._id.toString() !== req.params.id) {
        return res.status(400).json({ msg: '該進貨單號已存在' });
      }
      
      // 如果進貨單號變更，生成新的唯一訂單號
      const orderNumber = await generateUniqueOrderNumber(poid);
      purchaseOrder.orderNumber = orderNumber;
    }

    // 準備更新數據
    const updateData = {};
    if (poid) updateData.poid = poid;
    if (purchaseOrder.orderNumber) updateData.orderNumber = purchaseOrder.orderNumber;
    if (pobill) updateData.pobill = pobill;
    if (pobilldate) updateData.pobilldate = pobilldate;
    if (posupplier) updateData.posupplier = posupplier;
    if (supplier) updateData.supplier = supplier;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    // 處理狀態變更
    const oldStatus = purchaseOrder.status;
    if (status && status !== oldStatus) {
      updateData.status = status;
      
      // 如果狀態從已完成改為其他狀態，刪除相關庫存記錄
      if (oldStatus === 'completed' && status !== 'completed') {
        await deleteInventoryRecords(purchaseOrder._id);
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
          }
        }
      }
      updateData.items = items;
    }

    // 更新進貨單
    // 先更新基本字段
    purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    // 應用更新
    Object.keys(updateData).forEach(key => {
      purchaseOrder[key] = updateData[key];
    });
    
    // 手動計算總金額以確保正確
    purchaseOrder.totalAmount = purchaseOrder.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
    
    // 保存更新後的進貨單，這樣會觸發pre-save中間件
    await purchaseOrder.save();

    // 如果狀態從非完成變為完成，則更新庫存
    if (oldStatus !== 'completed' && purchaseOrder.status === 'completed') {
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
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
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
    const purchaseOrders = await PurchaseOrder.find({ supplier: req.params.supplierId })
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
    if (poid) query.poid = { $regex: poid, $options: 'i' };
    if (pobill) query.pobill = { $regex: pobill, $options: 'i' };
    if (posupplier) query.posupplier = { $regex: posupplier, $options: 'i' };
    
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
      'items.product': req.params.productId,
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
        product: item.product,
        quantity: parseInt(item.dquantity),
        totalAmount: Number(item.dtotalCost), // 添加totalAmount字段
        purchaseOrderId: purchaseOrder._id, // 保存進貨單ID
        purchaseOrderNumber: purchaseOrder.orderNumber // 保存進貨單號
      });
      
      await inventory.save();
      console.log(`已為產品 ${item.product} 創建新庫存記錄，進貨單號: ${purchaseOrder.orderNumber}, 數量: ${item.dquantity}, 總金額: ${item.dtotalCost}`);
      
      // 更新藥品的採購價格
      await BaseProduct.findByIdAndUpdate(
        item.product,
        { 
          $set: { 
            purchasePrice: item.unitPrice || (item.dquantity > 0 ? item.dtotalCost / item.dquantity : 0)
          } 
        }
      );
    } catch (err) {
      console.error(`更新庫存時出錯: ${err.message}`);
      // 繼續處理其他項目
    }
  }
}

// 刪除與進貨單相關的庫存記錄
async function deleteInventoryRecords(purchaseOrderId) {
  try {
    const result = await Inventory.deleteMany({ purchaseOrderId });
    console.log(`已刪除 ${result.deletedCount} 筆與進貨單 ${purchaseOrderId} 相關的庫存記錄`);
    return result;
  } catch (err) {
    console.error(`刪除庫存記錄時出錯: ${err.message}`);
    throw err;
  }
}

// @route   POST api/purchase-orders/import/basic
// @desc    導入進貨單基本資訊CSV
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
            if (!row['進貨單號'] || !row['廠商']) {
              errors.push(`行 ${results.indexOf(row) + 1}: 進貨單號和廠商為必填項`);
              continue;
            }

            // 檢查進貨單號是否已存在
            const existingPO = await PurchaseOrder.findOne({ poid: row['進貨單號'] });
            if (existingPO) {
              errors.push(`行 ${results.indexOf(row) + 1}: 進貨單號 ${row['進貨單號']} 已存在`);
              continue;
            }

            // 準備進貨單數據
            const purchaseOrderData = {
              poid: row['進貨單號'],
              pobill: row['發票號'] || '',
              pobilldate: row['發票日期'] ? new Date(row['發票日期']) : null,
              posupplier: row['廠商'],
              paymentStatus: row['付款狀態'] || '未付',
              items: [],
              status: 'pending'
            };

            // 嘗試查找供應商
            const supplierDoc = await Supplier.findOne({ name: row['廠商'] });
            if (supplierDoc) {
              purchaseOrderData.supplier = supplierDoc._id;
            }

            // 創建進貨單
            const purchaseOrder = new PurchaseOrder(purchaseOrderData);
            await purchaseOrder.save();
            successCount++;
          } catch (err) {
            console.error(`處理行 ${results.indexOf(row) + 1} 時出錯:`, err);
            errors.push(`行 ${results.indexOf(row) + 1}: ${err.message}`);
          }
        }

        // 返回結果
        res.json({
          msg: `成功導入 ${successCount} 筆進貨單基本資訊${errors.length > 0 ? '，但有部分錯誤' : ''}`,
          success: successCount,
          errors: errors
        });
      });
  } catch (err) {
    console.error('CSV導入錯誤:', err);
    res.status(500).json({ msg: '伺服器錯誤' });
  }
});

// @route   POST api/purchase-orders/import/items
// @desc    導入進貨品項CSV
// @access  Public
router.post('/import/items', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: '請上傳CSV文件' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    const updatedPOs = new Set();

    // 創建一個Promise來處理CSV解析和數據保存
    const processCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            try {
              // 刪除上傳的文件
              fs.unlinkSync(req.file.path);

              // 處理每一行數據
              for (const row of results) {
                try {
                  // 檢查必要字段
                  if (!row['進貨單號'] || !row['藥品代碼'] || !row['數量'] || !row['金額']) {
                    errors.push(`行 ${results.indexOf(row) + 1}: 進貨單號、藥品代碼、數量和金額為必填項`);
                    continue;
                  }

                  // 檢查進貨單是否存在
                  const purchaseOrder = await PurchaseOrder.findOne({ poid: row['進貨單號'] });
                  if (!purchaseOrder) {
                    errors.push(`行 ${results.indexOf(row) + 1}: 進貨單號 ${row['進貨單號']} 不存在`);
                    continue;
                  }

                  // 檢查藥品是否存在
                  const product = await BaseProduct.findOne({ code: row['藥品代碼'] });
                  if (!product) {
                    errors.push(`行 ${results.indexOf(row) + 1}: 藥品代碼 ${row['藥品代碼']} 不存在`);
                    continue;
                  }

                  // 準備進貨品項數據
                  const itemData = {
                    product: product._id,
                    did: row['藥品代碼'],
                    dname: product.name,
                    dquantity: parseInt(row['數量']),
                    dtotalCost: parseFloat(row['金額'])
                  };

                  // 檢查是否已有相同藥品的項目
                  const existingItemIndex = purchaseOrder.items.findIndex(
                    item => item.did === row['藥品代碼']
                  );

                  if (existingItemIndex >= 0) {
                    // 更新現有項目
                    purchaseOrder.items[existingItemIndex] = {
                      ...purchaseOrder.items[existingItemIndex],
                      ...itemData
                    };
                  } else {
                    // 添加新項目
                    purchaseOrder.items.push(itemData);
                  }

                  // 標記此進貨單已更新
                  updatedPOs.add(purchaseOrder._id.toString());
                  
                  // 立即保存更新後的進貨單
                  // 重新計算總金額
                  purchaseOrder.totalAmount = purchaseOrder.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
                  await purchaseOrder.save();
                  
                  successCount++;
                  console.log(`成功更新進貨單 ${purchaseOrder.poid} 的品項: ${itemData.did}, 數量: ${itemData.dquantity}, 金額: ${itemData.dtotalCost}`);
                } catch (err) {
                  console.error(`處理行 ${results.indexOf(row) + 1} 時出錯:`, err);
                  errors.push(`行 ${results.indexOf(row) + 1}: ${err.message}`);
                }
              }

              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    };

    // 執行CSV處理並等待完成
    await processCSV();

    // 返回結果
    res.json({
      msg: `成功導入 ${successCount} 筆進貨品項，更新了 ${updatedPOs.size} 個進貨單${errors.length > 0 ? '，但有部分錯誤' : ''}`,
      success: successCount,
      updatedPOs: updatedPOs.size,
      errors: errors
    });
  } catch (err) {
    console.error('CSV導入錯誤:', err);
    res.status(500).json({ msg: '伺服器錯誤: ' + err.message });
  }
});

module.exports = router;
