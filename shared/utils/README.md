# 共享工具函數 (Shared Utils)

這個目錄包含了前後端共用的工具函數，提供了一套完整的工具函數庫來處理常見的業務邏輯和數據操作。

## 📁 文件結構

```
shared/utils/
├── index.ts              # 統一導出文件
├── roleUtils.ts          # 角色相關工具函數
├── dateUtils.ts          # 日期處理工具函數
├── workHoursUtils.ts     # 工時計算工具函數
├── stringUtils.ts        # 字串處理工具函數
├── numberUtils.ts        # 數字處理工具函數
├── validationUtils.ts    # 驗證工具函數
└── README.md            # 說明文件
```

## 🚀 使用方式

### 基本導入

```typescript
// 導入所有工具函數
import * as Utils from 'shared/utils';

// 導入特定分類的工具函數
import { RoleUtils, DateUtils, StringUtils } from 'shared/utils';

// 導入特定函數
import { 
  getRoleDisplayName, 
  formatTime, 
  isValidEmail,
  formatCurrency 
} from 'shared/utils';
```

### 按分類導入

```typescript
// 角色相關
import { UserRole, getRoleDisplayName, hasPermission } from 'shared/utils/roleUtils';

// 日期相關
import { formatTime, addDays, getDaysBetween } from 'shared/utils/dateUtils';

// 工時相關
import { calculateShiftHours, SHIFT_TIMES } from 'shared/utils/workHoursUtils';

// 字串相關
import { isBlank, capitalize, formatTaiwanPhone } from 'shared/utils/stringUtils';

// 數字相關
import { formatCurrency, safeParseNumber, clamp } from 'shared/utils/numberUtils';

// 驗證相關
import { validateEmail, validateRequired } from 'shared/utils/validationUtils';
```

## 📚 工具函數分類

### 1. 角色工具函數 (roleUtils.ts)

處理用戶角色相關的邏輯。

```typescript
import { UserRole, getRoleDisplayName, getRoleColor, hasPermission } from 'shared/utils';

// 獲取角色顯示名稱
const displayName = getRoleDisplayName(UserRole.ADMIN); // "管理員"

// 獲取角色顏色
const color = getRoleColor(UserRole.PHARMACIST); // "#10b981"

// 檢查權限
const canManage = hasPermission(UserRole.ADMIN, 'manage_users'); // true
```

**主要功能：**
- 角色類型定義和枚舉
- 角色顯示名稱轉換
- 角色顏色映射
- 權限檢查邏輯

### 2. 日期工具函數 (dateUtils.ts)

處理日期和時間相關的操作。

```typescript
import { formatTime, addDays, getDaysBetween, isValidDate } from 'shared/utils';

// 格式化日期
const formatted = formatTime(new Date(), 'YYYY-MM-DD'); // "2023-12-25"

// 添加天數
const futureDate = addDays(new Date(), 7);

// 計算天數差
const daysDiff = getDaysBetween(startDate, endDate);

// 驗證日期
const isValid = isValidDate(dateString);
```

**主要功能：**
- 日期格式化（多種格式支持）
- 日期計算（加減天數、月份、年份）
- 日期驗證和解析
- 時間範圍計算

### 3. 工時計算工具函數 (workHoursUtils.ts)

處理員工工時計算相關的邏輯。

```typescript
import { 
  calculateShiftHours, 
  SHIFT_TIMES, 
  formatEmployeeHours,
  ShiftType 
} from 'shared/utils';

// 計算班次工時
const morningHours = calculateShiftHours('morning'); // 3.5

// 獲取班次時間
const shiftTime = SHIFT_TIMES.morning; // { start: '08:30', end: '12:00' }

// 格式化員工工時
const formatted = formatEmployeeHours(employeeId, hoursData);
```

**主要功能：**
- 班次工時計算
- 工時數據格式化
- 請假類型處理
- 工時統計和匯總

### 4. 字串工具函數 (stringUtils.ts)

處理字串操作和驗證。

```typescript
import { 
  isBlank, 
  capitalize, 
  formatTaiwanPhone, 
  isValidEmail,
  truncate,
  maskSensitiveInfo 
} from 'shared/utils';

// 檢查空白字串
const isEmpty = isBlank(userInput); // true/false

// 首字母大寫
const capitalized = capitalize('hello world'); // "Hello world"

// 格式化手機號碼
const phone = formatTaiwanPhone('0912345678'); // "0912-345-678"

// 驗證電子郵件
const isValidMail = isValidEmail('user@example.com'); // true

// 截斷字串
const truncated = truncate('很長的文字...', 10); // "很長的文字..."

// 遮罩敏感資訊
const masked = maskSensitiveInfo('1234567890', 2, 2); // "12******90"
```

**主要功能：**
- 字串驗證和檢查
- 格式化和轉換
- 敏感資訊處理
- 字串相似度計算

### 5. 數字工具函數 (numberUtils.ts)

處理數字操作和格式化。

```typescript
import { 
  formatCurrency, 
  safeParseNumber, 
  clamp,
  calculateAverage,
  isValidNumber 
} from 'shared/utils';

// 格式化貨幣
const price = formatCurrency(1000); // "NT$1,000"

// 安全數字轉換
const num = safeParseNumber(userInput, 0);

// 數字範圍限制
const clamped = clamp(value, 0, 100);

// 計算平均值
const avg = calculateAverage([1, 2, 3, 4, 5]); // 3

// 驗證數字
const isValid = isValidNumber(value);
```

**主要功能：**
- 數字格式化（貨幣、百分比、千分位）
- 安全數字轉換
- 數學計算（平均值、總和、最大最小值）
- 數字驗證和範圍限制

### 6. 驗證工具函數 (validationUtils.ts)

提供完整的數據驗證功能。

```typescript
import { 
  validateRequired, 
  validateEmail, 
  validatePassword,
  validateMultiple,
  createValidationRule 
} from 'shared/utils';

// 必填驗證
const requiredResult = validateRequired(value, '姓名');

// 電子郵件驗證
const emailResult = validateEmail(email);

// 密碼強度驗證
const passwordResult = validatePassword(password, {
  minLength: 8,
  requireUppercase: true,
  requireNumbers: true
});

// 批量驗證
const rules = [
  createValidationRule('name', name, [
    { type: 'required', message: '姓名為必填' }
  ]),
  createValidationRule('email', email, [
    { type: 'email', message: '電子郵件格式不正確' }
  ])
];

const result = validateMultiple(rules);
```

**主要功能：**
- 基本驗證（必填、長度、範圍）
- 格式驗證（電子郵件、手機、URL）
- 密碼強度驗證
- 批量驗證支持

## 🔧 開發指南

### 添加新的工具函數

1. **選擇合適的分類文件**：根據功能選擇對應的 `*Utils.ts` 文件
2. **編寫純函數**：確保函數無副作用，便於測試和復用
3. **添加 TypeScript 類型**：為參數和返回值添加明確的類型定義
4. **編寫 JSDoc 註釋**：提供清晰的函數說明和使用示例
5. **更新導出**：在對應文件和 `index.ts` 中添加導出

### 示例：添加新的字串工具函數

```typescript
// 在 stringUtils.ts 中添加
/**
 * 將字串轉換為標題格式
 * @param str - 要轉換的字串
 * @returns 標題格式的字串
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// 在 index.ts 中會自動導出（因為使用了 export * from './stringUtils'）
```

### 最佳實踐

1. **保持函數純淨**：避免副作用，使函數可預測和可測試
2. **明確的類型定義**：使用 TypeScript 提供完整的類型安全
3. **一致的命名規範**：使用清晰、描述性的函數名稱
4. **完整的錯誤處理**：對異常情況提供合理的默認值或錯誤處理
5. **詳細的文檔**：為每個函數提供清晰的 JSDoc 註釋

## 🧪 測試

建議為每個工具函數編寫單元測試：

```typescript
// 示例測試
describe('stringUtils', () => {
  test('isBlank should return true for empty string', () => {
    expect(isBlank('')).toBe(true);
    expect(isBlank('   ')).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
  });

  test('capitalize should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('WORLD')).toBe('World');
  });
});
```

## 📝 版本歷史

- **v1.0.0** - 初始版本，包含基本的工具函數分類
  - 角色管理工具函數
  - 日期處理工具函數
  - 工時計算工具函數
  - 字串處理工具函數
  - 數字處理工具函數
  - 驗證工具函數

## 🤝 貢獻指南

1. 確保新增的函數是純函數，無副作用
2. 添加完整的 TypeScript 類型定義
3. 編寫清晰的 JSDoc 註釋
4. 在適當的分類文件中添加函數
5. 更新此 README 文件的相關部分
6. 編寫對應的單元測試

---

這個工具函數庫旨在提高代碼復用性，減少重複代碼，並確保前後端邏輯的一致性。如有任何問題或建議，請隨時提出。