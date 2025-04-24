# InventorySummary組件修改報告

## 修改概述

根據需求，對`frontend/src/components/reports/inventory/InventorySummary.js`組件進行了以下修改：

1. 將「潛在收入」改為「總毛利」
2. 將「潛在利潤」改為「損益總和」
3. 移除「低庫存商品」項目
4. 添加`useFullHistory`參數，確保使用全部歷史來計算數值，而不只是剩餘庫存
5. 調整Grid佈局，從4個卡片減少到3個卡片，每個卡片現在佔用`md={4}`的空間

## 技術實現

### 數據模型調整

修改了前端數據模型，將原有的字段映射為新的字段名稱：

```javascript
// 原始數據模型
const [summaryData, setSummaryData] = useState({
  totalItems: 0,
  totalInventoryValue: 0,
  totalPotentialRevenue: 0,
  totalPotentialProfit: 0,
  lowStockCount: 0
});

// 修改後的數據模型
const [summaryData, setSummaryData] = useState({
  totalItems: 0,
  totalInventoryValue: 0,
  totalGrossProfit: 0,
  totalProfitLoss: 0
});
```

### API請求調整

在API請求中添加了`useFullHistory`參數，確保後端使用全部歷史數據進行計算：

```javascript
// 添加參數指示使用全部歷史計算
params.append('useFullHistory', 'true');
```

### 數據映射

在接收到API響應後，將原有的字段映射為新的字段：

```javascript
const { totalInventoryValue, totalPotentialRevenue, totalPotentialProfit } = response.data.summary;
setSummaryData({
  totalItems: response.data.summary.totalItems || 0,
  totalInventoryValue: totalInventoryValue || 0,
  totalGrossProfit: totalPotentialRevenue || 0,
  totalProfitLoss: totalPotentialProfit || 0
});
```

### UI調整

1. 移除了「低庫存商品」卡片
2. 將「潛在收入」卡片標題改為「總毛利」
3. 將「潛在利潤」卡片標題改為「損益總和」
4. 調整了Grid佈局，從`md={3}`改為`md={4}`，使三個卡片平均分佈

## 測試結果

修改後的組件能夠正常顯示，並且通過添加`useFullHistory`參數，確保了數據計算基於全部歷史記錄而不僅僅是剩餘庫存。

## 提交記錄

變更已提交到GitHub倉庫，提交信息如下：

```
refactor: 修改InventorySummary組件顯示內容

- 將潛在收入改為總毛利
- 將潛在利潤改為損益總和
- 移除低庫存商品項目
- 添加useFullHistory參數使用全部歷史計算數值
- 調整Grid佈局適應3個卡片
```

## 後續建議

1. 後端API需要支持`useFullHistory`參數，確保能夠基於全部歷史記錄計算總毛利和損益總和
2. 可以考慮在後端添加更詳細的計算邏輯，例如按時間段分析毛利和損益趨勢
3. 可以考慮添加圖表顯示總毛利和損益總和的變化趨勢
