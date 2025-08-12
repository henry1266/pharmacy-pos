import jwt from 'jsonwebtoken';
import config from 'config';
import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@pharmacy-pos/shared/types/api';

/**
 * @description 擴展 Request 介面以包含用戶資訊
 * @interface AuthenticatedRequest
 * @extends {Request}
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * @description 測試模式配置
 * @constant {boolean} TEST_MODE_ENABLED - 是否啟用測試模式
 * @constant {string} TEST_MODE_TOKEN - 測試模式使用的令牌
 * @constant {Object} TEST_MODE_USER - 測試模式使用的用戶對象
 */
const TEST_MODE_ENABLED = process.env.REACT_APP_TEST_MODE === 'true';
const TEST_MODE_TOKEN = 'test-mode-token';
const TEST_MODE_USER = {
  id: 'test-user-id'
};

/**
 * @description 身份驗證中間件
 * @function auth
 * @param {AuthenticatedRequest} req - Express請求對象
 * @param {Response} res - Express響應對象
 * @param {NextFunction} next - Express下一個中間件函數
 * @returns {void}
 */
const auth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // 從請求頭獲取 token - 支援兩種格式
  let token = req.header("x-auth-token");
  
  // 如果沒有 x-auth-token，嘗試從 Authorization header 獲取
  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // 移除 "Bearer " 前綴
    }
  }
  
  //console.log(`Auth middleware - Request path: ${req.originalUrl}`);
  //console.log(`Token found: ${token ? 'Yes' : 'No'}`);
  console.log(`Test mode enabled: ${TEST_MODE_ENABLED}`);

  // 檢查是否有 token
  if (!token) {
    console.log("No token provided in request");
    const errorResponse: ErrorResponse = {
      success: false,
      message: "沒有權限，請先登入",
      timestamp: new Date()
    };
    res.status(401).json(errorResponse);
    return;
  }

  // 檢查是否為測試模式 token
  if (TEST_MODE_ENABLED && token === TEST_MODE_TOKEN) {
    console.log("Test mode token detected, bypassing JWT verification");
    req.user = TEST_MODE_USER;
    next();
    return;
  }

  try {
    // 驗證 JWT token
    console.log("Verifying JWT token...");
    const decoded = jwt.verify(token, config.get("jwtSecret")) as any;
    
    // Log decoded token information (excluding sensitive parts)
    console.log("JWT token verified successfully. User ID:", decoded.user?.id);
    
    if (!decoded.user?.id) {
      console.error("Token payload missing user ID");
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Token 格式無效",
        timestamp: new Date()
      };
      res.status(401).json(errorResponse);
      return;
    }

    // 將用戶信息添加到請求對象
    req.user = decoded.user; // decoded.user should contain { id: userId }
    next();
  } catch (err) {
    console.error("Token 驗證失敗:", (err as Error).message);
    console.error("Token verification error details:", err);
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Token 無效或已過期",
      timestamp: new Date()
    };
    res.status(401).json(errorResponse);
  }
};

/**
 * @description 導出身份驗證中間件
 * @exports auth
 */
export default auth;