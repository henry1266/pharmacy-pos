/**
 * 共享列舉常數定義
 * 統一前後端使用的常數值
 */

/**
 * 使用者角色
 */
export enum UserRole {
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  STAFF = 'staff',
  EMPLOYEE = 'employee',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager'
}

/**
 * 產品類型
 */
export enum ProductType {
  PRODUCT = 'product',
  MEDICINE = 'medicine'
}

/**
 * 付款方式
 */
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TRANSFER = 'transfer',
  MOBILE_PAYMENT = 'mobile_payment',
  OTHER = 'other'
}

/**
 * 付款狀態
 */
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
  UNPAID = '未付',
  RECEIVED = '已下收',
  TRANSFERRED = '已匯款',
  NOT_RECEIVED = '未收',
  PAYMENT_RECEIVED = '已收款',
  INVOICED = '已開立'
}

/**
 * 訂單狀態
 */
export enum OrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RECEIVED = 'received'
}

/**
 * 庫存異動類型
 */
export enum InventoryMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  SHIP = 'ship',
  IN = 'in',
  OUT = 'out'
}

/**
 * 班別
 */
export enum Shift {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  MORNING_ZH = '早',
  AFTERNOON_ZH = '中',
  EVENING_ZH = '晚'
}

/**
 * 性別
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  MALE_ZH = '男',
  FEMALE_ZH = '女',
  OTHER_ZH = '其他'
}

/**
 * 會員等級
 */
export enum MembershipLevel {
  REGULAR = 'regular',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

/**
 * 請假類型
 */
export enum LeaveType {
  SICK = 'sick',
  PERSONAL = 'personal',
  OVERTIME = 'overtime'
}

/**
 * 加班狀態
 */
export enum OvertimeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * 會計交易類型
 */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

/**
 * 報表類型
 */
export enum ReportType {
  SALES = 'sales',
  INVENTORY = 'inventory',
  ACCOUNTING = 'accounting',
  EMPLOYEE = 'employee'
}

/**
 * 報表格式
 */
export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel',
  XML = 'xml'
}

/**
 * 報表分組方式
 */
export enum ReportGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

/**
 * 排序方向
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 庫存成本計算方法
 */
export enum CostMethod {
  FIFO = 'fifo',
  LIFO = 'lifo',
  AVERAGE = 'average'
}

/**
 * 庫存警報類型
 */
export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRY_WARNING = 'expiry_warning',
  OVERSTOCK = 'overstock'
}

/**
 * 警報嚴重程度
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 通知類型
 */
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook'
}

/**
 * 通知優先級
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 檔案類型
 */
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PDF = 'pdf',
  CSV = 'csv'
}

/**
 * 編碼格式
 */
export enum Encoding {
  UTF8 = 'utf8',
  BIG5 = 'big5',
  GB2312 = 'gb2312'
}

/**
 * 工作流程狀態
 */
export enum WorkflowStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

/**
 * 工作流程步驟狀態
 */
export enum WorkflowStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed'
}

/**
 * 系統日誌等級
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * 快取策略
 */
export enum CacheStrategy {
  LRU = 'lru',
  FIFO = 'fifo',
  LFU = 'lfu'
}

/**
 * 密碼強度
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong'
}

/**
 * 驗證規則類型
 */
export enum ValidationType {
  REQUIRED = 'required',
  STRING = 'string',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  CUSTOM = 'custom'
}

/**
 * 匯入錯誤嚴重程度
 */
export enum ImportErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning'
}

/**
 * 折扣類型
 */
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

/**
 * 重設週期
 */
export enum ResetPeriod {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  NEVER = 'never'
}