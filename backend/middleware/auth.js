const jwt = require("jsonwebtoken");
const config = require("config");
// const mongoose = require("mongoose"); 
// mongoose is not needed for JWT verification

module.exports = function (req, res, next) {
  // 關閉權限功能 - 直接通過所有請求 (The following code is now disabled)
  // 將一個虛擬用戶添加到請求對象，以便後續代碼能正常運行
  // 使用一個有效的 ObjectId 作為虛擬用戶 ID
  // req.user = { id: new mongoose.Types.ObjectId("600000000000000000000000") }; 
  // Use a valid dummy ObjectId
  // return next();

  // // 以下代碼已被禁用 (Re-enabling the original JWT verification logic)
  
  // 從請求頭獲取 token
  const token = req.header("x-auth-token");

  // 檢查是否有 token
  if (!token) {
    // Allow access without token for specific routes if needed, but settings requires auth
    return res.status(401).json({ msg: "沒有權限，請先登入" });
  }

  try {
    // 驗證 token
    // Use the correct config key for jwtSecret
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    // 將用戶信息添加到請求對象
    req.user = decoded.user; // decoded.user should contain { id: userId }
    next();
  } catch (err) {
    console.error("Token 驗證失敗:", err.message); // Log the error for debugging
    res.status(401).json({ msg: "Token 無效或已過期" });
  }
  
};

