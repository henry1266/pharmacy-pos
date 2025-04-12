# 藥局POS系統目錄結構說明

## 專案整體結構

```
pharmacy-pos/
├── backend/                # 後端程式碼
│   ├── config/             # 配置文件
│   ├── middleware/         # 中間件
│   ├── models/             # 資料模型
│   └── routes/             # API路由
├── csv/                    # CSV匯入/匯出相關文件
├── frontend/               # 前端程式碼
│   ├── public/             # 靜態資源
│   └── src/                # 源代碼
│       ├── assets/         # 靜態資源
│       ├── components/     # 組件
│       ├── hooks/          # 自定義Hooks
│       ├── pages/          # 頁面
│       ├── redux/          # Redux狀態管理
│       └── utils/          # 工具函數
├── 報告/                   # AI產生的報告
├── setup.bat               # Windows環境設置腳本
├── setup.sh                # Linux/Mac環境設置腳本
├── start.bat               # Windows啟動腳本
└── start2.bat              # Windows備用啟動腳本
```

## 前端組件結構

### 優化後的PurchaseOrders相關組件結構

```
frontend/src/components/
├── purchase-orders/            # 進貨單相關組件
│   ├── common/                 # 共用元件
│   │   ├── StatusChip.js       # 狀態標籤組件
│   │   ├── PaymentStatusChip.js # 付款狀態標籤組件
│   │   └── ConfirmDialog.js    # 通用確認對話框
│   ├── list/                   # 列表相關組件
│   │   ├── PurchaseOrdersTable.js # 進貨單表格
│   │   ├── TableActions.js     # 表格操作按鈕
│   │   ├── TableFilters.js     # 表格篩選器
│   │   └── PreviewPopover.js   # 預覽彈出框
│   ├── form/                   # 表單相關組件
│   │   ├── BasicInfo/          # 基本信息相關
│   │   │   ├── index.js        # 基本信息表單主組件
│   │   │   ├── SupplierSelect.js # 供應商選擇組件
│   │   │   ├── StatusSelect.js # 狀態選擇組件
│   │   │   └── PaymentSelect.js # 付款狀態選擇組件
│   │   └── ProductItems/       # 產品項目相關
│   │       ├── ItemsTable.js   # 項目表格
│   │       ├── ItemForm.js     # 項目表單
│   │       └── ItemActions.js  # 項目操作按鈕
│   └── import/                 # 導入相關組件
│       └── CsvImportDialog.js  # CSV導入對話框
└── purchase-order-form/        # 舊版進貨單表單組件(待移除)
```

## 組件功能說明

### 共用元件 (common/)

- **StatusChip.js**: 顯示進貨單狀態的標籤組件，根據不同狀態顯示不同顏色和文字。
- **PaymentStatusChip.js**: 顯示付款狀態的標籤組件，根據不同付款狀態顯示不同顏色和文字。
- **ConfirmDialog.js**: 通用確認對話框組件，用於各種需要用戶確認的操作。

### 列表相關組件 (list/)

- **PurchaseOrdersTable.js**: 進貨單列表表格組件，顯示所有進貨單的主要信息。
- **TableActions.js**: 表格行操作按鈕組件，包含查看、編輯、刪除等功能。
- **TableFilters.js**: 表格篩選器組件，提供多種條件篩選進貨單。
- **PreviewPopover.js**: 進貨單預覽彈出框組件，顯示進貨單的詳細信息。

### 表單相關組件 (form/)

#### 基本信息相關 (BasicInfo/)

- **index.js**: 基本信息表單主組件，整合各子組件。
- **SupplierSelect.js**: 供應商選擇組件，提供自動完成和鍵盤事件處理。
- **StatusSelect.js**: 狀態選擇組件，包含樣式和鍵盤事件處理。
- **PaymentSelect.js**: 付款狀態選擇組件，包含樣式和事件處理。

#### 產品項目相關 (ProductItems/)

- **ItemsTable.js**: 藥品項目表格組件，顯示進貨單中的所有藥品項目。
- **ItemForm.js**: 藥品項目編輯表單組件，用於編輯單個藥品項目。
- **ItemActions.js**: 藥品項目操作按鈕組件，包含上移、下移、編輯、刪除等功能。

### 導入相關組件 (import/)

- **CsvImportDialog.js**: CSV導入對話框組件，用於從CSV文件導入進貨單數據。

## 組件間關係

1. **共用元件**被其他組件引用，提供統一的UI元素和行為。
   - StatusChip和PaymentStatusChip被PurchaseOrdersTable使用
   - ConfirmDialog被需要確認操作的組件使用

2. **列表相關組件**負責進貨單的顯示和管理：
   - PurchaseOrdersTable是主要容器組件
   - TableActions提供行操作功能
   - TableFilters提供篩選功能
   - PreviewPopover提供快速預覽功能

3. **表單相關組件**負責進貨單的創建和編輯：
   - BasicInfo相關組件處理進貨單的基本信息
   - ProductItems相關組件處理進貨單中的藥品項目

## 優化說明

1. **組件拆分**：將大型組件拆分為更小、更專注的組件，提高可維護性和可讀性。

2. **共用元件抽取**：將重複使用的UI元素抽取為共用元件，減少代碼重複。

3. **目錄結構優化**：按功能和用途組織組件，使目錄結構更加清晰。

4. **命名規範**：使用一致且有意義的命名，提高代碼可讀性。

5. **事件處理統一**：統一事件處理函數的命名和參數傳遞方式。

6. **樣式處理**：將樣式邏輯集中到專門的組件中，提高樣式的一致性和可維護性。

## 後續建議

1. **完全移除舊版組件**：在確認新組件正常工作後，可以移除舊版的purchase-order-form目錄。

2. **添加單元測試**：為重構後的組件添加單元測試，確保功能正確性。

3. **文檔完善**：為每個組件添加更詳細的文檔，包括PropTypes定義和使用示例。

4. **性能優化**：進一步優化組件的渲染性能，減少不必要的重渲染。

5. **狀態管理優化**：考慮使用Context API或Redux來管理共享狀態，減少props drilling。
