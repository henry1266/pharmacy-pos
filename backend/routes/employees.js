const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// @route   GET api/employees
// @desc    Get all employees with pagination and search
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortField = req.query.sortField || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // 建立搜尋條件
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { position: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // 計算總筆數
    const totalCount = await Employee.countDocuments(searchQuery);

    // 取得分頁資料
    const employees = await Employee.find(searchQuery)
      .sort({ [sortField]: sortOrder })
      .skip(page * limit)
      .limit(limit);

    res.json({
      employees,
      totalCount,
      page,
      limit
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    const employee = await Employee.findOne({ _id: req.params.id.toString() });

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    res.json(employee);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/employees
// @desc    Create a new employee
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', '姓名為必填欄位').not().isEmpty(),
      check('gender', '性別為必填欄位').isIn(['male', 'female']),
      check('birthDate', '出生年月日為必填欄位').not().isEmpty(),
      check('idNumber', '身分證統一號碼為必填欄位').not().isEmpty(),
      check('address', '住址為必填欄位').not().isEmpty(),
      check('position', '任職職務為必填欄位').not().isEmpty(),
      check('department', '所屬部門為必填欄位').not().isEmpty(),
      check('hireDate', '到職年月日為必填欄位').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // 檢查身分證號碼是否已存在
      let employee = await Employee.findOne({ idNumber: req.body.idNumber.toString() });
      if (employee) {
        return res.status(400).json({ msg: '此身分證號碼已存在' });
      }

      // 建立新員工資料
      const {
        name,
        gender,
        birthDate,
        idNumber,
        education,
        nativePlace,
        address,
        phone,
        position,
        department,
        hireDate,
        salary,
        insuranceDate,
        experience,
        rewards,
        injuries,
        additionalInfo,
        idCardFront,
        idCardBack,
        userId
      } = req.body;

      const newEmployee = new Employee({
        name,
        gender,
        birthDate,
        idNumber,
        education,
        nativePlace,
        address,
        phone,
        position,
        department,
        hireDate,
        salary,
        insuranceDate,
        experience,
        rewards,
        injuries,
        additionalInfo,
        idCardFront,
        idCardBack,
        userId: userId || req.user.id // 使用當前登入用戶ID作為預設值
      });

      const savedEmployee = await newEmployee.save();
      res.json(savedEmployee);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    const employee = await Employee.findOne({ _id: req.params.id.toString() });

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    // 檢查身分證號碼是否與其他員工重複
    if (req.body.idNumber && req.body.idNumber !== employee.idNumber) {
      // 驗證身分證號碼格式，確保只包含合法字符
      if (!/^[A-Z][12]\d{8}$/.test(req.body.idNumber)) {
        return res.status(400).json({ msg: '身分證號碼格式不正確' });
      }
      
      // 使用參數化查詢，避免直接將用戶輸入傳入查詢
      const idNumberToCheck = String(req.body.idNumber).trim();
      const existingEmployee = await Employee.findOne({ idNumber: idNumberToCheck.toString() });
      if (existingEmployee) {
        return res.status(400).json({ msg: '此身分證號碼已存在' });
      }
    }

    // 更新資料 - 安全地處理用戶輸入
    const updatedFields = {};
    const allowedFields = [
      'name', 'gender', 'birthDate', 'idNumber', 'education', 
      'nativePlace', 'address', 'phone', 'position', 'department', 
      'hireDate', 'salary', 'insuranceDate', 'experience', 'rewards', 
      'injuries', 'additionalInfo', 'idCardFront', 'idCardBack'
    ];
    
    // 只允許更新預定義的欄位，避免惡意注入其他欄位
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && allowedFields.includes(key)) {
        updatedFields[key] = value;
      }
    }

    // 設定更新時間
    updatedFields.updatedAt = Date.now();

    // 使用參數化查詢和安全的更新操作
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    res.json(updatedEmployee);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    const employee = await Employee.findOne({ _id: req.params.id.toString() });

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    await Employee.findOneAndDelete({ _id: req.params.id.toString() });
    res.json({ msg: '員工資料已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
