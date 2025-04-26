# InventorySummary損益總和功能實現報告

## 功能概述

將原本在InventoryTable中實現的損益總和功能移植到InventorySummary組件中，使損益總和數據能夠在摘要卡片中直接顯示，提高用戶體驗和數據可視性。

## 實現細節

### 1. 數據獲取與處理邏輯

在InventorySummary組件中添加了與InventoryTable相同的數據獲取和處理邏輯：

```javascript
// 添加狀態變量
const [totalProfitLoss, setTotalProfitLoss] = useState(0);

// 獲取庫存數據
useEffect(() => {
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // 構建查詢參數
      const params = new URLSearchParams();
      if (filters.supplier) params.append('supplier', filters.supplier);
      if (filters.category) params.append('category', filters.category);
      if (filters.productCode) params.append('productCode', filters.productCode);
      if (filters.productName) params.append('productName', filters.productName);
      if (filters.productType) params.append('productType', filters.productType);
      
      // 添加參數以獲取完整的交易歷史記錄
      params.append('includeTransactionHistory', 'true');
      params.append('useSequentialProfitLoss', 'true');
      
      const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
      
      if (response.data && response.data.data) {
        // 處理數據分組和計算損益總和
        processInventoryData(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('獲取庫存數據失敗:', err);
      setError('獲取庫存數據失敗');
    } finally {
      setLoading(false);
    }
  };

  fetchInventoryData();
}, [filters]);
```

### 2. 損益總和計算邏輯

實現了與InventoryTable相同的損益總和計算邏輯，確保數據一致性：

```javascript
// 處理庫存數據分組和計算損益總和
const processInventoryData = (data) => {
  // 按產品ID分組
  const groupedByProduct = {};
  let profitLossSum = 0;
  
  // 數據處理和分組...
  
  // 計算每個商品的損益總和並取貨單號最大的那筆作為最終值
  groupedArray.forEach(product => {
    if (product.transactions.length > 0) {
      // 根據交易類型計算損益
      const calculateTransactionProfitLoss = (transaction) => {
        if (transaction.type === '進貨') {
          // 進貨為負數
          return -(transaction.quantity * transaction.price);
        } else if (transaction.type === '銷售' || transaction.type === '出貨') {
          // 銷售為正數
          return transaction.quantity * transaction.price;
        }
        return 0;
      };
      
      // 排序和計算邏輯...
      
      // 計算貨單號最大的那筆交易的累積損益
      if (sortedByDescending.length > 0) {
        // 找到貨單號最大的交易
        const latestTransaction = sortedByDescending[0];
        
        // 計算到該交易為止的累積損益
        let latestCumulativeProfitLoss = 0;
        for (let i = 0; i <= index; i++) {
          const transaction = sortedTransactions[i];
          if (transaction.type === '進貨') {
            latestCumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
          } else if (transaction.type === '銷售' || transaction.type === '出貨') {
            latestCumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
          }
        }
        
        // 將貨單號最大的交易的累積損益加入總損益
        profitLossSum += latestCumulativeProfitLoss;
      }
    }
  });
  
  // 更新損益總和
  setTotalProfitLoss(profitLossSum);
};
```

### 3. UI更新

更新了損益總和卡片的UI，使用新計算的totalProfitLoss值：

```javascript
<Typography 
  variant="h5" 
  component="div" 
  fontWeight="600" 
  color={totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
>
  {formatCurrency(totalProfitLoss)}
</Typography>
```

## 技術說明

1. **代碼重用**：
   - 從InventoryTable中移植了損益總和計算邏輯，確保功能一致性
   - 保持了相同的數據處理流程和計算方法

2. **數據處理**：
   - 使用相同的API請求參數，確保獲取完整的交易歷史記錄
   - 按產品ID分組處理數據
   - 計算每個商品的最新交易的累積損益，並加總得到總損益

3. **UI處理**：
   - 使用條件樣式，根據損益總和的正負值顯示不同顏色
   - 使用formatCurrency函數格式化金額顯示

## 效果展示

實現後，損益總和數據現在直接顯示在InventorySummary組件的摘要卡片中，與總庫存價值和總毛利並列顯示。這樣用戶可以在頁面頂部一目了然地看到關鍵財務指標，而不需要滾動到InventoryTable部分。

## 優化說明

1. **數據一致性**：
   - 確保InventorySummary和InventoryTable中的損益總和計算邏輯完全一致
   - 使用相同的API請求參數和數據處理方法

2. **用戶體驗**：
   - 將關鍵財務指標集中在摘要卡片中顯示，提高數據可視性
   - 使用視覺提示（顏色）幫助用戶快速識別損益情況

3. **代碼組織**：
   - 將相關功能集中在適當的組件中，提高代碼的可維護性
   - 保持組件職責清晰，InventorySummary負責顯示摘要數據，InventoryTable負責顯示詳細列表

## 後續建議

1. **性能優化**：
   - 考慮在後端計算損益總和，減少前端計算負擔
   - 添加數據緩存機制，避免重複計算

2. **UI增強**：
   - 考慮添加趨勢指標，顯示損益總和的變化趨勢
   - 添加圖表視覺化，直觀展示損益變化

3. **功能擴展**：
   - 添加時間範圍選擇，允許用戶查看不同時期的損益總和
   - 添加按類別或供應商的損益總和分析
