# 前後端型別統一指南

## 概述

本專案實現了前後端型別統一，確保資料結構的一致性和型別安全。

## 架構設計

### 1. 型別層級結構

```
shared/
├── types/
│   ├── entities.ts          # 基礎實體型別（資料庫模型對應）
│   ├── accounting.ts        # 會計業務型別
│   ├── api.ts              # API 介面型別
│   ├── business.ts         # 業務邏輯型別
│   ├── forms.ts            # 表單型別
│   ├── models.ts           # 模型型別
│   ├── store.ts            # 狀態管理型別
│   ├── utils.ts            # 工具型別
│   └── index.ts            # 統一匯出
└── utils/
    └── accountingTypeConverters.ts  # 型別轉換工具
```

### 2. 型別統一原則

#### 基礎型別定義
- **entities.ts**: 定義資料庫實體對應的基礎型別
- **accounting.ts**: 擴展基礎型別，添加前端特定屬性

#### 型別轉換
- 使用 `accountingTypeConverters.ts` 處理前後端資料格式差異
- 自動處理 ObjectId 與 string 之間的轉換
- 提供驗證功能確保資料完整性

## 使用方式

### Frontend 使用

```typescript
// 統一從 shared 匯入
import type { 
  AccountingItem, 
  ExtendedAccountingRecord,
  AccountingFilters 
} from '@pharmacy-pos/shared/types/accounting';

// 或使用統一匯出
import type { AccountingItem } from '@pharmacy-pos/shared/types';
```

### Backend 使用

```typescript
// Backend 模型型別
import type { IAccountingItem } from './types/models';
import type { AccountingItem } from '@pharmacy-pos/shared/types/accounting';

// 使用轉換工具
import { toBackendAccountingItem } from '@pharmacy-pos/shared/utils/accountingTypeConverters';
```

## 型別對應關係

### AccountingItem

| 屬性 | Frontend | Backend | 說明 |
|------|----------|---------|------|
| amount | `number` | `number` | 統一為數字型別 |
| category | `string` | `string` | 類別名稱 |
| categoryId | `string?` | `ObjectId?` | 類別ID，轉換時處理 |
| note | `string?` | `string?` | 備註，統一為選填 |

### AccountingCategory

| 屬性 | Frontend | Backend | 說明 |
|------|----------|---------|------|
| _id | `string` | `ObjectId` | ID 型別轉換 |
| name | `string` | `string` | 類別名稱 |
| isExpense | `boolean` | `boolean` | 是否為支出 |
| order | `number?` | `number` | 排序 |
| createdAt | `Date\|string` | `Date` | 建立時間 |
| updatedAt | `Date\|string` | `Date` | 更新時間 |

## 最佳實踐

### 1. 型別定義
- 基礎型別定義在 `entities.ts`
- 業務特定型別定義在對應的業務檔案中
- 避免重複定義相同的型別

### 2. 資料轉換
- 使用提供的轉換工具進行前後端資料轉換
- 在 API 邊界進行型別轉換
- 驗證資料完整性

### 3. 匯入規範
```typescript
// ✅ 推薦：從 shared 統一匯入
import type { AccountingItem } from '@pharmacy-pos/shared/types/accounting';

// ❌ 避免：從多個來源匯入相同型別
import type { AccountingItem } from '../types/accounting';
```

### 4. 新增型別
1. 在 `shared/types/` 中定義基礎型別
2. 如需前後端差異，使用轉換工具處理
3. 更新 `index.ts` 匯出
4. 更新相關文件

## 型別驗證

使用提供的驗證工具確保資料完整性：

```typescript
import { validateAccountingItem } from '@pharmacy-pos/shared/utils/accountingTypeConverters';

const validation = validateAccountingItem(item);
if (!validation.isValid) {
  console.error('驗證失敗:', validation.errors);
}
```

## 遷移指南

### 從舊架構遷移

1. **刪除重複型別檔案**
   ```bash
   # 刪除 frontend/src/types/accounting.ts
   rm frontend/src/types/accounting.ts
   ```

2. **更新匯入路徑**
   ```typescript
   // 舊的匯入
   import type { AccountingItem } from '../types/accounting';
   
   // 新的匯入
   import type { AccountingItem } from '@pharmacy-pos/shared/types/accounting';
   ```

3. **使用轉換工具**
   ```typescript
   // 在 API 處理中使用轉換
   import { toBackendAccountingItem } from '@pharmacy-pos/shared/utils/accountingTypeConverters';
   
   const backendItem = toBackendAccountingItem(frontendItem);
   ```

## 注意事項

1. **ObjectId 處理**: 前端使用 string，後端使用 ObjectId，需要轉換
2. **日期格式**: 統一使用 ISO 字串格式傳輸，本地轉換為 Date 物件
3. **選填屬性**: 確保前後端對選填屬性的處理一致
4. **驗證邏輯**: 前後端都應進行資料驗證

## 故障排除

### 常見問題

1. **型別衝突**
   - 檢查是否有重複的型別定義
   - 使用明確的型別匯出避免衝突

2. **轉換錯誤**
   - 確保使用正確的轉換工具
   - 檢查資料格式是否符合預期

3. **匯入錯誤**
   - 確認 tsconfig.json 中的路徑設定
   - 檢查 package.json 中的依賴關係

## 未來改進

1. 自動化型別同步檢查
2. 更完善的驗證規則
3. 型別文件自動生成
4. 運行時型別檢查