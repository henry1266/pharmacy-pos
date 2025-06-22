import { Document, Types } from 'mongoose';

// 基礎介面
export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// User 模型型別
export interface IUser {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'employee';
  isActive: boolean;
  lastLogin?: Date;
  settings?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
}

export interface IUserDocument extends IUser, Document, ITimestamps {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Employee 模型型別
export interface IEmployee {
  employeeId: string;
  name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  hireDate: Date;
  salary?: number;
  isActive: boolean;
  workSchedule?: {
    monday?: { start: string; end: string; };
    tuesday?: { start: string; end: string; };
    wednesday?: { start: string; end: string; };
    thursday?: { start: string; end: string; };
    friday?: { start: string; end: string; };
    saturday?: { start: string; end: string; };
    sunday?: { start: string; end: string; };
  };
}

export interface IEmployeeDocument extends IEmployee, Document, ITimestamps {
  _id: Types.ObjectId;
  getWorkExperience(): number;
  hasWorkSchedule(): boolean;
  getWorkDays(): string[];
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
}

export interface ISale {
  saleNumber?: string;
  customer?: Types.ObjectId;
  items: ISaleItem[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  note?: string;
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

// PurchaseOrder 模型型別
export interface IPurchaseOrderItem {
  product: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IPurchaseOrder {
  orderNumber: string;
  supplier: Types.ObjectId;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  createdBy: Types.ObjectId;
  notes?: string;
}

export interface IPurchaseOrderDocument extends IPurchaseOrder, Document, ITimestamps {
  _id: Types.ObjectId;
  calculateTotalAmount(): number;
  validateItemSubtotals(): boolean;
  updateStatus(newStatus: string, deliveryDate?: Date): void;
  isOverdue(): boolean;
}

// ShippingOrder 模型型別
export interface IShippingOrderItem {
  product: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface IShippingOrder {
  orderNumber: string;
  customer?: Types.ObjectId;
  customerName?: string;
  items: IShippingOrderItem[];
  totalAmount?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingDate?: Date;
  deliveryDate?: Date;
  shippingAddress?: string;
  trackingNumber?: string;
  createdBy: Types.ObjectId;
  notes?: string;
}

export interface IShippingOrderDocument extends IShippingOrder, Document, ITimestamps {
  _id: Types.ObjectId;
  calculateTotalAmount(): number;
  updateStatus(newStatus: string, date?: Date): void;
  setTrackingNumber(trackingNumber: string): void;
  isOverdue(): boolean;
  getDeliveryDays(): number | null;
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
  calculateRunningBalance(): Promise<number>;
  getRelatedTransactions(): Promise<{
    purchases: number;
    sales: number;
    adjustments: number;
  }>;
}

// Accounting 模型型別 (記帳系統)
export interface IAccountingItem {
  amount: number;
  category: string;
  categoryId?: Types.ObjectId;
  note?: string;
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
  note?: string;
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
  updateOrder(newOrder: number): void;
  toggleActive(): void;
}

// AccountingCategory 模型型別
export interface IAccountingCategory {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface IAccountingCategoryDocument extends IAccountingCategory, Document, ITimestamps {
  _id: Types.ObjectId;
  updateOrder(newOrder: number): void;
  toggleActive(): void;
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

// OvertimeRecord 模型型別
export interface IOvertimeRecord {
  employee: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  overtimeHours: number;
  reason?: string;
  approvedBy?: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface IOvertimeRecordDocument extends IOvertimeRecord, Document, ITimestamps {
  _id: Types.ObjectId;
}