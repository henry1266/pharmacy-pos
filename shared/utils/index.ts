/**
 * 共享工具函數型別定義
 * 統一前後端使用的工具函數介面
 */

/**
 * 型別守衛工具函數
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * 日期工具函數型別
 */
export interface DateUtilsType {
  formatDate: (date: Date | string, format?: string) => string;
  parseDate: (dateString: string, format?: string) => Date | null;
  isValidDate: (date: unknown) => date is Date;
  addDays: (date: Date, days: number) => Date;
  subtractDays: (date: Date, days: number) => Date;
  getDaysBetween: (startDate: Date, endDate: Date) => number;
  isWeekend: (date: Date) => boolean;
  isWorkDay: (date: Date) => boolean;
  getStartOfDay: (date: Date) => Date;
  getEndOfDay: (date: Date) => Date;
  getStartOfMonth: (date: Date) => Date;
  getEndOfMonth: (date: Date) => Date;
}

/**
 * 字串工具函數型別
 */
export interface StringUtilsType {
  capitalize: (str: string) => string;
  camelCase: (str: string) => string;
  kebabCase: (str: string) => string;
  snakeCase: (str: string) => string;
  truncate: (str: string, length: number, suffix?: string) => string;
  removeSpecialChars: (str: string) => string;
  generateRandomString: (length: number, charset?: string) => string;
  isValidEmail: (email: string) => boolean;
  isValidPhone: (phone: string) => boolean;
  isValidTaiwanId: (id: string) => boolean;
  isValidTaiwanTaxId: (taxId: string) => boolean;
}

/**
 * 數字工具函數型別
 */
export interface NumberUtilsType {
  formatCurrency: (amount: number, currency?: string, locale?: string) => string;
  formatNumber: (num: number, decimals?: number, locale?: string) => string;
  roundToDecimals: (num: number, decimals: number) => number;
  isValidPrice: (price: unknown) => boolean;
  isValidQuantity: (quantity: unknown) => boolean;
  calculatePercentage: (value: number, total: number) => number;
  calculateDiscount: (originalPrice: number, discountPercent: number) => number;
  calculateTax: (amount: number, taxRate: number) => number;
}

/**
 * 陣列工具函數型別
 */
export interface ArrayUtilsType {
  unique: <T>(array: T[]) => T[];
  groupBy: <T, K extends keyof T>(array: T[], key: K) => Record<string, T[]>;
  sortBy: <T, K extends keyof T>(array: T[], key: K, order?: 'asc' | 'desc') => T[];
  chunk: <T>(array: T[], size: number) => T[][];
  flatten: <T>(array: (T | T[])[]) => T[];
  intersection: <T>(array1: T[], array2: T[]) => T[];
  difference: <T>(array1: T[], array2: T[]) => T[];
  shuffle: <T>(array: T[]) => T[];
}

/**
 * 物件工具函數型別
 */
export interface ObjectUtilsType {
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]) => T;
  pick: <T, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>;
  omit: <T, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>;
  hasProperty: <T, K extends PropertyKey>(obj: T, key: K) => obj is T & Record<K, unknown>;
  getNestedValue: (obj: Record<string, any>, path: string) => unknown;
  setNestedValue: (obj: Record<string, any>, path: string, value: unknown) => void;
  flattenObject: (obj: Record<string, any>, prefix?: string) => Record<string, any>;
}

/**
 * 驗證工具函數型別
 */
export interface ValidationUtilsType {
  validateRequired: (value: unknown) => boolean;
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
  validateTaiwanId: (id: string) => boolean;
  validateTaiwanTaxId: (taxId: string) => boolean;
  validateProductCode: (code: string) => boolean;
  validatePrice: (price: number) => boolean;
  validateQuantity: (quantity: number) => boolean;
  validateDateRange: (startDate: Date, endDate: Date) => boolean;
}

/**
 * 檔案工具函數型別
 */
export interface FileUtilsType {
  getFileExtension: (filename: string) => string;
  getMimeType: (filename: string) => string | null;
  isValidFileType: (filename: string, allowedTypes: string[]) => boolean;
  formatFileSize: (bytes: number) => string;
  generateUniqueFilename: (originalName: string) => string;
  validateFileSize: (size: number, maxSize: number) => boolean;
}

/**
 * 錯誤處理工具函數型別
 */
export interface ErrorUtilsType {
  createError: (message: string, code?: string, statusCode?: number) => Error;
  isApiError: (error: unknown) => boolean;
  formatErrorMessage: (error: unknown) => string;
  logError: (error: unknown, context?: string) => void;
}

/**
 * 快取工具函數型別
 */
export interface CacheUtilsType {
  generateCacheKey: (...parts: string[]) => string;
  isExpired: (timestamp: number, ttl: number) => boolean;
  calculateTTL: (expiryDate: Date) => number;
}

/**
 * URL 工具函數型別
 */
export interface UrlUtilsType {
  buildUrl: (baseUrl: string, path: string, params?: Record<string, string>) => string;
  parseQueryString: (queryString: string) => Record<string, string>;
  buildQueryString: (params: Record<string, string | number | boolean>) => string;
  isValidUrl: (url: string) => boolean;
}

/**
 * 加密工具函數型別
 */
export interface CryptoUtilsType {
  generateHash: (data: string, algorithm?: string) => string;
  generateSalt: (length?: number) => string;
  hashPassword: (password: string, salt: string) => string;
  comparePassword: (password: string, hash: string, salt: string) => boolean;
  generateToken: (length?: number) => string;
}

/**
 * 格式化工具函數型別
 */
export interface FormatUtilsType {
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, format?: string) => string;
  formatTime: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatNumber: (num: number, decimals?: number) => string;
  formatPercentage: (value: number, decimals?: number) => string;
  formatFileSize: (bytes: number) => string;
  formatDuration: (milliseconds: number) => string;
}

/**
 * 轉換工具函數型別
 */
export interface ConversionUtilsType {
  stringToNumber: (str: string) => number | null;
  numberToString: (num: number, decimals?: number) => string;
  booleanToString: (bool: boolean) => string;
  stringToBoolean: (str: string) => boolean | null;
  dateToString: (date: Date, format?: string) => string;
  stringToDate: (str: string, format?: string) => Date | null;
  objectToQueryString: (obj: Record<string, any>) => string;
  queryStringToObject: (queryString: string) => Record<string, any>;
}

/**
 * 業務邏輯工具函數型別
 */
export interface BusinessUtilsType {
  calculateSubtotal: (quantity: number, price: number) => number;
  calculateDiscount: (amount: number, discountPercent: number) => number;
  calculateTax: (amount: number, taxRate: number) => number;
  calculateTotal: (subtotal: number, discount: number, tax: number) => number;
  generateOrderNumber: (prefix: string, date?: Date) => string;
  validateInventoryQuantity: (requested: number, available: number) => boolean;
  calculateInventoryValue: (quantity: number, unitCost: number) => number;
  isLowStock: (currentStock: number, minStock: number) => boolean;
  calculateReorderPoint: (dailyUsage: number, leadTimeDays: number, safetyStock: number) => number;
}

/**
 * 統計工具函數型別
 */
export interface StatisticsUtilsType {
  sum: (numbers: number[]) => number;
  average: (numbers: number[]) => number;
  median: (numbers: number[]) => number;
  mode: (numbers: number[]) => number[];
  standardDeviation: (numbers: number[]) => number;
  variance: (numbers: number[]) => number;
  min: (numbers: number[]) => number;
  max: (numbers: number[]) => number;
  range: (numbers: number[]) => number;
  percentile: (numbers: number[], percentile: number) => number;
}

/**
 * 搜尋工具函數型別
 */
export interface SearchUtilsType {
  fuzzySearch: <T>(items: T[], query: string, keys: (keyof T)[]) => T[];
  highlightMatches: (text: string, query: string) => string;
  normalizeSearchQuery: (query: string) => string;
  createSearchIndex: <T>(items: T[], keys: (keyof T)[]) => Map<string, T[]>;
}

/**
 * 分頁工具函數型別
 */
export interface PaginationUtilsType {
  calculateOffset: (page: number, limit: number) => number;
  calculateTotalPages: (totalItems: number, limit: number) => number;
  createPaginationInfo: (page: number, limit: number, totalItems: number) => {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    startIndex: number;
    endIndex: number;
  };
}

/**
 * 匯出所有工具函數型別
 */
export interface SharedUtils {
  date: DateUtilsType;
  string: StringUtilsType;
  number: NumberUtilsType;
  array: ArrayUtilsType;
  object: ObjectUtilsType;
  validation: ValidationUtilsType;
  file: FileUtilsType;
  error: ErrorUtilsType;
  cache: CacheUtilsType;
  url: UrlUtilsType;
  crypto: CryptoUtilsType;
  format: FormatUtilsType;
  conversion: ConversionUtilsType;
  business: BusinessUtilsType;
  statistics: StatisticsUtilsType;
  search: SearchUtilsType;
  pagination: PaginationUtilsType;
}

/**
 * 通用型別工具
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;