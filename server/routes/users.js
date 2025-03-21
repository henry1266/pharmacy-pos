const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');

// @route   POST api/users
// @desc    註冊用戶
// @access  Public
router.post(
  '/',
  [
    check('name', '姓名為必填欄位').not().isEmpty(),
    check('email', '請輸入有效的電子郵件').isEmail(),
    check('password', '請輸入至少6個字符的密碼').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      // 檢查用戶是否已存在
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: '用戶已存在' });
      }

      user = new User({
        name,
        email,
        password,
        role
      });

      // 加密密碼
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // 返回JWT
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: config.get('jwtExpire') },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('伺服器錯誤');
    }
  }
);

module.exports = router;
