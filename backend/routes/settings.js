const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// @route   GET api/settings
// @desc    Get current user's settings
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // req.user.id is available from the auth middleware
    const user = await User.findById(req.user.id).select("settings");
    if (!user) {
      return res.status(404).json({ msg: "找不到用戶" });
    }
    // Return the settings object, defaulting to an empty object if undefined
    res.json(user.settings || {});
  } catch (err) {
    console.error("獲取用戶設定失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   PUT api/settings
// @desc    Update current user's settings
// @access  Private
router.put("/", auth, async (req, res) => {
  // We expect the entire settings object to be sent in the body
  const newSettings = req.body;

  // Basic validation: ensure req.body is an object
  if (typeof newSettings !== 'object' || newSettings === null) {
      return res.status(400).json({ msg: "無效的設定格式，應為一個物件。" });
  }

  try {
    // Find the user by ID from the token
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "找不到用戶" });
    }

    // Update the settings field
    // Using $set ensures we replace the entire object. 
    // Alternatively, could merge, but replacing is simpler for this case.
    user.settings = newSettings;

    // Save the updated user document
    await user.save();

    // Return the updated settings
    res.json(user.settings);

  } catch (err) {
    console.error("更新用戶設定失敗:", err.message);
    // Handle potential validation errors if schema evolves
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: "設定資料驗證失敗", errors: err.errors });
    }
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;

