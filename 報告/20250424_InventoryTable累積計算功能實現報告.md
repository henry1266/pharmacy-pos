# InventoryTable組件修改報告

## 修改內容

根據需求，我已經對InventoryTable組件進行了以下修改：

1. **實現庫存實際狀況顯示**
   - 添加了計算累積庫存的功能，顯示每筆交易後的實際庫存數量
   - 例如：進貨後庫存為12，銷售1個後變為11，再銷售1個後變為10
   - 在交易記錄表格中添加了「庫存」欄位，顯示每筆交易後的實際庫存數量

2. **實現累積損益總和顯示**
   - 添加了計算累積損益總和的功能，顯示每筆交易後的累積損益
   - 例如：進貨後損益為-420，銷售後增加50元變為-370，以此類推
   - 在交易記錄表格中添加了「損益總和」欄位，顯示每筆交易後的累積損益總和

3. **改進交易處理邏輯**
   - 按時間順序處理交易，確保累積計算的正確性
   - 先按時間順序（由小到大）計算累積值，再按時間倒序（由大到小）顯示，使最新交易顯示在前面

4. **添加API參數**
   - 添加了`includeTransactionHistory`參數，告訴後端需要提供完整的交易歷史
   - 添加了`useSequentialProfitLoss`參數，告訴後端需要提供連續的損益計算

## 技術實現

### 計算累積庫存和損益總和

```javascript
// 計算累積庫存和損益總和
const calculateCumulativeValues = () => {
  let cumulativeStock = 0;
  let cumulativeProfitLoss = 0;
  
  return sortedTransactions.map(transaction => {
    // 計算庫存變化
    if (transaction.type === '進貨') {
      cumulativeStock += transaction.quantity;
    } else if (transaction.type === '銷售' || transaction.type === '出貨') {
      cumulativeStock -= transaction.quantity;
    }
    
    // 計算損益變化
    cumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
    
    return {
      ...transaction,
      cumulativeStock,
      cumulativeProfitLoss
    };
  });
};
```

### 交易排序邏輯

```javascript
// 按貨單號排序交易記錄（由小到大）
const sortedTransactions = [...item.transactions].sort((a, b) => {
  const aOrderNumber = getOrderNumber(a);
  const bOrderNumber = getOrderNumber(b);
  return aOrderNumber.localeCompare(bOrderNumber); // 由小到大排序，確保時間順序
});

// 按貨單號排序（由大到小）用於顯示
const displayTransactions = [...transactionsWithCumulativeValues].sort((a, b) => {
  const aOrderNumber = getOrderNumber(a);
  const bOrderNumber = getOrderNumber(b);
  return bOrderNumber.localeCompare(aOrderNumber); // 由大到小排序，顯示最新的在前面
});
```

### 顯示累積庫存和損益總和

```javascript
<TableCell align="right" sx={{ fontWeight: 'bold' }}>
  {transaction.cumulativeStock}
</TableCell>
<TableCell align="right" sx={{ 
  color: transaction.cumulativeProfitLoss >= 0 ? 'success.main' : 'error.main',
  fontWeight: 'bold'
}}>
  {formatCurrency(transaction.cumulativeProfitLoss)}
</TableCell>
```

## 後續建議

1. **後端API支持**
   - 確保後端API支持`includeTransactionHistory`和`useSequentialProfitLoss`參數
   - 確保後端返回的交易記錄包含正確的時間戳，以便按時間順序排序

2. **性能優化**
   - 對於大量交易記錄，考慮在後端進行累積計算，減輕前端負擔
   - 考慮實現分頁加載交易記錄，避免一次加載過多數據

3. **用戶體驗優化**
   - 考慮添加圖表顯示庫存和損益總和的變化趨勢
   - 考慮添加時間範圍過濾功能，允許用戶查看特定時間段的交易記錄

## 總結

這次修改完成了InventoryTable組件中庫存實際狀況和累積損益總和的顯示功能，使用戶能夠清晰地看到每筆交易後的實際庫存數量和累積損益總和。通過按時間順序處理交易並計算累積值，確保了數據的準確性和連續性，完全符合用戶的需求。
