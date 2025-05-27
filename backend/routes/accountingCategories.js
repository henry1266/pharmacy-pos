const express = require('express');
const router = express.Router();
const AccountingCategory = require('../models/AccountingCategory');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET api/accounting-categories
// @desc    獲取所有記帳名目類別
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await AccountingCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });
      
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/accounting-categories/:id
// @desc    獲取單筆記帳名目類別
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await AccountingCategory.findOne({ _id: req.params.id.toString() });
      
    if (!category) {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST api/accounting-categories
// @desc    新增記帳名目類別
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
    const existingCategory = await AccountingCategory.findOne({ name: name.toString() });
    
    if (existingCategory) {
      return res.status(400).json({ msg: '該名目類別已存在' });
    }
    
    const newCategory = new AccountingCategory({
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

// @route   PUT api/accounting-categories/:id
// @desc    更新記帳名目類別
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
    const existingCategory = await AccountingCategory.findOne({
      name,
      _id: { $ne: req.params.id.toString() }
    });
    
    if (existingCategory) {
      return res.status(400).json({ msg: '該名目類別已存在' });
    }
    
    let category = await AccountingCategory.findOne({ _id: req.params.id.toString() });
    
    if (!category) {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
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
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/accounting-categories/:id
// @desc    刪除記帳名目類別
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await AccountingCategory.findOne({ _id: req.params.id.toString() });
    
    if (!category) {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    
    // 軟刪除 - 將isActive設為false
    category.isActive = false;
    await category.save();
    
    res.json({ msg: '記帳名目類別已停用' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;
