import { Product } from '@pharmacy-pos/shared/types/entities';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ProductQueryParams {
  search?: string;
  productType?: 'product' | 'medicine';
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'low' | 'out' | 'normal';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ProductResponseDto = Product;

