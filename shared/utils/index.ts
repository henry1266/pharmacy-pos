/**
 * 共享工具函數統一導出
 * 提供前後端共用的工具函數集合
 */

// 角色相關工具函數
export * from './roleUtils';

// 日期處理工具函數
export * from './dateUtils';

// 工時計算工具函數
export * from './workHoursUtils';

// 字串處理工具函數
export * from './stringUtils';

// 數字處理工具函數
export * from './numberUtils';

// 驗證工具函數
export * from './validationUtils';

// 錯誤處理工具函數
export * from './errorUtils';

/**
 * 工具函數分類導出
 * 可以按需導入特定分類的工具函數
 */

// 角色工具函數命名空間
import * as RoleUtils from './roleUtils';
export { RoleUtils };

// 日期工具函數命名空間
import * as DateUtils from './dateUtils';
export { DateUtils };

// 工時工具函數命名空間
import * as WorkHoursUtils from './workHoursUtils';
export { WorkHoursUtils };

// 字串工具函數命名空間
import * as StringUtils from './stringUtils';
export { StringUtils };

// 數字工具函數命名空間
import * as NumberUtils from './numberUtils';
export { NumberUtils };

// 驗證工具函數命名空間
import * as ValidationUtils from './validationUtils';
export { ValidationUtils };

// 錯誤處理工具函數命名空間
import * as ErrorUtils from './errorUtils';
export { ErrorUtils };

/**
 * 版本資訊
 */
export const SHARED_UTILS_VERSION = '1.0.0';

/**
 * 工具函數使用說明
 */
export const USAGE_EXAMPLES = {
  role: {
    description: '角色相關工具函數',
    examples: [
      "import { getRoleDisplayName, UserRole } from 'shared/utils';",
      "const displayName = getRoleDisplayName(UserRole.ADMIN);"
    ]
  },
  date: {
    description: '日期處理工具函數',
    examples: [
      "import { formatTime, addDays } from 'shared/utils';",
      "const formatted = formatTime(new Date(), 'YYYY-MM-DD');",
      "const futureDate = addDays(new Date(), 7);"
    ]
  },
  workHours: {
    description: '工時計算工具函數',
    examples: [
      "import { calculateShiftHours, SHIFT_TIMES } from 'shared/utils';",
      "const hours = calculateShiftHours('morning');"
    ]
  },
  string: {
    description: '字串處理工具函數',
    examples: [
      "import { isBlank, capitalize, formatTaiwanPhone } from 'shared/utils';",
      "const isEmpty = isBlank(userInput);",
      "const formatted = formatTaiwanPhone('0912345678');"
    ]
  },
  number: {
    description: '數字處理工具函數',
    examples: [
      "import { formatCurrency, safeParseNumber } from 'shared/utils';",
      "const price = formatCurrency(1000);",
      "const num = safeParseNumber(userInput, 0);"
    ]
  },
  validation: {
    description: '驗證工具函數',
    examples: [
      "import { validateEmail, validateRequired } from 'shared/utils';",
      "const emailResult = validateEmail(email);",
      "const requiredResult = validateRequired(value, '姓名');"
    ]
  }
};