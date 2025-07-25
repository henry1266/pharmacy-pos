/**
 * 管理員權限中間件
 * 確保只有管理員角色的用戶可以訪問特定路由
 */
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, AdminAuthMiddleware } from '../src/types/express';
import User from '../models/User';

/**
 * 管理員權限中間件
 * 驗證用戶是否具有管理員權限
 */
const adminAuth: AdminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 從 auth 中間件獲取用戶 ID
    const authenticatedReq = req as AuthenticatedRequest;
    
    if (!authenticatedReq.user?.id) {
      res.status(401).json({
        success: false,
        message: '未授權，請先登入',
        timestamp: new Date()
      });
      return;
    }
    
    const userId = authenticatedReq.user.id;
    
    // 查詢用戶資訊
    const user = await User.findById(userId);
    
    // 檢查用戶是否存在且角色為管理員
    if (!user || user.role !== 'admin') {
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