import express, { Request, Response } from "express";
import auth from "../middleware/auth";
import User from "../models/User";
import { AuthenticatedRequest } from "../src/types/express";
import { ApiResponse, ErrorResponse } from '@shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@shared/constants';

const router = express.Router();

interface UserSettings {
  [key: string]: any;
}

interface ValidationError extends Error {
  name: 'ValidationError';
  errors: any;
}

// @route   GET api/settings
// @desc    Get current user's settings
// @access  Private
router.get("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("Settings GET request from user ID:", req.user.id);
    
    // req.user.id is available from the auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.error("User not found for ID:", req.user.id);
      const errorResponse: ErrorResponse = {
        success: false,
        message: "找不到用戶",
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }
    
    // Log the user object (excluding password) for debugging
    const userForLog: any = { ...user.toObject() };
    delete userForLog.password;
    console.log("User found:", userForLog);
    
    // Return the settings object, defaulting to an empty object if undefined
    const settings: UserSettings = user.settings || {};
    console.log("Returning settings:", settings);
    
    const response: ApiResponse<UserSettings> = {
      success: true,
      message: "用戶設定獲取成功",
      data: settings,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    const error = err as Error;
    console.error("獲取用戶設定失敗:", error.message);
    console.error("Error stack:", error.stack);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: error.message,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT api/settings
// @desc    Update current user's settings
// @access  Private
router.put("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  console.log("Settings PUT request from user ID:", req.user.id);
  
  // We expect the entire settings object to be sent in the body
  const newSettings: UserSettings = req.body as UserSettings;
  console.log("New settings received:", newSettings);

  // Basic validation: ensure req.body is an object
  if (typeof newSettings !== 'object' || newSettings === null) {
      console.error("Invalid settings format received");
      const errorResponse: ErrorResponse = {
        success: false,
        message: "無效的設定格式，應為一個物件。",
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  }

  try {
    // Find the user by ID from the token
    let user = await User.findById(req.user.id);

    if (!user) {
      console.error("User not found for ID:", req.user.id);
      const errorResponse: ErrorResponse = {
        success: false,
        message: "找不到用戶",
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    console.log("Current user settings before update:", user.settings);

    // Update the settings field
    // Using $set ensures we replace the entire object.
    // Alternatively, could merge, but replacing is simpler for this case.
    user.settings = newSettings;

    // Save the updated user document
    await user.save();
    console.log("User settings updated successfully");

    // Return the updated settings
    const response: ApiResponse<UserSettings> = {
      success: true,
      message: "用戶設定更新成功",
      data: user.settings,
      timestamp: new Date()
    };
    
    res.json(response);

  } catch (err) {
    const error = err as Error;
    console.error("更新用戶設定失敗:", error.message);
    console.error("Error stack:", error.stack);
    
    // Handle potential validation errors if schema evolves
    if (error.name === 'ValidationError') {
        const validationError = error as ValidationError;
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
          error: JSON.stringify(validationError.errors),
          timestamp: new Date()
        };
        return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: error.message,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;