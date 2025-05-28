const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Supplier = require('../models/Supplier');

// 設置文件上傳
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
    cb(null, `suppliers-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // 只接受CSV文件
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('只接受CSV文件'), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 限制5MB
  }
});

// @route   GET api/suppliers
// @desc    Get all suppliers
// @access  Public (已改為公開)
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/suppliers/:id
// @desc    Get supplier by ID
// @access  Public (已改為公開)
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id.toString() });
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/suppliers
// @desc    Create a supplier
// @access  Public (已改為公開)
router.post(
  '/',
  [
    // 移除 auth
    // auth,
    [
      check('name', '供應商名稱為必填項').not().isEmpty(),
      // 移除供應商編號必填驗證，允許自動生成
      // check('code', '供應商編號為必填項').not().isEmpty(),
      // 移除電話必填驗證
      // check('phone', '電話號碼為必填項').not().isEmpty(),
      check('shortCode', '簡碼為必填項').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      shortCode,
      name,
      contactPerson,
      phone,
      email,
      address,
      taxId,
      paymentTerms,
      notes
    } = req.body;

    try {
      // 檢查供應商編號是否已存在
      if (code) {
        let supplier = await Supplier.findOne({ code: code.toString() });
        if (supplier) {
          return res.status(400).json({ msg: '供應商編號已存在' });
        }
      }

      // 建立供應商欄位物件
      const supplierFields = {
        name: name.toString(),
        shortCode: shortCode.toString()
      };

      // 修復：允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
      if (code !== undefined) supplierFields.code = code.toString();
      if (contactPerson !== undefined) supplierFields.contactPerson = contactPerson.toString();
      if (phone !== undefined) supplierFields.phone = phone.toString();
      if (email !== undefined) supplierFields.email = email.toString();
      if (address !== undefined) supplierFields.address = address.toString();
      if (taxId !== undefined) supplierFields.taxId = taxId.toString();
      if (paymentTerms !== undefined) supplierFields.paymentTerms = paymentTerms.toString();
      if (notes !== undefined) supplierFields.notes = notes.toString();

      // 若沒提供供應商編號，系統自動生成
      if (!code) {
        const supplierCount = await Supplier.countDocuments();
        supplierFields.code = `S${String(supplierCount + 1).padStart(5, '0')}`;
      }

      let supplier = new Supplier(supplierFields);
      await supplier.save();
      res.json(supplier);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * 建立供應商更新欄位物件
 * @param {Object} reqBody - 請求體
 * @returns {Object} 供應商欄位物件
 */
function createSupplierFields(reqBody) {
  const {
    code,
    shortCode,
    name,
    contactPerson,
    phone,
    email,
    address,
    taxId,
    paymentTerms,
    notes
  } = reqBody;

  // 建立更新欄位物件
  const supplierFields = {};
  
  // 修復：允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
  if (code !== undefined) supplierFields.code = code.toString();
  if (shortCode !== undefined) supplierFields.shortCode = shortCode.toString();
  if (name !== undefined) supplierFields.name = name.toString();
  if (contactPerson !== undefined) supplierFields.contactPerson = contactPerson.toString();
  if (phone !== undefined) supplierFields.phone = phone.toString();
  if (email !== undefined) supplierFields.email = email.toString();
  if (address !== undefined) supplierFields.address = address.toString();
  if (taxId !== undefined) supplierFields.taxId = taxId.toString();
  if (paymentTerms !== undefined) supplierFields.paymentTerms = paymentTerms.toString();
  if (notes !== undefined) supplierFields.notes = notes.toString();
  
  return supplierFields;
}

/**
 * 檢查供應商編號是否重複
 * @param {string} code - 供應商編號
 * @param {string} currentCode - 當前供應商編號
 * @returns {Promise<boolean>} 是否重複
 */
async function isCodeDuplicate(code, currentCode) {
  // 若編號未修改，不需檢查
  if (!code || code === currentCode) {
    return false;
  }
  
  const existingSupplier = await Supplier.findOne({ code: code.toString() });
  return !!existingSupplier;
}

/**
 * 應用更新到供應商物件
 * @param {Object} supplier - 供應商物件
 * @param {Object} supplierFields - 供應商欄位物件
 */
function applyUpdatesToSupplier(supplier, supplierFields) {
  Object.keys(supplierFields).forEach(key => {
    supplier[key] = supplierFields[key];
  });
}

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
  try {
    // 查找供應商
    let supplier = await Supplier.findOne({ _id: req.params.id.toString() });
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }

    // 建立更新欄位物件
    const supplierFields = createSupplierFields(req.body);
    
    // 檢查編號是否重複
    if (await isCodeDuplicate(supplierFields.code, supplier.code)) {
      return res.status(400).json({ msg: '供應商編號已存在' });
    }

    // 應用更新
    applyUpdatesToSupplier(supplier, supplierFields);
    
    // 保存更新
    await supplier.save();
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/suppliers/:id
// @desc    Delete a supplier
// @access  Public (已改為公開)
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id.toString() });
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }

    // 修復：使用 deleteOne 替代 findByIdAndDelete
    await Supplier.deleteOne({ _id: req.params.id.toString() });
    res.json({ msg: '供應商已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * 檢查CSV行的必填欄位
 * @param {Object} row - CSV行數據
 * @returns {Object} 檢查結果
 */
function validateRequiredFields(row) {
  if (!row.shortCode || !row.name) {
    return {
      isValid: false,
      error: '簡碼和供應商名稱為必填項'
    };
  }
  return { isValid: true };
}

/**
 * 檢查供應商編號是否已存在
 * @param {string} code - 供應商編號
 * @returns {Promise<Object>} 檢查結果
 */
async function checkCodeDuplicate(code) {
  if (!code) {
    return { isDuplicate: false };
  }
  
  const existingSupplier = await Supplier.findOne({ code: code.toString() });
  if (existingSupplier) {
    return {
      isDuplicate: true,
      existingId: existingSupplier._id.toString()
    };
  }
  
  return { isDuplicate: false };
}

/**
 * 從CSV行創建供應商欄位物件
 * @param {Object} row - CSV行數據
 * @returns {Object} 供應商欄位物件
 */
function createSupplierFieldsFromRow(row) {
  const supplierFields = {
    name: row.name.toString(),
    shortCode: row.shortCode.toString()
  };

  // 處理可選欄位
  if (row.code) supplierFields.code = row.code.toString();
  if (row.contactPerson) supplierFields.contactPerson = row.contactPerson.toString();
  if (row.phone) supplierFields.phone = row.phone.toString();
  if (row.email) supplierFields.email = row.email.toString();
  if (row.address) supplierFields.address = row.address.toString();
  if (row.taxId) supplierFields.taxId = row.taxId.toString();
  if (row.paymentTerms) supplierFields.paymentTerms = row.paymentTerms.toString();
  if (row.notes) supplierFields.notes = row.notes.toString();
  
  return supplierFields;
}

/**
 * 生成供應商編號
 * @returns {Promise<string>} 生成的供應商編號
 */
async function generateSupplierCode() {
  const supplierCount = await Supplier.countDocuments();
  return `S${String(supplierCount + 1).padStart(5, '0')}`;
}

/**
 * 處理單個CSV行
 * @param {Object} row - CSV行數據
 * @param {Object} importResults - 匯入結果
 * @param {Array} errors - 錯誤數組
 * @param {Array} duplicates - 重複數組
 * @returns {Promise<void>}
 */
async function processRow(row, importResults, errors, duplicates) {
  try {
    // 檢查必填欄位
    const validation = validateRequiredFields(row);
    if (!validation.isValid) {
      errors.push({
        row,
        error: validation.error
      });
      importResults.failed++;
      return;
    }

    // 檢查供應商編號是否已存在
    const duplicateCheck = await checkCodeDuplicate(row.code);
    if (duplicateCheck.isDuplicate) {
      duplicates.push({
        row,
        existingId: duplicateCheck.existingId
      });
      importResults.duplicates++;
      return;
    }

    // 建立供應商欄位物件
    const supplierFields = createSupplierFieldsFromRow(row);

    // 若沒提供供應商編號，系統自動生成
    if (!row.code) {
      supplierFields.code = await generateSupplierCode();
    }

    // 創建新供應商
    const supplier = new Supplier(supplierFields);
    await supplier.save();
    importResults.success++;
  } catch (err) {
    console.error('匯入供應商錯誤:', err.message);
    errors.push({
      row,
      error: err.message
    });
    importResults.failed++;
  }
}

// @route   POST api/suppliers/import-csv
// @desc    Import suppliers from CSV file
// @access  Public
router.post('/import-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: '請上傳CSV文件' });
    }

    const results = [];
    const errors = [];
    const duplicates = [];
    const filePath = req.file.path;

    // 讀取CSV文件並處理
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    // 初始化匯入結果
    const importResults = {
      total: results.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };

    // 處理每一行CSV數據
    for (const row of results) {
      await processRow(row, importResults, errors, duplicates);
    }

    // 刪除上傳的文件
    fs.unlinkSync(filePath);

    // 返回匯入結果
    importResults.errors = errors;
    res.json(importResults);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/suppliers/template/csv
// @desc    Get CSV template for supplier import
// @access  Public
router.get('/template/csv', (req, res) => {
  try {
    // 創建CSV模板內容
    const csvTemplate = 'code,shortCode,name,contactPerson,phone,email,address,taxId,paymentTerms,notes\n' +
                        ',ABC,範例供應商,張三,0912345678,example@example.com,台北市信義區,12345678,月結30天,備註說明';

    // 設置響應頭
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers-template.csv');

    // 發送CSV模板
    res.send(csvTemplate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
