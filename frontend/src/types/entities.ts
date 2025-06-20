/**
 * 業務實體型別定義
 */

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
export interface Product {
  _id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category?: string; // 分類ID
  categoryName?: string; // 分類名稱，可能在API回傳時附加
  supplier?: string; // 供應商ID
  supplierName?: string; // 供應商名稱，可能在API回傳時附加
  stock: number;
  unit: string;
  barcode?: string;
  isMonitored?: boolean;
  isMedicine?: boolean;
  medicineInfo?: {
    licenseNumber?: string;
    ingredients?: string;
    dosage?: string;
    sideEffects?: string;
    contraindications?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: string; // 父分類ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
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
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SaleItem {
  _id?: string;
  product: string | Product; // 產品ID或產品對象
  quantity: number;
  price: number;
  discount?: number;
  subtotal: number;
  notes?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
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
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  referenceId?: string; // 參考ID（如銷售ID、採購ID等）
  date: string | Date;
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
  shift: 'morning' | 'afternoon' | 'evening';
  category: string | AccountingCategory; // 分類ID或分類對象
  amount: number;
  isExpense: boolean;
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
  orderNumber: string;
  supplier: string | Supplier; // 供應商ID或供應商對象
  orderDate: string | Date;
  expectedDeliveryDate?: string | Date;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PurchaseOrderItem {
  _id?: string;
  product: string | Product; // 產品ID或產品對象
  quantity: number;
  price: number;
  subtotal: number;
  receivedQuantity?: number;
  notes?: string;
}

/**
 * 出貨相關型別
 */
export interface ShippingOrder {
  _id: string;
  orderNumber: string;
  customer: string | Customer; // 客戶ID或客戶對象
  orderDate: string | Date;
  shippingDate?: string | Date;
  items: ShippingOrderItem[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdBy?: string; // 創建者ID
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ShippingOrderItem {
  _id?: string;
  product: string | Product; // 產品ID或產品對象
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}