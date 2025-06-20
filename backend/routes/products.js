const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// 模型 - 修正導入方式
const { BaseProduct, Product, Medicine } = require('../models/BaseProduct');
// 導入編號產生器
const { generateNextProductCode, generateNextMedicineCode } = require('../utils/codeGenerator');

// 配置multer存儲
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// 文件過濾器
const fileFilter = (req, file, cb) => {
  // 只接受CSV文件
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('只接受CSV文件'), false);
  }
};

// 配置上傳
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 限制5MB
});

// @route   GET api/products
// @desc    獲取所有產品
// @access  Public - 修改為公開訪問
router.get('/', async (req, res) => {
  try {
    const products = await BaseProduct.find().sort({ code: 1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/products
// @desc    獲取所有商品（非藥品）
// @access  Public - 修改為公開訪問
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ code: 1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/medicines
// @desc    獲取所有藥品
// @access  Public - 修改為公開訪問
router.get('/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ code: 1 });
    res.json(medicines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/code/:code
// @desc    根據產品代碼獲取產品
// @access  Public
router.get('/code/:code', async (req, res) => {
  try {
    // 驗證並清理產品代碼參數
    const productCode = req.params.code.toString().trim();
    
    // 使用參數化查詢而非直接構建查詢對象
    const codeQuery = { code: productCode };
    const product = await BaseProduct.findOne(codeQuery);
    
    if (!product) {
      return res.status(404).json({ msg: '產品不存在' });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
// @desc    獲取單個產品
// @access  Public - 修改為公開訪問
router.get('/:id', async (req, res) => {
  try {
    const product = await BaseProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: '產品不存在' });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '產品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products/product
// @desc    創建商品
// @access  Private
router.post(
  '/product',
  [
    auth,
    [
      check('name', '名稱是必填的').not().isEmpty(),
      check('shortCode', '簡碼是必填的').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const {
        code,
        shortCode,
        name,
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode
      } = req.body;
      
      // 創建商品對象
      const productFields = {
        code: code || await generateNextProductCode(), // 使用自動產生的編號
        shortCode,
        name,
        productType: 'product',
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode
      };
      
      const product = new Product(productFields);
      await product.save();
      
      res.json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/products/medicine
// @desc    創建藥品
// @access  Private
router.post(
  '/medicine',
  [
    auth,
    [
      check('name', '名稱是必填的').not().isEmpty(),
      check('shortCode', '簡碼是必填的').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const {
        code,
        shortCode,
        name,
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode,
        healthInsuranceCode,
        healthInsurancePrice
      } = req.body;
      
      // 創建藥品對象
      const medicineFields = {
        code: code || await generateNextMedicineCode(), // 使用自動產生的編號
        shortCode,
        name,
        productType: 'medicine',
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode,
        healthInsuranceCode,
        healthInsurancePrice
      };
      
      const medicine = new Medicine(medicineFields);
      await medicine.save();
      
      res.json(medicine);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/products/:id
// @desc    更新產品
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await BaseProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: '產品不存在' });
    }
    
    // 更新產品
    const {
      code,
      shortCode,
      name,
      category,
      unit,
      purchasePrice,
      sellingPrice,
      description,
      supplier,
      minStock,
      barcode,
      healthInsuranceCode,
      healthInsurancePrice
    } = req.body;
    
    // 記錄barcode值，用於調試
    console.log('更新產品，barcode值:', barcode);
    
    // 根據產品類型更新
    if (product.productType === 'product') {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          code,
          shortCode,
          name,
          category,
          unit,
          purchasePrice,
          sellingPrice,
          description,
          supplier,
          minStock,
          barcode
        },
        { new: true }
      );
      
      return res.json(updatedProduct);
    } else if (product.productType === 'medicine') {
      const updatedMedicine = await Medicine.findByIdAndUpdate(
        req.params.id,
        {
          code,
          shortCode,
          name,
          category,
          unit,
          purchasePrice,
          sellingPrice,
          description,
          supplier,
          minStock,
          barcode,
          healthInsuranceCode,
          healthInsurancePrice
        },
        { new: true }
      );
      
      return res.json(updatedMedicine);
    }
    
    res.status(400).json({ msg: '無效的產品類型' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '產品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/products/:id
// @desc    刪除產品
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await BaseProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: '產品不存在' });
    }
    
    await BaseProduct.findByIdAndDelete(req.params.id);
    
    res.json({ msg: '產品已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '產品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * 驗證CSV數據中的必填字段
 * @param {Array} results - CSV解析結果
 * @returns {boolean} - 是否有缺失必填字段
 */
function validateRequiredFields(results) {
  const requiredFields = ['shortCode', 'name'];
  return results.some(item => 
    requiredFields.some(field => !item[field] || item[field].trim() === '')
  );
}

/**
 * 查找或創建供應商
 * @param {string} supplierName - 供應商名稱
 * @returns {Promise<string|null>} - 供應商ID
 */
async function findOrCreateSupplier(supplierName) {
  // 導入Supplier模型
  const Supplier = require('../models/Supplier');
  
  if (!supplierName || supplierName.trim() === '') {
    return null;
  }
  
  // 先嘗試根據名稱查找供應商
  let supplier = await Supplier.findOne({ name: supplierName });
  
  // 如果找不到供應商，則創建新供應商
  if (!supplier) {
    const supplierCount = await Supplier.countDocuments();
    const newSupplier = new Supplier({
      code: `S${String(supplierCount + 1).padStart(5, '0')}`,
      shortCode: supplierName.substring(0, 3).toUpperCase(), // 使用供應商名稱前三個字符作為簡碼
      name: supplierName
    });
    supplier = await newSupplier.save();
    console.log(`創建新供應商: ${supplier.name}, ID: ${supplier._id}`);
  }
  
  return supplier._id;
}

/**
 * 創建產品基本字段
 * @param {Object} item - CSV項目數據
 * @param {string} productType - 產品類型
 * @param {string|null} supplierId - 供應商ID
 * @returns {Promise<Object>} - 產品基本字段
 */
async function createProductFields(item, productType, supplierId) {
  return {
    code: item.code || await (productType === 'product' ? generateNextProductCode() : generateNextMedicineCode()),
    shortCode: item.shortCode,
    name: item.name,
    productType,
    category: item.category || '',
    unit: item.unit || '',
    purchasePrice: parseFloat(item.purchasePrice) || 0,
    sellingPrice: parseFloat(item.sellingPrice) || 0,
    description: item.description || '',
    supplier: supplierId, // 使用供應商ID而不是名稱
    minStock: parseInt(item.minStock) || 10
  };
}

/**
 * 創建產品實例並保存
 * @param {Object} productFields - 產品基本字段
 * @param {Object} item - CSV項目數據
 * @param {string} productType - 產品類型
 * @returns {Promise<Object>} - 創建的產品
 */
async function createAndSaveProduct(productFields, item, productType) {
  if (productType === 'product') {
    productFields.barcode = item.barcode || '';
    const product = new Product(productFields);
    await product.save();
    return product;
  } else {
    productFields.healthInsuranceCode = item.healthInsuranceCode || '';
    productFields.healthInsurancePrice = parseFloat(item.healthInsurancePrice) || 0;
    const medicine = new Medicine(productFields);
    await medicine.save();
    return medicine;
  }
}

// @route   POST api/products/import
// @desc    從CSV匯入產品
// @access  Private
router.post('/import', [auth, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: '請上傳CSV文件' });
    }

    const productType = req.body.productType || 'product';
    const results = [];
    const errors = [];
    
    // 創建可讀流
    const readStream = fs.createReadStream(req.file.path);
    
    // 解析CSV
    readStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // 刪除上傳的文件
        fs.unlinkSync(req.file.path);
        
        if (results.length === 0) {
          return res.status(400).json({ msg: 'CSV文件為空或格式不正確' });
        }
        
        // 驗證必填字段
        if (validateRequiredFields(results)) {
          return res.status(400).json({ 
            msg: '部分記錄缺少必填字段 (shortCode, name)' 
          });
        }
        
        // 批量創建產品
        const createdProducts = [];
        
        for (const item of results) {
          try {
            // 處理供應商 - 根據名稱查找或創建供應商
            const supplierId = await findOrCreateSupplier(item.supplier);
            
            // 創建產品基本字段
            const productFields = await createProductFields(item, productType, supplierId);
            
            // 創建產品實例並保存
            const product = await createAndSaveProduct(productFields, item, productType);
            createdProducts.push(product);
          } catch (err) {
            console.error('創建產品錯誤:', err.message);
            errors.push({
              item,
              error: err.message
            });
          }
        }
        
        res.json({ 
          success: true, 
          count: createdProducts.length,
          errors: errors.length > 0 ? errors : undefined
        });
      })
      .on('error', (err) => {
        console.error('CSV解析錯誤:', err.message);
        return res.status(500).json({ msg: 'CSV解析錯誤' });
      });
  } catch (err) {
    console.error('CSV匯入錯誤:', err.message);
    res.status(500).json({ msg: '服務器錯誤' });
  }
});

module.exports = router;
