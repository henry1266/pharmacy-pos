# Shared 模組

這個目錄包含了前後端共用的型別定義和工具函數，旨在提高程式碼重用性並確保型別一致性。

## 目錄結構

```
shared/
├── types/           # 型別定義
│   ├── entities.ts     # 基礎實體型別
│   ├── api.ts          # API 相關型別
│   ├── forms.ts        # 表單相關型別
│   ├── accounting.ts   # 會計相關型別
│   ├── store.ts        # Redux 狀態型別
│   ├── business.ts     # 業務邏輯型別
│   ├── utils.ts        # 工具函數型別
│   └── models.ts       # 資料模型型別
├── utils/           # 工具函數
│   ├── calendarUtils.ts        # 日曆相關工具
│   ├── dataTransformations.ts  # 資料轉換工具
│   ├── overtimeDataProcessor.ts # 加班數據處理
│   ├── roleUtils.ts            # 角色相關工具
│   └── stringUtils.ts          # 字串處理工具
├── index.ts         # 統一匯出檔案
└── README.md        # 說明文件
```

## 使用方式

### 在前端使用

```typescript
// 匯入型別定義
import { Product, Sale, Customer } from '@pharmacy-pos/shared';

// 匯入工具函數
import { formatDate, getRoleName } from '@pharmacy-pos/shared';

// 使用特定模組
import { ActionType, RootState } from '@pharmacy-pos/shared/types/store';
```

### 在後端使用

```typescript
// 匯入型別定義
import { IUser, IProduct, CodeGenerationResult } from '@pharmacy-pos/shared';

// 匯入工具函數
import { validateRole, processOvertimeData } from '@pharmacy-pos/shared';
```

## 型別定義說明

### entities.ts
包含基礎的實體型別定義，如 Product、Customer、Sale 等。

### api.ts
包含 API 請求和回應的型別定義，統一前後端的 API 介面。

### forms.ts
包含各種表單的型別定義，確保表單資料結構的一致性。

### accounting.ts
包含會計相關的型別定義，如記帳項目、會計分類等。

### store.ts
包含 Redux 狀態管理的型別定義，包括 Action 型別和 State 型別。

### business.ts
包含業務邏輯相關的型別定義，如訂單號生成、FIFO 計算等。

### utils.ts
包含工具函數相關的型別定義，如密碼驗證、檔案處理等。

### models.ts
包含資料模型的型別定義，移除了 MongoDB 依賴，適用於前後端。

## 工具函數說明

### calendarUtils.ts
提供日曆相關的工具函數，如日期格式化、員工顏色生成等。

### dataTransformations.ts
提供資料轉換工具，如銷售數據轉換、趨勢分析等。

### overtimeDataProcessor.ts
提供加班數據處理工具，包含複雜的業務邏輯處理。

### roleUtils.ts
提供角色相關的工具函數，如角色名稱轉換、權限檢查等。

### stringUtils.ts
提供字串處理工具函數，如格式化、驗證等。

## 設計原則

1. **環境無關性**: 所有共享程式碼都不依賴特定的執行環境（如 Node.js 或瀏覽器）
2. **型別安全**: 使用 TypeScript 提供完整的型別定義
3. **模組化**: 按功能分類組織程式碼，便於維護和使用
4. **一致性**: 確保前後端使用相同的型別定義和工具函數
5. **可重用性**: 提供通用的工具函數，避免程式碼重複

## 注意事項

1. 避免在 shared 模組中引入特定環境的依賴（如 DOM API 或 Node.js API）
2. 型別定義應該保持向後相容性
3. 新增型別或工具函數時，請更新相應的匯出檔案
4. 確保所有型別都有適當的 JSDoc 註釋

## 版本管理

當修改 shared 模組時，請注意：

1. 破壞性變更需要更新版本號
2. 新增功能應該保持向後相容
3. 修改現有型別時要考慮對前後端的影響
4. 建議使用語義化版本控制

## 測試

建議為工具函數編寫單元測試，確保功能的正確性和穩定性。

```typescript
// 測試範例
import { getRoleName } from '@pharmacy-pos/shared';

describe('getRoleName', () => {
  it('should return correct role name', () => {
    expect(getRoleName('admin')).toBe('管理員');
    expect(getRoleName('pharmacist')).toBe('藥師');
    expect(getRoleName('staff')).toBe('員工');
  });
});