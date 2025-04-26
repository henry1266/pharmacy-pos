# 移除 totalAmount 依賴報告

## 問題描述

在藥局POS系統的庫存報表中，價格計算邏輯依賴於 totalAmount 數據，但根據用戶反饋，系統無法獲取 totalAmount 數據，導致價格計算可能不準確。

## 問題原因

之前的價格計算邏輯優先使用 totalAmount/quantity 的絕對值來計算單價：

```javascript
price: item.totalAmount && item.quantity ? Math.abs(item.totalAmount / item.quantity) : 
       (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),
```

然而，用戶反饋系統無法獲取 totalAmount 數據，這可能是因為：
1. API 未返回 totalAmount 字段
2. 數據格式或結構發生了變化
3. 後端處理邏輯未計算或提供 totalAmount 值

無論具體原因是什麼，我們需要修改價格計算邏輯，移除對 totalAmount 的依賴。

## 解決方案

修改價格計算邏輯，移除對 totalAmount 的依賴，直接使用可用的價格字段：

```javascript
price: (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),
```

新的邏輯考慮了三種情況：
1. 如果是進貨類型，優先使用 price 字段，如果不存在則使用 purchasePrice
2. 如果是出貨類型，優先使用 price 字段，如果不存在則使用 sellingPrice
3. 如果是銷售類型，優先使用 price 字段，如果不存在則使用 sellingPrice

這樣可以確保在 totalAmount 數據不可用的情況下，系統仍能正確顯示價格。

## 修改內容

### 修改文件
- `/frontend/src/components/reports/inventory/InventoryTable.js`

### 代碼變更

```javascript
// 修改前
price: item.totalAmount && item.quantity ? Math.abs(item.totalAmount / item.quantity) : 
       (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),

// 修改後
price: (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),
```

## 預期效果

1. **穩定性提升**：移除對不可用數據的依賴，提高系統穩定性。

2. **向後兼容性保障**：保留對 price、purchasePrice 和 sellingPrice 字段的支持，確保系統能夠平滑過渡。

3. **維護性增強**：簡化價格計算邏輯，使代碼更易於理解和維護。

## 後續建議

1. 與後端團隊協調，了解 totalAmount 數據缺失的具體原因，並考慮在未來版本中添加此數據。

2. 考慮添加日誌記錄，在處理價格數據時輸出相關信息，便於調試和驗證計算結果。

3. 在用戶界面中添加提示信息，說明價格的來源和計算方式，幫助用戶理解數據。

4. 考慮實現更靈活的價格計算策略，允許用戶配置不同的價格計算方式。
