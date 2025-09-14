import { Customer } from '@pharmacy-pos/shared/types/entities';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CustomerRequestDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  idCardNumber?: string;
  birthdate?: string | null;
  membershipLevel?: string;
}

export type CustomerResponseDto = Customer;

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

