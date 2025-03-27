const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const auth = require('../middleware/auth'); // 已移除
const Product = require('../models/Product');

// @route   GET api/products
// @desc    Get all products
// @access  Public (已改為公開)
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
// @access  Public (已改為公開)
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

// 生成唯一藥品編號的函數
const generateProductCode = async () => {
  // 獲取當前最大編號
  const latestProduct = await Product.findOne().sort({ code: -1 });
  let newCode = 'P0001'; // 默認起始編號
  
  if (latestProduct && latestProduct.code) {
    // 如果編號格式為 P 開頭加數字
    const match = latestProduct.code.match(/^P(\d+)$/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      newCode = `P${num.toString().padStart(4, '0')}`;
    }
  }
  
  return newCode;
};

// @route   POST api/products
// @desc    Create a product
// @access  Public (已改為公開)
router.post(
  '/',
  [
    // 移除 auth
    // auth,
    [
      check('name', '藥品名稱為必填項').not().isEmpty(),
      check('unit', '單位為必填項').not().isEmpty(),
      check('purchasePrice', '進貨價為必填項').isNumeric(),
      check('sellingPrice', '售價為必填項').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      code,
      name,
      specification,
      category,
      unit,
      purchasePrice,
      sellingPrice,
      description,
      manufacturer,
      supplier,
      minStock
    } = req.body;
    try {
      // 建立藥品欄位物件
      const productFields = {
        name,
        unit,
        purchasePrice,
        sellingPrice
      };
      
      // 如果提供了藥品編號，檢查是否已存在
      if (code && code.trim() !== '') {
        // 檢查藥品編號是否已存在
        let existingProduct = await Product.findOne({ code });
        if (existingProduct) {
          return res.status(400).json({ msg: '藥品編號已存在' });
        }
        productFields.code = code;
      } else {
        // 自動生成藥品編號
        productFields.code = await generateProductCode();
      }
      
      if (specification) productFields.specification = specification;
      if (category) productFields.category = category;
      if (description) productFields.description = description;
      if (manufacturer) productFields.manufacturer = manufacturer;
      if (supplier) productFields.supplier = supplier;
      if (minStock) productFields.minStock = minStock;

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
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
  const {
    code,
    name,
    specification,
    category,
    unit,
    purchasePrice,
    sellingPrice,
    description,
    manufacturer,
    supplier,
    minStock
  } = req.body;
  // 建立更新欄位物件
  const productFields = {};
  if (code) productFields.code = code;
  if (name) productFields.name = name;
  if (specification !== undefined) productFields.specification = specification;
  if (category !== undefined) productFields.category = category;
  if (unit) productFields.unit = unit;
  if (purchasePrice) productFields.purchasePrice = purchasePrice;
  if (sellingPrice) productFields.sellingPrice = sellingPrice;
  if (description !== undefined) productFields.description = description;
  if (manufacturer !== undefined) productFields.manufacturer = manufacturer;
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
// @access  Public (已改為公開)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: '藥品不存在' });
    }
    await product.remove();
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
