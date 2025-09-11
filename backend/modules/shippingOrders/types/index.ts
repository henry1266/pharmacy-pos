import { Types } from 'mongoose';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';

// 定義產品介面
export interface ProductDocument {
  _id: Types.ObjectId;
  code: string;
  name: string;
  healthInsuranceCode?: string;
}

// 定義出貨單項目介面
export interface ShippingOrderItem {
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  product?: Types.ObjectId | ProductDocument;
  healthInsuranceCode?: string;
  batchNumber?: string;
  packageQuantity?: number;
  boxQuantity?: number;
  unit?: string;
}

// 定義出貨單文檔介面
export interface ShippingOrderDocument {
  _id: Types.ObjectId;
  soid: string;
  orderNumber: string;
  sosupplier: string;
  supplier?: Types.ObjectId;
  items: ShippingOrderItem[];
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: string;
  totalAmount?: number;
  createdAt: Date;
  toObject(): any;
}

// 定義出貨單請求介面
export interface ShippingOrderRequest {
  soid?: string;
  sosupplier: string;
  supplier?: Types.ObjectId | string;
  items: ShippingOrderItem[];
  notes?: string;
  status?: 'pending' | 'completed';
  paymentStatus?: string;
  sobill?: string;
  socustomer?: string;
  customer?: Types.ObjectId;
  // 添加大包裝相關屬性
  packageQuantity?: number;
  boxQuantity?: number;
  unit?: string;
}

// 定義 API 響應類型
export type ShippingOrderResponse = ApiResponse<ShippingOrderDocument | ShippingOrderDocument[] | null>;
export type ShippingOrderErrorResponse = ErrorResponse;