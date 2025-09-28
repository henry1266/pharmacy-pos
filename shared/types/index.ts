/**
 * 共享型別統一匯出
 * 提供前後端統一的型別介面
 */

// 基礎實體型別
export * from './entities';

// 會計相關型別 (明確匯出避免衝突)
export type {
  AccountingFilters,
  ExtendedAccountingRecord,
  FormData,
  OperationResult,
  UnaccountedSale
} from './accounting';

// Accounting3 相關型別 (新一代會計系統)
export * from './accounting3';

// API 相關型別
export * from './api';

// 表單型別
export * from './forms';
// 工具型別
export * from './utils';

// 包裝單位相關型別
export * from './package';

// 主題相關型別
export * from './theme';

// 採購訂單相關型別 (明確匯出避免衝突)
export type {
  PurchaseOrderStatus,
  PaymentStatus,
  PurchaseOrderRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderSearchParams
} from './purchase-order';

// 業務邏輯型別 (避免與 api 衝突) - 使用重構後的版本
export type {
  // 基礎型別
  BaseResult,
  BaseTimestamps,
  BaseEntity,
  BaseStatus,
  ProcessStatus,
  SeverityLevel,
  BaseError,
  
  // 訂單號生成器相關型別
  OrderNumberOptions,
  GeneratorConfig,
  OrderNumberResult,
  
  // FIFO 計算相關型別
  InventoryBatch,
  FIFOCalculation,
  InventoryMovement,
  FIFOResult,
  
  // 員工帳號服務相關型別
  EmployeeRole,
  EmployeeAccountData,
  AccountUpdateData,
  EmployeeAccountValidation,
  AccountCreationResult,
  
  // CSV 匯入相關型別
  ImportOptions,
  ImportError,
  ImportResult,
  CSVRowData,
  ImportMapping,
  
  // 價格計算相關型別
  PriceCalculation,
  BulkPriceRule,
  PricingResult,
  
  // 庫存警報相關型別
  AlertType,
  StockAlert,
  AlertConfiguration,
  
  // 報表生成相關型別
  ReportFilter,
  ReportColumn,
  ReportConfiguration,
  ReportData,
  
  // 工作流程相關型別
  WorkflowStep,
  WorkflowType,
  WorkflowInstance,
  
  // 系統配置相關型別
  CompanyInfo,
  BusinessSettings,
  InventorySettings,
  SalesSettings,
  SecuritySettings,
  SystemConfiguration,
  ConfigurationUpdate
} from './business';