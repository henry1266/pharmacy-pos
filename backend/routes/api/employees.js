const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const adminAuth = require('../../middleware/adminAuth');
const Employee = require('../../models/Employee');

// @route   GET api/employees
// @desc    Get all employees with pagination and search
// @access  Admin only
router.get('/', auth, adminAuth, async (req, res) => {
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
// @access  Admin only
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

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
// @access  Admin only
router.post(
  '/',
  [
    auth,
    adminAuth,
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
      let employee = await Employee.findOne({ idNumber: req.body.idNumber });
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
        userId
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
// @access  Admin only
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    // 檢查身分證號碼是否與其他員工重複
    if (req.body.idNumber && req.body.idNumber !== employee.idNumber) {
      const existingEmployee = await Employee.findOne({ idNumber: req.body.idNumber });
      if (existingEmployee) {
        return res.status(400).json({ msg: '此身分證號碼已存在' });
      }
    }

    // 更新資料
    const updatedFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        updatedFields[key] = value;
      }
    }

    // 設定更新時間
    updatedFields.updatedAt = Date.now();

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
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
// @access  Admin only
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    await employee.remove();
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
