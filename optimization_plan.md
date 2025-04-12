# PurchaseOrders相關頁面優化計劃

## 當前問題分析

經過對現有PurchaseOrders相關組件的分析，發現以下幾個可以優化的方面：

1. **組件結構過於集中**：目前的組件結構分為purchase-orders和purchase-order-form兩個主要目錄，但內部組件職責邊界不夠清晰。

2. **BasicInfoForm.js過於複雜**：包含了大量的邏輯和UI元素，特別是供應商選擇和狀態選擇部分包含了複雜的事件處理和樣式邏輯。

3. **PurchaseOrdersTable.js功能過於集中**：包含了表格定義、狀態芯片渲染、操作按鈕等多種功能。

4. **缺乏共用元件**：狀態芯片、付款狀態芯片等在多個組件中重複定義。

5. **ProductItemsTable.js邏輯複雜**：包含了編輯、刪除、移動等多種操作邏輯。

## 優化方案

### 1. 重構目錄結構

將purchase-orders相關組件重構為以下目錄結構：

```
frontend/src/components/purchase-orders/
├── common/                     # 共用元件
│   ├── StatusChip.js           # 狀態標籤組件
│   ├── PaymentStatusChip.js    # 付款狀態標籤組件
│   └── ConfirmDialog.js        # 通用確認對話框
├── list/                       # 列表相關組件
│   ├── PurchaseOrdersTable.js  # 進貨單表格
│   ├── TableActions.js         # 表格操作按鈕
│   ├── TableFilters.js         # 表格篩選器
│   └── PreviewPopover.js       # 預覽彈出框
├── form/                       # 表單相關組件
│   ├── BasicInfo/              # 基本信息相關
│   │   ├── index.js            # 基本信息表單主組件
│   │   ├── SupplierSelect.js   # 供應商選擇組件
│   │   ├── StatusSelect.js     # 狀態選擇組件
│   │   └── PaymentSelect.js    # 付款狀態選擇組件
│   ├── ProductItems/           # 產品項目相關
│   │   ├── index.js            # 產品項目主組件
│   │   ├── ItemsTable.js       # 項目表格
│   │   ├── ItemForm.js         # 項目表單
│   │   └── ItemActions.js      # 項目操作按鈕
│   └── ActionButtons.js        # 表單操作按鈕
└── import/                     # 導入相關組件
    └── CsvImportDialog.js      # CSV導入對話框
```

### 2. 重構共用元件

創建共用元件以減少代碼重複：

- **StatusChip.js**：封裝狀態標籤邏輯，接受status參數並返回對應的Chip組件
- **PaymentStatusChip.js**：封裝付款狀態標籤邏輯，接受status參數並返回對應的Chip組件
- **ConfirmDialog.js**：通用確認對話框，可用於刪除確認等操作

### 3. 拆分BasicInfoForm.js

將BasicInfoForm.js拆分為多個子組件：

- **BasicInfo/index.js**：主組件，整合各子組件
- **SupplierSelect.js**：供應商選擇邏輯，包含自動完成和鍵盤事件處理
- **StatusSelect.js**：狀態選擇邏輯，包含樣式和鍵盤事件處理
- **PaymentSelect.js**：付款狀態選擇邏輯，包含樣式和事件處理

### 4. 拆分ProductItemsTable.js

將ProductItemsTable.js拆分為多個子組件：

- **ProductItems/index.js**：主組件，整合各子組件
- **ItemsTable.js**：表格顯示邏輯
- **ItemForm.js**：項目編輯表單
- **ItemActions.js**：項目操作按鈕（上移、下移、編輯、刪除）

### 5. 拆分PurchaseOrdersTable.js

將PurchaseOrdersTable.js拆分為多個子組件：

- **TableActions.js**：表格操作按鈕（查看、編輯、刪除）
- **PreviewPopover.js**：預覽彈出框，用於顯示進貨單詳情

### 6. 優化狀態管理

- 使用React Context或Redux來管理共享狀態，減少props drilling
- 將表單狀態邏輯與UI渲染邏輯分離

### 7. 改進用戶體驗

- 優化表單Tab鍵順序，確保順暢的鍵盤操作體驗
- 統一狀態和付款狀態的顏色標示
- 改進表格的響應式設計，確保在不同屏幕尺寸下的良好顯示

## 實施步驟

1. 創建新的目錄結構
2. 實現共用元件
3. 重構BasicInfoForm
4. 重構ProductItemsTable
5. 重構PurchaseOrdersTable
6. 更新引用路徑
7. 測試功能
8. 提交更改

## 預期效果

1. **提高代碼可讀性**：通過合理拆分組件，使每個組件職責更加明確
2. **提高可維護性**：減少單個文件的代碼量，使修改和擴展更加容易
3. **減少代碼重複**：通過共用元件減少重複代碼
4. **改進用戶體驗**：優化表單操作流程，提高用戶效率
5. **提高性能**：通過更精細的組件拆分，減少不必要的重渲染
