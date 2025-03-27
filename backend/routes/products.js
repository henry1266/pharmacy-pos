const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Product = require('../models/Product');

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
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
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: '藥品不存在' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '藥品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products
// @desc    Create a product
// @access  Public
router.post(
  '/',
  [
    [
      check('name', '藥品名稱為必填項').not().isEmpty(),
      check('shortCode', '簡碼為必填項').not().isEmpty()
      // 移除單位、進貨價和售價的必填驗證
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
      const productFields = {
        name,
        shortCode
      };

      // 檢查藥品編號是否已存在
      if (code) {
        let product = await Product.findOne({ code });
        if (product) {
          return res.status(400).json({ msg: '藥品編號已存在' });
        }
        productFields.code = code;
      } else {
        // 若沒提供藥品編號，系統自動生成
        const productCount = await Product.countDocuments();
        productFields.code = `P${String(productCount + 1).padStart(5, '0')}`;
      }

      // 處理可選欄位，允許保存空字符串值
      if (healthInsuranceCode !== undefined) productFields.healthInsuranceCode = healthInsuranceCode;
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

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Public
router.put('/:id', async (req, res) => {
  const {
    code,
    shortCode,
    name,
    healthInsuranceCode,
    category,
    unit,
    purchasePrice,
    sellingPrice,
    description,
    supplier,
    minStock
  } = req.body;

  // 建立更新欄位物件
  const productFields = {};
  // 允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
  if (code !== undefined) productFields.code = code;
  if (shortCode !== undefined) productFields.shortCode = shortCode;
  if (name !== undefined) productFields.name = name;
  if (healthInsuranceCode !== undefined) productFields.healthInsuranceCode = healthInsuranceCode;
  if (category !== undefined) productFields.category = category;
  if (unit !== undefined) productFields.unit = unit;
  if (purchasePrice !== undefined) productFields.purchasePrice = purchasePrice;
  if (sellingPrice !== undefined) productFields.sellingPrice = sellingPrice;
  if (description !== undefined) productFields.description = description;
  if (supplier !== undefined) productFields.supplier = supplier;
  if (minStock !== undefined) productFields.minStock = minStock;

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: '藥品不存在' });
    }

    // 若編號被修改，檢查是否重複
    if (code && code !== product.code) {
      const existingProduct = await Product.findOne({ code });
      if (existingProduct) {
        return res.status(400).json({ msg: '藥品編號已存在' });
      }
    }

    // 更新
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '藥品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: '藥品不存在' });
    }

    // 使用 findByIdAndDelete 替代 remove()
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: '藥品已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '藥品不存在' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
