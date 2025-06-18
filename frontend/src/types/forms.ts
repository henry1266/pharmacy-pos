/**
 * 表單型別定義
 */

import { Role } from './entities';

/**
 * 登入表單型別
 */
export interface LoginFormData {
  loginType: 'username' | 'email';
  username: string;
  email: string;
  password: string;
}

/**
 * 員工表單型別
 */
export interface EmployeeFormData {
  // 個人基本資料
  name: string;
  gender: 'male' | 'female' | 'other' | '男' | '女' | '其他';
  birthDate: string;
  idNumber: string;
  education?: string;
  nativePlace?: string;
  
  // 聯絡資訊
  address: string;
  phone: string;
  email?: string;
  
  // 工作資訊
  position: string;
  department: string;
  hireDate: string;
  salary?: string | number;
  insuranceDate?: string;
  
  // 其他資訊
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  
  // 身分證影像
  idCardFront?: File | null;
  idCardBack?: File | null;
  
  // 簽署資訊
  signDate?: string;
}

/**
 * 員工帳號表單型別
 */
export interface EmployeeAccountFormData {
  employeeId: string;
  username: string;
  email?: string;
  password?: string;
  role: Role;
}

/**
 * 產品表單型別
 */
export interface ProductFormData {
  code: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category?: string;
  supplier?: string;
  stock?: number;
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
}

/**
 * 產品分類表單型別
 */
export interface CategoryFormData {
  name: string;
  description?: string;
  parentCategory?: string;
}

/**
 * 供應商表單型別
 */
export interface SupplierFormData {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * 銷售表單型別
 */
export interface SaleFormData {
  saleNumber: string;
  date: string;
  customer?: string;
  items: SaleItemFormData[];
  totalAmount: number;
  discount?: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  notes?: string;
}

/**
 * 銷售項目表單型別
 */
export interface SaleItemFormData {
  product: string;
  quantity: number;
  price: number;
  discount?: number;
  subtotal: number;
  notes?: string;
}

/**
 * 客戶表單型別
 */
export interface CustomerFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * 會計記錄表單型別
 */
export interface AccountingRecordFormData {
  date: string;
  shift: 'morning' | 'afternoon' | 'evening';
  category: string;
  amount: number;
  isExpense: boolean;
  description?: string;
  referenceId?: string;
}

/**
 * 會計分類表單型別
 */
export interface AccountingCategoryFormData {
  name: string;
  isExpense: boolean;
  description?: string;
  order?: number;
}

/**
 * 採購單表單型別
 */
export interface PurchaseOrderFormData {
  orderNumber: string;
  supplier: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItemFormData[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
}

/**
 * 採購項目表單型別
 */
export interface PurchaseOrderItemFormData {
  product: string;
  quantity: number;
  price: number;
  subtotal: number;
  receivedQuantity?: number;
  notes?: string;
}

/**
 * 出貨單表單型別
 */
export interface ShippingOrderFormData {
  orderNumber: string;
  customer: string;
  orderDate: string;
  shippingDate?: string;
  items: ShippingOrderItemFormData[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
}

/**
 * 出貨項目表單型別
 */
export interface ShippingOrderItemFormData {
  product: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}