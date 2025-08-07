import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared';

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
export interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
}

// DataGrid 行數據介面
export interface TransactionRow extends ExtendedTransactionGroupWithEntries {
  id: string; // DataGrid需要唯一的id字段
}

// 定義分頁模型介面
export interface PaginationModel {
  page: number;
  pageSize: number;
}

export interface AccountingDataGridProps {
  organizationId?: string;
  showFilters?: boolean;
  searchTerm?: string; // 添加 searchTerm 參數
  onCreateNew: () => void;
  onEdit: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onCopy: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onDelete: (id: string) => void;
  onView: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onConfirm: (id: string) => void;
  onUnlock: (id: string) => void;
  paginationModel?: PaginationModel;
  setPaginationModel?: (model: PaginationModel) => void;
}

export interface FilterOptions {
  search: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
}