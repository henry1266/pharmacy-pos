const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  // 關閉權限功能 - 直接通過所有請求
  // 將一個虛擬用戶添加到請求對象，以便後續代碼能正常運行
  req.user = { id: 'bypass-auth-user' };
  return next();
  
  // 以下代碼已被禁用
  /*
  // 從請求頭獲取 token
  const token = req.header('x-auth-token');

  // 檢查是否有 token
  if (!token) {
    return res.status(401).json({ msg: '沒有權限，請先登入' });
  }

  try {
    // 驗證 token
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // 將用戶信息添加到請求對象
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token 無效' });
  }
  */
};
