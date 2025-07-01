// Accounting2 模組的 TypeScript 類型定義

export interface Account2 {
  _id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
}

export interface Category2 {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  icon?: string;
  color?: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  children?: Category2[];
}

export interface AccountingRecord2 {
  _id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  categoryId: string | Category2;
  accountId: string | Account2;
  date: string | Date;
  description?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
}

// 表單相關類型
export interface Account2FormData {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  initialBalance: number;
  currency: string;
  description?: string;
}

export interface Category2FormData {
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  icon?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
}

export interface AccountingRecord2FormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  categoryId: string;
  accountId: string;
  date: string | Date;
  description?: string;
  tags?: string[];
  attachments?: string[];
}

// API 回應類型
export interface Account2ListResponse {
  success: boolean;
  data: Account2[];
}

export interface Account2DetailResponse {
  success: boolean;
  data: Account2;
}

export interface Category2ListResponse {
  success: boolean;
  data: Category2[];
}

export interface Category2DetailResponse {
  success: boolean;
  data: Category2;
}

export interface AccountingRecord2ListResponse {
  success: boolean;
  data: {
    records: AccountingRecord2[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface AccountingRecord2DetailResponse {
  success: boolean;
  data: AccountingRecord2;
}

export interface AccountingRecord2SummaryResponse {
  success: boolean;
  data: {
    income: number;
    expense: number;
    balance: number;
    recordCount: number;
  };
}

// 過濾器類型
export interface AccountingRecord2Filter {
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// 帳戶餘額類型
export interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

// 類別重新排序類型
export interface CategoryReorderItem {
  id: string;
  sortOrder: number;
}

// 錯誤回應類型
export interface ErrorResponse {
  success: false;
  message: string;
  timestamp?: Date;
}

// 成功回應類型
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// 聯合類型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// 帳戶類型選項
export const ACCOUNT_TYPES = [
  { value: 'cash', label: '現金' },
  { value: 'bank', label: '銀行' },
  { value: 'credit', label: '信用卡' },
  { value: 'investment', label: '投資' },
  { value: 'other', label: '其他' }
] as const;

// 記錄類型選項
export const RECORD_TYPES = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
  { value: 'transfer', label: '轉帳' }
] as const;

// 類別類型選項
export const CATEGORY_TYPES = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' }
] as const;

// 幣別選項
export const CURRENCIES = [
  { value: 'TWD', label: '新台幣 (TWD)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '歐元 (EUR)' },
  { value: 'JPY', label: '日圓 (JPY)' },
  { value: 'CNY', label: '人民幣 (CNY)' }
] as const;