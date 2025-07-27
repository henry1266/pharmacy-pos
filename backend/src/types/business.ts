import { Types } from 'mongoose';
import {
  // 從 shared 匯入基礎型別
  BaseResult,
  BaseTimestamps,
  BaseEntity,
  OrderNumberOptions,
  GeneratorConfig,
  EmployeeRole,
  EmployeeAccountData as SharedEmployeeAccountData,
  AccountUpdateData as SharedAccountUpdateData,
  EmployeeAccountValidation,
  ImportOptions,
  ImportError as SharedImportError,
  ImportResult as SharedImportResult,
  CSVRowData,
  ImportMapping,
  PriceCalculation,
  BulkPriceRule,
  AlertConfiguration,
  ReportColumn,
  ReportConfiguration,
  WorkflowType,
  CompanyInfo,
  BusinessSettings,
  InventorySettings,
  SalesSettings,
  SecuritySettings,
  SystemConfiguration as SharedSystemConfiguration,
  AlertType,
  ProcessStatus,
  BaseStatus,
  SeverityLevel
} from '@pharmacy-pos/shared/types';

/**
 * MongoDB 特定的業務型別定義
 * 繼承 shared 型別並加入 MongoDB ObjectId 支援
 */

// ===== 訂單號生成器相關型別 (MongoDB 版本) =====

export interface OrderNumberResult extends BaseResult {
  data?: {
    orderNumber: string;
    sequence: number;
    generatedAt: Date;
  };
}

// ===== FIFO 計算相關型別 (MongoDB 版本) =====

export interface InventoryBatch extends BaseEntity {
  batchId: string;
  quantity: number;
  unitCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  supplier?: Types.ObjectId;
  referenceId?: Types.ObjectId;
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
  referenceId?: Types.ObjectId;
  batchesAffected?: Array<{
    batchId: string;
    quantityUsed: number;
    costUsed: number;
  }>;
}

export interface FIFOCalculation {
  productId: Types.ObjectId;
  totalQuantity: number;
  totalCost: number;
  averageCost: number;
  batches: InventoryBatch[];
  movements: InventoryMovement[];
  calculatedAt: Date;
}

export interface FIFOResult extends BaseResult {
  data?: {
    productId: Types.ObjectId;
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
  };
}

// ===== 員工帳號服務相關型別 (MongoDB 版本) =====

export interface EmployeeAccountData extends SharedEmployeeAccountData {
  // 繼承 shared 版本，如需要可加入 MongoDB 特定欄位
}

export interface AccountUpdateData extends SharedAccountUpdateData {
  // 繼承 shared 版本
}

export interface AccountCreationResult extends BaseResult {
  data?: {
    userId: string;
    username: string;
    temporaryPassword?: string;
    mustChangePassword: boolean;
  };
}

// ===== CSV 匯入相關型別 (MongoDB 版本) =====

export interface ImportError extends SharedImportError {
  // 繼承 shared 版本
}

export interface ImportResult<T = any> extends SharedImportResult<T> {
  // 繼承 shared 版本
}

// ===== 價格計算相關型別 (MongoDB 版本) =====

export interface PricingResult {
  productId: Types.ObjectId;
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

// ===== 庫存警報相關型別 (MongoDB 版本) =====

export interface StockAlert extends BaseTimestamps {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  currentStock: number;
  minStock: number;
  alertType: AlertType;
  severity: SeverityLevel;
  message: string;
  acknowledged?: boolean;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
}

// ===== 報表生成相關型別 (MongoDB 版本) =====

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  productIds?: Types.ObjectId[];
  categoryIds?: Types.ObjectId[];
  supplierIds?: Types.ObjectId[];
  customerIds?: Types.ObjectId[];
  employeeIds?: Types.ObjectId[];
  status?: string[];
  paymentMethods?: string[];
  [key: string]: any;
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
    generatedBy: Types.ObjectId;
    totalRows: number;
    filters: ReportFilter;
  };
}

// ===== 工作流程相關型別 (MongoDB 版本) =====

export interface WorkflowStep extends BaseEntity {
  stepId: string;
  name: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  status: ProcessStatus;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  requiredFields?: string[];
  validationRules?: any[];
}

export interface WorkflowInstance extends BaseTimestamps {
  workflowId: string;
  instanceId: string;
  type: WorkflowType;
  referenceId: Types.ObjectId;
  status: BaseStatus;
  currentStep: number;
  steps: WorkflowStep[];
  createdBy: Types.ObjectId;
  completedAt?: Date;
  metadata?: any;
}

// ===== 系統配置相關型別 (MongoDB 版本) =====

export interface SystemConfiguration extends SharedSystemConfiguration {
  // 繼承 shared 版本
}

export interface ConfigurationUpdate extends BaseTimestamps {
  section: keyof SystemConfiguration;
  updates: Partial<SystemConfiguration[keyof SystemConfiguration]>;
  updatedBy: Types.ObjectId;
}

// ===== 重新匯出 shared 型別以保持向後相容性 =====

export type {
  // 基礎型別
  BaseResult,
  BaseTimestamps,
  BaseEntity,
  BaseStatus,
  ProcessStatus,
  SeverityLevel,
  
  // 直接使用 shared 版本的型別
  OrderNumberOptions,
  GeneratorConfig,
  EmployeeRole,
  EmployeeAccountValidation,
  ImportOptions,
  CSVRowData,
  ImportMapping,
  PriceCalculation,
  BulkPriceRule,
  AlertConfiguration,
  ReportColumn,
  ReportConfiguration,
  WorkflowType,
  CompanyInfo,
  BusinessSettings,
  InventorySettings,
  SalesSettings,
  SecuritySettings,
  AlertType
};