const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const EmployeeSchedule = require('../models/EmployeeSchedule');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// @route   GET api/employee-schedules
// @desc    Get employee schedules with date range filter
// @access  Private
router.get('/', [
  auth,
  [
    check('startDate').optional().isISO8601().withMessage('開始日期格式無效'),
    check('endDate').optional().isISO8601().withMessage('結束日期格式無效'),
    check('employeeId').optional().custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('員工ID格式無效');
      }
      return true;
    })
  ]
], async (req, res) => {
  try {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, employeeId } = req.query;
    
    // Build filter object with validated data
    const filter = {};
    
    // Add date range filter if provided
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Additional validation to ensure dates are valid
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ msg: '無效的日期格式' });
      }
      
      filter.date = {
        $gte: startDateObj,
        $lte: endDateObj
      };
    }
    
    // Add employee filter if provided and validated
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      filter.employeeId = mongoose.Types.ObjectId(employeeId);
    }
    
    const schedules = await EmployeeSchedule.find(filter)
      .populate('employeeId', 'name department position')
      .sort({ date: 1, shift: 1 });
    
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/employee-schedules
// @desc    Create a new employee schedule
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('date', '日期為必填欄位').not().isEmpty(),
      check('shift', '班次為必填欄位').isIn(['morning', 'afternoon', 'evening']),
      check('employeeId', '員工ID為必填欄位').not().isEmpty(),
      check('leaveType', '請假類型格式無效').optional().isIn(['sick', 'personal', 'overtime'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // 驗證員工ID是否存在
      if (!mongoose.Types.ObjectId.isValid(req.body.employeeId)) {
        return res.status(400).json({ msg: '無效的員工ID格式' });
      }

      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(404).json({ msg: '找不到此員工資料' });
      }

      // 檢查是否已有相同日期、班次的排班
      const existingSchedule = await EmployeeSchedule.findOne({
        date: new Date(req.body.date),
        shift: req.body.shift,
        employeeId: req.body.employeeId
      });

      if (existingSchedule) {
        return res.status(400).json({ msg: '此員工在該日期和班次已有排班' });
      }

      // 建立新排班
      const newSchedule = new EmployeeSchedule({
        date: req.body.date,
        shift: req.body.shift,
        employeeId: req.body.employeeId,
        leaveType: req.body.leaveType || null,
        createdBy: req.user.id
      });

      const savedSchedule = await newSchedule.save();
      
      // 返回包含員工資訊的排班資料
      const populatedSchedule = await EmployeeSchedule.findById(savedSchedule._id)
        .populate('employeeId', 'name department position');
      
      res.json(populatedSchedule);
    } catch (err) {
      console.error(err.message);
      if (err.code === 11000) {
        return res.status(400).json({ msg: '此員工在該日期和班次已有排班' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// 驗證排班ID
const validateScheduleId = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { status: 400, msg: '無效的排班ID格式' } };
  }

  const schedule = await EmployeeSchedule.findById(id);
  if (!schedule) {
    return { valid: false, error: { status: 404, msg: '找不到此排班資料' } };
  }

  return { valid: true, schedule };
};

// 驗證員工ID
const validateEmployeeId = async (employeeId, res) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return { valid: false, error: { status: 400, msg: '無效的員工ID格式' } };
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return { valid: false, error: { status: 404, msg: '找不到此員工資料' } };
  }

  return { valid: true };
};

// 檢查排班衝突
const checkScheduleConflict = async (scheduleId, date, shift, employeeId) => {
  const conflictQuery = {
    _id: { $ne: scheduleId },
    date,
    shift,
    employeeId
  };
  
  const conflictingSchedule = await EmployeeSchedule.findOne(conflictQuery);
  return conflictingSchedule !== null;
};

// @route   PUT api/employee-schedules/:id
// @desc    Update an employee schedule
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // 驗證排班ID
    const scheduleValidation = await validateScheduleId(req.params.id);
    if (!scheduleValidation.valid) {
      return res.status(scheduleValidation.error.status).json({ msg: scheduleValidation.error.msg });
    }
    const schedule = scheduleValidation.schedule;

    // 如果要更新員工ID，先檢查員工是否存在
    if (req.body.employeeId) {
      const employeeValidation = await validateEmployeeId(req.body.employeeId);
      if (!employeeValidation.valid) {
        return res.status(employeeValidation.error.status).json({ msg: employeeValidation.error.msg });
      }
    }

    // 更新資料
    const updatedFields = {};
    const allowedFields = ['date', 'shift', 'employeeId', 'leaveType'];
    
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && allowedFields.includes(key)) {
        updatedFields[key] = value;
      }
    }
    
    updatedFields.updatedAt = Date.now();

    // 檢查更新後是否會與現有排班衝突
    if (updatedFields.date || updatedFields.shift || updatedFields.employeeId) {
      const hasConflict = await checkScheduleConflict(
        req.params.id,
        updatedFields.date || schedule.date,
        updatedFields.shift || schedule.shift,
        updatedFields.employeeId || schedule.employeeId
      );
      
      if (hasConflict) {
        return res.status(400).json({ msg: '此員工在該日期和班次已有排班' });
      }
    }

    const updatedSchedule = await EmployeeSchedule.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name department position');

    res.json(updatedSchedule);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: '此員工在該日期和班次已有排班' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/employee-schedules/:id
// @desc    Delete an employee schedule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: '無效的排班ID格式' });
    }

    const schedule = await EmployeeSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ msg: '找不到此排班資料' });
    }

    await EmployeeSchedule.findByIdAndDelete(req.params.id);
    res.json({ msg: '排班資料已刪除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/employee-schedules/by-date
// @desc    Get schedules grouped by date
// @access  Private
router.get('/by-date', [
  auth,
  [
    check('startDate').isISO8601().withMessage('開始日期格式無效'),
    check('endDate').isISO8601().withMessage('結束日期格式無效')
  ]
], async (req, res) => {
  try {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: '請提供開始和結束日期' });
    }
    
    // Validate and convert dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Additional validation to ensure dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ msg: '無效的日期格式' });
    }
    
    const schedules = await EmployeeSchedule.find({
      date: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    }).populate('employeeId', 'name department position');
    
    // 將排班按日期和班次分組
    const groupedSchedules = {};
    
    schedules.forEach(schedule => {
      const dateStr = schedule.date.toISOString().split('T')[0];
      
      if (!groupedSchedules[dateStr]) {
        groupedSchedules[dateStr] = {
          morning: [],
          afternoon: [],
          evening: []
        };
      }
      
      groupedSchedules[dateStr][schedule.shift].push({
        _id: schedule._id,
        employee: schedule.employeeId,
        shift: schedule.shift,
        leaveType: schedule.leaveType
      });
    });
    
    res.json(groupedSchedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;