const express = require('express');
const router = express.Router();
const ProductCategory = require('../models/ProductCategory');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET api/product-categories
// @desc    獲取所有產品分類
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await ProductCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });
      
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/product-categories/:id
// @desc    獲取單筆產品分類
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
      
    if (!category) {
      return res.status(404).json({ msg: '找不到產品分類' });
    }
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到產品分類' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST api/product-categories
// @desc    新增產品分類
// @access  Private
router.post('/', [
  auth,
  [
    check('name', '名稱為必填欄位').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { name, description } = req.body;
    
    // 檢查是否已存在相同名稱的類別
    const existingCategory = await ProductCategory.findOne({ name });
    
    if (existingCategory) {
      return res.status(400).json({ msg: '該產品分類已存在' });
    }
    
    const newCategory = new ProductCategory({
      name,
      description: description || ''
    });
    
    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   PUT api/product-categories/:id
// @desc    更新產品分類
// @access  Private
router.put('/:id', [
  auth,
  [
    check('name', '名稱為必填欄位').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { name, description, isActive, order } = req.body;
    
    // 檢查是否存在相同名稱的其他類別
    const existingCategory = await ProductCategory.findOne({
      name,
      _id: { $ne: req.params.id }
    });
    
    if (existingCategory) {
      return res.status(400).json({ msg: '該產品分類已存在' });
    }
    
    let category = await ProductCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: '找不到產品分類' });
    }
    
    // 更新類別
    category.name = name;
    category.description = description || '';
    if (isActive !== undefined) {
      category.isActive = isActive;
    }
    if (order !== undefined) {
      category.order = order;
    }
    
    category = await category.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到產品分類' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/product-categories/:id
// @desc    刪除產品分類
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: '找不到產品分類' });
    }
    
    // 軟刪除 - 將isActive設為false
    category.isActive = false;
    await category.save();
    
    res.json({ msg: '產品分類已停用' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到產品分類' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;
