# totalAmount 數據獲取實現報告

## 問題描述

在藥局POS系統的庫存報表中，價格計算邏輯依賴於 totalAmount 數據，但系統未能從資料庫獲取此數據，導致價格計算不準確。

## 問題原因

經過分析，我們發現：

1. **數據庫模型中存在 totalAmount 欄位**：在 Inventory.js 模型中，totalAmount 已被定義為一個數據庫欄位。

```javascript
const InventorySchema = new mongoose.Schema({
  // 其他欄位...
  totalAmount: {
    type: Number,
    default: 0
  },
  // 其他欄位...
});
```

2. **API 響應中缺少 totalAmount 數據**：在 reports.js 路由文件中，API 響應未包含 totalAmount 欄位，導致前端無法獲取此數據。

```javascript
// 原始代碼中缺少 totalAmount
return {
  // 其他欄位...
  inventoryValue: item.quantity * item.product.purchasePrice,
  potentialRevenue: item.quantity * item.product.sellingPrice,
  potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
  // 缺少 totalAmount
  // 其他欄位...
};
```

## 解決方案

1. **修改後端 API 響應**：在 reports.js 路由文件中，將 totalAmount 欄位添加到 API 響應中。

```javascript
return {
  // 其他欄位...
  inventoryValue: item.quantity * item.product.purchasePrice,
  potentialRevenue: item.quantity * item.product.sellingPrice,
  potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
  totalAmount: item.totalAmount || 0, // 添加 totalAmount 欄位
  // 其他欄位...
};
```

2. **恢復前端價格計算邏輯**：在 InventoryTable.js 文件中，恢復使用 totalAmount 的價格計算邏輯。

```javascript
price: item.totalAmount && item.quantity ? Math.abs(item.totalAmount / item.quantity) : 
       (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),
```

## 修改內容

### 修改文件
- `/backend/routes/reports.js`
- `/frontend/src/components/reports/inventory/InventoryTable.js`

### 代碼變更

#### 1. 後端 API 響應添加 totalAmount 欄位

```javascript
// 修改前
return {
  // 其他欄位...
  inventoryValue: item.quantity * item.product.purchasePrice,
  potentialRevenue: item.quantity * item.product.sellingPrice,
  potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
  // 其他欄位...
};

// 修改後
return {
  // 其他欄位...
  inventoryValue: item.quantity * item.product.purchasePrice,
  potentialRevenue: item.quantity * item.product.sellingPrice,
  potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
  totalAmount: item.totalAmount || 0, // 添加 totalAmount 欄位
  // 其他欄位...
};
```

#### 2. 前端恢復使用 totalAmount 的價格計算邏輯

```javascript
// 修改前
price: (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),

// 修改後
price: item.totalAmount && item.quantity ? Math.abs(item.totalAmount / item.quantity) : 
       (item.type === 'purchase' ? item.price || item.purchasePrice : 
       (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),
```

## 預期效果

1. **數據完整性提升**：API 響應現在包含 totalAmount 欄位，確保前端能夠獲取完整的數據。

2. **價格計算準確性提高**：使用 totalAmount/quantity 計算單價，更準確地反映實際交易價格。

3. **向後兼容性保障**：保留對 price、purchasePrice 和 sellingPrice 字段的支持，確保系統能夠平滑過渡。

## 後續建議

1. **數據驗證**：在生產環境中部署前，建議進行全面測試，確保 totalAmount 數據正確無誤。

2. **數據遷移**：如果歷史數據中缺少 totalAmount 值，考慮進行數據遷移或補充。

3. **監控與日誌**：添加監控和日誌記錄，跟踪 totalAmount 數據的使用情況，及時發現潛在問題。

4. **文檔更新**：更新系統文檔，明確說明 totalAmount 欄位的用途和計算方式，便於未來維護。
