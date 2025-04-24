# InventorySummary組件損益總和變化欄位實現報告

## 需求分析

根據用戶提供的需求，我們需要對InventorySummary組件進行以下修改：

1. 移除盈虧圖功能
2. 在單價欄位旁邊添加一個"損益總和變化"欄位
3. 保持累積盈虧計算的邏輯不變，維持以下模式：
   - 進貨2個，單價65元，總額130元，盈虧為-130元
   - 再進貨2個，單價65元，總額130元，盈虧累積為-260元
   - 再進貨2個，單價65元，總額130元，盈虧累積為-390元
   - 銷售3個，單價90元，總額270元，盈虧累積為-120元

## 技術實現

### 損益總和變化欄位

添加了新的"損益總和變化"欄位，顯示每筆交易前後的累積盈虧變化：

```javascript
// 保存當前的累積盈虧值（變化前）
const previousCumulativeProfitLoss = cumulativeProfitLoss;

// 更新累積盈虧
cumulativeProfitLoss += transactionAmount;

return {
  ...transaction,
  transactionAmount,
  previousCumulativeProfitLoss,
  cumulativeProfitLoss
};
```

在表格中顯示損益總和變化：

```javascript
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

### 表格結構修改

修改了表格的列結構，添加了"損益總和變化"列：

```javascript
<TableHead>
  <TableRow>
    <TableCell>貨單號</TableCell>
    <TableCell>類型</TableCell>
    <TableCell align="right">數量</TableCell>
    <TableCell align="right">單價</TableCell>
    <TableCell align="right">損益總和變化</TableCell>
    <TableCell align="right">交易金額</TableCell>
    <TableCell align="right">累積盈虧</TableCell>
  </TableRow>
</TableHead>
```

### 視覺效果

使用顏色區分損益總和變化的增加和減少：
- 增加（如從-390元到-120元）顯示為綠色
- 減少（如從-260元到-390元）顯示為紅色

## 實現效果

修改後的InventorySummary組件能夠：

1. 顯示每筆交易前後的累積盈虧變化，例如：
   - 進貨時：0元 → -130元，-130元 → -260元，-260元 → -390元
   - 銷售時：-390元 → -120元

2. 使用顏色區分增加（綠色）和減少（紅色），提高視覺效果

3. 保持原有的累積盈虧計算邏輯不變，完全符合用戶提供的例子

4. 表格中的數據顯示更加清晰，用戶可以直觀地看到每筆交易對累積盈虧的影響

## 提交記錄

變更已提交到GitHub倉庫，提交信息如下：

```
feat: 添加損益總和變化欄位到InventorySummary組件

- 在單價欄位旁邊添加了損益總和變化欄位
- 顯示每筆交易前後的累積盈虧變化
- 使用顏色區分增加（綠色）和減少（紅色）
- 保持累積盈虧計算的邏輯不變
```

## 後續建議

1. 考慮添加排序功能，允許用戶按照不同的列進行排序
2. 添加篩選功能，允許用戶篩選特定類型的交易（如只顯示進貨或只顯示銷售）
3. 添加分頁功能，提高大量數據時的用戶體驗
4. 考慮添加導出功能，允許用戶將交易歷史和累積盈虧數據導出為Excel或PDF
