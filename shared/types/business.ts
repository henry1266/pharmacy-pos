/**
 * 業務邏輯相關型別定義 - 重構版本
 */

// ===== 基礎共用型別 =====

/** 基礎結果型別 */
export interface BaseResult {
  success: boolean;
  message: string;
}

/** 基礎時間戳記型別 */
export interface BaseTimestamps {
  createdAt: Date;
  updatedAt?: Date;
}

/** 基礎實體型別 */
export interface BaseEntity extends BaseTimestamps {
  id: string;
}

/** 基礎狀態型別 */
export type BaseStatus = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'failed';

/** 基礎處理狀態型別 */
export type ProcessStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

/** 基礎嚴重程度型別 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/** 基礎錯誤型別 */
export interface BaseError {
  field?: string;
  value?: any;
  error: string;
  severity: 'error' | 'warning';
}

/** 帶數據的結果型別 */
export interface DataResult<T> extends BaseResult {
  data?: T;
  errors?: string[];
}

/** 帶錯誤詳情的結果型別 */
export interface DetailedResult<T> extends DataResult<T> {
  warnings?: string[];
  metadata?: Record<string, any>;
}

/** 列表結果型別 */
export interface ListResult<T> extends DataResult<T[]> {
  total?: number;
  page?: number;
  limit?: number;
}

/** 分頁結果型別 */
export interface PaginatedResult<T> extends ListResult<T> {
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/** 統計結果型別 */
export interface StatsResult<T> extends DataResult<T> {
  calculatedAt?: Date;
  period?: {
    start: Date;
    end: Date;
  };
}

// ===== 訂單號生成器相關型別 =====

export interface OrderNumberOptions {
  prefix?: string;
  suffix?: string;
  dateFormat?: string;
  sequenceLength?: number;
  resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
}

export interface GeneratorConfig {
  type: 'sale' | 'purchase' | 'shipping' | 'accounting';
  options: OrderNumberOptions;
}

export interface OrderNumberResult extends DataResult<{
  orderNumber: string;
  sequence: number;
  generatedAt: Date;
}> {}

// ===== FIFO 計算相關型別 =====

export interface InventoryBatch extends BaseEntity {
  batchId: string;
  quantity: number;
  unitCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  supplier?: string;
  referenceId?: string;
}

export interface InventoryMovement extends BaseEntity {
  movementId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  remainingQuantity: number;
  remainingCost: number;
  date: Date;
  reference?: string;
  referenceId?: string;
  batchesAffected?: Array<{
    batchId: string;
    quantityUsed: number;
    costUsed: number;
  }>;
}

export interface FIFOCalculation {
  productId: string;
  totalQuantity: number;
  totalCost: number;
  averageCost: number;
  batches: InventoryBatch[];
  movements: InventoryMovement[];
  calculatedAt: Date;
}

export interface FIFOResult extends DataResult<{
  productId: string;
  requestedQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  totalCost: number;
  averageCost: number;
  batchesUsed: Array<{
    batchId: string;
    quantityUsed: number;
    unitCost: number;
    totalCost: number;
  }>;
  remainingBatches: InventoryBatch[];
  calculatedAt: Date;
}> {}

// ===== 員工帳號服務相關型別 =====

export type EmployeeRole = 'employee' | 'supervisor' | 'manager';

export interface EmployeeAccountData extends BaseEntity {
  employeeId: string;
  username: string;
  email?: string;
  role: EmployeeRole;
  permissions: string[];
  isActive: boolean;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
}

export interface AccountUpdateData {
  username?: string;
  email?: string;
  role?: EmployeeRole;
  permissions?: string[];
  isActive?: boolean;
  password?: string;
}

export interface EmployeeAccountValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AccountCreationResult extends DataResult<{
  userId: string;
  username: string;
  temporaryPassword?: string;
  mustChangePassword: boolean;
}> {}

// ===== CSV 匯入相關型別 =====

export interface ImportOptions {
  skipHeader?: boolean;
  delimiter?: string;
  encoding?: 'utf8' | 'big5' | 'gb2312';
  dateFormat?: string;
  validateOnly?: boolean;
}

export interface ImportError extends BaseError {
  row: number;
  column?: string;
}

export interface ImportResult<T = any> extends BaseResult {
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  warningRows: number;
  data?: T[];
  errors: ImportError[];
  warnings?: ImportError[];
  summary?: {
    created: number;
    updated: number;
    skipped: number;
  };
  processedAt: Date;
}

export interface CSVRowData {
  [key: string]: string | number | Date | boolean | null | undefined;
}

export interface ImportMapping {
  csvColumn: string;
  dbField: string;
  required?: boolean;
  transform?: (value: any) => any;
  validate?: (value: any) => boolean | string;
}

// ===== 價格計算相關型別 =====

export interface PriceCalculation {
  basePrice: number;
  discountAmount?: number;
  discountPercentage?: number;
  taxAmount?: number;
  taxPercentage?: number;
  finalPrice: number;
  savings?: number;
}

export interface BulkPriceRule {
  minQuantity: number;
  maxQuantity?: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description?: string;
}

export interface PricingResult {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountApplied?: {
    type: string;
    value: number;
    amount: number;
  };
  finalAmount: number;
  appliedRules?: string[];
}

// ===== 庫存警報相關型別 =====

export type AlertType = 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'overstock';

export interface StockAlert extends BaseTimestamps {
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  minStock: number;
  alertType: AlertType;
  severity: SeverityLevel;
  message: string;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AlertConfiguration {
  lowStockThreshold: number;
  expiryWarningDays: number;
  overstockThreshold?: number;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  alertRecipients: string[];
}

// ===== 報表生成相關型別 =====

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  productIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  customerIds?: string[];
  employeeIds?: string[];
  status?: string[];
  paymentMethods?: string[];
  [key: string]: any;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage';
  format?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ReportConfiguration {
  title: string;
  description?: string;
  columns: ReportColumn[];
  filters: ReportFilter;
  groupBy?: string[];
  sortBy?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  includeCharts?: boolean;
  chartTypes?: string[];
}

export interface ReportData {
  headers: string[];
  rows: any[][];
  summary?: {
    [key: string]: number | string;
  };
  charts?: Array<{
    type: string;
    title: string;
    data: any;
  }>;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    totalRows: number;
    filters: ReportFilter;
  };
}

// ===== 工作流程相關型別 =====

export interface WorkflowStep extends BaseEntity {
  stepId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  status: ProcessStatus;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  requiredFields?: string[];
  validationRules?: any[];
}

export type WorkflowType = 'purchase_order' | 'sale_order' | 'inventory_adjustment' | 'employee_onboarding';

export interface WorkflowInstance extends BaseTimestamps {
  workflowId: string;
  instanceId: string;
  type: WorkflowType;
  referenceId: string;
  status: BaseStatus;
  currentStep: number;
  steps: WorkflowStep[];
  createdBy: string;
  completedAt?: Date;
  metadata?: any;
}

// ===== 系統配置相關型別 =====

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logo?: string;
}

export interface BusinessSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  fiscalYearStart: string;
}

export interface InventorySettings {
  defaultCostMethod: 'fifo' | 'lifo' | 'average';
  autoReorderEnabled: boolean;
  lowStockAlertEnabled: boolean;
  expiryAlertEnabled: boolean;
}

export interface SalesSettings {
  allowNegativeInventory: boolean;
  requireCustomerForSale: boolean;
  defaultPaymentMethod: string;
  taxRate?: number;
}

export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface SystemConfiguration {
  companyInfo: CompanyInfo;
  businessSettings: BusinessSettings;
  inventorySettings: InventorySettings;
  salesSettings: SalesSettings;
  securitySettings: SecuritySettings;
}

export interface ConfigurationUpdate extends BaseTimestamps {
  section: keyof SystemConfiguration;
  updates: Partial<SystemConfiguration[keyof SystemConfiguration]>;
  updatedBy: string;
}