/**
 * @file 銷售列表頁面相關類型定義
 * @description 定義銷售列表頁面所需的所有類型
 */

import type { Sale as SharedSale, SaleItem as SharedSaleItem, Customer as SharedCustomer, Product as SharedProduct } from '@pharmacy-pos/shared/types/entities';

/**
 * API 回應類型定義
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface User {
  _id: string;
  name: string;
}

export type Product = SharedProduct;
export type Customer = SharedCustomer;

export type SaleItem = Omit<SharedSaleItem, 'product'> & {
  product?: SharedProduct | { name: string; _id?: string; id?: string };
  amount?: number;
};

export type ExtendedSale = Omit<SharedSale, 'customer' | 'items' | 'user'> & {
  customer?: Customer | { name: string; _id?: string };
  items: SaleItem[];
  user?: User;
};

export type Sale = ExtendedSale;

/**
 * 提示訊息狀態類型
 */
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

/**
 * 付款狀態信息類型
 */
export interface PaymentStatusInfo {
  text: string;
  color: 'success' | 'warning' | 'info' | 'error' | 'default';
}

/**
 * 表格本地化文字類型
 */
export interface TableLocaleTextType {
  noRowsLabel: string;
  footerRowSelected: (count: number) => string;
  columnMenuLabel: string;
  columnMenuShowColumns: string;
  columnMenuFilter: string;
  columnMenuHideColumn: string;
  columnMenuUnsort: string;
  columnMenuSortAsc: string;
  columnMenuSortDesc: string;
  filterPanelAddFilter: string;
  filterPanelDeleteIconLabel: string;
  filterPanelOperator: string;
  filterPanelOperatorAnd: string;
  filterPanelOperatorOr: string;
  filterPanelColumns: string;
  filterPanelInputLabel: string;
  filterPanelInputPlaceholder: string;
  columnsPanelTextFieldLabel: string;
  columnsPanelTextFieldPlaceholder: string;
  columnsPanelDragIconLabel: string;
  columnsPanelShowAllButton: string;
  columnsPanelHideAllButton: string;
  toolbarDensity: string;
  toolbarDensityLabel: string;
  toolbarDensityCompact: string;
  toolbarDensityStandard: string;
  toolbarDensityComfortable: string;
  toolbarExport: string;
  toolbarExportLabel: string;
  toolbarExportCSV: string;
  toolbarExportPrint: string;
  toolbarColumns: string;
  toolbarColumnsLabel: string;
  toolbarFilters: string;
  toolbarFiltersLabel: string;
  toolbarFiltersTooltipHide: string;
  toolbarFiltersTooltipShow: string;
  toolbarQuickFilterPlaceholder: string;
  toolbarQuickFilterLabel: string;
  toolbarQuickFilterDeleteIconLabel: string;
  paginationRowsPerPage: string;
  paginationPageSize: string;
  paginationLabelRowsPerPage: string;
}

/**
 * 銷售列表頁面屬性類型
 */
export interface SalesListPageProps {
  // 目前沒有屬性，但保留此接口以便將來擴展
}