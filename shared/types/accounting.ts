/**
 * 會計相關型別定義
 * 前後端共用型別，確保資料結構一致性
 */

import { AccountingRecord as BaseAccountingRecord, AccountingCategory as BaseAccountingCategory } from './entities';

/**
 * 記帳項目介面
 * 統一前後端資料格式
 */
export interface AccountingItem {
  amount: number; // 統一為 number 型別
  category: string;
  categoryId?: string;
  notes?: string; // 改為選填，與 backend 一致
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
 * 擴展基礎類別，添加前端需要的屬性
 */
export interface AccountingCategory extends BaseAccountingCategory {
  // 繼承 BaseAccountingCategory 的所有屬性
  // 可以在這裡添加前端特有的屬性
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
  shift?: 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚' | '';
  search?: string; // 新增內文搜尋參數
}