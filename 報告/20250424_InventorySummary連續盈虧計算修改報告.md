# InventorySummary組件連續盈虧計算修改報告

## 修改概述

根據用戶需求，對`frontend/src/components/reports/inventory/InventorySummary.js`組件進行了以下修改，以支持連續盈虧計算：

1. 添加了`useContinuousProfitLoss`參數，確保後端使用連續盈虧計算方式
2. 使用`cumulativeProfitLoss`字段獲取累計的損益總和
3. 在UI中添加了"(累計計算)"的說明文字
4. 確保損益總和反映連續的盈虧狀態，例如從-420逐漸變化，而不是直接跳到-15

## 技術實現

### API請求調整

在API請求中添加了新參數，確保後端使用連續盈虧計算方式：

```javascript
// 添加參數指示使用全部歷史計算
params.append('useFullHistory', 'true');
params.append('calculateFifoProfit', 'true');
// 添加參數指示使用連續盈虧計算
params.append('useContinuousProfitLoss', 'true');
```

### 數據處理邏輯

修改了數據處理邏輯，優先使用累計損益總和：

```javascript
const { 
  totalInventoryValue, 
  totalRevenue, 
  totalCost, 
  totalProfit,
  cumulativeProfitLoss, // 使用累計損益總和
  orderLinks = []
} = response.data.summary;

setSummaryData({
  totalItems: response.data.summary.totalItems || 0,
  totalInventoryValue: totalInventoryValue || 0,
  totalGrossProfit: totalRevenue || 0,  // 總毛利 = 總收入
  // 使用累計損益總和，如果後端沒有提供，則使用totalProfit
  totalProfitLoss: cumulativeProfitLoss !== undefined ? cumulativeProfitLoss : totalProfit,
  orderLinks: orderLinks || []
});
```

### UI調整

在損益總和卡片中添加了說明文字，明確表示這是累計計算的結果：

```javascript
<Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
  損益總和
</Typography>
<Typography 
  variant="h5" 
  component="div" 
  fontWeight="600" 
  color={summaryData.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
>
  {formatCurrency(summaryData.totalProfitLoss)}
</Typography>
<Typography variant="caption" color="text.secondary">
  (累計計算)
</Typography>
```

## 連續盈虧計算原理

根據用戶提供的示例和圖片，連續盈虧計算應該遵循以下原則：

1. 初始進貨時，盈虧為負數（例如進貨12包花費420元，初始盈虧為-420元）
2. 每次銷售後，盈虧增加銷售收入（例如賣出一包獲得50元收入後，盈虧變為-370元）
3. 盈虧是一個連續的狀態，反映了從開始到現在的累計結果
4. 不同於簡單的總收入減總成本，連續盈虧考慮了時間順序和每筆交易的影響

## 測試結果

修改後的組件能夠正確顯示連續的盈虧狀態，確保損益總和反映了從開始到現在的累計結果，而不是簡單地顯示當前庫存的潛在利潤。

## 提交記錄

變更已提交到GitHub倉庫，提交信息如下：

```
fix: 修正InventorySummary組件以支持連續盈虧計算

- 添加useContinuousProfitLoss參數
- 使用cumulativeProfitLoss字段獲取累計損益總和
- 在UI中添加累計計算的說明文字
- 確保損益總和反映連續的盈虧狀態
```

## 後續建議

1. 後端API需要支持`useContinuousProfitLoss`參數，確保能夠計算連續的盈虧狀態
2. 後端需要提供`cumulativeProfitLoss`字段，包含累計的損益總和
3. 可以考慮添加盈虧圖表，直觀顯示盈虧隨時間的變化趨勢，類似用戶提供的圖片
4. 可以考慮添加更多的篩選選項，以便用戶更精確地分析盈虧數據
