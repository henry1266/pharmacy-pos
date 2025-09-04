/**
 * @file 進貨單列表頁面相關類型定義
 * @description 定義進貨單列表頁面所需的所有類型
 */

import { Customer } from '@pharmacy-pos/shared/types/entities';

/**
 * API 回應類型定義
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * 進貨單項目類型
 */
export interface PurchaseOrderItem {
  did: string;
  dname: string;
  dquantity: number | string;
  dtotalCost: number | string;
}

/**
 * 進貨單類型
 */
export interface PurchaseOrder {
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  supplier?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  // 會計分錄相關欄位
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  selectedAccountIds?: string[];
  // 付款狀態相關欄位
  hasPaidAmount?: boolean;
  // 更新時間欄位
  updatedAt?: string;
  items?: PurchaseOrderItem[];
  [key: string]: any; // 添加索引簽名以允許動態屬性
}

/**
 * 過濾後的進貨單行類型
 */
export interface FilteredRow {
  id: string;
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  // 會計分錄相關欄位
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  selectedAccountIds?: string[];
  // 付款狀態相關欄位
  hasPaidAmount?: boolean;
  // 更新時間欄位
  updatedAt?: string;
}

/**
 * 搜尋參數類型
 */
export interface SearchParams {
  poid: string;
  pobill: string;
  posupplier: string;
  startDate: Date | null;
  endDate: Date | null;
  searchTerm?: string;
}

/**
 * 提示訊息狀態類型
 */
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

/**
 * 分頁模型類型
 */
export interface PaginationModel {
  pageSize: number;
  page: number;
}

/**
 * 進貨單列表頁面屬性類型
 */
export interface PurchaseOrdersPageProps {
  initialSupplierId?: string | null;
}

/**
 * 進貨單類型
 */
export interface Supplier {
  _id: string;
  name: string;
  [key: string]: any;
}

// 不需要重複導出 PurchaseOrder 類型，因為已經在上面定義並導出了