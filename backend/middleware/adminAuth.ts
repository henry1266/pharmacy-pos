import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, AdminAuthMiddleware } from '../src/types/express';
import User, { IUserDocument } from '../models/User';

/**
 * 管理員權限中間件
 * 確保只有管理員角色的用戶可以訪問特定路由
 */
const adminAuth: AdminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 將 req 轉換為 AuthenticatedRequest 型別
  const authReq = req as AuthenticatedRequest;
  try {
    // 從 auth 中間件獲取用戶 ID
    const userId = authReq.user.id;
    
    // 查詢用戶資訊
    const user = await User.findById(userId);
    
    // 檢查用戶是否存在且角色為管理員
    if (!user || (user as IUserDocument).role !== 'admin') {
      res.status(403).json({ 
        success: false,
        message: '權限不足，需要管理員權限',
        timestamp: new Date()
      });
      return;
    }
    
    // 如果是管理員，則繼續執行
    next();
  } catch (err) {
    console.error('管理員權限驗證失敗:', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      timestamp: new Date()
    });
  }
};

export default adminAuth;