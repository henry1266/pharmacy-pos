# Accounting3 AccountingDataGrid 組件

## 📋 概述

AccountingDataGrid 是一個專為會計交易數據設計的高性能數據表格組件。它提供了豐富的功能，包括分頁、篩選、排序和自定義操作按鈕，專門用於顯示和管理會計交易數據。

## 🏗️ 架構設計

```
AccountingDataGrid/
├── AccountingDataGrid.tsx     # 主組件
├── index.ts                   # 導出
├── types.ts                   # 型別定義
├── README.md                  # 本文件
├── components/                # 子組件
│   ├── FundingStatus.tsx      # 資金狀態組件
│   ├── LoadingSkeleton.tsx    # 載入骨架屏
│   ├── StatusChip.tsx         # 狀態標籤
│   └── TransactionFlow.tsx    # 交易流程圖
├── config/                    # 配置
│   └── columns.tsx            # 列定義配置
├── hooks/                     # 自定義 Hooks
│   └── useDebounce.ts         # 防抖 Hook
└── utils/                     # 工具函數
    ├── calculations.ts        # 計算相關工具
    └── formatters.ts          # 格式化工具
```

## 🎯 主要特性

- **高性能數據處理**: 優化的渲染和數據處理，支援大量交易數據
- **服務端分頁**: 支援後端分頁，減少前端負擔
- **靈活的篩選系統**: 日期範圍、狀態、關鍵字等多維度篩選
- **自適應佈局**: 響應式設計，適配不同屏幕尺寸
- **自定義操作按鈕**: 根據交易狀態動態顯示不同操作選項
- **優化的載入體驗**: 專業的骨架屏載入效果
- **本地化支援**: 完整的中文介面

## 🚀 使用方式

### 基本使用

```tsx
import { AccountingDataGrid } from '@/modules/accounting3/components/ui';

const TransactionPage = () => {
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25
  });
  
  return (
    <AccountingDataGrid
      organizationId="org123"
      showFilters={true}
      searchTerm=""
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onView={handleView}
      onDelete={handleDelete}
      onConfirm={handleConfirm}
      onUnlock={handleUnlock}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
    />
  );
};
```

### 自定義篩選器

```tsx
const TransactionPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div>
      <TextField
        label="搜尋交易"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <AccountingDataGrid
        searchTerm={searchTerm}
        showFilters={true}
        // 其他屬性...
      />
    </div>
  );
};
```

## 📊 Props API

| 屬性名 | 類型 | 必填 | 預設值 | 描述 |
|--------|------|------|--------|------|
| `organizationId` | `string` | 否 | - | 組織 ID，用於篩選特定組織的交易 |
| `showFilters` | `boolean` | 否 | `false` | 是否顯示篩選面板 |
| `searchTerm` | `string` | 否 | `''` | 搜尋關鍵字 |
| `onCreateNew` | `() => void` | 否 | - | 創建新交易的回調函數 |
| `onEdit` | `(transaction: TransactionGroupWithEntries) => void` | 否 | - | 編輯交易的回調函數 |
| `onView` | `(transaction: TransactionGroupWithEntries) => void` | 否 | - | 查看交易詳情的回調函數 |
| `onCopy` | `(transaction: TransactionGroupWithEntries) => void` | 否 | - | 複製交易的回調函數 |
| `onDelete` | `(id: string) => void` | 否 | - | 刪除交易的回調函數 |
| `onConfirm` | `(id: string) => void` | 否 | - | 確認交易的回調函數 |
| `onUnlock` | `(id: string) => void` | 否 | - | 解鎖交易的回調函數 |
| `paginationModel` | `{ page: number; pageSize: number }` | 否 | `{ page: 0, pageSize: 25 }` | 分頁模型 |
| `setPaginationModel` | `(model: { page: number; pageSize: number }) => void` | 否 | - | 更新分頁模型的回調函數 |

## 🎨 設計原則

### 1. 高性能優先

AccountingDataGrid 採用多種優化技術確保高性能：

- 使用 `useMemo` 和 `useCallback` 減少不必要的重新渲染
- 實現虛擬滾動，只渲染可見區域的行
- 使用防抖處理搜索輸入，減少不必要的 API 請求
- 使用 ref 追蹤請求參數，避免重複請求

```tsx
// 使用 useMemo 優化行數據
const rows = useMemo(() => transactionGroups.map(group => ({
  ...group,
  id: group._id,
})), [transactionGroups]);

// 使用 useCallback 記憶化事件處理函數
const handleFilterChange = useCallback((field, value) => {
  // 處理邏輯
}, [dependencies]);
```

### 2. 用戶體驗優化

- 提供骨架屏載入效果，減少用戶等待感
- 實現響應式設計，適配不同屏幕尺寸
- 提供清晰的錯誤處理和重試機制
- 支援鍵盤導航和無障礙功能

### 3. 可擴展性設計

- 使用配置驅動的列定義，便於擴展和自定義
- 提供豐富的回調函數，支援外部控制和集成
- 模塊化的子組件設計，便於維護和擴展

## 🔧 子組件說明

### 1. StatusChip

顯示交易狀態的標籤組件，根據不同狀態顯示不同顏色。

```tsx
<StatusChip status="confirmed" />  // 顯示藍色「已確認」標籤
<StatusChip status="draft" />      // 顯示灰色「草稿」標籤
```

### 2. TransactionFlow

視覺化顯示交易資金流向的組件。

```tsx
<TransactionFlow 
  sourceAccount="現金"
  targetAccount="銷售收入"
  amount={1000}
/>
```

### 3. FundingStatus

顯示資金狀態的組件，包括可用餘額、已使用金額等。

```tsx
<FundingStatus 
  availableAmount={5000}
  usedAmount={3000}
  totalAmount={8000}
/>
```

### 4. LoadingSkeleton

數據載入時顯示的骨架屏組件。

```tsx
{loading && <LoadingSkeleton />}
```

## 📊 性能優化

### 1. 防抖搜索

使用 `useDebounce` Hook 處理搜索輸入，減少 API 請求頻率。

```tsx
// 在 hooks/useDebounce.ts 中
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 在組件中使用
const debouncedSearch = useDebounce(searchTerm, 500);
```

### 2. 請求優化

使用 ref 追蹤上一次的請求參數，避免重複請求。

```tsx
// 使用ref來追蹤上一次的請求參數
const prevParamsRef = useRef<string>('');

useEffect(() => {
  const params = { /* 請求參數 */ };
  const currentParams = JSON.stringify(params);
  
  // 只有當參數變化時才發送請求
  if (prevParamsRef.current !== currentParams) {
    prevParamsRef.current = currentParams;
    dispatch(fetchTransactionGroupsWithEntries(params));
  }
}, [dependencies]);
```

### 3. 虛擬化渲染

使用 DataGrid 的虛擬滾動功能，只渲染可見區域的行。

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  rowBuffer={10}  // 優化虛擬滾動，減少預渲染的行數
  // 其他配置...
/>
```

## 🧪 測試策略

### 1. 單元測試

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountingDataGrid } from './AccountingDataGrid';

describe('AccountingDataGrid', () => {
  test('should render empty state when no transactions', () => {
    // 測試代碼
  });
  
  test('should call onCreateNew when create button is clicked', () => {
    // 測試代碼
  });
  
  // 更多測試...
});
```

### 2. 整合測試

```tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { AccountingDataGrid } from './AccountingDataGrid';

describe('AccountingDataGrid Integration', () => {
  test('should fetch and display transactions', async () => {
    // 測試代碼
  });
  
  // 更多測試...
});
```

## 🎯 最佳實踐

### 1. 使用時機

- 當需要顯示和管理大量會計交易數據時
- 需要提供豐富的篩選和操作功能時
- 需要服務端分頁支援時

### 2. 避免的做法

- 不要在同一頁面使用多個 AccountingDataGrid 實例，可能導致性能問題
- 避免頻繁切換 organizationId，會觸發不必要的數據重載
- 不要直接修改 transactionGroups Redux 狀態，應通過 dispatch action 更新

### 3. 性能考量

- 對於大量數據，考慮增加 pageSize 並減少頁面切換
- 使用 showFilters 控制篩選面板的顯示，減少不必要的渲染
- 確保所有回調函數都使用 useCallback 包裹，避免不必要的重新渲染

## 🔄 維護指南

### 1. 添加新列

在 `config/columns.tsx` 中添加新列定義：

```tsx
// 在 createColumns 函數中添加新列
export const createColumns = (callbacks) => [
  // 現有列...
  
  // 添加新列
  {
    field: 'newField',
    headerName: '新欄位',
    width: 150,
    renderCell: (params) => (
      <div>{params.row.newField}</div>
    )
  }
];
```

### 2. 添加新篩選器

在 AccountingDataGrid.tsx 中擴展 FilterOptions 介面和篩選邏輯：

```tsx
// 擴展 FilterOptions 介面
interface FilterOptions {
  // 現有屬性...
  newFilter: string;
}

// 在 useEffect 中添加新篩選邏輯
useEffect(() => {
  const params: any = {
    // 現有參數...
  };
  
  if (filter.newFilter) params.newFilter = filter.newFilter;
  
  dispatch(fetchTransactionGroupsWithEntries(params) as any);
}, [
  // 現有依賴...
  filter.newFilter
]);
```

---

**最後更新**: 2025-08-07  
**維護者**: 開發團隊