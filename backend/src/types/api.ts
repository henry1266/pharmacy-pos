
// 從 shared 模組匯入共用型別
export type {
  ApiResponse,
  ErrorResponse,
  PaginationParams,
  PaginatedResponse,
  LoginRequest,
  AuthResponse,
  JWTPayload,
  QueryParams,
  FilterParams,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductResponse,
  SaleCreateRequest,
  SaleResponse,
  PurchaseOrderCreateRequest,
  PurchaseOrderResponse,
  ShippingOrderCreateRequest,
  ShippingOrderResponse,
  InventoryResponse,
  InventoryMovementRequest,
  AccountingCreateRequest,
  AccountingResponse,
  EmployeeCreateRequest,
  EmployeeResponse,
  CustomerCreateRequest,
  CustomerResponse,
  SupplierCreateRequest,
  SupplierResponse,
  FileUploadResponse,
  CSVImportRequest,
  CSVImportResponse,
  DashboardStats,
  ReportParams,
  ReportResponse
} from '@shared/types/api';

// Backend 特定的擴展型別（如果需要的話）
// 這裡可以添加 backend 特有的型別定義，例如包含 Mongoose Types.ObjectId 的型別