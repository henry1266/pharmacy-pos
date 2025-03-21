const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Product = require('../models/Product');

// @route   GET api/products
// @desc    獲取所有藥品
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ date: -1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/products/:id
// @desc    獲取單個藥品
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: '找不到藥品' });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到藥品' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST api/products
// @desc    添加藥品
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('code', '藥品編號為必填欄位').not().isEmpty(),
      check('name', '藥品名稱為必填欄位').not().isEmpty(),
      check('category', '類別為必填欄位').not().isEmpty(),
      check('unit', '單位為必填欄位').not().isEmpty(),
      check('purchasePrice', '進貨價格為必填欄位').isNumeric(),
      check('sellingPrice', '售價為必填欄位').isNumeric()
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

      // 創建新藥品
      product = new Product({
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
      });

      await product.save();
      res.json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('伺服器錯誤');
    }
  }
);

// @route   PUT api/products/:id
// @desc    更新藥品
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
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

  // 建立更新對象
  const productFields = {};
  if (name) productFields.name = name;
  if (specification) productFields.specification = specification;
  if (category) productFields.category = category;
  if (unit) productFields.unit = unit;
  if (purchasePrice) productFields.purchasePrice = purchasePrice;
  if (sellingPrice) productFields.sellingPrice = sellingPrice;
  if (description) productFields.description = description;
  if (manufacturer) productFields.manufacturer = manufacturer;
  if (supplier) productFields.supplier = supplier;
  if (minStock) productFields.minStock = minStock;

  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: '找不到藥品' });
    }

    // 更新藥品
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到藥品' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/products/:id
// @desc    刪除藥品
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: '找不到藥品' });
    }

    await Product.findByIdAndRemove(req.params.id);
    res.json({ msg: '藥品已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到藥品' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;
