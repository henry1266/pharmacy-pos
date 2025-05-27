# ObjectId 調用錯誤修正報告

## 錯誤描述

用戶反饋在建立出貨單時出現以下錯誤：
```
建出貨單錯誤: Class constructor ObjectId cannot be invoked without 'new'
```

這個錯誤表示在處理出貨單時，程式碼嘗試直接調用 ObjectId 而沒有使用 `new` 關鍵字。

## 修正內容

我對 `backend/routes/fifo.js` 檔案進行了以下修正：

1. 導入 mongoose 模組：
   ```javascript
   const mongoose = require('mongoose');
   ```

2. 將所有使用 `toString()` 進行型態轉換的查詢參數改為使用 `new mongoose.Types.ObjectId()`：
   ```javascript
   // 修改前
   const sale = await Sale.findOne({ _id: req.params.saleId.toString() })
   
   // 修改後
   const sale = await Sale.findOne({ _id: new mongoose.Types.ObjectId(req.params.saleId) })
   ```

3. 修正所有涉及 MongoDB ObjectId 的查詢，包括：
   - `/product/:productId` 路由
   - `/sale/:saleId` 路由
   - `/shipping-order/:shippingOrderId` 路由
   - `/all` 路由
   - `/simulate` 路由

## 修正原理

MongoDB 的 ObjectId 是一個類別，必須使用 `new` 關鍵字來建立實例。在之前的修正中，我們將參數轉換為字串 (`toString()`)，但這在某些情況下可能導致 MongoDB 嘗試將字串轉換回 ObjectId 時出錯。

正確的做法是使用 `new mongoose.Types.ObjectId()` 來確保所有 ID 參數都被正確地轉換為 ObjectId 實例，這樣 MongoDB 就能正確處理這些查詢。

## 測試建議

為確保修正有效，建議進行以下手動測試：

1. 建立新的出貨單，確認不再出現 ObjectId 錯誤
2. 查詢現有出貨單的 FIFO 資訊
3. 查詢銷售訂單的 FIFO 利潤
4. 使用 `/simulate` 路由模擬產品的 FIFO 成本

## 結論

這次修正解決了 ObjectId 調用錯誤的問題，同時也遵循了 NoSQL 注入防護規範，確保所有查詢參數都被正確處理。這種修正方式與專案中其他路由（如 shippingOrders.js）的做法一致，提高了程式碼的一致性和安全性。
