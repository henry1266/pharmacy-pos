# FIFO過程資料日誌功能實現報告

## 功能需求

根據用戶需求，在FIFO計算過程中添加詳細的console.log打印功能，以便在開發過程中更容易追蹤和調試FIFO計算過程。

## 實現內容

我在`backend/utils/fifoCalculator.js`文件中添加了詳細的console.log語句，記錄FIFO計算的每個關鍵步驟。具體添加的日誌內容包括：

### 1. 準備FIFO計算數據階段
- 庫存記錄總數
- 每條庫存記錄的處理過程（類型、數量、總金額）
- 進貨記錄和出貨記錄的添加
- 進貨記錄和出貨記錄的排序結果

### 2. FIFO匹配過程階段
- 進貨批次總數和出貨記錄總數
- 進貨批次詳細資料（訂單號、時間、數量、單價）
- 出貨記錄詳細資料（訂單號、時間、數量、產品ID）
- 每筆出貨記錄的處理過程
- 批次匹配和扣除的詳細過程
- 負庫存情況的處理

### 3. 計算銷售毛利階段
- FIFO匹配結果數和銷售記錄數
- 每筆FIFO匹配結果的處理過程
- 銷售總額的計算
- 負庫存情況的特殊處理
- 成本明細的詳細資料
- 毛利和毛利率的計算

### 4. 產品FIFO計算總結階段
- 總成本、總收入、總毛利的計算
- 平均毛利率的計算

## 代碼示例

以下是添加的部分日誌代碼示例：

```javascript
// FIFO匹配過程開始
console.log('===== FIFO匹配過程開始 =====');
console.log(`進貨批次總數: ${stockIn.length}`);
console.log(`出貨記錄總數: ${stockOut.length}`);

// 打印進貨批次資料
console.log('進貨批次資料:');
stockIn.forEach((batch, index) => {
  console.log(`  批次[${index}]: 訂單號=${batch.orderNumber}, 時間=${new Date(batch.timestamp).toLocaleString()}, 數量=${batch.quantity}, 單價=${batch.unit_price}`);
});

// 處理出貨記錄
console.log(`\n處理出貨記錄: 訂單號=${out.orderNumber}, 數量=${out.quantity}`);
console.log(`  初始剩餘數量: ${remaining}`);

// 使用批次
console.log(`  使用批次[${inIndex}]: 訂單號=${batch.orderNumber}, 剩餘數量=${batch.remainingQty}`);
console.log(`  從批次[${inIndex}]扣除: ${used}個, 單價=${batch.unit_price}, 小計=${used * batch.unit_price}`);
console.log(`  批次[${inIndex}]剩餘: ${batch.remainingQty}, 出貨剩餘未匹配: ${remaining}`);

// 計算毛利
console.log(`  毛利: ${grossProfit} (${totalRevenue} - ${totalCost})`);
console.log(`  毛利率: ${profitMargin.toFixed(2)}%`);
```

## 如何查看日誌

這些日誌會在FIFO計算過程中輸出到服務器的控制台。您可以通過以下方式查看這些日誌：

1. **開發環境**：
   - 在運行Node.js服務器時，日誌會直接輸出到終端窗口
   - 使用`npm run dev`啟動服務器時可以在終端中看到所有日誌

2. **生產環境**：
   - 日誌會記錄到服務器的日誌文件中
   - 可以通過查看服務器日誌文件或使用日誌管理工具查看

3. **瀏覽器開發者工具**：
   - 如果您在前端代碼中調用了這些FIFO計算函數，日誌也會輸出到瀏覽器的控制台
   - 打開瀏覽器開發者工具（F12），切換到"Console"標籤即可查看

## 日誌使用場景

這些詳細的日誌對以下場景特別有用：

1. **調試FIFO計算問題**：當FIFO計算結果不符合預期時，可以通過日誌追蹤計算過程中的每一步
2. **理解FIFO算法**：新開發人員可以通過日誌了解FIFO計算的具體實現
3. **性能分析**：通過日誌可以識別FIFO計算中的性能瓶頸
4. **數據驗證**：確保進出貨記錄的處理和排序符合預期

## 提交信息

按照development_collaboration_guidelines中的Conventional Commits規範提交了修改：
```
feat: 添加FIFO過程資料的console.log打印功能
```

## 推送結果

修改已成功推送到GitHub倉庫的new分支。
