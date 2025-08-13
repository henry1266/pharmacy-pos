# 會計科目管理模組 (Accounts Module)

## 模組概述

會計科目管理模組是會計系統 (accounting3) 的核心組件之一，負責處理會計科目的創建、編輯、刪除、查詢和管理等功能。此模組提供了完整的科目樹狀結構管理、科目交易查詢、科目統計等功能。

## 目錄結構

```
accounts/
├── components/        # 科目相關組件
├── hooks/             # 科目相關自定義 hooks
├── pages/             # 科目管理頁面
├── services/          # 科目相關 API 服務
├── types/             # 科目相關類型定義
├── utils/             # 科目相關工具函數
└── index.ts           # 模組導出文件
```

## 主要功能

### 科目管理

- **科目創建與編輯**：支持創建新科目和編輯現有科目的信息
- **科目樹狀結構**：支持多層級科目結構，父子科目關係管理
- **科目類型管理**：支持資產、負債、權益、收入、費用、成本等不同類型科目
- **科目代碼管理**：支持科目代碼的自動生成和手動設置

### 科目查詢與篩選

- **科目搜索**：支持按名稱、代碼搜索科目
- **科目篩選**：支持按類型、狀態等條件篩選科目
- **科目排序**：支持按不同條件排序科目列表

### 科目交易管理

- **交易查詢**：查看特定科目的所有交易記錄
- **交易確認**：確認科目相關的交易
- **交易解鎖**：解鎖已確認的交易
- **交易刪除**：刪除科目相關的交易

### 科目統計與報表

- **科目餘額**：顯示科目當前餘額
- **科目統計**：提供科目相關的統計數據
- **月度趨勢**：顯示科目餘額和交易的月度趨勢

## 使用方法

### 導入模組

```tsx
// 導入整個模組
import * as AccountsModule from 'modules/accounting3/accounts';

// 或導入特定組件/hooks
import { useAccountForm } from 'modules/accounting3/accounts/hooks';
import { AccountsManagementPage } from 'modules/accounting3/accounts/pages';
```

### 科目管理頁面

科目管理頁面 (`AccountsManagementPage`) 提供了完整的科目管理界面，包括：

- 科目樹狀結構顯示
- 科目創建、編輯、刪除功能
- 科目交易列表顯示
- 科目搜索和篩選

```tsx
// 在路由中使用
<Route path="/accounting3/accounts" element={<AccountsManagementPage />} />
```

### 使用科目表單 Hook

`useAccountForm` hook 提供了科目表單的狀態管理和驗證功能：

```tsx
const {
  formData,
  errors,
  loading,
  updateField,
  validateForm,
  submitForm,
  resetForm
} = useAccountForm({
  initialData: { /* 初始數據 */ },
  onSuccess: (account) => { /* 成功處理 */ },
  onError: (error) => { /* 錯誤處理 */ }
});
```

## 關鍵組件和 Hooks

### 組件

- **AccountHierarchyManager**：科目階層管理組件，顯示科目樹狀結構
- **AccountForm**：科目創建和編輯表單
- **AccountTransactionList**：科目交易列表
- **AccountsManagementPage**：科目管理頁面

### Hooks

- **useAccountForm**：科目表單管理 hook，處理表單狀態和驗證
- **useAccountStatistics**：科目統計數據 hook，提供科目相關統計信息

## 數據類型

主要數據類型定義在 `types/account.types.ts` 中：

- **Account**：科目基本數據結構
- **AccountType**：科目類型 (資產、負債、權益、收入、費用、成本)
- **AccountTreeNode**：科目樹狀結構節點
- **AccountFormData**：科目表單數據
- **AccountStatistics**：科目統計數據

## 注意事項

1. 科目代碼必須符合規定格式 (2-8位數字)
2. 刪除有餘額的科目可能會影響財務報表的準確性
3. 科目類型決定了科目的借貸方向 (normalBalance)
4. 科目階層最多支持 5 層