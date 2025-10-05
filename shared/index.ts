/**
 * Shared 模組主要匯出檔案
 * 統一匯出所有共享的型別、常數、工具函數等
 */

// 型別定義
export * from './types/entities';
export * from './types/api';
export * from './types/theme';

// 從 accounting2 明確匯出，避免與 api.ts 的型別衝突
export {
  // 核心介面
  Account2,
  Category2,
  AccountingRecord2,
  TransactionGroup,
  AccountingEntry,
  
  // 內嵌分錄相關介面
  EmbeddedAccountingEntry,
  TransactionGroupWithEntries,
  ReferencedByInfo,
  
  // 表單資料介面
  Account2FormData,
  TransactionGroupFormData,
  AccountingEntryFormData,
  Category2FormData,
  AccountingRecord2FormData,
  EmbeddedAccountingEntryFormData,
  TransactionGroupWithEntriesFormData,
  
  // API 回應介面 - 使用別名避免衝突
  Account2ListResponse,
  Account2DetailResponse,
  Category2ListResponse,
  Category2DetailResponse,
  AccountingRecord2ListResponse,
  AccountingRecord2DetailResponse,
  AccountingRecord2SummaryResponse,
  TransactionGroupListResponse,
  TransactionGroupDetailResponse,
  TransactionGroupWithEntriesListResponse,
  TransactionGroupWithEntriesDetailResponse,
  AccountingEntryListResponse,
  AccountingEntryDetailResponse,
  DebitCreditBalanceResponse,
  FundingTrackingResponse,
  FundingFlowResponse,
  EmbeddedEntriesValidationResponse,
  
  // 過濾器介面
  AccountingRecord2Filter,
  TransactionGroupFilter,
  AccountingEntryFilter,
  Account2Filter,
  
  // 其他工具介面
  AccountBalance,
  CategoryReorderItem,
  
  // 資金來源追蹤相關介面
  FundingSource,
  FundingSourcesResponse,
  FundingFlowTransaction,
  FundingFlowData,
  FundingValidationResult,
  FundingValidationData,
  FundingValidationResponse,
  FundingSourceEntriesResponse,
  FundingPathLevel,
  FundingPathEntriesResponse,
  
  // 常數
  ACCOUNT_TYPES_V2,
  ACCOUNT_TYPES,
  NORMAL_BALANCE_TYPES,
  TRANSACTION_STATUS,
  FUNDING_TYPES,
  RECORD_TYPES,
  CATEGORY_TYPES,
  CURRENCIES,
  
  // 型別別名
  FundingType,
  TransactionStatus
} from './types/accounting2';

// 列舉常數
export * from './enums';

// 常數定義 - 包含 ActionTypes
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
  canAccessResource,
  
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

// 交易相關工具函數 - 新增的共用邏輯
export {
  TransactionValidator
} from './utils/transactionValidation';

export {
  TransactionDataConverter
} from './utils/transactionDataConverter';

export {
  TransactionStatusManager
} from './utils/transactionStatus';

// 顏色工具函數
export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  lightenColor,
  darkenColor,
  adjustSaturation,
  adjustHue,
  getLuminance,
  getContrastRatio,
  getContrastText,
  generateColorPalette,
  generateThemePalette,
  isValidHexColor,
  normalizeHexColor
} from './utils/colorUtils';

// 服務層 - API 客戶端
export {
  AccountingApiClient,
  createAccountingApiClient,
  HttpClient,
  handleApiError,
  formatDateForApi,
  buildQueryParams
} from './services/accountingApiClient';

export {
  ProductApiClient,
  createProductApiClient,
  ProductQueryParams
} from './services/productApiClient';

export {
  SupplierApiClient,
  createSupplierApiClient,
  SupplierQueryParams
} from './services/supplierApiClient';

export {
  CustomerApiClient,
  createCustomerApiClient,
  CustomerQueryParams
} from './services/customerApiClient';

export {
  SalesApiClient,
  createSalesApiClient,
  SalesQueryParams,
  SalesStats
} from './services/salesApiClient';

export {
  InventoryApiClient,
  createInventoryApiClient,
  InventoryQueryParams,
  InventoryCreateRequest,
  InventoryUpdateRequest
} from './services/inventoryApiClient';

export {
  BaseApiClient,
  createApiClient
} from './services/baseApiClient';

export {
  AuthApiClient,
  createAuthApiClient,
  AuthLoginRequest,
  AuthUpdateRequest,
  PasswordResetRequest,
  PasswordChangeRequest,
  TokenValidationResponse
} from './services/authApiClient';

export {
  EmployeeApiClient,
  createEmployeeApiClient,
  EmployeeQueryParams,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  EmployeeListResponse,
  EmployeeAccountCreateRequest,
  EmployeeAccountUpdateRequest,
  EmployeeStats
} from './services/employeeApiClient';

export {
  ThemeApiClient,
  createThemeApiClient
} from './services/themeApiClient';

// 主題相關常數和型別 - 直接重新匯出
export {
  DEFAULT_THEME_COLORS,
  DEFAULT_CUSTOM_SETTINGS,
  UserTheme,
  CreateUserThemeRequest,
  UpdateUserThemeRequest,
  UserThemeQueryParams,
  DuplicateThemeRequest,
  ColorPalette,
  GeneratedPalette,
  CustomThemeSettings,
  RGB,
  HSL,
  DefaultThemeColor
} from './types/theme';

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
// Zod 工具函數
export {
  zodId,
  zodOptionalId,
  zodDate,
  zodDateString,
  zodTimestamp,
  zodEmail,
  zodPhone,
  zodIdNumber,
  zodTaxId,
  createZodSchema,
  zodPagination,
  zodQuery
} from './utils/zodUtils';

// ts-rest contracts
export { salesContract, customersContract, suppliersContract, purchaseOrdersContract, shippingOrdersContract, pharmacyContract } from './api/contracts';
// Shared Zod schemas for API envelopes
export {
  apiSuccessEnvelopeSchema,
  createApiResponseSchema,
  createPaginatedResponseSchema,
  apiErrorResponseSchema,
} from './schemas/zod/common';
export { saleEntitySchema } from './schemas/zod/sale';
export { customerEntitySchema } from './schemas/zod/customer';
export { supplierEntitySchema } from './schemas/zod/supplier';
export { purchaseOrderEntitySchema } from './schemas/zod/purchaseOrder';
export { shippingOrderEntitySchema } from './schemas/zod/shippingOrder';

export { createSalesContractClient } from './api/clients/sales';
export type { SalesContractClient, SalesClientOptions, HeaderShape as SalesClientHeaderShape } from './api/clients/sales';

export { createCustomersContractClient } from './api/clients/customers';
export type { CustomersContractClient, CustomersClientOptions, HeaderShape as CustomersClientHeaderShape } from './api/clients/customers';

export { createAccountingContractClient } from './api/clients/accounting';
export type { AccountingContractClient, AccountingClientOptions, HeaderShape as AccountingClientHeaderShape } from './api/clients/accounting';

export { createDashboardContractClient } from './api/clients/dashboard';
export type { DashboardContractClient, DashboardClientOptions, HeaderShape as DashboardClientHeaderShape } from './api/clients/dashboard';

export { createSuppliersContractClient } from './api/clients/suppliers';
export type { SuppliersContractClient, SuppliersClientOptions, HeaderShape as SuppliersClientHeaderShape } from './api/clients/suppliers';

export { createPurchaseOrdersContractClient } from './api/clients/purchaseOrders';
export type { PurchaseOrdersContractClient, PurchaseOrdersClientOptions, HeaderShape as PurchaseOrdersClientHeaderShape } from './api/clients/purchaseOrders';
export { createShippingOrdersContractClient } from './api/clients/shippingOrders';
export type { ShippingOrdersContractClient, ShippingOrdersClientOptions, HeaderShape as ShippingOrdersClientHeaderShape } from './api/clients/shippingOrders';

export {
  shippingOrderSchema,
  createShippingOrderSchema,
  updateShippingOrderSchema,
  shippingOrderSearchSchema,
  shippingOrderStatusValues,
  shippingOrderPaymentStatusValues
} from './schemas/zod/shippingOrder';
