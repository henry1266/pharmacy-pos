# 出貨單模組 (Shipping Order Module) 評估報告

## 1. 模組概述

出貨單模組是一個完整的功能模組，負責管理藥局系統中的出貨單相關功能。該模組採用 React 和 Material-UI 構建，遵循現代前端開發最佳實踐，包括元件化設計、狀態管理和共享資源。模組提供了出貨單的創建、編輯、查看、列印和刪除等功能，並支援 CSV 導入功能，以便批量處理出貨單資料。

## 2. 目錄結構

```
shipping-order/
├── components/       # 出貨單特定元件
│   ├── ActionButtons.tsx             # 操作按鈕元件
│   ├── BasicInfo.tsx                 # 基本資訊表單元件
│   ├── CsvImportDialog.tsx           # CSV 導入對話框
│   ├── ItemForm.tsx                  # 藥品項目表單
│   ├── ItemsTable.tsx                # 藥品項目表格
│   ├── MedicineCsvImportController.tsx # 藥品 CSV 導入控制器
│   ├── MedicineCsvImportDialog.tsx   # 藥品 CSV 導入對話框
│   ├── PageHeader.tsx                # 頁面標題元件
│   ├── ShippingOrderActions.tsx      # 出貨單操作元件
│   ├── ShippingOrderAmountInfo.tsx   # 出貨單金額資訊元件
│   ├── ShippingOrderBasicInfo.tsx    # 出貨單基本資訊元件
│   ├── ShippingOrderDetailPanel.tsx  # 出貨單詳情面板
│   └── ShippingOrderImportOptions.tsx # 出貨單導入選項
├── hooks/            # 自定義 Hooks
├── pages/            # 頁面元件
│   ├── ShippingOrderDetailPage.tsx   # 出貨單詳情頁面
│   ├── ShippingOrderFormPage.tsx     # 出貨單表單頁面
│   └── ShippingOrdersPage.tsx        # 出貨單列表頁面
└── shared/           # 共用資源
    ├── components.tsx  # 共用 UI 元件
    ├── constants.ts    # 常數定義
    ├── hooks.ts        # 自定義 Hooks
    ├── index.ts        # 主要導出文件
    ├── README.md       # 共用資源文檔
    ├── types.ts        # 類型定義
    └── utils.ts        # 工具函數
```

## 3. 主要功能

### 3.1 出貨單列表 (ShippingOrdersPage)

- 顯示所有出貨單的列表，支援分頁、排序和篩選
- 提供搜索功能，可根據出貨單號、客戶名稱等進行搜索
- 支援按供應商篩選
- 顯示出貨單總金額統計
- 提供預覽、編輯、刪除和解鎖等操作
- 支援計算批量 FIFO 毛利功能
- 支援 CSV 導入功能

### 3.2 出貨單詳情 (ShippingOrderDetailPage)

- 顯示出貨單的詳細資訊，包括基本資訊、藥品項目和金額資訊
- 顯示出貨單的狀態和付款狀態
- 提供編輯、刪除和解鎖等操作
- 支援列印功能，包括標準版、簡化版和大包裝版
- 顯示 FIFO 毛利計算結果
- 支援查看關聯的會計分錄

### 3.3 出貨單表單 (ShippingOrderFormPage)

- 支援創建新出貨單和編輯現有出貨單
- 提供基本資訊表單，包括出貨單號、客戶、狀態、付款狀態等
- 提供藥品項目表單，支援添加、編輯、刪除和排序藥品項目
- 支援大包裝單位和基礎單位的轉換
- 支援批號管理
- 提供倍率模式，可調整總金額

### 3.4 CSV 導入功能

- 支援導入出貨單基本資訊
- 支援導入出貨單藥品項目
- 提供檔案驗證和錯誤處理

## 4. 元件架構

### 4.1 頁面元件 (Pages)

頁面元件是模組的主要入口點，負責整合各種子元件和處理頁面級別的邏輯。

- **ShippingOrdersPage**: 出貨單列表頁面，整合了列表顯示、搜索、篩選和操作功能。
- **ShippingOrderDetailPage**: 出貨單詳情頁面，顯示出貨單的詳細資訊和提供相關操作。
- **ShippingOrderFormPage**: 出貨單表單頁面，用於創建和編輯出貨單。

### 4.2 功能元件 (Components)

功能元件是實現特定功能的可重用元件，通常由頁面元件組合使用。

- **BasicInfo**: 基本資訊表單元件，用於輸入出貨單的基本資訊。
- **ItemForm**: 藥品項目表單元件，用於添加和編輯藥品項目。
- **ItemsTable**: 藥品項目表格元件，用於顯示和管理藥品項目列表。
- **ShippingOrderActions**: 出貨單操作元件，提供各種操作按鈕。
- **CsvImportDialog**: CSV 導入對話框元件，用於導入 CSV 檔案。

### 4.3 共用元件 (Shared Components)

共用元件是在模組內部共享的基礎 UI 元件，通常由功能元件組合使用。

- **EditableRow**: 可編輯行元件，用於編輯表格行。
- **DisplayRow**: 顯示行元件，用於顯示表格行。
- **ActionButtons**: 操作按鈕元件，提供通用的操作按鈕。
- **FileUpload**: 檔案上傳元件，用於上傳檔案。
- **StatusMessage**: 狀態訊息元件，用於顯示狀態訊息。

## 5. 資料流

### 5.1 Redux 狀態管理

模組使用 Redux 進行狀態管理，主要包括以下狀態：

- **shippingOrders**: 出貨單列表和當前選中的出貨單
- **suppliers**: 供應商列表
- **products**: 產品列表

### 5.2 本地狀態管理

模組使用 React 的 `useState` 和 `useEffect` 進行本地狀態管理，主要包括：

- 表單數據狀態
- UI 狀態（對話框、提示訊息等）
- 篩選和搜索狀態
- 分頁和排序狀態

### 5.3 自定義 Hooks

模組使用自定義 Hooks 封裝複雜的邏輯和狀態管理，提高代碼的可讀性和可維護性：

- **useItemsManagement**: 管理藥品項目的添加、編輯、刪除和排序
- **useCsvImport**: 管理 CSV 導入的檔案選擇、驗證和上傳
- **useTablePagination**: 管理表格分頁
- **useTableLoading**: 管理表格載入狀態
- **useTableSelection**: 管理表格選擇狀態
- **useTableFilter**: 管理表格篩選狀態
- **useTableSort**: 管理表格排序狀態

### 5.4 API 調用

模組使用 Redux actions 和 axios 進行 API 調用，主要包括：

- 獲取出貨單列表和詳情
- 創建、更新和刪除出貨單
- 導入 CSV 檔案
- 獲取供應商和產品列表
- 計算 FIFO 毛利

## 6. 共享資源

### 6.1 類型定義 (Types)

模組定義了多種類型，確保代碼的類型安全：

- **Item**: 藥品項目類型
- **ShippingOrder**: 出貨單類型
- **ItemsTableProps**: 藥品項目表格屬性類型
- **CsvImportDialogProps**: CSV 導入對話框屬性類型
- **ShippingOrdersTableProps**: 出貨單表格屬性類型
- **EditableRowProps**: 可編輯行屬性類型
- **DisplayRowProps**: 顯示行屬性類型
- **ActionButtonsProps**: 操作按鈕屬性類型
- **FileUploadProps**: 檔案上傳屬性類型
- **StatusMessageProps**: 狀態訊息屬性類型

### 6.2 常數定義 (Constants)

模組定義了多種常數，提高代碼的可讀性和可維護性：

- **TABLE_CONFIG**: 表格配置
- **FILE_UPLOAD_CONFIG**: 檔案上傳配置
- **STATUS_CONFIG**: 狀態配置
- **PAYMENT_STATUS_CONFIG**: 付款狀態配置
- **TABLE_LOCALE_TEXT**: 表格本地化文字
- **CSV_IMPORT_TABS**: CSV 導入標籤頁配置
- **TABLE_COLUMNS**: 表格欄位配置
- **SHIPPING_ORDER_COLUMNS**: 出貨單表格欄位配置

### 6.3 工具函數 (Utils)

模組定義了多種工具函數，提高代碼的可重用性：

- **calculateUnitPrice**: 計算單價
- **formatAmount**: 格式化金額
- **validateFileType**: 驗證檔案類型
- **validateFileSize**: 驗證檔案大小
- **getLocalizedPaginationText**: 生成本地化分頁文字
- **validateItem**: 驗證項目資料
- **calculateTotalAmount**: 計算項目總金額
- **moveArrayItem**: 移動陣列項目位置
- **deepClone**: 深拷貝物件
- **debounce**: 防抖函數
- **throttle**: 節流函數
- **generateUniqueId**: 生成唯一 ID
- **safeNumber**: 安全的數字轉換
- **safeString**: 安全的字串轉換
- **createDetailItem**: 創建詳細項目的工廠函數
- **createStatusConfig**: 創建狀態配置的工廠函數
- **createColumnConfig**: 創建表格欄位配置的工廠函數

## 7. 依賴關係

### 7.1 外部依賴

- **React**: 用於構建用戶界面
- **Material-UI**: 用於 UI 元件和樣式
- **Redux**: 用於狀態管理
- **React Router**: 用於路由管理
- **Axios**: 用於 API 調用
- **date-fns**: 用於日期格式化
- **react-beautiful-dnd**: 用於拖放功能

### 7.2 內部依賴

- **@/hooks**: 全局自定義 Hooks
- **@/components**: 全局共用元件
- **@/redux**: Redux 相關代碼
- **@/services**: 服務函數
- **@pharmacy-pos/shared/types**: 共享類型定義

## 8. 最佳實踐與改進建議

### 8.1 代碼組織

- **模組化設計**: 模組採用了良好的模組化設計，將功能分解為可重用的元件和 Hooks，提高了代碼的可讀性和可維護性。
- **共享資源**: 模組定義了共享的類型、常數和工具函數，減少了代碼重複，提高了代碼的一致性。
- **明確的導出策略**: 模組採用了明確的命名導出策略，清晰定義了模組的公共 API，避免了意外導出內部實現細節。

### 8.2 性能優化

- **分頁和虛擬化**: 模組使用了分頁功能，但可以考慮在處理大量數據時使用虛擬化技術，進一步提高性能。
- **懶加載**: 可以考慮使用 React 的懶加載功能，延遲加載不常用的元件，減少初始加載時間。

### 8.3 可訪問性

- **鍵盤導航**: 模組提供了基本的鍵盤導航支持，但可以進一步改進，確保所有功能都可以通過鍵盤訪問。
- **ARIA 屬性**: 可以添加更多的 ARIA 屬性，提高對屏幕閱讀器的支持。
- **顏色對比度**: 確保所有顏色組合都符合 WCAG 2.1 AA 級別的對比度要求。

### 8.4 測試

- **單元測試**: 添加單元測試，確保各個元件和函數的正確性。
- **集成測試**: 添加集成測試，確保元件之間的交互正常。
- **端到端測試**: 添加端到端測試，確保整個模組的功能正常。

### 8.5 文檔

- **元件文檔**: 為每個元件添加詳細的文檔，包括屬性、用法和示例。
- **API 文檔**: 為 API 調用添加詳細的文檔，包括參數、返回值和錯誤處理。
- **使用指南**: 添加使用指南，幫助開發者理解和使用模組。

## 9. 總結

出貨單模組是一個功能完整、結構清晰的 React 模組，採用了現代前端開發最佳實踐，包括元件化設計、狀態管理和共享資源。模組提供了出貨單的創建、編輯、查看、列印和刪除等功能，並支援 CSV 導入功能，以便批量處理出貨單資料。

模組的代碼組織良好，使用了明確的命名導出策略，清晰定義了模組的公共 API。模組還定義了共享的類型、常數和工具函數，減少了代碼重複，提高了代碼的一致性。

模組的性能優化、可訪問性、測試和文檔方面還有改進空間，可以通過添加虛擬化技術、ARIA 屬性、單元測試和詳細文檔來進一步提高模組的質量。

總體而言，出貨單模組是一個高質量的 React 模組，為藥局系統提供了完整的出貨單管理功能。