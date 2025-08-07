# AccountingDataGrid 工具函數

## 📋 概述

本目錄包含 AccountingDataGrid 使用的工具函數，這些函數提供了各種計算、格式化和數據處理功能。

## 🏗️ 文件說明

### calculations.ts
提供各種計算相關的工具函數，如借貸平衡檢查、總額計算等。

### formatters.ts
提供數據格式化的工具函數，如日期格式化、金額格式化、狀態文本轉換等。

## 🚀 使用方式

### calculations.ts

```tsx
import { isBalanced, calculateTotal } from '@/modules/accounting3/components/ui/AccountingDataGrid/utils/calculations';

// 檢查交易是否平衡
const balanced = isBalanced(transaction);

// 計算總額
const total = calculateTotal(entries);
```

### formatters.ts

```tsx
import { 
  formatDate, 
  formatAmount, 
  getStatusLabel 
} from '@/modules/accounting3/components/ui/AccountingDataGrid/utils/formatters';

// 格式化日期
const formattedDate = formatDate(new Date(), 'yyyy/MM/dd');

// 格式化金額
const formattedAmount = formatAmount(1234.56); // 輸出: "1,234.56"

// 獲取狀態標籤
const statusLabel = getStatusLabel('confirmed'); // 輸出: "已確認"
```

## 🎯 設計原則

1. **純函數**: 工具函數應該是純函數，不依賴外部狀態
2. **單一職責**: 每個函數只負責一個特定功能
3. **可測試性**: 函數設計應易於單元測試
4. **性能優化**: 注重性能，避免不必要的計算

## 🔧 添加新工具函數

如需添加新的工具函數，請遵循以下模板：

```tsx
/**
 * 函數描述
 * 
 * @param param1 - 參數1描述
 * @param param2 - 參數2描述
 * @returns 返回值描述
 * 
 * @example
 * // 使用示例
 * const result = newFunction(param1, param2);
 */
export const newFunction = (param1: Type1, param2: Type2): ReturnType => {
  // 函數實現
  return result;
};
```

## 🧪 測試

工具函數應該有完整的單元測試覆蓋：

```tsx
import { newFunction } from './utils';

describe('newFunction', () => {
  test('should handle normal case', () => {
    expect(newFunction(param1, param2)).toBe(expectedResult);
  });
  
  test('should handle edge cases', () => {
    expect(newFunction(edgeParam1, edgeParam2)).toBe(expectedEdgeResult);
  });
  
  test('should throw error for invalid input', () => {
    expect(() => newFunction(invalidParam)).toThrow();
  });
});
```

---

**最後更新**: 2025-08-07  
**維護者**: 開發團隊