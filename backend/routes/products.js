const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { BaseProduct, Product, Medicine } = require('../models/BaseProduct');

// @route   GET api/products
// @desc    Get all products (both types)
// @access  Public
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
// @desc    Get only regular products
// @access  Public
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
// @desc    Get only medicines
// @access  Public
router.get('/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ code: 1 });
    res.json(medicines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
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

// 生成唯一產品編號的函數
const generateProductCode = async (productType) => {
  // 獲取當前最大編號
  const prefix = productType === 'medicine' ? 'M' : 'P';
  const latestProduct = await BaseProduct.findOne({ 
    code: new RegExp(`^${prefix}\\d+$`) 
  }).sort({ code: -1 });
  
  let newCode = `${prefix}0001`; // 默認起始編號
  
  if (latestProduct && latestProduct.code) {
    // 如果編號格式為 P/M 開頭加數字
    const match = latestProduct.code.match(/^[PM](\d+)$/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      newCode = `${prefix}${num.toString().padStart(4, '0')}`;
    }
  }
  
  return newCode;
};

// @route   POST api/products/product
// @desc    Create a regular product
// @access  Public
router.post(
  '/product',
  [
    [
      check('name', '產品名稱為必填項').not().isEmpty(),
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
      barcode,
      category,
      unit,
      purchasePrice,
      sellingPrice,
      description,
      supplier,
      minStock
    } = req.body;

    try {
      // 建立產品欄位物件
      const productFields = {
        name,
        shortCode,
        productType: 'product'
      };

      // 檢查產品編號是否已存在
      if (code) {
        let product = await BaseProduct.findOne({ code });
        if (product) {
          return res.status(400).json({ msg: '產品編號已存在' });
        }
        productFields.code = code;
      } else {
        // 若沒提供產品編號，系統自動生成
        productFields.code = await generateProductCode('product');
      }

      // 處理可選欄位，允許保存空字符串值
      if (barcode !== undefined) productFields.barcode = barcode;
      if (category !== undefined) productFields.category = category;
      if (unit !== undefined) productFields.unit = unit;
      if (purchasePrice !== undefined) productFields.purchasePrice = purchasePrice;
      if (sellingPrice !== undefined) productFields.sellingPrice = sellingPrice;
      if (description !== undefined) productFields.description = description;
      if (supplier !== undefined) productFields.supplier = supplier;
      if (minStock !== undefined) productFields.minStock = minStock;

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
// @desc    Create a medicine
// @access  Public
router.post(
  '/medicine',
  [
    [
      check('name', '藥品名稱為必填項').not().isEmpty(),
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
      healthInsuranceCode,
      healthInsurancePrice,
      category,
      unit,
      purchasePrice,
      sellingPrice,
      description,
      supplier,
      minStock
    } = req.body;

    try {
      // 建立藥品欄位物件
      const medicineFields = {
        name,
        shortCode,
        productType: 'medicine'
      };

      // 檢查藥品編號是否已存在
      if (code) {
        let medicine = await BaseProduct.findOne({ code });
        if (medicine) {
          return res.status(400).json({ msg: '藥品編號已存在' });
        }
        medicineFields.code = code;
      } else {
        // 若沒提供藥品編號，系統自動生成
        medicineFields.code = await generateProductCode('medicine');
      }

      // 處理可選欄位，允許保存空字符串值
      if (healthInsuranceCode !== undefined) medicineFields.healthInsuranceCode = healthInsuranceCode;
      if (healthInsurancePrice !== undefined) medicineFields.healthInsurancePrice = healthInsurancePrice;
      if (category !== undefined) medicineFields.category = category;
      if (unit !== undefined) medicineFields.unit = unit;
      if (purchasePrice !== undefined) medicineFields.purchasePrice = purchasePrice;
      if (sellingPrice !== undefined) medicineFields.sellingPrice = sellingPrice;
      if (description !== undefined) medicineFields.description = description;
      if (supplier !== undefined) medicineFields.supplier = supplier;
      if (minStock !== undefined) medicineFields.minStock = minStock;

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
// @desc    Update a product
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    // 先檢查產品是否存在並獲取類型
    const existingProduct = await BaseProduct.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ msg: '產品不存在' });
    }

    const productType = existingProduct.productType;
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
      minStock
    } = req.body;

    // 建立基本更新欄位物件
    const updateFields = {};
    // 允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
    if (code !== undefined) updateFields.code = code;
    if (shortCode !== undefined) updateFields.shortCode = shortCode;
    if (name !== undefined) updateFields.name = name;
    if (category !== undefined) updateFields.category = category;
    if (unit !== undefined) updateFields.unit = unit;
    if (purchasePrice !== undefined) updateFields.purchasePrice = purchasePrice;
    if (sellingPrice !== undefined) updateFields.sellingPrice = sellingPrice;
    if (description !== undefined) updateFields.description = description;
    if (supplier !== undefined) updateFields.supplier = supplier;
    if (minStock !== undefined) updateFields.minStock = minStock;

    // 根據產品類型處理特有欄位
    if (productType === 'product') {
      const { barcode } = req.body;
      if (barcode !== undefined) updateFields.barcode = barcode;
      
      // 調試日誌
      console.log('更新商品，barcode值:', barcode);
      console.log('更新欄位:', updateFields);
    } else if (productType === 'medicine') {
      const { healthInsuranceCode, healthInsurancePrice } = req.body;
      if (healthInsuranceCode !== undefined) updateFields.healthInsuranceCode = healthInsuranceCode;
      if (healthInsurancePrice !== undefined) updateFields.healthInsurancePrice = healthInsurancePrice;
    }

    // 若編號被修改，檢查是否重複
    if (code && code !== existingProduct.code) {
      const duplicateProduct = await BaseProduct.findOne({ code });
      if (duplicateProduct) {
        return res.status(400).json({ msg: '產品編號已存在' });
      }
    }

    // 更新
    const updatedProduct = await BaseProduct.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '產品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const product = await BaseProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: '產品不存在' });
    }

    // 使用 findByIdAndDelete 刪除產品
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

module.exports = router;
