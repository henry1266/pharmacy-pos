/**
 * Shared 模組主要匯出檔案
 * 統一匯出所有共享的型別、常數、工具函數等
 */

// 型別定義
export * from './types/entities';
export * from './types/api';

// 列舉常數
export * from './enums';

// 常數定義
export * from './constants';

// 工具函數 - 明確重新導出以避免型別衝突
export {
  // 字串工具函數
  isBlank,
  isNotBlank,
  safeTrim,
  capitalize,
  camelToKebab,
  kebabToCamel,
  generateRandomString,
  truncate,
  stripHtml,
  escapeHtml,
  unescapeHtml,
  getByteLength,
  isValidEmail,
  isValidTaiwanPhone,
  formatTaiwanPhone,
  maskSensitiveInfo,
  toSlug,
  calculateSimilarity,
  
  // 數字工具函數
  isValidNumber,
  safeParseNumber,
  safeParseInt,
  formatCurrency,
  formatPercentage,
  formatNumber,
  clamp,
  roundToDecimals,
  calculatePercentage,
  calculateAverage,
  calculateSum,
  findMax,
  findMin,
  randomInt,
  randomFloat,
  isEven,
  isOdd,
  isPositive,
  isNegative,
  isZero,
  isEqual,
  toRoman,
  factorial,
  
  // 日期工具函數
  formatDateString,
  formatMonth,
  isToday,
  isWeekend,
  isWorkDay,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  addDays,
  subtractDays,
  getDaysBetween,
  isValidDate,
  parseDate,
  formatTime,
  formatDateTime,
  validateDateRange,
  
  // 驗證工具函數 - 使用別名避免衝突
  ValidationResult,
  ValidationParams,
  ValidationRule as UtilsValidationRule,
  createValidationResult,
  validateRequired,
  validateStringLength,
  validateNumberRange,
  validateEmail,
  validateTaiwanPhone,
  validatePassword,
  validateDateFormat,
  validateUrl,
  validateArrayLength,
  validateObjectKeys,
  validateMultiple,
  createValidationRule,
  
  // 工時工具函數
  ShiftType,
  LeaveType as UtilsLeaveType,
  ShiftTime,
  Employee as UtilsEmployee,
  Schedule,
  HoursData,
  FormattedEmployeeHours,
  SHIFT_TIMES,
  SHIFT_NAMES,
  calculateShiftHours,
  calculateHoursBetween,
  initializeEmployeeHours,
  allocateHoursByLeaveType,
  formatEmployeeHours,
  getLeaveTypeText,
  isValidShiftType,
  isValidLeaveType,
  calculateTotalHours,
  formatHours,
  isValidHours,
  
  // 角色工具函數
  Role as UtilsRole,
  RoleOption,
  getRoleName,
  getRoleColor,
  roleOptions,
  isValidRole,
  getRoleLevel,
  hasPermission,
  
  // 工具函數命名空間
  RoleUtils,
  DateUtils,
  WorkHoursUtils,
  StringUtils,
  NumberUtils,
  ValidationUtils,
  SHARED_UTILS_VERSION,
  USAGE_EXAMPLES
} from './utils';

// Schema 驗證 - 使用別名避免衝突
export {
  ValidationRule as SchemaValidationRule,
  ValidationSchema,
  AuthSchemas,
  ProductSchemas,
  CustomerSchemas,
  SupplierSchemas,
  SaleSchemas,
  PurchaseOrderSchemas,
  ShippingOrderSchemas,
  AccountingSchemas,
  EmployeeSchemas,
  PaginationSchema,
  QuerySchema,
  Schemas,
  SchemaValidator
} from './schemas';

/**
 * 版本資訊
 */
export const SHARED_VERSION = '1.0.0' as const;

/**
 * 模組資訊介面
 */
export interface SharedModuleInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
}

/**
 * 模組資訊
 */
export const SHARED_INFO: SharedModuleInfo = {
  name: 'Pharmacy POS Shared Types',
  version: SHARED_VERSION,
  description: '藥局 POS 系統共享型別定義',
  author: 'Development Team',
  license: 'MIT'
} as const;