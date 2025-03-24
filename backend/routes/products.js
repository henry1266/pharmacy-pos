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
      check('code', '藥品編號為必填項').not().isEmpty(),
      check('category', '藥品分類為必填項').not().isEmpty(),
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
      // 檢查藥品編號是否已存在
      let product = await Product.findOne({ code });
      if (product) {
        return res.status(400).json({ msg: '藥品編號已存在' });
      }
      // 建立藥品欄位物件
      const productFields = {
        code,
        name,
        category,
        unit,
        purchasePrice,
        sellingPrice
      };
      if (specification) productFields.specification = specification;
      if (description) productFields.description = description;
      if (manufacturer) productFields.manufacturer = manufacturer;
      if (supplier) productFields.supplier = supplier;
      if (minStock) productFields.minStock = minStock;

      product = new Product(productFields);
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
  if (specification) productFields.specification = specification;
  if (category) productFields.category = category;
  if (unit) productFields.unit = unit;
  if (purchasePrice) productFields.purchasePrice = purchasePrice;
  if (sellingPrice) productFields.sellingPrice = sellingPrice;
  if (description) productFields.description = description;
  if (manufacturer) productFields.manufacturer = manufacturer;
  if (supplier) productFields.supplier = supplier;
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
