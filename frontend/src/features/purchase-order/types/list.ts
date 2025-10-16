import type {
  PurchaseOrderSummary as SharedPurchaseOrderSummary,
  PurchaseOrderDetail as SharedPurchaseOrderDetail,
} from '@pharmacy-pos/shared/types/purchase-order';

export type PurchaseOrder = SharedPurchaseOrderSummary;
export type PurchaseOrderDetail = SharedPurchaseOrderDetail;
export type PurchaseOrderItem = PurchaseOrderDetail['items'][number];

export interface FilteredRow {
  id: string;
  _id: PurchaseOrder['_id'];
  poid: PurchaseOrder['poid'];
  pobill?: string;
  pobilldate?: string;
  posupplier: PurchaseOrder['posupplier'];
  totalAmount: PurchaseOrder['totalAmount'];
  status: PurchaseOrder['status'];
  paymentStatus?: PurchaseOrder['paymentStatus'];
  relatedTransactionGroupId?: PurchaseOrder['relatedTransactionGroupId'];
  accountingEntryType?: PurchaseOrder['accountingEntryType'];
  selectedAccountIds?: PurchaseOrder['selectedAccountIds'];
  updatedAt?: string;
  hasPaidAmount?: boolean;
}

export interface SearchParams {
  poid: string;
  pobill: string;
  posupplier: string;
  startDate: Date | null;
  endDate: Date | null;
  searchTerm?: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export interface PaginationModel {
  pageSize: number;
  page: number;
}

export interface PurchaseOrdersPageProps {
  initialSupplierId?: string | null;
}

export interface Supplier {
  _id: string;
  name: string;
  [key: string]: unknown;
}
