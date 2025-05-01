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

  // **Important:** Currently, this route only logs the received configuration.
  // It does NOT dynamically update the MongoDB connection string used by the application.
  // Implementing dynamic updates requires careful handling of the database connection
  // and potentially restarting the application or managing connection pools.
  // For now, we acknowledge the request and log the intended configuration.

  // TODO: Implement logic to actually update the config (e.g., update config file, re-initiate DB connection)
  // Example (Conceptual - Needs proper implementation):
  /*
  try {
    const configPath = path.join(__dirname, '../config/default.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    configData.mongoURI = `mongodb://${host}:${port}/${database}`;
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log('MongoDB URI updated in default.json. Restart server to apply changes.');
    res.json({ msg: "MongoDB 設定已接收，伺服器需要重新啟動以套用變更。" });
  } catch (error) {
    console.error('Failed to update MongoDB config file:', error);
    res.status(500).send("伺服器錯誤：無法更新設定檔");
  }
  */

  // Respond that the config was received (but not yet fully applied dynamically)
  res.json({ msg: "MongoDB 設定已接收，但目前僅記錄，尚未動態套用。" });
});

module.exports = router;

