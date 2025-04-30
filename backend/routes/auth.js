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
    const user = await User.findById(req.user.id).select("-password");
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
    check("email", "請輸入有效的電子郵件").isEmail(),
    check("password", "密碼為必填欄位").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // 檢查用戶是否存在
      let user = await User.findOne({ email });

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

module.exports = router;

