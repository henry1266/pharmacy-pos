/**
 * 業務邏輯相關型別定義
 */

// 訂單號生成器相關型別
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

export interface OrderNumberResult {
  orderNumber: string;
  sequence: number;
  generatedAt: Date;
}

// FIFO 計算相關型別
export interface InventoryBatch {
  batchId: string;
  quantity: number;
  unitCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  supplier?: string;
  referenceId?: string;
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

export interface InventoryMovement {
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

export interface FIFOResult {
  success: boolean;
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
}

// 員工帳號服務相關型別
export interface EmployeeAccountData {
  employeeId: string;
  username: string;
  email?: string;
  role: 'employee' | 'supervisor' | 'manager';
  permissions: string[];
  isActive: boolean;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
}

export interface AccountUpdateData {
  username?: string;
  email?: string;
  role?: 'employee' | 'supervisor' | 'manager';
  permissions?: string[];
  isActive?: boolean;
  password?: string;
}

export interface EmployeeAccountValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AccountCreationResult {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    username: string;
    temporaryPassword?: string;
    mustChangePassword: boolean;
  };
  errors?: string[];
}

// CSV 匯入相關型別
export interface ImportOptions {
  skipHeader?: boolean;
  delimiter?: string;
  encoding?: 'utf8' | 'big5' | 'gb2312';
  dateFormat?: string;
  validateOnly?: boolean;
}

export interface ImportError {
  row: number;
  column?: string;
  field?: string;
  value?: any;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportResult<T = any> {
  success: boolean;
  message: string;
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

// 價格計算相關型別
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

// 庫存警報相關型別
export interface StockAlert {
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  minStock: number;
  alertType: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: Date;
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

// 報表生成相關型別
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

// 工作流程相關型別
export interface WorkflowStep {
  stepId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  requiredFields?: string[];
  validationRules?: any[];
}

export interface WorkflowInstance {
  workflowId: string;
  instanceId: string;
  type: 'purchase_order' | 'sale_order' | 'inventory_adjustment' | 'employee_onboarding';
  referenceId: string;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  currentStep: number;
  steps: WorkflowStep[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: any;
}

// 系統配置相關型別
export interface SystemConfiguration {
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logo?: string;
  };
  businessSettings: {
    currency: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    fiscalYearStart: string;
  };
  inventorySettings: {
    defaultCostMethod: 'fifo' | 'lifo' | 'average';
    autoReorderEnabled: boolean;
    lowStockAlertEnabled: boolean;
    expiryAlertEnabled: boolean;
  };
  salesSettings: {
    allowNegativeInventory: boolean;
    requireCustomerForSale: boolean;
    defaultPaymentMethod: string;
    taxRate?: number;
  };
  securitySettings: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}

export interface ConfigurationUpdate {
  section: keyof SystemConfiguration;
  updates: Partial<SystemConfiguration[keyof SystemConfiguration]>;
  updatedBy: string;
  updatedAt: Date;
}