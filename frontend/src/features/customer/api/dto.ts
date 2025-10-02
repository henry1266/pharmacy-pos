import { Customer } from '@pharmacy-pos/shared/types/entities';
import type { z } from 'zod';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CustomerCreateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/customer').createCustomerSchema
>;

export type CustomerUpdateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/customer').updateCustomerSchema
>;

export type CustomerQueryParams = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/customer').customerSearchSchema
>;

export type CustomerResponseDto = Customer;

