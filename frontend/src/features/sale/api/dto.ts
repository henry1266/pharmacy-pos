import type { z } from 'zod';
import type { Sale, Customer, Product } from '@pharmacy-pos/shared/types/entities';
import type { PaymentMethod, PaymentStatus } from '@pharmacy-pos/shared/schemas/zod/sale';
import type { ApiResponse as SharedApiResponse } from '@pharmacy-pos/shared/types/api';
import {
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_PAYMENT_STATUS,
  ensurePaymentMethod,
  ensurePaymentStatus,
} from '../constants/payment';


/** Shared API response type (derived from shared module) */
export type ApiResponse<T> = SharedApiResponse<T>;

/**
 * 銷售項目 DTO
 * 用於請求和響應的銷售項目格式
 */
export type SaleItemDto = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/sale').saleItemSchema
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
  typeof import('@pharmacy-pos/shared/schemas/zod/sale').createSaleSchema
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
export type SaleQueryParams = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/sale').saleQuerySchema
>;

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
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string;
}

/**
 * 將 SaleResponseDto 轉換為 SaleDataDto
 */
export const mapSaleResponseToSaleData = (sale: SaleResponseDto): SaleDataDto => {
  const discountAmount = sale.discountAmount ?? sale.discount ?? 0;
  return {
    customer: typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || '',
    items: sale.items.map((item) => {
      const productObj = typeof item.product === 'string'
        ? undefined
        : (item.product as unknown as Product);

      const mappedItem: SaleItemWithDetailsDto = {
        product: typeof item.product === 'string' ? item.product : (item.product as any)._id,
        productDetails: productObj,
        name: productObj?.name || '',
        code: productObj?.code || '',
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        productType: (productObj as any)?.productType,
      };

      if (item.discount !== undefined && item.discount !== null) {
        mappedItem.discount = Number(item.discount);
      }

      return mappedItem;
    }),
    totalAmount: sale.totalAmount,
    discount: sale.discount ?? discountAmount,
    discountAmount,
    paymentMethod: ensurePaymentMethod(sale.paymentMethod, DEFAULT_PAYMENT_METHOD),
    paymentStatus: ensurePaymentStatus(
      sale.paymentStatus ?? DEFAULT_PAYMENT_STATUS,
      DEFAULT_PAYMENT_STATUS,
    ),
    notes: sale.notes || '',
  };
};

/**
 * 將 SaleDataDto 轉換為 SaleRequestDto
 */
export const mapSaleDataToSaleRequest = (saleData: SaleDataDto): SaleCreateRequest => {
  return {
    // saleNumber 由後端產生，僅在需要覆寫時由呼叫方補上
    date: new Date().toISOString(), // 使用當前日期
    customer: saleData.customer || undefined,
    items: saleData.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      subtotal: item.subtotal,
    })),
    totalAmount: saleData.totalAmount,
    discount: saleData.discount,
    ...(saleData.discountAmount !== undefined ? { discountAmount: saleData.discountAmount } : {}),
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus,
    notes: saleData.notes,
  };
};
