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
const OrderNumberService = require('../utils/OrderNumberService');

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

/**
 * 為出貨單創建庫存記錄
 * @param {Object} shippingOrder - 出貨單對象
 */
async function createShippingInventoryRecords(shippingOrder) {
  try {
    // 檢查是否已經存在該出貨單的庫存記錄
    const existingRecords = await Inventory.find({ 
      shippingOrderId: shippingOrder._id 
    });
    
    if (existingRecords.length > 0) {
      console.log(`出貨單 ${shippingOrder.soid} 的庫存記錄已存在，跳過創建`);
      return;
    }
    
    // 為每個藥品項目創建庫存記錄
    for (const item of shippingOrder.items) {
      if (!item.product || !item.dquantity) continue;
      
      // 創建出貨庫存記錄（負數表示出貨）
      const inventory = new Inventory({
        product: item.product,
        quantity: -item.dquantity, // 負數表示出貨減少庫存
        totalAmount: item.dtotalCost || 0,
        type: 'ship', // 設置類型為ship
        shippingOrderId: shippingOrder._id, // 關聯到出貨單ID
        shippingOrderNumber: shippingOrder.soid, // 設置出貨單號
        accountingId: null, // 預設為null
        lastUpdated: new Date() // 設置最後更新時間
      });
      
      await inventory.save();
      console.log(`為產品 ${item.dname} 創建了庫存記錄，數量: ${-item.dquantity}`);
    }
    
    console.log(`成功為出貨單 ${shippingOrder.soid} 創建庫存記錄`);
  } catch (error) {
    console.error(`創建出貨單庫存記錄時出錯:`, error);
    throw error;
  }
}

/**
 * 根據日期生成訂單號
 * @param {string} dateStr - 日期字符串，格式為YYYY-MM-DD
 * @returns {Promise<string>} 生成的訂單號
 */
async function generateOrderNumberByDate(dateStr) {
  try {
    // 解析日期
    let dateObj;
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(dateStr);
    } else {
      // 如果日期格式不正確或未提供，使用當前日期
      dateObj = new Date();
    }
    
    // 檢查日期是否有效
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    
    // 格式化日期為YYYYMMDD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateFormat = `${year}${month}${day}`;
    
    // 基本訂單號前綴
    const prefix = `D${dateFormat}`;
    
    // 查找當天最大序號
    const regex = new RegExp(`^${prefix}\\d{3}$`);
    const existingOrders = await ShippingOrder.find({ soid: regex }).sort({ soid: -1 });
    
    let sequence = 1; // 默認從001開始
    
    if (existingOrders.length > 0) {
      // 從現有訂單號中提取序號並加1
      const lastOrderNumber = existingOrders[0].soid;
      const lastSequence = parseInt(lastOrderNumber.substring(prefix.length), 10);
      sequence = lastSequence + 1;
      
      // 檢查是否有序號缺失，如果有則使用最小的缺失序號
      const existingSequences = existingOrders.map(order => 
        parseInt(order.soid.substring(prefix.length), 10)
      ).sort((a, b) => a - b);
      
      // 查找從1開始的第一個缺失序號
      for (let i = 1; i <= existingSequences[existingSequences.length - 1]; i++) {
        if (!existingSequences.includes(i)) {
          sequence = i;
          break;
        }
      }
    }
    
    // 生成新訂單號，序號部分固定3位數
    return `${prefix}${String(sequence).padStart(3, '0')}`;
  } catch (error) {
    console.error('根據日期生成訂單號時出錯:', error);
    throw error;
  }
}

// @route   GET api/shipping-orders/generate-number
// @desc    生成新的出貨單號
// @access  Public
router.get('/generate-number', async (req, res) => {
  try {
    // 使用當前日期生成訂單號
    const orderNumber = await generateOrderNumberByDate();
    res.json({ orderNumber });
  } catch (err) {
    console.error('生成出貨單號時出錯:', err.message);
    res.status(500).json({ msg: '伺服器錯誤', error: err.message });
  }
});

// @route   POST api/shipping-orders/import/medicine
// @desc    導入藥品明細CSV (日期,健保碼,數量,健保價)
// @access  Public
router.post('/import/medicine', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: '請上傳CSV文件' });
    }

    // 獲取請求中的出貨單號和預設供應商
    const { orderNumber } = req.body;
    let defaultSupplier = null;
    
    try {
      if (req.body.defaultSupplier) {
        defaultSupplier = JSON.parse(req.body.defaultSupplier);
      }
    } catch (error) {
      console.error('解析預設供應商數據時出錯:', error);
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;
    let totalItems = 0;
    let firstDate = null;

    // 讀取並解析CSV文件
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          // 檢查CSV格式是否符合要求
          const keys = Object.keys(data);
          // 如果CSV沒有標題行，則使用索引位置
          if (keys.length >= 4) {
            const date = data[keys[0]] || '';
            const nhCode = data[keys[1]] || '';
            const quantity = parseInt(data[keys[2]], 10) || 0;
            const nhPrice = parseFloat(data[keys[3]]) || 0;

            // 記錄第一行的日期，用於生成訂單號
            if (firstDate === null && date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              firstDate = date;
            }

            if (nhCode && quantity > 0 && nhPrice > 0) {
              results.push({
                date,
                nhCode,
                quantity,
                nhPrice
              });
              totalItems++;
            } else {
              errors.push(`行 ${totalItems + 1}: 資料不完整或格式錯誤 (健保碼: ${nhCode}, 數量: ${quantity}, 健保價: ${nhPrice})`);
              failCount++;
            }
          } else {
            errors.push(`行 ${totalItems + 1}: CSV格式不正確，應為"日期,健保碼,數量,健保價"`);
            failCount++;
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // 刪除上傳的文件
    fs.unlinkSync(req.file.path);

    if (results.length === 0) {
      return res.status(400).json({ 
        msg: 'CSV文件中沒有有效的藥品明細數據',
        errors
      });
    }

    // 根據CSV首行日期生成訂單號
    let soid = orderNumber;
    if (!soid) {
      soid = await generateOrderNumberByDate(firstDate);
    }

    // 檢查出貨單號是否已存在
    const existingSO = await ShippingOrder.findOne({ soid });
    if (existingSO) {
      // 如果已存在，生成新的訂單號
      soid = await generateOrderNumberByDate(firstDate);
      
      // 再次檢查
      const existingSO2 = await ShippingOrder.findOne({ soid });
      if (existingSO2) {
        return res.status(400).json({ msg: '無法生成唯一的出貨單號，請稍後再試' });
      }
    }

    // 查找所有健保碼對應的藥品
    const nhCodes = results.map(item => item.nhCode);
    const products = await BaseProduct.find({ healthInsuranceCode: { $in: nhCodes } });
    
    // 建立健保碼到藥品的映射
    const productMap = {};
    products.forEach(product => {
      if (product.healthInsuranceCode) {
        productMap[product.healthInsuranceCode] = product;
      }
    });

    // 準備出貨單項目
    const items = [];
    for (const item of results) {
      const product = productMap[item.nhCode];
      
      if (!product) {
        errors.push(`找不到健保碼為 ${item.nhCode} 的藥品`);
        failCount++;
        continue;
      }

      // 計算總成本
      const totalCost = item.quantity * item.nhPrice;
      
      items.push({
        product: product._id,
        did: product.code || '',
        dname: product.name || '',
        dquantity: item.quantity,
        dtotalCost: totalCost,
        unitPrice: item.nhPrice
      });
      
      successCount++;
    }

    if (items.length === 0) {
      return res.status(400).json({ 
        msg: '無法匹配任何有效的藥品',
        errors
      });
    }

    // 確定供應商
    let supplierId = null;
    let supplierName = '預設供應商';
    
    if (defaultSupplier) {
      if (defaultSupplier._id) {
        supplierId = defaultSupplier._id;
      }
      if (defaultSupplier.name) {
        supplierName = defaultSupplier.name;
      }
    } else {
      // 嘗試查找名為"調劑"的供應商
      const supplier = await Supplier.findOne({ name: '調劑' });
      if (supplier) {
        supplierId = supplier._id;
        supplierName = supplier.name;
      }
    }

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber: soid, // 使用相同的編號作為orderNumber
      sosupplier: supplierName,
      supplier: supplierId,
      items,
      status: 'completed', // 根據新需求設置為completed
      paymentStatus: '已收款', // 根據之前的需求設置為已收款
      notes: `從CSV匯入 (${new Date().toLocaleDateString()})`
    });

    // 保存出貨單
    const savedOrder = await shippingOrder.save();
    console.log(`出貨單 ${savedOrder.soid} 已保存，狀態: ${savedOrder.status}`);
    
    // 創建庫存記錄
    await createShippingInventoryRecords(savedOrder);
    console.log(`已為出貨單 ${savedOrder.soid} 創建庫存記錄`);

    res.json({
      msg: '藥品明細CSV匯入成功',
      shippingOrder: {
        _id: savedOrder._id,
        soid: savedOrder.soid,
        orderNumber: savedOrder.orderNumber,
        supplier: supplierName,
        itemCount: items.length,
        totalAmount: savedOrder.totalAmount,
        paymentStatus: savedOrder.paymentStatus,
        status: savedOrder.status
      },
      summary: {
        totalItems,
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : null
      }
    });
  } catch (err) {
    console.error('匯入藥品明細CSV時出錯:', err.message);
    res.status(500).json({ 
      msg: '伺服器錯誤', 
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  }
});

module.exports = router;
