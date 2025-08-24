import { ObjectId } from 'mongoose';

/**
 * 交易狀態類型
 */
export type TransactionStatus = 'draft' | 'confirmed' | 'cancelled';

/**
 * 交易分錄介面
 */
export interface TransactionEntry {
  sequence: number;
  accountId: string | ObjectId | { _id: string | ObjectId; name?: string; code?: string; accountType?: string; normalBalance?: string };
  debitAmount: number;
  creditAmount: number;
  description?: string;
  sourceTransactionId?: string;
  [key: string]: any;
}

/**
 * 付款資訊介面
 */
export interface PaymentInfo {
  paymentMethod: string;
  payableTransactions: Array<{
    transactionId: string;
    paidAmount: number;
    remainingAmount?: number;
  }>;
  [key: string]: any;
}

/**
 * 應付帳款資訊介面
 */
export interface PayableInfo {
  supplierId?: string;
  supplierName?: string;
  dueDate?: Date;
  totalPaidAmount?: number;
  isPaidOff?: boolean;
  paymentHistory?: Array<{
    paymentTransactionId: string;
    paidAmount: number;
    paymentDate: Date;
    paymentMethod?: string;
  }>;
  [key: string]: any;
}

/**
 * 查詢參數介面
 */
export interface QueryParams {
  createdBy: string;
  organizationId?: string;
  status?: TransactionStatus | { $in: TransactionStatus[] };
  transactionDate?: {
    $gte?: Date;
    $lte?: Date;
  };
  $or?: Array<{[key: string]: any}>;
  'entries.sourceTransactionId'?: string | { $in: string[] };
  'paymentInfo.payableTransactions.transactionId'?: string | { $in: string[] };
  [key: string]: any;
}

/**
 * 分頁選項介面
 */
export interface PaginationOptions {
  page: number | undefined;
  limit: number | undefined;
  defaultLimit?: number;
}

/**
 * 分頁結果介面
 */
export interface PaginationResult {
  skip: number;
  limit: number;
  page: number;
  totalPages: number;
}

/**
 * 分頁查詢結果介面
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 交易篩選條件介面
 */
export interface TransactionFilters {
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 付款交易資料介面
 */
export interface PaymentData {
  description: string;
  transactionDate: Date;
  paymentMethod: string;
  totalAmount: number;
  entries: Array<{
    sequence: number;
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
    sourceTransactionId?: string;
  }>;
  linkedTransactionIds: string[];
  organizationId?: string;
  paymentInfo: {
    paymentMethod: string;
    payableTransactions: Array<{
      transactionId: string;
      paidAmount: number;
      remainingAmount?: number;
    }>;
  };
  paymentAccountId: string;
  [key: string]: any;
}

/**
 * 驗證結果介面
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 交易餘額資訊介面
 */
export interface TransactionBalance {
  transactionId: string;
  totalAmount: number;
  usedAmount: number;
  availableAmount: number;
  referencedByCount: number;
  referencedByTransactions: Array<{
    transactionId: string;
    groupNumber: string;
    description: string;
    usedAmount: number;
    transactionDate: Date;
  }>;
}

/**
 * 交易餘額結果介面
 */
export interface TransactionBalanceResult {
  transactionId: string;
  totalAmount: number;
  usedAmount: number;
  availableAmount: number;
  referencedByCount: number;
  success: boolean;
  error?: string;
}

/**
 * 付款狀態資訊介面
 */
export interface PaymentStatusInfo {
  hasPaidAmount: boolean;
  paidAmount: number;
  totalAmount: number;
  isPaidOff: boolean;
  paymentTransactions: Array<{
    transactionId: string;
    groupNumber: string;
    paidAmount: number;
    paymentDate: Date;
    status: string;
  }>;
}

/**
 * 應付帳款資訊介面
 */
export interface PayableTransactionInfo {
  _id: string;
  groupNumber: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  supplierInfo?: {
    supplierId: string;
    supplierName: string;
  };
  isPaidOff: boolean;
  paymentHistory: Array<{
    paymentTransactionId: string;
    paidAmount: number;
    paymentDate: Date;
    paymentMethod?: string;
  }>;
  transactionDate: Date;
}

/**
 * 交易統計資訊介面
 */
export interface TransactionStatistics {
  totalTransactions: number;
  confirmedTransactions: number;
  draftTransactions: number;
  cancelledTransactions: number;
  totalAmount: number;
  averageAmount: number;
  transactionsByStatus: Array<{ status: string; count: number }>;
}