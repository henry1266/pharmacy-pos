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
    const supplier = await Supplier.findById(req.params.id);
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
        let supplier = await Supplier.findOne({ code });
        if (supplier) {
          return res.status(400).json({ msg: '供應商編號已存在' });
        }
      }

      // 建立供應商欄位物件
      const supplierFields = {
        name,
        shortCode
      };

      // 修復：允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
      if (code !== undefined) supplierFields.code = code;
      if (contactPerson !== undefined) supplierFields.contactPerson = contactPerson;
      if (phone !== undefined) supplierFields.phone = phone;
      if (email !== undefined) supplierFields.email = email;
      if (address !== undefined) supplierFields.address = address;
      if (taxId !== undefined) supplierFields.taxId = taxId;
      if (paymentTerms !== undefined) supplierFields.paymentTerms = paymentTerms;
      if (notes !== undefined) supplierFields.notes = notes;

      // 若沒提供供應商編號，系統自動生成
      if (!code) {
        const supplierCount = await Supplier.countDocuments();
        supplierFields.code = `S${String(supplierCount + 1).padStart(5, '0')}`;
      }

      supplier = new Supplier(supplierFields);
      await supplier.save();
      res.json(supplier);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
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

  // 建立更新欄位物件
  const supplierFields = {};
  // 修復：允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
  if (code !== undefined) supplierFields.code = code;
  if (shortCode !== undefined) supplierFields.shortCode = shortCode;
  if (name !== undefined) supplierFields.name = name;
  if (contactPerson !== undefined) supplierFields.contactPerson = contactPerson;
  if (phone !== undefined) supplierFields.phone = phone;
  if (email !== undefined) supplierFields.email = email;
  if (address !== undefined) supplierFields.address = address;
  if (taxId !== undefined) supplierFields.taxId = taxId;
  if (paymentTerms !== undefined) supplierFields.paymentTerms = paymentTerms;
  if (notes !== undefined) supplierFields.notes = notes;

  try {
    let supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }

    // 若編號被修改，檢查是否重複
    if (code && code !== supplier.code) {
      const existingSupplier = await Supplier.findOne({ code });
      if (existingSupplier) {
        return res.status(400).json({ msg: '供應商編號已存在' });
      }
    }

    // 更新
    supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: supplierFields },
      { new: true }
    );

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
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }

    // 修復：使用 findByIdAndDelete 替代 supplier.remove()
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ msg: '供應商已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    res.status(500).send('Server Error');
  }
});

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

    // 讀取CSV文件
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // 處理CSV數據
        const importResults = {
          total: results.length,
          success: 0,
          failed: 0,
          duplicates: 0,
          errors: []
        };

        for (const row of results) {
          try {
            // 檢查必填欄位
            if (!row.shortCode || !row.name) {
              errors.push({
                row,
                error: '簡碼和供應商名稱為必填項'
              });
              importResults.failed++;
              continue;
            }

            // 檢查供應商編號是否已存在
            if (row.code) {
              const existingSupplier = await Supplier.findOne({ code: row.code });
              if (existingSupplier) {
                duplicates.push({
                  row,
                  existingId: existingSupplier._id
                });
                importResults.duplicates++;
                continue;
              }
            }

            // 建立供應商欄位物件
            const supplierFields = {
              name: row.name,
              shortCode: row.shortCode
            };

            // 處理可選欄位
            if (row.code) supplierFields.code = row.code;
            if (row.contactPerson) supplierFields.contactPerson = row.contactPerson;
            if (row.phone) supplierFields.phone = row.phone;
            if (row.email) supplierFields.email = row.email;
            if (row.address) supplierFields.address = row.address;
            if (row.taxId) supplierFields.taxId = row.taxId;
            if (row.paymentTerms) supplierFields.paymentTerms = row.paymentTerms;
            if (row.notes) supplierFields.notes = row.notes;

            // 若沒提供供應商編號，系統自動生成
            if (!row.code) {
              const supplierCount = await Supplier.countDocuments();
              supplierFields.code = `S${String(supplierCount + 1).padStart(5, '0')}`;
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

        // 刪除上傳的文件
        fs.unlinkSync(filePath);

        // 返回匯入結果
        importResults.errors = errors;
        res.json(importResults);
      });
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
