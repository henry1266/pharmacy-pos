const express = require('express');
const router = express.Router();
const Accounting = require('../models/Accounting');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET api/accounting
// @desc    獲取所有記帳記錄
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, shift } = req.query;
    let query = {};
    
    // 日期範圍過濾
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // 班別過濾
    if (shift) {
      query.shift = shift;
    }
    
    const accountingRecords = await Accounting.find(query)
      .sort({ date: -1, shift: 1 })
      .populate('createdBy', 'name');
      
    res.json(accountingRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/accounting/:id
// @desc    獲取單筆記帳記錄
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const accounting = await Accounting.findById(req.params.id)
      .populate('createdBy', 'name');
      
    if (!accounting) {
      return res.status(404).json({ msg: '找不到記帳記錄' });
    }
    
    res.json(accounting);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到記帳記錄' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST api/accounting
// @desc    新增記帳記錄
// @access  Private
router.post('/', [
  auth,
  [
    check('date', '日期為必填欄位').not().isEmpty(),
    check('shift', '班別為必填欄位').isIn(['早', '中', '晚']),
    check('items', '至少需要一個項目').isArray().not().isEmpty(),
    check('items.*.amount', '金額必須為正數').isFloat({ min: 0 }),
    check('items.*.category', '名目為必填欄位').isIn(['掛號費', '部分負擔', '其他'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // 檢查是否已存在相同日期和班別的記錄
    const { date, shift } = req.body;
    const existingRecord = await Accounting.findOne({
      date: new Date(date),
      shift
    });
    
    if (existingRecord) {
      return res.status(400).json({ msg: '該日期和班別已有記帳記錄' });
    }
    
    const newAccounting = new Accounting({
      ...req.body,
      createdBy: req.user.id
    });
    
    const accounting = await newAccounting.save();
    res.json(accounting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   PUT api/accounting/:id
// @desc    更新記帳記錄
// @access  Private
router.put('/:id', [
  auth,
  [
    check('date', '日期為必填欄位').not().isEmpty(),
    check('shift', '班別為必填欄位').isIn(['早', '中', '晚']),
    check('items', '至少需要一個項目').isArray().not().isEmpty(),
    check('items.*.amount', '金額必須為正數').isFloat({ min: 0 }),
    check('items.*.category', '名目為必填欄位').isIn(['掛號費', '部分負擔', '其他'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { date, shift, items } = req.body;
    
    // 檢查是否存在相同日期和班別的其他記錄
    const existingRecord = await Accounting.findOne({
      date: new Date(date),
      shift,
      _id: { $ne: req.params.id }
    });
    
    if (existingRecord) {
      return res.status(400).json({ msg: '該日期和班別已有其他記帳記錄' });
    }
    
    let accounting = await Accounting.findById(req.params.id);
    
    if (!accounting) {
      return res.status(404).json({ msg: '找不到記帳記錄' });
    }
    
    // 更新記錄
    accounting.date = date;
    accounting.shift = shift;
    accounting.items = items;
    
    accounting = await accounting.save();
    res.json(accounting);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到記帳記錄' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/accounting/:id
// @desc    刪除記帳記錄
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const accounting = await Accounting.findById(req.params.id);
    
    if (!accounting) {
      return res.status(404).json({ msg: '找不到記帳記錄' });
    }
    
    await accounting.remove();
    res.json({ msg: '記帳記錄已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到記帳記錄' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/accounting/summary/daily
// @desc    獲取每日記帳摘要
// @access  Private
router.get('/summary/daily', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = {};
    
    // 日期範圍過濾
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.date.$lte = new Date(endDate);
      }
    }
    
    const summary = await Accounting.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            shift: '$shift'
          },
          totalAmount: { $sum: '$totalAmount' },
          items: { $push: '$items' }
        }
      },
      { $sort: { '_id.date': -1, '_id.shift': 1 } }
    ]);
    
    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;
