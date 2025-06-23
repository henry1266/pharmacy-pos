/**
 * 共享業務實體型別定義
 * 這些型別在前後端都會使用
 */

/**
 * 基礎時間戳記介面
 */
export interface ITimestamps {
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 員工相關型別
 */
export interface Employee {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  position: string;
  hireDate: string | Date;
  birthDate?: string | Date;
  idNumber?: string;
  gender?: 'male' | 'female' | 'other' | '男' | '女' | '其他';
  department?: string;
  salary?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface EmployeeAccount {
  _id: string;
  employeeId: string;
  username: string;
  email?: string;
  password?: string; // 通常不會在前端顯示
  role: Role;
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type Role = 'admin' | 'pharmacist' | 'staff';

export interface EmployeeWithAccount extends Employee {
  account: EmployeeAccount | null;
}

/**
 * 產品相關型別
 */
export interface BaseProduct {
  _id: string;
  code: string;
  shortCode?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  category?: string; // 分類ID
  categoryName?: string; // 分類名稱，可能在API回傳時附加
  supplier?: string; // 供應商ID
  supplierName?: string; // 供應商名稱，可能在API回傳時附加
  stock?: number;
  minStock?: number;
  unit: string;
  barcode?: string;
  isMonitored?: boolean;
  isMedicine?: boolean;
  productType?: 'product' | 'medicine';
  isActive?: boolean;
  date?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Product extends BaseProduct {
  medicineInfo?: {
    licenseNumber?: string;
    ingredients?: string;
    dosage?: string;
    sideEffects?: string;
    contraindications?: string;
  };
}

export interface Medicine extends BaseProduct {
  healthInsuranceCode?: string;
  healthInsurancePrice?: number;
  medicineInfo?: {
    licenseNumber?: string;
    ingredients?: string;
    dosage?: string;
    sideEffects?: string;
    contraindications?: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: string; // 父分類ID
  order?: number;
  isActive?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Supplier {
  _id: string;
  code?: string;
  shortCode?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  date?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 銷售相關型別
 */
export interface Sale {
  _id: string;
  saleNumber: string;
  date: string | Date;
  customer?: string | Customer; // 客戶ID或客戶對象
  items: SaleItem[];
  totalAmount: number;
  discount?: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | 'credit_card' | 'debit_card' | 'mobile_payment';
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'cancelled';
  status?: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  note?: string;
  cashier?: string; // 創建者ID
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SaleItem {
  _id?: string;
  product: string | Product; // 產品ID或產品對象
  quantity: number;
  price: number;
  unitPrice?: number;
  discount?: number;
  subtotal: number;
  notes?: string;
}

export interface Customer {
  _id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  idCardNumber?: string;
  birthdate?: string | Date;
  gender?: 'male' | 'female' | 'other';
  allergies?: string[];
  membershipLevel?: 'regular' | 'silver' | 'gold' | 'platinum';
  medicalHistory?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string | Date;
  notes?: string;
  date?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 庫存相關型別
 */
export interface Inventory {
  _id: string;
  product: string | Product; // 產品ID或產品對象
  quantity: number;
  totalAmount?: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'ship';
  referenceId?: string; // 參考ID（如銷售ID、採購ID等）
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  saleId?: string;
  saleNumber?: string;
  shippingOrderId?: string;
  shippingOrderNumber?: string;
  accountingId?: string;
  date: string | Date;
  lastUpdated?: string | Date;
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StockMovement {
  _id: string;
  product: string | Product; // 產品ID或產品對象
  previousStock: number;
  changeAmount: number;
  currentStock: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  referenceId?: string; // 參考ID（如銷售ID、採購ID等）
  date: string | Date;
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 會計相關型別
 */
export interface AccountingRecord {
  _id: string;
  date: string | Date;
  shift: 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚';
  category: string | AccountingCategory; // 分類ID或分類對象
  amount: number;
  isExpense: boolean;
  type?: 'income' | 'expense';
  description?: string;
  referenceId?: string; // 參考ID（如銷售ID等）
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AccountingCategory {
  _id: string;
  name: string;
  isExpense: boolean;
  description?: string;
  order?: number;
  isActive?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AccountingItem {
  amount: number;
  category: string;
  categoryId?: string;
  note?: string;
}

export interface Accounting {
  _id: string;
  date: string | Date;
  status: 'pending' | 'completed';
  shift: '早' | '中' | '晚';
  items: AccountingItem[];
  totalAmount: number;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Transaction {
  _id: string;
  date: string | Date;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string | AccountingCategory; // 分類ID或分類對象
  description?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  referenceId?: string; // 參考ID（如銷售ID等）
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 採購相關型別
 */
export interface PurchaseOrder {
  _id: string;
  poid?: string;
  orderNumber: string;
  pobill?: string;
  pobilldate?: string | Date;
  posupplier?: string;
  supplier: string | Supplier; // 供應商ID或供應商對象
  orderDate: string | Date;
  expectedDeliveryDate?: string | Date;
  actualDeliveryDate?: string | Date;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled' | 'completed';
  paymentStatus?: '未付' | '已下收' | '已匯款';
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PurchaseOrderItem {
  _id?: string;
  product: string | Product; // 產品ID或產品對象
  did?: string;
  dname?: string;
  quantity: number;
  dquantity?: number;
  price: number;
  unitPrice?: number;
  subtotal: number;
  dtotalCost?: number;
  receivedQuantity?: number;
  notes?: string;
}

/**
 * 出貨相關型別
 */
export interface ShippingOrder {
  _id: string;
  soid?: string;
  orderNumber: string;
  sosupplier?: string;
  customer?: string | Customer; // 客戶ID或客戶對象
  customerName?: string;
  supplier?: string | Supplier; // 供應商ID或供應商對象
  orderDate: string | Date;
  shippingDate?: string | Date;
  deliveryDate?: string | Date;
  items: ShippingOrderItem[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus?: '未收' | '已收款' | '已開立';
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ShippingOrderItem {
  _id?: string;
  product: string | Product; // 產品ID或產品對象
  did?: string;
  dname?: string;
  quantity: number;
  dquantity?: number;
  price: number;
  unitPrice?: number;
  subtotal: number;
  dtotalCost?: number;
  notes?: string;
}

/**
 * 監控產品相關型別
 */
export interface MonitoredProduct {
  _id: string;
  productCode: string;
  addedBy?: string;
  addedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 員工排班相關型別
 */
export interface EmployeeSchedule {
  _id: string;
  date: string | Date;
  shift: 'morning' | 'afternoon' | 'evening';
  employeeId: string;
  leaveType?: 'sick' | 'personal' | 'overtime' | null;
  createdBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 加班記錄相關型別
 */
export interface OvertimeRecord {
  _id: string;
  employee: string | {
    _id: string;
    name: string;
    [key: string]: any;
  };
  employeeId?: string; // 向後兼容前端組件
  date: string | Date;
  startTime?: string;
  endTime?: string;
  hours: number;
  reason?: string;
  description?: string; // 向後兼容前端組件
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string | Date;
  rejectionReason?: string;
  hourlyRate?: number;
  totalPay?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}