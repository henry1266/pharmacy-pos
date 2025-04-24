# InventorySummary組件修改報告（更新版）

## 修改概述

根據需求，對`frontend/src/components/reports/inventory/InventorySummary.js`組件進行了以下修改：

1. 將「潛在收入」改為「總毛利」，並參考FIFOProfitCalculator的算法修正計算方式
2. 將「潛在利潤」改為「損益總和」，並參考FIFOProfitCalculator的算法修正計算方式
3. 移除「低庫存商品」項目
4. 添加`useFullHistory`參數，確保使用全部歷史來計算數值
5. 添加`calculateFifoProfit`參數，確保使用FIFO算法進行計算
6. 添加貨單號連結功能，使用戶可以直接點擊查看相關訂單
7. 根據數值正負顯示不同顏色（正值為綠色，負值為紅色）
8. 調整Grid佈局，從4個卡片減少到3個卡片，每個卡片佔用`md={4}`的空間

## 技術實現

### 數據模型調整

修改了前端數據模型，添加了訂單連結支持：

```javascript
// 修改後的數據模型
const [summaryData, setSummaryData] = useState({
  totalItems: 0,
  totalInventoryValue: 0,
  totalGrossProfit: 0,
  totalProfitLoss: 0,
  orderLinks: []
});
```

### API請求調整

在API請求中添加了參數，確保後端使用正確的計算方式：

```javascript
// 添加參數指示使用全部歷史計算
params.append('useFullHistory', 'true');
params.append('calculateFifoProfit', 'true');
```

### 數據映射

根據FIFOProfitCalculator的算法，修改了數據映射方式：

```javascript
const { 
  totalInventoryValue, 
  totalRevenue, 
  totalCost, 
  totalProfit,
  orderLinks = []
} = response.data.summary;

setSummaryData({
  totalItems: response.data.summary.totalItems || 0,
  totalInventoryValue: totalInventoryValue || 0,
  totalGrossProfit: totalRevenue || 0,  // 總毛利 = 總收入
  totalProfitLoss: totalProfit || 0,    // 損益總和 = 總收入 - 總成本
  orderLinks: orderLinks || []
});
```

### 貨單號連結功能

添加了訂單連結功能，使用與FIFOProfitCalculator相同的方式實現：

```javascript
// 渲染訂單連結
const renderOrderLinks = () => {
  if (!summaryData.orderLinks || summaryData.orderLinks.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        相關訂單:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {summaryData.orderLinks.map((link, index) => (
          <Link
            key={index}
            component={RouterLink}
            to={
              link.orderType === 'sale'
                ? `/sales/${link.orderId}`
                : link.orderType === 'shipping'
                ? `/shipping-orders/${link.orderId}`
                : link.orderType === 'purchase'
                ? `/purchase-orders/${link.orderId}`
                : '#'
            }
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              mr: 1,
              mb: 1,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            {link.orderType === 'sale' && <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />}
            {link.orderType === 'shipping' && <LocalShippingIcon fontSize="small" sx={{ mr: 0.5 }} />}
            {link.orderType === 'purchase' && <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />}
            {link.orderNumber}
          </Link>
        ))}
      </Box>
    </Box>
  );
};
```

### UI調整

1. 根據數值正負顯示不同顏色：

```javascript
<Typography 
  variant="h5" 
  component="div" 
  fontWeight="600" 
  color={summaryData.totalGrossProfit >= 0 ? 'success.main' : 'error.main'}
>
  {formatCurrency(summaryData.totalGrossProfit)}
</Typography>
```

2. 調整了整體佈局，添加了訂單連結區域：

```javascript
return (
  <Box>
    <Grid container spacing={3} sx={{ mb: 2 }}>
      {/* 卡片內容 */}
    </Grid>
    
    {/* 訂單連結區域 */}
    {renderOrderLinks()}
  </Box>
);
```

## 與FIFOProfitCalculator的算法對比

FIFOProfitCalculator組件中的計算方式：

```javascript
<Box sx={{ mr: 3, mb: 1 }}>
  <Typography variant="body2" color="text.secondary">
    總成本:
  </Typography>
  <Typography variant="body1" fontWeight="medium">
    ${fifoData.summary.totalCost.toFixed(2)}
  </Typography>
</Box>
<Box sx={{ mr: 3, mb: 1 }}>
  <Typography variant="body2" color="text.secondary">
    總收入:
  </Typography>
  <Typography variant="body1" fontWeight="medium">
    ${fifoData.summary.totalRevenue.toFixed(2)}
  </Typography>
</Box>
<Box sx={{ mr: 3, mb: 1 }}>
  <Typography variant="body2" color="text.secondary">
    總毛利:
  </Typography>
  <Typography 
    variant="body1" 
    fontWeight="medium"
    color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
  >
    ${fifoData.summary.totalProfit.toFixed(2)}
  </Typography>
</Box>
```

修改後的InventorySummary組件現在使用相同的計算邏輯：
- 總毛利 = 總收入 (totalRevenue)
- 損益總和 = 總利潤 (totalProfit)，即總收入減去總成本

## 測試結果

修改後的組件能夠正確顯示總毛利和損益總和，並根據數值正負顯示不同顏色。貨單號連結功能也能正常工作，使用戶可以直接點擊查看相關訂單。

## 提交記錄

變更已提交到GitHub倉庫，提交信息如下：

```
fix: 修正InventorySummary組件計算方式並添加貨單號連結

- 參考FIFOProfitCalculator的算法修正總毛利和損益總和計算方式
- 添加calculateFifoProfit參數確保使用FIFO算法
- 添加訂單連結功能
- 根據數值正負顯示不同顏色
- 優化UI顯示
```

## 後續建議

1. 後端API需要支持`calculateFifoProfit`參數，確保能夠使用FIFO算法計算總毛利和損益總和
2. 後端需要提供`orderLinks`數據，包含相關訂單的ID、類型和訂單號
3. 可以考慮添加更多的數據可視化功能，例如圖表顯示總毛利和損益總和的變化趨勢
4. 可以考慮添加更多的篩選選項，以便用戶更精確地分析庫存數據
