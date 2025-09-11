# Sale 模組

本模組實現了銷售管理相關功能，包括銷售列表、詳情、編輯和新增等功能。此模組也作為專案中模組化結構的標準參考實現。

## 功能概述

- 銷售列表管理
- 銷售詳情查看
- 銷售記錄編輯
- 新增銷售記錄

## 目錄結構

```
sale/
├── api/                    # API 相關文件
│   ├── client.ts           # API 客戶端配置
│   ├── dto.ts              # 資料傳輸物件定義
│   └── saleApi.ts          # 銷售 API 請求函數
├── components/             # UI 組件
│   ├── MobileFabButton.tsx         # 行動裝置浮動按鈕
│   ├── MobileSalesDrawer.tsx       # 行動裝置銷售抽屜
│   ├── SalesInputPanel.tsx         # 銷售輸入面板
│   ├── ShortcutButtonSection.tsx   # 快捷按鈕區域
│   ├── detail/             # 詳情頁面相關組件
│   │   ├── CustomContentRenderer.tsx  # 自定義內容渲染器
│   │   ├── DetailIconRenderer.tsx     # 詳情圖標渲染器
│   │   ├── MainContent.tsx            # 主要內容
│   │   ├── SaleInfoSidebar.tsx        # 銷售信息側邊欄
│   │   ├── SalesItemRow.tsx           # 銷售項目行
│   │   └── SalesItemsTable.tsx        # 銷售項目表格
│   ├── edit/               # 編輯頁面相關組件
│   │   ├── ErrorState.tsx             # 錯誤狀態
│   │   ├── HeaderSection.tsx          # 頁頭區域
│   │   ├── LoadingState.tsx           # 載入狀態
│   │   ├── NotificationSnackbar.tsx   # 通知提示條
│   │   ├── SaleEditDetailsCard.tsx    # 銷售編輯詳情卡片
│   │   ├── SaleEditInfoCard.tsx       # 銷售編輯信息卡片
│   │   ├── SalesEditItemsTable.tsx    # 銷售編輯項目表格
│   │   └── index.ts                   # 導出文件
│   └── list/               # 列表頁面相關組件
│       ├── ActionButtons.tsx          # 操作按鈕
│       ├── DeleteConfirmDialog.tsx    # 刪除確認對話框
│       ├── HeaderSection.tsx          # 頁頭區域
│       ├── LoadingSkeleton.tsx        # 載入骨架屏
│       ├── NotificationSnackbar.tsx   # 通知提示條
│       ├── SalesPreviewPopover.tsx    # 銷售預覽彈出框
│       ├── SalesTable.tsx             # 銷售表格
│       ├── SearchBar.tsx              # 搜索欄
│       └── index.ts                   # 導出文件
├── hooks/                  # 自定義 React Hooks
│   ├── useSaleEdit.ts              # 銷售編輯 Hook
│   ├── useSaleEditManagement.ts    # 銷售編輯管理 Hook
│   ├── useSalesEditData.ts         # 銷售編輯數據 Hook
│   └── useSalesList.ts             # 銷售列表 Hook
├── model/                  # 狀態管理
│   └── saleSlice.ts               # 銷售 Redux Slice
├── pages/                  # 頁面組件
│   ├── SalesDetailPage.tsx        # 銷售詳情頁面
│   ├── SalesEditPage.tsx          # 銷售編輯頁面
│   ├── SalesListPage.tsx          # 銷售列表頁面
│   └── SalesNew2Page.tsx          # 銷售新增頁面
├── types/                  # TypeScript 類型定義
│   ├── detail.ts                  # 詳情頁面相關類型
│   ├── edit.ts                    # 編輯頁面相關類型
│   ├── index.ts                   # 類型導出
│   └── list.ts                    # 列表頁面相關類型
└── utils/                  # 工具函數
    ├── editUtils.ts               # 編輯相關工具函數
    ├── fifoUtils.ts               # FIFO 相關工具函數
    ├── listUtils.ts               # 列表相關工具函數
    ├── paymentUtils.ts            # 支付相關工具函數
    └── shortcutUtils.ts           # 快捷鍵相關工具函數
```

## 使用指南

### 頁面路由

- 列表頁面: `/sales`
- 詳情頁面: `/sales/:id`
- 編輯頁面: `/sales/:id/edit`
- 新增頁面: `/sales/new`

### 主要組件

- **SalesTable**: 顯示銷售記錄列表
- **SalesItemsTable**: 顯示單個銷售的項目列表
- **SaleEditInfoCard**: 編輯銷售基本信息
- **SaleEditDetailsCard**: 編輯銷售詳細信息

### 狀態管理

本模組使用 Redux Toolkit 進行狀態管理，主要 slice 為 `saleSlice.ts`。

### API 調用

所有 API 請求都集中在 `api/saleApi.ts` 中，使用統一的錯誤處理和響應轉換。

## 開發指南

### 添加新功能

1. 確定功能所屬的頁面類型（列表、詳情、編輯等）
2. 在相應的 components/ 子目錄中創建新組件
3. 如需新的 API 請求，在 api/saleApi.ts 中添加
4. 如需新的狀態管理，在 model/saleSlice.ts 中添加
5. 更新相應的類型定義

### 修改現有功能

1. 找到相關組件和功能
2. 確保修改符合現有的代碼風格和模式
3. 更新相關的類型定義和文檔

## 最佳實踐

- 保持組件的單一職責
- 使用 TypeScript 類型確保類型安全
- 遵循 Redux 最佳實踐
- 使用 hooks 封裝業務邏輯
- 保持 UI 組件的純粹性