const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
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
};
