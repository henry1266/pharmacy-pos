import express, { Request, Response } from "express";
import auth from "../middleware/auth";
import User, { IUserDocument } from "../models/User";
import mongoose from "mongoose";

// 擴展 Request 介面，添加 user 屬性
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// 定義用戶設定介面
interface UserSettings {
  theme?: string;
  language?: string;
  notifications?: boolean;
  [key: string]: any; // 允許其他自定義設定
}

const router = express.Router();

/**
 * @route   GET api/settings
 * @desc    Get current user's settings
 * @access  Private
 */
router.get("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("Settings GET request from user ID:", req.user?.id);
    
    // req.user.id is available from the auth middleware
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      console.error("User not found for ID:", req.user?.id);
      return res.status(404).json({ msg: "找不到用戶" });
    }
    
    // Log the user object (excluding password) for debugging
    const userForLog = { ...user.toObject() };
    delete userForLog.password;
    console.log("User found:", userForLog);
    
    // Return the settings object, defaulting to an empty object if undefined
    const settings: UserSettings = user.settings || {};
    console.log("Returning settings:", settings);
    
    res.json(settings);
  } catch (err) {
    console.error("獲取用戶設定失敗:", (err as Error).message);
    console.error("Error stack:", (err as Error).stack);
    res.status(500).json({
      msg: "伺服器錯誤",
      error: (err as Error).message,
      userId: req.user?.id || 'unknown'
    });
  }
});

/**
 * @route   PUT api/settings
 * @desc    Update current user's settings
 * @access  Private
 */
router.put("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  console.log("Settings PUT request from user ID:", req.user?.id);
  
  // We expect the entire settings object to be sent in the body
  const newSettings = req.body as UserSettings;
  console.log("New settings received:", newSettings);

  // Basic validation: ensure req.body is an object
  if (typeof newSettings !== 'object' || newSettings === null) {
    console.error("Invalid settings format received");
    return res.status(400).json({ msg: "無效的設定格式，應為一個物件。" });
  }

  try {
    // Find the user by ID from the token
    let user = await User.findById(req.user?.id);

    if (!user) {
      console.error("User not found for ID:", req.user?.id);
      return res.status(404).json({ msg: "找不到用戶" });
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
    res.json(user.settings);

  } catch (err) {
    console.error("更新用戶設定失敗:", (err as Error).message);
    console.error("Error stack:", (err as Error).stack);
    
    // Handle potential validation errors if schema evolves
    if ((err as any).name === 'ValidationError') {
      return res.status(400).json({
        msg: "設定資料驗證失敗",
        errors: (err as any).errors,
        userId: req.user?.id || 'unknown'
      });
    }
    
    res.status(500).json({
      msg: "伺服器錯誤",
      error: (err as Error).message,
      userId: req.user?.id || 'unknown'
    });
  }
});

export default router;