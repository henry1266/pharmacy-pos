# 藥局POS系統目錄結構說明

## 專案整體結構

```
pharmacy-pos/
├── backend/                # 後端程式碼
│   ├── config/             # 配置文件
│   ├── middleware/         # 中間件
│   ├── models/             # 資料模型
│   ├── routes/             # API路由
│   ├── scripts/            # 腳本文件
│   └── utils/              # 工具函數
├── config/                 # 系統配置文件
├── csv/                    # CSV匯入/匯出相關文件
├── frontend/               # 前端程式碼
│   ├── public/             # 靜態資源
│   └── src/                # 源代碼
│       ├── assets/         # 靜態資源
│       │   └── css/        # 樣式文件
│       ├── components/     # 組件
│       │   ├── accounting/ # 記帳相關組件
│       │   ├── charts/     # 圖表組件
│       │   ├── common/     # 共用組件
│       │   ├── filters/    # 過濾器組件
│       │   ├── layout/     # 布局組件
│       │   ├── products/   # 產品相關組件
│       │   ├── purchase-orders/ # 進貨單相關組件
│       │   ├── reports/    # 報表相關組件
│       │   ├── sales/      # 銷售相關組件
│       │   ├── settings/   # 設置相關組件
│       │   ├── shipping-orders/ # 出貨單相關組件
│       │   └── tables/     # 表格組件
│       ├── hooks/          # 自定義Hooks
│       ├── pages/          # 頁面
│       ├── redux/          # Redux狀態管理
│       ├── services/       # 服務
│       ├── tests/          # 測試文件
│       └── utils/          # 工具函數
├── 報告/                   # AI產生的報告
├── setup.bat               # Windows環境設置腳本
├── setup.sh                # Linux/Mac環境設置腳本
├── start.bat               # Windows啟動腳本
└── start2.bat              # Windows備用啟動腳本
```

## 前端組件結構

### 進貨單相關組件結構

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

### 出貨單相關組件結構

```
frontend/src/components/
└── shipping-orders/            # 出貨單相關組件
    ├── common/                 # 共用元件
    │   ├── StatusChip.js       # 狀態標籤組件
    │   └── ConfirmDialog.js    # 通用確認對話框
    ├── list/                   # 列表相關組件
    │   ├── ShippingOrdersTable.js # 出貨單表格
    │   ├── TableActions.js     # 表格操作按鈕
    │   └── TableFilters.js     # 表格篩選器
    ├── form/                   # 表單相關組件
    │   ├── BasicInfo/          # 基本信息相關
    │   │   ├── index.js        # 基本信息表單主組件
    │   │   ├── CustomerSelect.js # 客戶選擇組件
    │   │   └── StatusSelect.js # 狀態選擇組件
    │   └── ProductItems/       # 產品項目相關
    │       ├── ItemsTable.js   # 項目表格
    │       ├── ItemForm.js     # 項目表單
    │       └── ItemActions.js  # 項目操作按鈕
    └── import/                 # 導入相關組件
        └── CsvImportDialog.js  # CSV導入對話框
```

### 報表相關組件結構

```
frontend/src/components/
├── reports/                    # 報表相關組件
│   └── AccountingChart.js      # 記帳報表圖表組件
└── charts/                     # 圖表組件
    ├── BarChart.js             # 柱狀圖組件
    └── LineChart.js            # 折線圖組件
```

## 組件功能說明

### 進貨單共用元件 (purchase-orders/common/)

- **StatusChip.js**: 顯示進貨單狀態的標籤組件，根據不同狀態顯示不同顏色和文字。
- **PaymentStatusChip.js**: 顯示付款狀態的標籤組件，根據不同付款狀態顯示不同顏色和文字。
- **ConfirmDialog.js**: 通用確認對話框組件，用於各種需要用戶確認的操作。

### 進貨單列表相關組件 (purchase-orders/list/)

- **PurchaseOrdersTable.js**: 進貨單列表表格組件，顯示所有進貨單的主要信息。
- **TableActions.js**: 表格行操作按鈕組件，包含查看、編輯、刪除等功能。
- **TableFilters.js**: 表格篩選器組件，提供多種條件篩選進貨單。
- **PreviewPopover.js**: 進貨單預覽彈出框組件，顯示進貨單的詳細信息。

### 進貨單表單相關組件 (purchase-orders/form/)

#### 基本信息相關 (BasicInfo/)

- **index.js**: 基本信息表單主組件，整合各子組件。
- **SupplierSelect.js**: 供應商選擇組件，提供自動完成和鍵盤事件處理。
- **StatusSelect.js**: 狀態選擇組件，包含樣式和鍵盤事件處理。
- **PaymentSelect.js**: 付款狀態選擇組件，包含樣式和事件處理。

#### 產品項目相關 (ProductItems/)

- **ItemsTable.js**: 藥品項目表格組件，顯示進貨單中的所有藥品項目。
- **ItemForm.js**: 藥品項目編輯表單組件，用於編輯單個藥品項目。
- **ItemActions.js**: 藥品項目操作按鈕組件，包含上移、下移、編輯、刪除等功能。

### 報表相關組件 (reports/ 和 charts/)

- **AccountingChart.js**: 記帳報表圖表組件，提供多種圖表類型和數據視圖，支持按日期、班別或類別分組，並提供CSV導出功能。
- **BarChart.js**: 柱狀圖組件，用於顯示分類數據的比較。
- **LineChart.js**: 折線圖組件，用於顯示數據的趨勢變化。

## 後端API結構

### 報表相關API

```
backend/routes/
├── reports.js                  # 報表相關API
│   ├── GET /api/reports/sales  # 獲取銷售報表數據
│   ├── GET /api/reports/inventory # 獲取庫存報表數據
│   └── GET /api/reports/accounting # 獲取記帳報表數據
└── accounting.js               # 記帳相關API
    ├── GET /api/accounting     # 獲取所有記帳記錄
    ├── GET /api/accounting/:id # 獲取單筆記帳記錄
    ├── POST /api/accounting    # 新增記帳記錄
    ├── PUT /api/accounting/:id # 更新記帳記錄
    ├── DELETE /api/accounting/:id # 刪除記帳記錄
    └── GET /api/accounting/summary/daily # 獲取每日記帳摘要
```

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

4. **報表相關組件**負責數據可視化和分析：
   - AccountingChart組件使用BarChart和LineChart組件來顯示不同類型的圖表
   - 報表組件通過API獲取數據，並提供多種視圖和分析工具

## 最新功能說明

### 庫存表分類功能

- 實現了將庫存表區分為商品(product)和藥品(medicine)兩類
- 添加了productType過濾功能，可以只顯示特定類型的庫存項目
- 實現了按產品類型的分組統計，提供每種類型的庫存總值、潛在收入等信息

### 記帳報表功能

- 添加了表格視圖，可以在圖表和表格之間切換查看數據
- 實現了CSV導出功能，可以將報表數據導出為CSV文件
- 改進了數據處理邏輯，使用新的後端API獲取更完整的數據
- 添加了摘要統計顯示，直觀展示總金額和總數量
- 優化了UI界面，提供更好的控制選項和可視化效果

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

6. **報表功能擴展**：添加更多圖表類型和分析工具，提供更豐富的數據分析能力。

7. **數據導出增強**：支持更多格式的數據導出，如Excel、PDF等。
