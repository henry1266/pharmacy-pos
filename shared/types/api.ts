/**
 * 共享 API 型別定義
 * 統一前後端的 API 介面規範
 */

/**
 * 基礎 API 回應型別
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: Date | string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Array<{
    msg: string;
    param?: string;
    location?: string;
  }>;
  details?: any;
  statusCode?: number;
  timestamp?: Date | string;
}

/**
 * 分頁相關型別
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    total?: number;
    currentPage?: number;
    page?: number;
    totalPages?: number;
    totalItems?: number;
    limit?: number;
    itemsPerPage?: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp?: Date | string;
}

/**
 * 認證相關型別
 */
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  loginType?: 'username' | 'email';
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email?: string;
      role: string;
      isAdmin?: boolean;
      permissions?: string[];
      createdAt?: string;
      updatedAt?: string;
    };
    expiresIn?: string;
  };
  timestamp?: Date | string;
}

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * 查詢參數型別
 */
export interface QueryParams {
  search?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface FilterParams extends QueryParams, PaginationParams {}

/**
 * 產品相關 API 型別
 */
export interface ProductCreateRequest {
  code: string;
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  category?: string;
  supplier?: string;
  stock?: number;
  minStock?: number;
  unit: string;
  barcode?: string;
  isMonitored?: boolean;
  isMedicine?: boolean;
  productType?: 'product' | 'medicine';
  medicineInfo?: {
    licenseNumber?: string;
    ingredients?: string;
    dosage?: string;
    sideEffects?: string;
    contraindications?: string;
  };
  tags?: string[];
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {}

export interface ProductResponse {
  _id: string;
  code: string;
  name: string;
  category?: {
    _id: string;
    name: string;
  };
  description?: string;
  unit: string;
  cost?: number;
  price?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  supplier?: {
    _id: string;
    name: string;
  };
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  stock?: number;
  isActive: boolean;
  isMedicine?: boolean;
  productType?: 'product' | 'medicine';
  medicineInfo?: {
    licenseNumber?: string;
    ingredients?: string;
    dosage?: string;
    sideEffects?: string;
    contraindications?: string;
  };
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 銷售相關 API 型別
 */
export interface SaleCreateRequest {
  saleNumber?: string;
  date?: string;
  customer?: string;
  items: Array<{
    product: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
    discount?: number;
    subtotal?: number;
    notes?: string;
  }>;
  totalAmount?: number;
  discount?: number;
  discountAmount?: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | 'credit_card' | 'debit_card' | 'mobile_payment';
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'cancelled';
  notes?: string;
}

export interface SaleResponse {
  _id: string;
  saleNumber: string;
  customer?: {
    _id: string;
    name: string;
  };
  items: Array<{
    _id?: string;
    product: {
      _id: string;
      name: string;
      code?: string;
    };
    quantity: number;
    price: number;
    unitPrice?: number;
    subtotal: number;
    discount?: number;
    notes?: string;
  }>;
  totalAmount: number;
  discount?: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  date: Date | string;
  saleDate?: Date | string;
  cashier?: {
    _id: string;
    username: string;
  };
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 採購訂單相關 API 型別
 */
export interface PurchaseOrderCreateRequest {
  orderNumber?: string;
  supplier: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  items: Array<{
    product: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
    subtotal?: number;
    notes?: string;
  }>;
  totalAmount?: number;
  status?: 'pending' | 'approved' | 'received' | 'cancelled' | 'completed';
  notes?: string;
}

export interface PurchaseOrderResponse {
  _id: string;
  orderNumber: string;
  supplier: {
    _id: string;
    name: string;
  };
  items: Array<{
    _id?: string;
    product: {
      _id: string;
      name: string;
      code?: string;
    };
    quantity: number;
    price: number;
    unitPrice?: number;
    subtotal: number;
    receivedQuantity?: number;
    notes?: string;
  }>;
  totalAmount: number;
  status: string;
  orderDate: Date | string;
  expectedDeliveryDate?: Date | string;
  actualDeliveryDate?: Date | string;
  createdBy?: {
    _id: string;
    username: string;
  };
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 出貨訂單相關 API 型別
 */
export interface ShippingOrderCreateRequest {
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  orderDate?: string;
  shippingDate?: string;
  items: Array<{
    product: string;
    quantity: number;
    price?: number;
    unitPrice?: number;
    subtotal?: number;
    notes?: string;
  }>;
  totalAmount?: number;
  status?: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  shippingAddress?: string;
  notes?: string;
}

export interface ShippingOrderResponse {
  _id: string;
  orderNumber: string;
  customer?: {
    _id: string;
    name: string;
  };
  customerName?: string;
  items: Array<{
    _id?: string;
    product: {
      _id: string;
      name: string;
      code?: string;
    };
    quantity: number;
    price?: number;
    unitPrice?: number;
    subtotal?: number;
    notes?: string;
  }>;
  totalAmount?: number;
  status: string;
  orderDate?: Date | string;
  shippingDate?: Date | string;
  deliveryDate?: Date | string;
  shippingAddress?: string;
  trackingNumber?: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 庫存相關 API 型別
 */
export interface InventoryResponse {
  _id: string;
  product: {
    _id: string;
    code: string;
    name: string;
  };
  quantity: number;
  currentStock?: number;
  reservedStock?: number;
  availableStock?: number;
  totalAmount?: number;
  averageCost?: number;
  type?: 'purchase' | 'sale' | 'adjustment' | 'return' | 'ship';
  lastMovement?: Date | string;
  lastUpdated?: Date | string;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InventoryMovementRequest {
  type: 'in' | 'out' | 'adjustment' | 'purchase' | 'sale' | 'return' | 'ship';
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  reference?: string;
  referenceId?: string;
  notes?: string;
}

/**
 * 會計相關 API 型別
 */
export interface AccountingCreateRequest {
  date: string;
  shift: 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚';
  category: string;
  amount: number;
  isExpense: boolean;
  type?: 'income' | 'expense';
  description?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  reference?: string;
  referenceId?: string;
  tags?: string[];
}

export interface AccountingResponse {
  _id: string;
  transactionNumber?: string;
  date: Date | string;
  shift: string;
  category: {
    _id: string;
    name: string;
    isExpense?: boolean;
  };
  amount: number;
  isExpense: boolean;
  type?: string;
  description?: string;
  paymentMethod?: string;
  reference?: string;
  referenceId?: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 員工相關 API 型別
 */
export interface EmployeeCreateRequest {
  name: string;
  gender?: 'male' | 'female' | 'other' | '男' | '女' | '其他';
  birthDate?: string;
  idNumber?: string;
  education?: string;
  nativePlace?: string;
  address?: string;
  phone?: string;
  email?: string;
  position: string;
  department?: string;
  hireDate: string;
  salary?: number;
  insuranceDate?: string;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string;
  idCardBack?: string;
}

export interface EmployeeResponse {
  _id: string;
  name: string;
  gender?: string;
  birthDate?: Date | string;
  idNumber?: string;
  education?: string;
  nativePlace?: string;
  address?: string;
  phone?: string;
  email?: string;
  position: string;
  department?: string;
  hireDate: Date | string;
  salary?: number;
  insuranceDate?: Date | string;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string;
  idCardBack?: string;
  isActive?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 客戶相關 API 型別
 */
export interface CustomerCreateRequest {
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  idCardNumber?: string;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other';
  allergies?: string[];
  membershipLevel?: 'regular' | 'silver' | 'gold' | 'platinum';
  medicalHistory?: string;
  notes?: string;
}

export interface CustomerResponse {
  _id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  idCardNumber?: string;
  birthdate?: Date | string;
  gender?: string;
  allergies?: string[];
  membershipLevel?: string;
  medicalHistory?: string;
  totalPurchases?: number;
  lastPurchaseDate?: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 供應商相關 API 型別
 */
export interface SupplierCreateRequest {
  name: string;
  code?: string;
  shortCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface SupplierResponse {
  _id: string;
  name: string;
  code?: string;
  shortCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 檔案上傳相關型別
 */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    path: string;
    url?: string;
  };
  timestamp: Date | string;
}

/**
 * CSV 匯入相關型別
 */
export interface CSVImportRequest {
  file: File | Express.Multer.File;
  options?: {
    skipHeader?: boolean;
    delimiter?: string;
    encoding?: string;
  };
}

export interface CSVImportResponse {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    successRows: number;
    errorRows: number;
    errors?: Array<{
      row: number;
      error: string;
      data?: any;
    }>;
  };
  timestamp: Date | string;
}

/**
 * 統計報表相關型別
 */
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
  monthlyRevenue: number[];
  topProducts: Array<{
    product: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface ReportParams {
  type?: 'sales' | 'inventory' | 'accounting' | 'employee';
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv' | 'pdf';
  groupBy?: 'day' | 'week' | 'month' | 'year';
  filters?: QueryParams;
}

export interface ReportResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    reportType: string;
    period: {
      startDate: Date | string;
      endDate: Date | string;
    };
    summary: any;
    details: T[];
    generatedAt: Date | string;
  };
  timestamp: Date | string;
}

/**
 * API 配置型別
 */
export interface ApiConfig {
  headers: {
    'x-auth-token'?: string;
    'Content-Type'?: string;
    Authorization?: string;
  };
}