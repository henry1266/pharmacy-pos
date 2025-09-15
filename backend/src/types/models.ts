import { Document, Types } from 'mongoose';
import { AccountingItem, AccountingCategory } from '@pharmacy-pos/shared/types/accounting';

// 基礎介面
export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// User 模型型別 (與實際模型一致)
export interface IUser {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
  settings: Record<string, any>;
  date: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

// Employee 模型型別 (與實際模型一致)
export interface IEmployee {
  name: string;
  gender: 'male' | 'female';
  birthDate: Date;
  idNumber: string;
  education?: string;
  nativePlace?: string;
  address: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  insuranceDate?: Date;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string;
  idCardBack?: string;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeDocument extends IEmployee, Document {
  _id: Types.ObjectId;
}

// BaseProduct 模型型別 (與實際資料庫結構一致)
export interface IBaseProduct {
  code: string;
  shortCode: string;
  name: string;
  category?: Types.ObjectId;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  description?: string;
  supplier?: Types.ObjectId;
  minStock: number;
  productType: 'product' | 'medicine';
  date: Date;
  isActive: boolean;
}

export interface IProduct extends IBaseProduct {
  barcode?: string;
}

export interface IMedicine extends IBaseProduct {
  barcode?: string;
  healthInsuranceCode?: string;
  healthInsurancePrice: number;
}

export interface IBaseProductDocument extends IBaseProduct, Document, ITimestamps {
  _id: Types.ObjectId;
}

// Product 和 Medicine 的 Document 型別
export interface IProductDocument extends IBaseProductDocument, IProduct {}
export interface IMedicineDocument extends IBaseProductDocument, IMedicine {}

// Sale 模型型別 (與實際資料庫結構一致)
export interface ISaleItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export interface ISale {
  saleNumber?: string;
  customer?: Types.ObjectId;
  items: ISaleItem[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other' | 'transfer' | 'card';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  notes?: string;
  cashier?: Types.ObjectId;
  date: Date;
}

export interface ISaleDocument extends ISale, Document, ITimestamps {
  _id: Types.ObjectId;
  calculateTotalAmount(): number;
  validateItemSubtotals(): boolean;
  finalAmount: number;
  saleDate: Date;
}

// PurchaseOrder 模型型別 (與實際模型一致)
export interface IPurchaseOrderItem {
  product: Types.ObjectId;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

export interface IPurchaseOrder {
  poid: string;
  orderNumber: string;
  pobill?: string;
  pobilldate?: Date;
  posupplier: string;
  supplier?: Types.ObjectId;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未付' | '已下收' | '已匯款';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseOrderDocument extends IPurchaseOrder, Document {
  _id: Types.ObjectId;
  items: IPurchaseOrderItemDocument[];
}

export interface IPurchaseOrderItemDocument extends IPurchaseOrderItem, Document {
  _id: Types.ObjectId;
}

// ShippingOrder 模型型別 (與實際模型一致)
export interface IShippingOrderItem {
  product: Types.ObjectId;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

export interface IShippingOrder {
  soid: string;
  orderNumber: string;
  sosupplier: string;
  supplier?: Types.ObjectId;
  items: IShippingOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未收' | '已收款' | '已開立';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShippingOrderDocument extends IShippingOrder, Document {
  _id: Types.ObjectId;
  items: IShippingOrderItemDocument[];
}

export interface IShippingOrderItemDocument extends IShippingOrderItem, Document {
  _id: Types.ObjectId;
}

// Inventory 模型型別 (庫存異動記錄)
export interface IInventory {
  product: Types.ObjectId;
  quantity: number;
  totalAmount: number;
  purchaseOrderId?: Types.ObjectId;
  purchaseOrderNumber?: string;
  type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'ship';
  saleId?: Types.ObjectId;
  saleNumber?: string;
  shippingOrderId?: Types.ObjectId;
  shippingOrderNumber?: string;
  accountingId?: Types.ObjectId;
  lastUpdated: Date;
}

export interface IInventoryDocument extends IInventory, Document {
  _id: Types.ObjectId;
  calculateRunningBalance?(): Promise<number>;
  getRelatedTransactions?(): Promise<{
    purchases: number;
    sales: number;
    adjustments: number;
  }>;
}

// Accounting 模型型別 (記帳系統)
// 使用 shared 型別，確保前後端一致
export interface IAccountingItem extends Omit<AccountingItem, 'categoryId'> {
  categoryId?: Types.ObjectId; // backend 使用 ObjectId
}

export interface IAccounting {
  date: Date;
  status: 'pending' | 'completed';
  shift: '早' | '中' | '晚';
  items: IAccountingItem[];
  totalAmount: number;
  createdBy: Types.ObjectId | string; // Mixed type for compatibility
}

export interface IAccountingDocument extends IAccounting, Document, ITimestamps {
  _id: Types.ObjectId;
  calculateTotalAmount(): number;
  addItem(item: IAccountingItem): void;
  removeItem(index: number): void;
  updateStatus(status: 'pending' | 'completed'): void;
}

// Customer 模型型別 (與實際資料庫結構一致)
export interface ICustomer {
  date: Date;
  name: string;
  code: string;
  phone: string;
  allergies: string[];
  idCardNumber: string;
  membershipLevel: "regular" | "silver" | "gold" | "platinum";
  email?: string;
  address?: string;
  birthdate?: Date;
  gender?: "other" | "male" | "female";
  medicalHistory?: string;
  notes?: string;
  totalPurchases?: number;
  lastPurchaseDate?: Date;
}

export interface ICustomerDocument extends ICustomer, Document, ITimestamps {
  _id: Types.ObjectId;
  updatePurchaseRecord(amount: number): void;
  getAge(): number | null;
  isActiveCustomer(days?: number): boolean;
  getCustomerTier(): string;
}

// Supplier 模型型別
export interface ISupplier {
  code: string;
  shortCode: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  date: Date;
}

export interface ISupplierDocument extends ISupplier, Document {
  _id: Types.ObjectId;
  updateSupplierInfo(data: Partial<ISupplier>): void;
  getSupplierSummary(): {
    code: string;
    name: string;
    contactPerson?: string;
    totalOrders?: number;
  };
}

// ProductCategory 模型型別
export interface IProductCategory {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface IProductCategoryDocument extends IProductCategory, Document, ITimestamps {
  _id: Types.ObjectId;
  updateOrder?(newOrder: number): void;
  toggleActive?(): void;
}

// AccountingCategory 模型型別
// 使用 shared 型別，確保前後端一致
export interface IAccountingCategory extends Omit<AccountingCategory, '_id' | 'createdAt' | 'updatedAt'> {
  // 繼承 shared 型別，移除 Document 相關屬性
}

export interface IAccountingCategoryDocument extends IAccountingCategory, Document, ITimestamps {
  _id: Types.ObjectId;
  updateOrder?(newOrder: number): void;
  toggleActive?(): void;
}

// MonitoredProduct 模型型別
export interface IMonitoredProduct {
  productCode: string;
  addedBy?: Types.ObjectId;
  addedAt: Date;
}

export interface IMonitoredProductDocument extends IMonitoredProduct, Document {
  _id: Types.ObjectId;
  isProductCodeValid(): Promise<boolean>;
  getProductInfo(): Promise<any>;
}

// EmployeeSchedule 模型型別 (與實際資料庫結構一致)
export interface IEmployeeSchedule {
  date: Date;
  shift: "morning" | "afternoon" | "evening";
  employeeId: Types.ObjectId;
  leaveType?: "sick" | "personal" | "overtime" | null;
  createdBy?: Types.ObjectId;
}

export interface IEmployeeScheduleDocument extends IEmployeeSchedule, Document, ITimestamps {
  _id: Types.ObjectId;
}

// OvertimeRecord 模型型別 (與實際模型一致)
export interface IOvertimeRecord {
  employee: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  hourlyRate?: number;
  totalPay?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOvertimeRecordDocument extends IOvertimeRecord, Document {
  _id: Types.ObjectId;
}
