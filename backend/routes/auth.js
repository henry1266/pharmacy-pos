const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");

const User = require("../models/User");

// @route   GET api/auth
// @desc    獲取已登入用戶
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Find user by ID from token payload and exclude password
    const user = await User.findOne({ _id: req.user.id.toString() }).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "找不到用戶" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   POST api/auth
// @desc    用戶登入 & 獲取 token 和用戶資訊
// @access  Public
router.post(
  "/",
  [
    check("password", "密碼為必填欄位").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    if (!username && !email) {
      return res.status(400).json({ msg: "請提供用戶名或電子郵件" });
    }

    try {
      // 檢查用戶是否存在 - 支持用戶名或電子郵件登入
      let user;
      
      if (username) {
        user = await User.findOne({ username: username.toString() });
      } else if (email) {
        user = await User.findOne({ email: email.toString() });
      }

      if (!user) {
        return res.status(400).json({ msg: "無效的憑證" });
      }

      // 比對密碼
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: "無效的憑證" });
      }

      // 準備 JWT Payload
      const payload = {
        user: {
          id: user.id,
          // Optionally include role in payload if needed frequently, but be mindful of security
          // role: user.role 
        },
      };

      // 簽發 JWT
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: config.get("jwtExpiration") }, // Use expiration from config
        (err, token) => {
          if (err) throw err;
          // 返回 token 和用戶資訊 (不含密碼)
          res.json({ 
            token,
            user: {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              role: user.role,
              // Include other non-sensitive fields if needed
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   PUT api/auth/update
// @desc    更新當前用戶資訊
// @access  Private
router.put(
  "/update",
  [
    auth,
    [
      check("username", "用戶名不能為空").optional().not().isEmpty(),
      check("email", "請提供有效的電子郵件").optional().isEmail(),
      check("newPassword", "新密碼長度至少需要4個字符").optional().isLength({ min: 4 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, currentPassword, newPassword } = req.body;

    try {
      // 獲取當前用戶
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "找不到用戶" });
      }

      // 如果要更新密碼，需要驗證當前密碼
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ msg: "請提供當前密碼" });
        }

        // 驗證當前密碼
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: "當前密碼不正確" });
        }

        // 加密新密碼
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }

      // 如果要更新用戶名，檢查是否已被使用
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ msg: "此用戶名已被使用" });
        }
        user.username = username;
      }

      // 如果要更新電子郵件，檢查是否已被使用
      if (email !== undefined && email !== user.email) {
        if (email && email.trim() !== '') {
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            return res.status(400).json({ msg: "此電子郵件已被使用" });
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

      // 保存更新
      await user.save();

      // 返回更新後的用戶資訊（不含密碼）
      const updatedUser = await User.findById(user.id).select("-password");
      res.json(updatedUser);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

module.exports = router;

