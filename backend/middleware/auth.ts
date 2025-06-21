import jwt from 'jsonwebtoken';
import config from 'config';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthMiddleware } from '../src/types/express';
import { JWTPayload } from '../src/types/api';

// 認證中間件
const auth: AuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 從請求頭獲取 token
  const token = req.header('x-auth-token');
  
  console.log(`Auth middleware - Request path: ${req.originalUrl}`);

  // 檢查是否有 token
  if (!token) {
    console.log('No token provided in request');
    res.status(401).json({ 
      success: false,
      message: '沒有權限，請先登入',
      timestamp: new Date()
    });
    return;
  }

  try {
    // 驗證 token
    console.log('Verifying token...');
    const jwtSecret = config.get<string>('jwtSecret');
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // 記錄解碼的 token 資訊（排除敏感部分）
    console.log('Token verified successfully. User ID:', decoded.id);
    
    if (!decoded.id) {
      console.error('Token payload missing user ID');
      res.status(401).json({ 
        success: false,
        message: 'Token 格式無效',
        timestamp: new Date()
      });
      return;
    }

    // 將用戶信息添加到請求對象
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      isAdmin: decoded.isAdmin || false
    };
    
    next();
  } catch (err) {
    console.error('Token 驗證失敗:', err instanceof Error ? err.message : err);
    console.error('Token verification error details:', err);
    
    let errorMessage = 'Token 無效或已過期';
    
    if (err instanceof jwt.TokenExpiredError) {
      errorMessage = 'Token 已過期，請重新登入';
    } else if (err instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Token 格式無效';
    } else if (err instanceof jwt.NotBeforeError) {
      errorMessage = 'Token 尚未生效';
    }
    
    res.status(401).json({ 
      success: false,
      message: errorMessage,
      timestamp: new Date()
    });
  }
};

export default auth;