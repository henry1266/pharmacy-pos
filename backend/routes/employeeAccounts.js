const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// @route   POST api/employee-accounts
// @desc    Create a user account for an employee
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    adminAuth,
    [
      check('employeeId', '員工ID為必填欄位').not().isEmpty(),
      check('username', '請提供有效的用戶名').not().isEmpty(),
      check('password', '請提供至少6個字符的密碼').isLength({ min: 6 }),
      check('role', '請提供有效的角色').isIn(['admin', 'pharmacist', 'staff'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, username, email, password, role } = req.body;

    try {
      // 驗證員工ID格式
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ msg: '無效的員工ID格式' });
      }

      // 檢查員工是否存在
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ msg: '找不到此員工資料' });
      }

      // 檢查用戶名是否已被使用
      let user = await User.findOne({ username });
      if (user) {
        return res.status(400).json({ msg: '此用戶名已被使用' });
      }

      // 檢查員工是否已有帳號
      if (employee.userId) {
        const existingUser = await User.findById(employee.userId);
        if (existingUser) {
          return res.status(400).json({ msg: '此員工已有帳號' });
        }
      }

      // 創建新用戶
      user = new User({
        name: employee.name,
        username,
        // 只有當email有值且不為空字符串時才設置
        ...(email && email.trim() !== '' ? { email } : {}),
        password,
        role
      });

      // 加密密碼
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // 保存用戶
      await user.save();

      // 更新員工記錄，關聯到新用戶
      employee.userId = user.id;
      await employee.save();

      res.json({
        msg: '員工帳號創建成功',
        employee: {
          id: employee.id,
          name: employee.name
        },
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('伺服器錯誤');
    }
  }
);

// @route   GET api/employee-accounts/:employeeId
// @desc    Get user account info for an employee
// @access  Private/Admin
router.get('/:employeeId', [auth, adminAuth], async (req, res) => {
  try {
    // 驗證員工ID格式
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    // 檢查員工是否存在
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    // 檢查員工是否有帳號
    if (!employee.userId) {
      return res.status(404).json({ msg: '此員工尚未建立帳號' });
    }

    // 獲取用戶資訊（不包含密碼）
    const user = await User.findById(employee.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: '找不到此員工的帳號資訊' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   PUT api/employee-accounts/:employeeId
// @desc    Update user account for an employee
// @access  Private/Admin
router.put(
  '/:employeeId',
  [
    auth,
    adminAuth,
    [
      check('username', '請提供有效的用戶名').optional().not().isEmpty(),
      check('email', '請提供有效的電子郵件').optional().isEmail(),
      check('password', '請提供至少6個字符的密碼').optional().isLength({ min: 6 }),
      check('role', '請提供有效的角色').optional().isIn(['admin', 'pharmacist', 'staff'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    try {
      // 驗證員工ID格式
      if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
        return res.status(400).json({ msg: '無效的員工ID格式' });
      }

      // 檢查員工是否存在
      const employee = await Employee.findById(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ msg: '找不到此員工資料' });
      }

      // 檢查員工是否有帳號
      if (!employee.userId) {
        return res.status(404).json({ msg: '此員工尚未建立帳號' });
      }

      // 獲取用戶資訊
      let user = await User.findById(employee.userId);
      if (!user) {
        return res.status(404).json({ msg: '找不到此員工的帳號資訊' });
      }

      // 如果更新用戶名，檢查是否已被使用
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ msg: '此用戶名已被使用' });
        }
        user.username = username;
      }

      // 如果更新電子郵件，檢查是否已被使用
      if (email !== undefined && email !== user.email) {
        if (email && email.trim() !== '') {
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            return res.status(400).json({ msg: '此電子郵件已被使用' });
          }
          user.email = email;
        } else {
          // 如果email為空或空字符串，則從用戶文檔中移除email字段
          user.email = undefined;
          if (user.email !== undefined) {
            await User.updateOne(
              { _id: user._id },
              { $unset: { email: 1 } }
            );
          }
        }
      }

      // 更新角色
      if (role) {
        user.role = role;
      }

      // 更新密碼
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      // 保存更新
      await user.save();

      // 返回更新後的用戶資訊（不包含密碼）
      const updatedUser = await User.findById(user.id).select('-password');

      res.json({
        msg: '員工帳號更新成功',
        user: updatedUser
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('伺服器錯誤');
    }
  }
);

// @route   DELETE api/employee-accounts/:employeeId
// @desc    Delete user account for an employee
// @access  Private/Admin
router.delete('/:employeeId', [auth, adminAuth], async (req, res) => {
  try {
    // 驗證員工ID格式
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    // 檢查員工是否存在
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    // 檢查員工是否有帳號
    if (!employee.userId) {
      return res.status(404).json({ msg: '此員工尚未建立帳號' });
    }

    // 獲取用戶資訊
    const user = await User.findById(employee.userId);
    if (!user) {
      return res.status(404).json({ msg: '找不到此員工的帳號資訊' });
    }

    // 刪除用戶
    await User.findByIdAndRemove(user.id);

    // 更新員工記錄，移除用戶關聯
    employee.userId = null;
    await employee.save();

    res.json({ msg: '員工帳號已刪除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   PUT api/employee-accounts/:employeeId/unbind
// @desc    Unbind an employee from their account (without deleting the account)
// @access  Private/Admin
router.put('/:employeeId/unbind', [auth, adminAuth], async (req, res) => {
  try {
    // 驗證員工ID格式
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    // 檢查員工是否存在
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    // 檢查員工是否有帳號
    if (!employee.userId) {
      return res.status(404).json({ msg: '此員工尚未綁定帳號' });
    }

    // 獲取用戶資訊
    const user = await User.findById(employee.userId);
    if (!user) {
      // 如果找不到用戶，仍然解除綁定
      employee.userId = null;
      await employee.save();
      return res.json({ msg: '員工帳號綁定已解除（用戶不存在）' });
    }

    // 解除綁定（不刪除用戶帳號）
    employee.userId = null;
    await employee.save();

    res.json({
      msg: '員工帳號綁定已解除',
      employee: {
        id: employee.id,
        name: employee.name
      },
      user: {
        id: user.id,
        name: user.name,
        username: user.username
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;