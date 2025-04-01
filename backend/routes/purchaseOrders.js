const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const PurchaseOrder = require('../models/PurchaseOrder');
const { BaseProduct } = require('../models/BaseProduct');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');

// @route   GET api/purchase-orders
// @desc    獲取所有進貨單
// @access  Public
router.get('/', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .sort({ createdAt: -1 })
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

// @route   POST api/purchase-orders
// @desc    創建新進貨單
// @access  Public
router.post('/', [
  check('poid', '進貨單號為必填項').not().isEmpty(),
  check('pobill', '發票號為必填項').not().isEmpty(),
  check('pobilldate', '發票日期為必填項').not().isEmpty(),
  check('posupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { poid, pobill, pobilldate, posupplier, supplier, items, notes, status } = req.body;

    // 檢查進貨單號是否已存在
    const existingPO = await PurchaseOrder.findOne({ poid });
    if (existingPO) {
      return res.status(400).json({ msg: '該進貨單號已存在' });
    }

    // 生成唯一訂單號
    const orderNumber = await generateUniqueOrderNumber(poid);

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
      status: status || 'pending'
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
    const { poid, pobill, pobilldate, posupplier, supplier, items, notes, status } = req.body;

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
    
    // 處理狀態變更
    const oldStatus = purchaseOrder.status;
    if (status && status !== oldStatus) {
      updateData.status = status;
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
        purchaseOrderId: purchaseOrder._id, // 保存進貨單ID
        purchaseOrderNumber: purchaseOrder.orderNumber // 保存進貨單號
      });
      
      await inventory.save();
      console.log(`已為產品 ${item.product} 創建新庫存記錄，進貨單號: ${purchaseOrder.orderNumber}, 數量: ${item.dquantity}`);
      
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

module.exports = router;
