# 前端模組標準結構指南

本文檔描述了我們專案中前端模組的標準資料夾結構，以 `sale` 模組為範例。所有新模組應遵循此結構，以確保程式碼的一致性和可維護性。

## 標準模組結構

以下是基於 `sale` 模組的標準資料夾結構：

```
modules/[模組名稱]/
├── api/                    # API 相關文件
│   ├── client.ts           # API 客戶端配置
│   ├── dto.ts              # 資料傳輸物件定義
│   └── [模組名稱]Api.ts     # API 請求函數
├── components/             # UI 組件
│   ├── [共用組件].tsx       # 模組內共用組件
│   ├── detail/             # 詳情頁面相關組件
│   ├── edit/               # 編輯頁面相關組件
│   └── list/               # 列表頁面相關組件
├── hooks/                  # 自定義 React Hooks
│   └── use[功能名稱].ts     # 特定功能的 Hook
├── model/                  # 狀態管理
│   └── [模組名稱]Slice.ts   # Redux Toolkit Slice
├── pages/                  # 頁面組件
│   └── [模組名稱][頁面類型]Page.tsx  # 頁面組件
├── types/                  # TypeScript 類型定義
│   ├── index.ts            # 匯出所有類型
│   ├── detail.ts           # 詳情頁面相關類型
│   ├── edit.ts             # 編輯頁面相關類型
│   └── list.ts             # 列表頁面相關類型
└── utils/                  # 工具函數
    └── [功能]Utils.ts      # 特定功能的工具函數
```

## 各資料夾用途說明

### api/

包含與後端 API 通信相關的所有文件：

- **client.ts**: 配置 API 客戶端，如 Axios 實例等
- **dto.ts**: 定義資料傳輸物件 (Data Transfer Objects)，用於請求和響應的類型
- **[模組名稱]Api.ts**: 包含所有 API 請求函數

### components/

包含模組內所有 UI 組件，按功能或頁面類型組織：

- **根目錄**: 放置模組內共用組件
- **detail/**: 詳情頁面相關組件
- **edit/**: 編輯頁面相關組件
- **list/**: 列表頁面相關組件

每個子目錄應包含該頁面類型的所有相關組件，如表格、表單、卡片等。

### hooks/

包含模組特定的自定義 React Hooks：

- **use[功能名稱].ts**: 例如 `useSaleEdit.ts`、`useSalesList.ts` 等

這些 Hooks 封裝了特定功能的邏輯，使組件保持簡潔。

### model/

包含狀態管理相關文件：

- **[模組名稱]Slice.ts**: Redux Toolkit Slice 定義，包含狀態、reducers 和 actions

### pages/

包含模組的頁面級組件：

- **[模組名稱][頁面類型]Page.tsx**: 例如 `SalesListPage.tsx`、`SalesEditPage.tsx` 等

頁面組件應該主要負責組合其他組件和處理頁面級邏輯。

### types/

包含模組內所有 TypeScript 類型定義：

- **index.ts**: 匯出所有類型，方便引入
- **detail.ts**, **edit.ts**, **list.ts** 等: 按功能或頁面類型組織類型定義

### utils/

包含模組特定的工具函數：

- **[功能]Utils.ts**: 例如 `editUtils.ts`、`listUtils.ts` 等

## 最佳實踐

1. **關注點分離**: 每個文件應該有明確的職責，避免過大的文件
2. **命名一致性**: 遵循統一的命名規範（如 camelCase 或 PascalCase）
3. **類型安全**: 充分利用 TypeScript 類型系統，確保類型安全
4. **組件拆分**: 將大型組件拆分為更小、更可重用的組件
5. **狀態管理**: 使用 Redux Toolkit 進行狀態管理，遵循其最佳實踐
6. **路徑引用**: 使用相對路徑或路徑別名，保持引用的一致性

## 新模組創建指南

創建新模組時，請遵循以下步驟：

1. 在 `src/modules` 下創建新的模組目錄
2. 按照上述標準結構創建必要的子目錄
3. 實現必要的文件，參考 `sale` 模組的實現方式
4. 確保新模組與現有系統正確集成

## 範例：sale 模組

`sale` 模組是我們的標準參考實現，包含完整的銷售管理功能：

- 銷售列表頁面
- 銷售詳情頁面
- 銷售編輯頁面
- 新增銷售頁面

新模組開發時，請參考 `sale` 模組的實現方式，確保結構和風格的一致性。