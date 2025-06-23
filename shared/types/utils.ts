/**
 * 工具函數相關型別定義
 */

// 密碼工具相關型別
export interface PasswordHashResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength?: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns?: string[];
  forbiddenWords?: string[];
}

export interface PasswordCompareResult {
  isMatch: boolean;
  error?: string;
}

// 程式碼生成器相關型別
export interface CodeGenerationOptions {
  prefix?: string;
  suffix?: string;
  length?: number;
  includeNumbers?: boolean;
  includeLetters?: boolean;
  includeSpecialChars?: boolean;
  excludeSimilarChars?: boolean;
  customCharset?: string;
}

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  error?: string;
  metadata?: {
    length: number;
    charset: string;
    generatedAt: Date;
  };
}

export interface UniqueCodeOptions extends CodeGenerationOptions {
  checkUniqueness?: (code: string) => Promise<boolean>;
  maxAttempts?: number;
  collectionName?: string;
  fieldName?: string;
}

export interface UniqueCodeResult extends CodeGenerationResult {
  attempts?: number;
  isUnique?: boolean;
}

// PDF 生成器相關型別
export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  fontSize?: number;
  fontFamily?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  headerText?: string;
  footerText?: string;
  watermark?: string;
  compression?: boolean;
}

export interface PDFContent {
  title?: string;
  subtitle?: string;
  sections: PDFSection[];
  tables?: PDFTable[];
  images?: PDFImage[];
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
  };
}

export interface PDFSection {
  title?: string;
  content: string;
  style?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    marginTop?: number;
    marginBottom?: number;
  };
}

export interface PDFTable {
  headers: string[];
  rows: string[][];
  style?: {
    headerStyle?: any;
    cellStyle?: any;
    borderStyle?: any;
    alternateRowColor?: string;
  };
}

export interface PDFImage {
  path: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill';
}

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  buffer?: Buffer;
  error?: string;
  metadata?: {
    pageCount: number;
    fileSize: number;
    generatedAt: Date;
    processingTime: number;
  };
}

// 日期時間工具相關型別
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateFormatOptions {
  format?: string;
  locale?: string;
  timezone?: string;
}

export interface DateCalculationResult {
  result: Date;
  operation: string;
  originalDate: Date;
  modifier: number | string;
}

export interface BusinessDayOptions {
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  holidays?: Date[];
  customWorkDays?: number[];
}

// 資料驗證相關型別
export interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'email' | 'phone' | 'date' | 'custom';
  message?: string;
  options?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => boolean | string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface DataSanitizationOptions {
  trimStrings?: boolean;
  removeEmptyFields?: boolean;
  convertTypes?: boolean;
  allowedFields?: string[];
  forbiddenFields?: string[];
  maxStringLength?: number;
}

export interface SanitizationResult {
  sanitizedData: any;
  removedFields: string[];
  modifiedFields: Array<{
    field: string;
    originalValue: any;
    newValue: any;
    reason: string;
  }>;
}

// 檔案處理相關型別
export interface FileProcessingOptions {
  allowedExtensions?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  destination?: string;
  filename?: string | ((file: any) => string);
  preserveOriginalName?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileInfo?: {
    originalName: string;
    size: number;
    mimetype: string;
    extension: string;
  };
}

export interface FileUploadResult {
  success: boolean;
  files?: Array<{
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    url?: string;
  }>;
  errors?: string[];
}

// 快取相關型別
export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'lfu';
  serialize?: boolean;
}

export interface CacheResult<T = any> {
  hit: boolean;
  data?: T;
  key: string;
  ttl?: number;
  createdAt?: Date;
  accessCount?: number;
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

// 日誌相關型別
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  metadata?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggingOptions {
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  format?: 'json' | 'text' | 'structured';
  destination?: 'console' | 'file' | 'database' | 'remote';
  rotation?: {
    maxSize?: string;
    maxFiles?: number;
    datePattern?: string;
  };
  filters?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
    value: any;
  }>;
}

// 效能監控相關型別
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'seconds' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  tags?: { [key: string]: string };
}

export interface PerformanceReport {
  period: DateRange;
  metrics: PerformanceMetric[];
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
  };
  slowestEndpoints: Array<{
    endpoint: string;
    averageTime: number;
    requestCount: number;
  }>;
  errorBreakdown: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

// 資料匯出相關型別
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'xml' | 'pdf';
  includeHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
  compression?: boolean;
  password?: string;
  template?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  buffer?: Buffer;
  filename: string;
  format: string;
  size: number;
  recordCount: number;
  generatedAt: Date;
  error?: string;
}

// 通知相關型別
export interface NotificationOptions {
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipients: string[];
  subject?: string;
  template?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  retryAttempts?: number;
  metadata?: any;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  deliveredTo: string[];
  failedTo: string[];
  errors?: Array<{
    recipient: string;
    error: string;
  }>;
  sentAt: Date;
  cost?: number;
}