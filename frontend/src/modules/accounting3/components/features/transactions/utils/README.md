# Transaction Utils

交易功能相關的工具函數集合，提供格式化、驗證和資料處理的通用功能。

## 📁 檔案結構

```
utils/
├── README.md              # 本說明文件
├── index.ts              # 統一導出
└── transactionUtils.ts   # 交易工具函數
```

## 🎯 功能概述

此模組提供交易相關的工具函數，包含金額格式化、日期處理、狀態管理、ID 驗證等常用功能，確保整個交易系統的資料一致性和使用者體驗。

## 🛠️ 工具函數說明

### 格式化函數

#### formatAmount
格式化金額為台幣格式。

```typescript
import { formatAmount } from './utils';

const amount = 12345;
const formatted = formatAmount(amount); // "NT$12,345"
```

**特色:**
- 使用台灣地區格式 (`zh-TW`)
- 自動添加貨幣符號 (TWD)
- 整數顯示（無小數點）
- 千分位分隔符

#### formatDate / formatDateOnly
格式化日期為 `yyyy/MM/dd` 格式。

```typescript
import { formatDate, formatDateOnly } from './utils';

const date = new Date('2024-01-15');
const formatted = formatDate(date); // "2024/01/15"
const dateOnly = formatDateOnly('2024-01-15T10:30:00Z'); // "2024/01/15"
```

**特色:**
- 支援 `Date` 物件和字串輸入
- 使用繁體中文地區設定
- 統一的日期格式
- 時區安全處理

### 狀態管理函數

#### getStatusInfo
獲取交易狀態的顯示資訊。

```typescript
import { getStatusInfo } from './utils';

const statusInfo = getStatusInfo('confirmed');
// 返回: { label: '已確認', color: 'success' }

const pendingInfo = getStatusInfo('pending');
// 返回: { label: '待處理', color: 'warning' }
```

**狀態對應:**
- `confirmed` → `success` (綠色)
- `cancelled` → `error` (紅色)
- 其他狀態 → `warning` (橙色)

#### getFundingTypeInfo
獲取資金類型的顯示資訊。

```typescript
import { getFundingTypeInfo } from './utils';

const fundingInfo = getFundingTypeInfo('cash');
// 返回: { label: '現金', color: '#4CAF50' }
```

**功能:**
- 從 `FUNDING_TYPES_3` 常數中查找對應資訊
- 提供標籤和顏色資訊
- 支援自定義資金類型

### ID 處理函數

#### extractObjectId
從各種格式中提取 MongoDB ObjectId。

```typescript
import { extractObjectId } from './utils';

// 處理不同格式的 ID
const id1 = extractObjectId('507f1f77bcf86cd799439011'); // 直接字串
const id2 = extractObjectId({ $oid: '507f1f77bcf86cd799439011' }); // MongoDB 格式
const id3 = extractObjectId({ _id: '507f1f77bcf86cd799439011' }); // 物件格式
```

**支援格式:**
- 直接字串 ID
- MongoDB ObjectId 格式: `{ $oid: "id" }`
- 物件格式: `{ _id: "id" }`
- Mongoose ObjectId (支援 `toHexString()`)
- 具有 `toString()` 方法的物件

**錯誤處理:**
- 自動偵測無效格式
- 詳細的錯誤日誌
- 安全的回退機制

#### isValidObjectId
驗證 ObjectId 格式是否正確。

```typescript
import { isValidObjectId } from './utils';

const valid = isValidObjectId('507f1f77bcf86cd799439011'); // true
const invalid = isValidObjectId('invalid-id'); // false
```

**驗證規則:**
- 必須是 24 個字符
- 只能包含十六進制字符 (0-9, a-f, A-F)
- 符合 MongoDB ObjectId 標準

#### cleanAndValidateTransactionId
清理和驗證交易 ID，提供詳細的處理結果。

```typescript
import { cleanAndValidateTransactionId } from './utils';

const result = cleanAndValidateTransactionId(transactionId);
// 返回: { cleanId: string, isValid: boolean, error?: string }

if (result.isValid) {
  // 使用 result.cleanId
} else {
  console.error(result.error);
}
```

**處理流程:**
1. 檢查輸入有效性
2. 處理物件類型 ID
3. 提取實際 ID 值
4. 驗證 ID 格式
5. 返回處理結果

**返回值:**
```typescript
interface CleanValidateResult {
  cleanId: string;      // 清理後的 ID
  isValid: boolean;     // 是否有效
  error?: string;       // 錯誤訊息（如果有）
}
```

## 🎨 使用範例

### 完整的交易資料格式化
```typescript
import {
  formatAmount,
  formatDate,
  getStatusInfo,
  getFundingTypeInfo,
  extractObjectId
} from './utils';

const formatTransactionData = (transaction: any) => {
  return {
    id: extractObjectId(transaction._id),
    amount: formatAmount(transaction.amount),
    date: formatDate(transaction.createdAt),
    status: getStatusInfo(transaction.status),
    fundingType: getFundingTypeInfo(transaction.fundingType)
  };
};
```

### 安全的 ID 處理
```typescript
import { cleanAndValidateTransactionId } from './utils';

const handleTransactionId = (rawId: any) => {
  const { cleanId, isValid, error } = cleanAndValidateTransactionId(rawId);
  
  if (!isValid) {
    throw new Error(`無效的交易ID: ${error}`);
  }
  
  return cleanId;
};
```

### 狀態顯示組件
```typescript
import { getStatusInfo } from './utils';

const StatusChip = ({ status }: { status: string }) => {
  const { label, color } = getStatusInfo(status);
  
  return (
    <Chip 
      label={label} 
      color={color as any}
      variant="outlined"
    />
  );
};
```

## 🔧 依賴項目

### 外部依賴
- `date-fns` - 日期格式化
- `date-fns/locale` - 繁體中文地區設定

### 內部依賴
- `@pharmacy-pos/shared/types/accounting3` - 交易狀態和資金類型常數

## 📊 性能考量

### 記憶化建議
對於頻繁調用的格式化函數，建議使用記憶化：

```typescript
import { useMemo } from 'react';
import { formatAmount, formatDate } from './utils';

const TransactionItem = ({ transaction }) => {
  const formattedAmount = useMemo(
    () => formatAmount(transaction.amount),
    [transaction.amount]
  );
  
  const formattedDate = useMemo(
    () => formatDate(transaction.createdAt),
    [transaction.createdAt]
  );
  
  return (
    <div>
      <span>{formattedAmount}</span>
      <span>{formattedDate}</span>
    </div>
  );
};
```

### 批量處理
對於大量資料的格式化，考慮批量處理：

```typescript
const formatTransactionList = (transactions: Transaction[]) => {
  return transactions.map(transaction => ({
    ...transaction,
    formattedAmount: formatAmount(transaction.amount),
    formattedDate: formatDate(transaction.createdAt),
    statusInfo: getStatusInfo(transaction.status)
  }));
};
```

## ⚠️ 注意事項

### ID 處理
1. **類型檢查**: 始終驗證 ID 格式再使用
2. **錯誤處理**: 妥善處理無效 ID 的情況
3. **日誌記錄**: 保留詳細的處理日誌以便除錯

### 格式化
1. **地區設定**: 確保使用正確的地區設定
2. **空值處理**: 檢查輸入值是否為空
3. **類型安全**: 使用 TypeScript 確保類型正確

### 狀態管理
1. **常數同步**: 確保狀態常數與後端一致
2. **預設值**: 為未知狀態提供合理的預設值
3. **向後相容**: 考慮新增狀態時的向後相容性

## 🚀 未來擴展

- 支援多語言格式化
- 增加更多日期格式選項
- 擴展狀態類型支援
- 添加資料驗證函數
- 支援自定義格式化規則
- 增加單元測試覆蓋率

## 🧪 測試建議

```typescript
// 測試格式化函數
describe('formatAmount', () => {
  it('should format positive amounts correctly', () => {
    expect(formatAmount(12345)).toBe('NT$12,345');
  });
  
  it('should handle zero amount', () => {
    expect(formatAmount(0)).toBe('NT$0');
  });
});

// 測試 ID 驗證
describe('isValidObjectId', () => {
  it('should validate correct ObjectId', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });
  
  it('should reject invalid ObjectId', () => {
    expect(isValidObjectId('invalid')).toBe(false);
  });
});