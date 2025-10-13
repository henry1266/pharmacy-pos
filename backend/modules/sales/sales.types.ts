import mongoose from 'mongoose';
import { SaleCreateRequest } from '@pharmacy-pos/shared/types/api';
import type {
  PaymentMethod,
  PaymentStatus,
  SaleLifecycleStatus,
} from '@pharmacy-pos/shared/schemas/zod/sale';
import { ISaleDocument } from '../../src/types/models';

// Keep parity with the shared SaleCreateRequest contract
export type SaleCreationRequest = SaleCreateRequest;
// 定義更具體的型別
// 使用 Record<string, any> 來避免 _id 型別衝突
export type SaleDocument = ISaleDocument;

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
  price?: number | undefined;
  unitPrice?: number | undefined;
  discount?: number | undefined;
  subtotal?: number | undefined;
  notes?: string | undefined;
}

export interface SaleFieldsInput {
  saleNumber: string;
  customer?: string | undefined;
  items: SaleItemInput[];
  totalAmount: number;
  discount?: number | undefined;
  discountAmount?: number | undefined;
  paymentMethod?: PaymentMethod | undefined;
  paymentStatus?: PaymentStatus | undefined;
  status?: SaleLifecycleStatus | undefined;
  notes?: string | undefined;
  cashier?: string | undefined;
  date?: Date | string | undefined;
  createdBy?: string | undefined;
  user?: string | undefined;
}

export interface SaleItem {
  product: string | mongoose.Types.ObjectId;
  quantity: number;
  subtotal?: number;
}

