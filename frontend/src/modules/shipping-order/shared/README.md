# 出貨單模組 (Shipping Order Module) 共用目錄結構與導出規範

## 目錄結構

```
shipping-order/
├── components/       # 出貨單特定組件
├── pages/            # 頁面組件
└── shared/           # 共用資源
    ├── components.tsx  # 共用 UI 組件
    ├── constants.ts    # 常數定義
    ├── hooks.ts        # 自定義 Hooks
    ├── index.ts        # 主要導出文件
    ├── types.ts        # 類型定義
    ├── utils.ts        # 工具函數
    └── README.md       # 本文檔
```

## 導出規範與最佳實踐

### 當前問題

目前的導出方式混合了兩種策略：
1. 使用 `export * from './xxx'` 導出所有內容
2. 同時又明確地使用 `export { ... } from './xxx'` 導出特定組件、hooks 和工具函數

這種混合導出方式可能導致：
- 命名衝突
- 不清楚哪些是公共 API，哪些是內部實現
- 導入時不知道具體導入了什麼
- 可能導致不必要的代碼被打包

### 推薦的導出策略

我們建議採用以下導出策略，遵循 React 生態系統的最佳實踐：

#### 1. 明確的命名導出 (Named Exports)

`index.ts` 文件應該明確列出所有要導出的項目，而不是使用通配符 `*` 導出。這樣可以：
- 清晰地定義模組的公共 API
- 避免意外導出內部實現細節
- 提高代碼可讀性和可維護性

```typescript
// 推薦的 index.ts 寫法
// 類型導出
export type { 
  Item,
  ShippingOrder,
  ItemsTableProps,
  // 其他需要導出的類型...
} from './types';

// 常數導出
export {
  TABLE_CONFIG,
  FILE_UPLOAD_CONFIG,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  TABLE_LOCALE_TEXT,
  CSV_IMPORT_TABS,
  TABLE_COLUMNS,
  SHIPPING_ORDER_COLUMNS
} from './constants';

// 工具函數導出
export {
  calculateUnitPrice,
  formatAmount,
  validateFileType,
  validateFileSize,
  getLocalizedPaginationText,
  validateItem,
  calculateTotalAmount,
  moveArrayItem,
  deepClone,
  debounce,
  throttle,
  generateUniqueId,
  safeNumber,
  safeString
} from './utils';

// 共用組件導出
export {
  EditableRow,
  DisplayRow,
  ActionButtons,
  FileUpload,
  StatusMessage,
  LoadingButton,
  EmptyState,
  TableHeaderRow,
  StatusChipRenderer,
  PaymentStatusChipRenderer,
  AmountRenderer,
  DateTimeRenderer
} from './components';

// Hooks 導出
export {
  useItemsManagement,
  useCsvImport,
  useTablePagination,
  useTableLoading,
  useTableSelection,
  useTableFilter,
  useTableSort
} from './hooks';
```

#### 2. 分類導出 (Categorized Exports)

對於較大的模組，可以考慮使用分類導出，將相關功能分組：

```typescript
// 另一種組織方式 - 按功能分類
import * as Components from './components';
import * as Hooks from './hooks';
import * as Utils from './utils';
import * as Constants from './constants';
import * as Types from './types';

// 導出分類命名空間
export { Components, Hooks, Utils, Constants };

// 導出常用項目到頂層
export { 
  EditableRow, 
  DisplayRow, 
  ActionButtons 
} from './components';

export { 
  useItemsManagement, 
  useCsvImport 
} from './hooks';

export type { 
  Item, 
  ShippingOrder 
} from './types';
```

#### 3. 桶文件模式 (Barrel Pattern)

對於每個子目錄，建議使用桶文件模式，即在每個目錄中創建一個 `index.ts` 文件，用於導出該目錄中的所有公共 API：

```
shared/
├── components/
│   ├── EditableRow.tsx
│   ├── DisplayRow.tsx
│   └── index.ts  # 導出所有組件
├── hooks/
│   ├── useItemsManagement.ts
│   ├── useCsvImport.ts
│   └── index.ts  # 導出所有 hooks
└── index.ts      # 主要導出文件
```

### 導入最佳實踐

使用上述導出策略後，可以採用以下導入方式：

```typescript
// 導入特定項目
import { EditableRow, DisplayRow } from '../shared';
import { useItemsManagement } from '../shared';

// 導入分類命名空間
import { Components, Hooks } from '../shared';
const { EditableRow } = Components;
const { useItemsManagement } = Hooks;

// 導入類型
import type { Item, ShippingOrder } from '../shared';
```

### 實施建議

1. 重構 `index.ts` 文件，採用明確的命名導出
2. 移除重複的導出聲明
3. 考慮將大文件拆分為更小的單一職責文件
4. 為每個文件添加 JSDoc 註釋，說明其用途和導出內容
5. 確保所有導出的項目都有適當的類型定義

## 結論

採用明確的導出策略可以提高代碼的可讀性、可維護性和可預測性。通過定義清晰的公共 API，我們可以更好地控制模組的使用方式，並避免意外的破壞性變更。