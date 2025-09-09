import mongoose from 'mongoose';
import { SaleCreateRequest } from '@pharmacy-pos/shared/types/api';

// 使用 shared 的 SaleCreateRequest，並擴展本地需要的欄位
export interface SaleCreationRequest extends SaleCreateRequest {
  productName?: string; // 向後兼容
  finalAmount?: number;
  cashier?: string;
}

// 定義更具體的型別
// 使用 Record<string, any> 來避免 _id 型別衝突
export type SaleDocument = mongoose.Document & Record<string, any>;

export interface ValidationResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  sale?: SaleDocument;
}

export interface CustomerCheckResult {
  exists: boolean;
  error?: ValidationResult;
}

export interface ProductCheckResult {
  exists: boolean;
  product?: mongoose.Document;
  error?: ValidationResult;
}

export interface InventoryCheckResult {
  success: boolean;
  error?: ValidationResult;
}

// 更靈活的銷售項目型別
export interface SaleItemInput {
  product: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  discount?: number;
  subtotal?: number;
  notes?: string;
}

export interface SaleFieldsInput {
  saleNumber: string;
  customer?: string;
  items: SaleItemInput[];
  totalAmount: number;
  discount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  cashier?: string;
}

export interface SaleItem {
  product: string | mongoose.Types.ObjectId;
  quantity: number;
  subtotal?: number;
}