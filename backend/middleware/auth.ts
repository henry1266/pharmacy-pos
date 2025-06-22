import jwt from 'jsonwebtoken';
import config from 'config';
import { Request, Response, NextFunction } from 'express';

// 擴展 Request 介面以包含用戶資訊
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const auth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // 從請求頭獲取 token
  const token = req.header("x-auth-token");
  
  console.log(`Auth middleware - Request path: ${req.originalUrl}`);

  // 檢查是否有 token
  if (!token) {
    console.log("No token provided in request");
    res.status(401).json({ msg: "沒有權限，請先登入" });
    return;
  }

  try {
    // 驗證 token
    console.log("Verifying token...");
    const decoded = jwt.verify(token, config.get("jwtSecret")) as any;
    
    // Log decoded token information (excluding sensitive parts)
    console.log("Token verified successfully. User ID:", decoded.user?.id);
    
    if (!decoded.user?.id) {
      console.error("Token payload missing user ID");
      res.status(401).json({ msg: "Token 格式無效" });
      return;
    }

    // 將用戶信息添加到請求對象
    req.user = decoded.user; // decoded.user should contain { id: userId }
    next();
  } catch (err) {
    console.error("Token 驗證失敗:", (err as Error).message);
    console.error("Token verification error details:", err);
    res.status(401).json({ msg: "Token 無效或已過期" });
  }
};

export default auth;