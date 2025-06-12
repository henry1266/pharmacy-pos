/**
 * 管理員權限中間件
 * 確保只有管理員角色的用戶可以訪問特定路由
 */
const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    // 從 auth 中間件獲取用戶 ID
    const userId = req.user.id;
    
    // 查詢用戶資訊
    const user = await User.findById(userId);
    
    // 檢查用戶是否存在且角色為管理員
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: '權限不足，需要管理員權限' });
    }
    
    // 如果是管理員，則繼續執行
    next();
  } catch (err) {
    console.error('管理員權限驗證失敗:', err.message);
    res.status(500).send('伺服器錯誤');
  }
};