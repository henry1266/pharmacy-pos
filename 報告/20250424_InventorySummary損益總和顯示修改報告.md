# InventorySummary組件損益總和顯示修改報告

## 需求分析

根據用戶提供的截圖，我們需要對InventorySummary組件進行以下修改：

1. 將損益總和顯示為單一數值（如-130、-50、-160、-80），而不是之前的變化過程
2. 添加「庫存」欄位，並將「損益總和」欄位放在其旁邊
3. 調整表格結構和欄位順序，使其與截圖一致

## 技術實現

### 表格結構修改

修改了表格的列結構，添加了「庫存」欄位，並調整了欄位順序：

```javascript
<TableHead>
  <TableRow>
    <TableCell>貨單號</TableCell>
    <TableCell>類型</TableCell>
    <TableCell align="right">數量</TableCell>
    <TableCell align="right">庫存</TableCell>
    <TableCell align="right">損益總和</TableCell>
    <TableCell align="right">單價</TableCell>
  </TableRow>
</TableHead>
```

### 庫存數量計算

添加了庫存數量的計算邏輯，根據交易類型增加或減少庫存：

```javascript
// 添加庫存數量，根據交易類型增加或減少
inventoryCount: transaction.type === 'purchase' 
  ? transaction.quantity 
  : -transaction.quantity
```

### 損益總和顯示

修改了損益總和的顯示方式，直接顯示交易金額，而不是變化過程：

```javascript
<TableCell align="right" sx={{ 
  color: transaction.transactionAmount >= 0 ? 'success.main' : 'error.main',
  fontWeight: 'bold'
}}>
  {formatCurrency(transaction.transactionAmount)}
</TableCell>
```

### 移除損益總和變化欄位

移除了之前的「損益總和變化」欄位，不再顯示變化過程：

```javascript
// 移除以下代碼
<TableCell align="right" sx={{ 
  color: transaction.previousCumulativeProfitLoss !== undefined 
    ? (transaction.cumulativeProfitLoss > transaction.previousCumulativeProfitLoss ? 'success.main' : 'error.main')
    : (transaction.transactionAmount >= 0 ? 'success.main' : 'error.main'),
  fontWeight: 'bold'
}}>
  {transaction.previousCumulativeProfitLoss !== undefined 
    ? `${formatCurrency(transaction.previousCumulativeProfitLoss)} → ${formatCurrency(transaction.cumulativeProfitLoss)}`
    : formatCurrency(transaction.transactionAmount)}
</TableCell>
```

## 實現效果

修改後的InventorySummary組件能夠：

1. 顯示與截圖一致的表格結構，包含貨單號、類型、數量、庫存、損益總和、單價等欄位
2. 損益總和顯示為單一數值（如-130、-50、-160、-80），而不是變化過程
3. 庫存欄位顯示當前交易的庫存變化（進貨為正數，銷售為負數）
4. 使用顏色區分不同類型的交易和數值（正值為綠色，負值為紅色）

## 提交記錄

變更已提交到GitHub倉庫，提交信息如下：

```
feat: 修改InventorySummary組件以顯示單一損益總和數值

- 修改表格結構，添加庫存欄位
- 將損益總和顯示為單一數值而非變化過程
- 調整欄位順序與截圖一致
- 移除損益總和變化欄位
```

## 後續建議

1. 考慮添加庫存累計計算功能，顯示每筆交易後的累計庫存數量
2. 添加日期欄位，顯示每筆交易的日期
3. 添加排序和篩選功能，提高用戶體驗
4. 考慮添加分頁功能，處理大量數據時的性能問題
