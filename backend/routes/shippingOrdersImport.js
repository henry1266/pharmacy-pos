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

// @route   GET api/shipping-orders/generate-number
// @desc    生成新的出貨單號
// @access  Public
router.get('/generate-number', async (req, res) => {
  try {
    const orderNumber = await OrderNumberService.generateShippingOrderNumber();
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

    // 如果沒有提供出貨單號，生成一個新的
    let soid = orderNumber;
    if (!soid) {
      soid = await OrderNumberService.generateShippingOrderNumber();
    }

    // 檢查出貨單號是否已存在
    const existingSO = await ShippingOrder.findOne({ soid });
    if (existingSO) {
      return res.status(400).json({ msg: '該出貨單號已存在' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;
    let totalItems = 0;

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

    // 生成唯一訂單號
    const uniqueOrderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', soid);

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber: uniqueOrderNumber,
      sosupplier: supplierName,
      supplier: supplierId,
      items,
      status: 'pending',
      paymentStatus: '未收',
      notes: `從CSV匯入 (${new Date().toLocaleDateString()})`
    });

    await shippingOrder.save();

    res.json({
      msg: '藥品明細CSV匯入成功',
      shippingOrder: {
        _id: shippingOrder._id,
        soid: shippingOrder.soid,
        orderNumber: shippingOrder.orderNumber,
        supplier: supplierName,
        itemCount: items.length,
        totalAmount: shippingOrder.totalAmount
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
