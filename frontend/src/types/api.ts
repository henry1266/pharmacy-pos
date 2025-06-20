/**
 * API 相關型別定義
 */

/**
 * HTTP 回應型別
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: {
    msg: string;
    param?: string;
    location?: string;
  }[];
  statusCode?: number;
}

/**
 * 分頁型別
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * 認證型別
 */
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    permissions?: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * API 配置型別
 */
export interface ApiConfig {
  headers: {
    'x-auth-token'?: string;
    'Content-Type'?: string;
  };
}

/**
 * 報表參數型別
 */
export interface ReportParams {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  filters?: Record<string, any>;
}