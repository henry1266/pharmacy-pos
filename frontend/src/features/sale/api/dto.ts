/**
 * Sale API DTO (Data Transfer Objects)
 * 定義 Request/Response 型別
 */
import { Sale, Customer, Product } from '@pharmacy-pos/shared/types/entities';
import type { z } from 'zod';

/**
 * 通用分頁響應介面
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 通用響應介面
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 銷售項目 DTO
 * 用於請求和響應的銷售項目格式
 */
export type SaleItemDto = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/sale').saleItemSchema
>;

/**
 * 前端使用的銷售項目 DTO
 * 包含更多前端需要的資訊
 */
export interface SaleItemWithDetailsDto extends SaleItemDto {
  productDetails?: Product | undefined;
  name: string;
  code: string;
  productType?: string | undefined;
}

/**
 * 創建/更新銷售請求 DTO
 */
export type SaleCreateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/sale').createSaleSchema
>;

/**
 * 銷售響應 DTO
 */
export interface SaleResponseDto extends Sale {
  // 擴展 Sale 介面，可以添加前端特有的屬性
  customerDetails?: Customer;
}

/**
 * 銷售列表查詢參數
 */
export interface SaleQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  customer?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * 銷售統計響應 DTO
 */
export interface SaleStatsResponseDto {
  totalSales: number;
  totalAmount: number;
  averageAmount: number;
  dailySales: {
    date: string;
    count: number;
    amount: number;
  }[];
  paymentMethodStats: {
    method: string;
    count: number;
    amount: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    count: number;
    amount: number;
  }[];
  topCustomers?: {
    customerId: string;
    customerName: string;
    count: number;
    amount: number;
  }[];
}

/**
 * 銷售退款請求 DTO
 */
export interface SaleRefundRequestDto {
  saleId: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
  amount?: number;
  reason?: string;
}

/**
 * 銷售退款響應 DTO
 */
export interface SaleRefundResponseDto {
  refundId: string;
  saleId: string;
  amount: number;
  date: string;
  items?: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  reason?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

/**
 * 前端使用的銷售資料 DTO
 * 對應 SaleData 介面
 */
export interface SaleDataDto {
  customer: string;
  items: SaleItemWithDetailsDto[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | 'credit_card' | 'debit_card' | 'mobile_payment';
  paymentStatus: 'paid' | 'pending' | 'cancelled';
  notes: string;
}

/**
 * 將 SaleResponseDto 轉換為 SaleDataDto
 */
export const mapSaleResponseToSaleData = (sale: SaleResponseDto): SaleDataDto => {
  return {
    customer: typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || '',
    items: sale.items.map(item => {
      const productObj = typeof item.product === 'string' 
        ? undefined 
        : item.product as unknown as Product;
      
      return {
        product: typeof item.product === 'string' ? item.product : (item.product as any)._id,
        productDetails: productObj,
        name: productObj?.name || '',
        code: productObj?.code || '',
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        discount: item.discount,
        productType: (productObj as any)?.productType
      };
    }),
    totalAmount: sale.totalAmount,
    discount: sale.discount || 0,
    paymentMethod: sale.paymentMethod,
    paymentStatus: (sale.paymentStatus || 'paid') as 'paid' | 'pending' | 'cancelled',
    notes: sale.notes || ''
  };
};

/**
 * 將 SaleDataDto 轉換為 SaleRequestDto
 */
export const mapSaleDataToSaleRequest = (saleData: SaleDataDto): SaleCreateRequest => {
  return {
    saleNumber: '', // 後端生成
    date: new Date().toISOString(), // 使用當前日期
    customer: saleData.customer || undefined,
    items: saleData.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      subtotal: item.subtotal
    })),
    totalAmount: saleData.totalAmount,
    discount: saleData.discount,
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus,
    status: saleData.paymentStatus === 'paid' ? 'completed' : saleData.paymentStatus,
    notes: saleData.notes
  };
};
