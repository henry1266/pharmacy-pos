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

// API 相關型別
export * from './api';

// 表單型別
export * from './forms';

// 儲存相關型別
export * from './store';

// 工具型別
export * from './utils';

// 業務邏輯型別 (避免與 api 衝突)
export type {
  OrderNumberOptions,
  GeneratorConfig,
  OrderNumberResult,
  InventoryBatch,
  FIFOCalculation,
  InventoryMovement,
  FIFOResult,
  EmployeeAccountData,
  AccountUpdateData,
  EmployeeAccountValidation,
  AccountCreationResult,
  ImportOptions,
  ImportError,
  ImportResult,
  CSVRowData,
  ImportMapping,
  PriceCalculation,
  BulkPriceRule,
  PricingResult,
  StockAlert,
  AlertConfiguration,
  ReportFilter,
  ReportColumn,
  ReportConfiguration,
  WorkflowStep,
  WorkflowInstance,
  SystemConfiguration,
  ConfigurationUpdate
} from './business';