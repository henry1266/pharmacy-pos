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
}

// BaseProduct 模型型別
export interface IBaseProduct {
  productCode: string;
  productName: string;
  category: Types.ObjectId;
  description?: string;
  unit: string;
  isActive: boolean;
  tags?: string[];
}

export interface IProduct extends IBaseProduct {
  costPrice: number;
  sellingPrice: number;
  supplier?: Types.ObjectId;
  minStock?: number;
  maxStock?: number;
}

export interface IMedicine extends IBaseProduct {
  activeIngredient?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  licenseNumber?: string;
  expiryDate?: Date;
  storageConditions?: string;
  prescriptionRequired: boolean;
}

export interface IBaseProductDocument extends IBaseProduct, Document, ITimestamps {
  _id: Types.ObjectId;
}

// Sale 模型型別
export interface ISaleItem {
  product: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount?: number;
}

export interface ISale {
  saleNumber: string;
  customer?: Types.ObjectId;
  items: ISaleItem[];
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  saleDate: Date;
  cashier: Types.ObjectId;
  notes?: string;
}

export interface ISaleDocument extends ISale, Document, ITimestamps {
  _id: Types.ObjectId;
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
}

// Inventory 模型型別
export interface IInventoryMovement {
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  reference?: string;
  referenceId?: Types.ObjectId;
  date: Date;
  notes?: string;
}

export interface IInventory {
  product: Types.ObjectId;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  averageCost: number;
  lastMovement?: Date;
  movements: IInventoryMovement[];
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface IInventoryDocument extends IInventory, Document, ITimestamps {
  _id: Types.ObjectId;
}

// Accounting 模型型別
export interface IAccounting {
  transactionNumber: string;
  category: Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: Date;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  reference?: string;
  referenceId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  tags?: string[];
}

export interface IAccountingDocument extends IAccounting, Document, ITimestamps {
  _id: Types.ObjectId;
}

// Customer 模型型別
export interface ICustomer {
  customerCode: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  isActive: boolean;
  totalPurchases?: number;
  lastPurchaseDate?: Date;
}

export interface ICustomerDocument extends ICustomer, Document, ITimestamps {
  _id: Types.ObjectId;
}

// Supplier 模型型別
export interface ISupplier {
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  totalOrders?: number;
  lastOrderDate?: Date;
}

export interface ISupplierDocument extends ISupplier, Document, ITimestamps {
  _id: Types.ObjectId;
}

// ProductCategory 模型型別
export interface IProductCategory {
  categoryCode: string;
  name: string;
  description?: string;
  parentCategory?: Types.ObjectId;
  isActive: boolean;
  sortOrder?: number;
}

export interface IProductCategoryDocument extends IProductCategory, Document, ITimestamps {
  _id: Types.ObjectId;
}

// AccountingCategory 模型型別
export interface IAccountingCategory {
  categoryCode: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  parentCategory?: Types.ObjectId;
  isActive: boolean;
  sortOrder?: number;
}

export interface IAccountingCategoryDocument extends IAccountingCategory, Document, ITimestamps {
  _id: Types.ObjectId;
}

// MonitoredProduct 模型型別
export interface IMonitoredProduct {
  product: Types.ObjectId;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  isActive: boolean;
  lastChecked?: Date;
  alertSent?: boolean;
}

export interface IMonitoredProductDocument extends IMonitoredProduct, Document, ITimestamps {
  _id: Types.ObjectId;
}

// EmployeeSchedule 模型型別
export interface IEmployeeSchedule {
  employee: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  breakTime?: number;
  workHours: number;
  status: 'scheduled' | 'completed' | 'absent' | 'cancelled';
  notes?: string;
  createdBy: Types.ObjectId;
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