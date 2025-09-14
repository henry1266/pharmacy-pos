import { ShippingOrder } from '@pharmacy-pos/shared/types/entities';
import type { ShippingOrderCreateRequest, ShippingOrderUpdateRequest } from '@pharmacy-pos/shared/types/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ShippingOrderQueryParams {
  search?: string;
  supplier?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ShippingOrderResponseDto = ShippingOrder;
export type ShippingOrderCreateDto = ShippingOrderCreateRequest;
export type ShippingOrderUpdateDto = ShippingOrderUpdateRequest;

