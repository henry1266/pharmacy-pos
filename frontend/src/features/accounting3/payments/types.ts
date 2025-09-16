import {
  TransactionGroupWithEntries,
  EmbeddedAccountingEntry,
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData
} from '@pharmacy-pos/shared';

/**
 * 交易頁面的 Snackbar 狀態介面
 */
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

/**
 * 交易頁面的路由參數介面
 */
export interface TransactionPageParams {
  transactionId?: string;
}

/**
 * 交易頁面的 URL 查詢參數介面
 */
export interface TransactionPageQueryParams {
  returnTo?: string | null;
  defaultAccountId?: string | null;
  defaultOrganizationId?: string | null;
}

/**
 * 交易頁面的頁面模式
 */
export enum TransactionPageMode {
  LIST = 'list',
  NEW = 'new',
  EDIT = 'edit',
  COPY = 'copy',
  VIEW = 'view'
}

/**
 * 交易頁面的 Redux 狀態介面
 */
export interface TransactionPageReduxState {
  transactionGroups: TransactionGroupWithEntries[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
  } | null;
}

/**
 * 交易 API 數據介面
 */
export type TransactionApiData = Omit<TransactionGroupWithEntries, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * 交易更新數據介面
 */
export type TransactionUpdateData = Partial<TransactionGroupWithEntries>;

/**
 * 交易頁面的過濾選項介面
 */
export interface FilterOptions {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  type: string;
  minAmount: string | number;
  maxAmount: string | number;
  account: string;
  category: string;
}

// 重新導出共享類型，方便使用
export type {
  TransactionGroupWithEntries,
  EmbeddedAccountingEntry,
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData
};