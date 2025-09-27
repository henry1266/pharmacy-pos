import { Supplier } from '@pharmacy-pos/shared/types/entities';
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

export type SupplierCreateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/supplier').createSupplierSchema
>;

export type SupplierUpdateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/supplier').updateSupplierSchema
>;

export type SupplierQueryParams = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/supplier').supplierSearchSchema
>;

export type SupplierResponseDto = Supplier;
