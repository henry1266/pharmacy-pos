import { Types } from 'mongoose';

// 基礎 API 回應型別
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: Date;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  timestamp: Date;
}

// 分頁相關型別
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: Date;
}

// 認證相關型別
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      role: string;
      isAdmin?: boolean;
    };
    expiresIn: string;
  };
  timestamp: Date;
}

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

// 查詢參數型別
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

// 產品相關 API 型別
export interface ProductCreateRequest {
  productCode: string;
  productName: string;
  category: string;
  description?: string;
  unit: string;
  costPrice?: number;
  sellingPrice?: number;
  supplier?: string;
  minStock?: number;
  maxStock?: number;
  tags?: string[];
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {}

export interface ProductResponse {
  _id: string;
  productCode: string;
  productName: string;
  category: {
    _id: string;
    name: string;
  };
  description?: string;
  unit: string;
  costPrice?: number;
  sellingPrice?: number;
  supplier?: {
    _id: string;
    name: string;
  };
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 銷售相關 API 型別
export interface SaleCreateRequest {
  customer?: string;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  discountAmount?: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
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
    product: {
      _id: string;
      productName: string;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discount?: number;
  }>;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  saleDate: Date;
  cashier: {
    _id: string;
    username: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 採購訂單相關 API 型別
export interface PurchaseOrderCreateRequest {
  supplier: string;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
  }>;
  expectedDeliveryDate?: string;
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
    product: {
      _id: string;
      productName: string;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  status: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  createdBy: {
    _id: string;
    username: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 出貨訂單相關 API 型別
export interface ShippingOrderCreateRequest {
  customer?: string;
  customerName?: string;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice?: number;
  }>;
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
    product: {
      _id: string;
      productName: string;
    };
    quantity: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  totalAmount?: number;
  status: string;
  shippingDate?: Date;
  deliveryDate?: Date;
  shippingAddress?: string;
  trackingNumber?: string;
  createdBy: {
    _id: string;
    username: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 庫存相關 API 型別
export interface InventoryResponse {
  _id: string;
  product: {
    _id: string;
    productCode: string;
    productName: string;
  };
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  averageCost: number;
  lastMovement?: Date;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovementRequest {
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
}

// 會計相關 API 型別
export interface AccountingCreateRequest {
  category: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  reference?: string;
  tags?: string[];
}

export interface AccountingResponse {
  _id: string;
  transactionNumber: string;
  category: {
    _id: string;
    name: string;
    type: string;
  };
  type: string;
  amount: number;
  description: string;
  transactionDate: Date;
  paymentMethod?: string;
  reference?: string;
  createdBy: {
    _id: string;
    username: string;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 員工相關 API 型別
export interface EmployeeCreateRequest {
  employeeId: string;
  name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  hireDate: string;
  salary?: number;
}

export interface EmployeeResponse {
  _id: string;
  employeeId: string;
  name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  hireDate: Date;
  salary?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 檔案上傳相關型別
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
  timestamp: Date;
}

// CSV 匯入相關型別
export interface CSVImportRequest {
  file: Express.Multer.File;
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
  timestamp: Date;
}

// 統計報表相關型別
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
  type: 'sales' | 'inventory' | 'accounting' | 'employee';
  startDate: string;
  endDate: string;
  format?: 'json' | 'csv' | 'pdf';
  filters?: QueryParams;
}

export interface ReportResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    reportType: string;
    period: {
      startDate: Date;
      endDate: Date;
    };
    summary: any;
    details: T[];
    generatedAt: Date;
  };
  timestamp: Date;
}