/**
 * 資料模型型別定義（不依賴 MongoDB）
 */

// 基礎介面
export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// User 模型型別
export interface IUser {
  _id?: string;
  name: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
  settings: Record<string, any>;
  date: Date;
}

// Employee 模型型別
export interface IEmployee extends ITimestamps {
  _id?: string;
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
  userId?: string;
}

// BaseProduct 模型型別
export interface IBaseProduct {
  _id?: string;
  code: string;
  shortCode: string;
  name: string;
  category?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  description?: string;
  supplier?: string;
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

// Sale 模型型別
export interface ISaleItem {
  product: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ISale extends ITimestamps {
  _id?: string;
  saleNumber?: string;
  customer?: string;
  items: ISaleItem[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  notes?: string;
  cashier?: string;
  date: Date;
  finalAmount: number;
  saleDate: Date;
}

// PurchaseOrder 模型型別
export interface IPurchaseOrderItem {
  _id?: string;
  product: string;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

export interface IPurchaseOrder {
  _id?: string;
  poid: string;
  orderNumber: string;
  pobill?: string;
  pobilldate?: Date;
  posupplier: string;
  supplier?: string;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未付' | '已下收' | '已匯款';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ShippingOrder 模型型別
export interface IShippingOrderItem {
  _id?: string;
  product: string;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

export interface IShippingOrder {
  _id?: string;
  soid: string;
  orderNumber: string;
  sosupplier: string;
  supplier?: string;
  items: IShippingOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未收' | '已收款' | '已開立';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory 模型型別（庫存異動記錄）
export interface IInventory {
  _id?: string;
  product: string;
  quantity: number;
  totalAmount: number;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'ship';
  saleId?: string;
  saleNumber?: string;
  shippingOrderId?: string;
  shippingOrderNumber?: string;
  accountingId?: string;
  lastUpdated: Date;
}

// Accounting 模型型別（記帳系統）
export interface IAccountingItem {
  amount: number;
  category: string;
  categoryId?: string;
  notes?: string;
}

export interface IAccounting extends ITimestamps {
  _id?: string;
  date: Date;
  status: 'pending' | 'completed';
  shift: '早' | '中' | '晚';
  items: IAccountingItem[];
  totalAmount: number;
  createdBy: string;
}

// Customer 模型型別
export interface ICustomer extends ITimestamps {
  _id?: string;
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

// Supplier 模型型別
export interface ISupplier {
  _id?: string;
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

// ProductCategory 模型型別
export interface IProductCategory extends ITimestamps {
  _id?: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

// AccountingCategory 模型型別
export interface IAccountingCategory extends ITimestamps {
  _id?: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

// MonitoredProduct 模型型別
export interface IMonitoredProduct {
  _id?: string;
  productCode: string;
  addedBy?: string;
  addedAt: Date;
}

// EmployeeSchedule 模型型別
export interface IEmployeeSchedule extends ITimestamps {
  _id?: string;
  date: Date;
  shift: "morning" | "afternoon" | "evening";
  employeeId: string;
  leaveType?: "sick" | "personal" | "overtime" | null;
  createdBy?: string;
}

// OvertimeRecord 模型型別
export interface IOvertimeRecord {
  _id?: string;
  employee: string;
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  hourlyRate?: number;
  totalPay?: number;
  createdAt: Date;
  updatedAt: Date;
}