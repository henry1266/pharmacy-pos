const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');

// @route   POST api/config/mongodb
// @desc    Update MongoDB configuration (currently logs received config)
// @access  Private (should add auth middleware later)
router.post("/mongodb", async (req, res) => {
  const { host, port, database } = req.body;

  console.log("Received MongoDB config update request:", req.body);

  // Basic validation
  if (!host || !port || !database) {
    return res.status(400).json({ msg: "請提供完整的 MongoDB 設定 (host, port, database)" });
  }


  // Respond that the config was received (but not yet fully applied dynamically)
  res.json({ msg: "MongoDB 設定已接收，但目前僅記錄，尚未動態套用。" });
});

module.exports = router;

