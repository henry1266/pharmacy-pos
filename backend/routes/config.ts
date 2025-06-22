import express, { Request, Response } from "express";
import fs from 'fs';
import path from 'path';

const router = express.Router();

interface MongoDBConfig {
  host: string;
  port: string | number;
  database: string;
}

interface MongoDBConfigRequest extends Request {
  body: MongoDBConfig;
}

// @route   POST api/config/mongodb
// @desc    Update MongoDB configuration (currently logs received config)
// @access  Private (should add auth middleware later)
router.post("/mongodb", async (req: MongoDBConfigRequest, res: Response) => {
  const { host, port, database } = req.body;

  console.log("Received MongoDB config update request:", req.body);

  // Basic validation
  if (!host || !port || !database) {
    return res.status(400).json({ msg: "請提供完整的 MongoDB 設定 (host, port, database)" });
  }

  // Respond that the config was received (but not yet fully applied dynamically)
  res.json({ msg: "MongoDB 設定已接收，但目前僅記錄，尚未動態套用。" });
});

export default router;