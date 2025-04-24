# InventorySummary組件累積盈虧計算功能實現報告

## 需求分析

根據用戶提供的需求和示例，我們需要實現一個累積盈虧計算功能，具體要求如下：

1. 每筆交易都會影響累積盈虧：
   - 進貨交易會減少累積盈虧（負數影響）
   - 銷售交易會增加累積盈虧（正數影響）

2. 累積盈虧是一個連續的計算過程，例如：
   - 進貨2個，單價65元，總額130元，盈虧為-130元
   - 再進貨2個，單價65元，總額130元，盈虧累積為-260元
   - 再進貨2個，單價65元，總額130元，盈虧累積為-390元
   - 銷售3個，單價90元，總額270元，盈虧累積為-120元

3. 需要顯示每筆交易的詳細信息，包括貨單號、類型、數量、單價、交易金額和累積盈虧

## 技術實現

### 數據獲取

修改了API請求參數，添加了`includeTransactionHistory`參數，以獲取完整的交易歷史記錄：

```javascript
// 添加參數請求交易歷史記錄
params.append('includeTransactionHistory', 'true');
```

### 累積盈虧計算

實現了累積盈虧的計算邏輯，對每筆交易進行處理：

```javascript
// 處理交易歷史記錄
if (response.data.transactionHistory && Array.isArray(response.data.transactionHistory)) {
  // 計算累積盈虧
  let cumulativeProfitLoss = 0;
  const historyWithCumulative = response.data.transactionHistory.map(transaction => {
    // 進貨為負數，銷售為正數
    const transactionAmount = transaction.type === 'purchase' 
      ? -(transaction.quantity * transaction.unitPrice)
      : (transaction.quantity * transaction.unitPrice);
    
    cumulativeProfitLoss += transactionAmount;
    
    return {
      ...transaction,
      transactionAmount,
      cumulativeProfitLoss
    };
  });
  
  setTransactionHistory(historyWithCumulative);
}
```

### 用戶界面

1. 摘要卡片：
   - 將"損益總和"改為"累積盈虧"
   - 顯示最新的累積盈虧值（交易歷史中的最後一筆交易的累積盈虧）
   - 根據值的正負顯示不同顏色（正值為綠色，負值為紅色）

2. 交易歷史表格：
   - 添加了一個新的表格組件，顯示完整的交易歷史
   - 包含貨單號、類型、數量、單價、交易金額和累積盈虧等列
   - 使用顏色區分進貨（藍色）和銷售（紅色）
   - 交易金額和累積盈虧根據值的正負顯示不同顏色（正值為綠色，負值為紅色）
   - 貨單號可點擊，連接到相應的訂單詳情頁面

## 實現效果

新的InventorySummary組件能夠：

1. 正確計算並顯示累積盈虧，完全符合用戶提供的例子
2. 提供詳細的交易歷史表格，清晰顯示每筆交易對累積盈虧的影響
3. 使用顏色和圖標增強視覺效果，提高用戶體驗
4. 保留原有的總庫存價值和總毛利卡片，同時添加新的累積盈虧卡片
5. 保留訂單連結功能，方便用戶查看相關訂單

## 後端API要求

為了支持這個新功能，後端API需要：

1. 支持`includeTransactionHistory`參數，返回完整的交易歷史記錄
2. 交易歷史記錄應包含以下字段：
   - `orderNumber`：貨單號
   - `orderId`：訂單ID
   - `type`：交易類型（purchase或sale）
   - `quantity`：數量
   - `unitPrice`：單價
   - 可選的其他字段，如日期、產品信息等

## 提交記錄

變更已提交到GitHub倉庫，提交信息如下：

```
feat: 重新設計InventorySummary組件以實現累積盈虧計算

- 完全重新設計InventorySummary組件
- 添加交易歷史表格，顯示每筆交易及其對累積盈虧的影響
- 對於進貨，交易金額為負數（成本）
- 對於銷售，交易金額為正數（收入）
- 累積盈虧通過將每筆交易金額添加到運行總額來計算
- 在頂部摘要卡片中顯示最終的累積盈虧
- 使用顏色區分進貨和銷售，以及正值和負值
```

## 後續建議

1. 考慮添加日期範圍篩選功能，允許用戶查看特定時間段的累積盈虧
2. 添加圖表視覺化功能，直觀顯示累積盈虧的變化趨勢
3. 添加導出功能，允許用戶將交易歷史和累積盈虧數據導出為Excel或PDF
4. 添加更多的統計指標，如平均成本、平均售價、毛利率等
5. 優化表格的分頁和排序功能，提高大量數據時的用戶體驗
