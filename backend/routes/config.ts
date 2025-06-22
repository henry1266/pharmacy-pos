import express, { Request, Response } from "express";
import fs from 'fs';
import path from 'path';
import { ApiResponse, ErrorResponse } from '@shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@shared/constants';

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
    const errorResponse: ErrorResponse = {
      success: false,
      message: "請提供完整的 MongoDB 設定 (host, port, database)",
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
  }

  // Respond that the config was received (but not yet fully applied dynamically)
  const response: ApiResponse<null> = {
    success: true,
    message: "MongoDB 設定已接收，但目前僅記錄，尚未動態套用。",
    data: null,
    timestamp: new Date()
  };
  
  res.json(response);
});

export default router;