import { AccountingRecord as BaseAccountingRecord } from '@pharmacy-pos/shared/types/entities';

/**
 * 記帳項目介面
 */
export interface AccountingItem {
  amount: string | number;
  category: string;
  categoryId?: string;
  note: string;
}

/**
 * 未結算銷售記錄介面
 */
export interface UnaccountedSale {
  _id?: string;
  lastUpdated: string;
  product?: {
    _id?: string;
    code?: string;
    name?: string;
  };
  quantity: number;
  totalAmount: number;
  saleNumber: string;
}

/**
 * 表單數據介面
 */
export interface FormData {
  date: Date | null;
  shift: string;
  status: string;
  items: AccountingItem[];
  unaccountedSales: UnaccountedSale[];
}

/**
 * 擴展的記帳記錄介面，包含前端特定屬性
 */
export interface ExtendedAccountingRecord extends BaseAccountingRecord {
  status?: string;
  items: AccountingItem[];
  totalAmount: number;
}

/**
 * 記帳名目類別介面
 */
export interface AccountingCategory {
  _id: string;
  name: string;
  description?: string;
  isExpense: boolean;
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * 操作結果介面
 */
export interface OperationResult {
  success: boolean;
  error?: string;
  data?: FormData;
}

/**
 * 記帳記錄過濾條件介面
 */
export interface AccountingFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  shift?: 'morning' | 'afternoon' | 'evening' | '';
}