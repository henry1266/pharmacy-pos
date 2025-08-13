/**
 * Transaction Types
 * 交易相關的型別定義
 */

import { Account } from '../../../accounts/types';

// 基本交易型別
export interface Transaction {
  id: string;
  code: string;
  date: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  entries: TransactionEntry[];
  attachments?: Attachment[];
  tags?: string[];
  metadata?: Record<string, any>;
}

// 交易狀態
export type TransactionStatus = 
  | 'draft'      // 草稿
  | 'pending'    // 待處理
  | 'approved'   // 已核准
  | 'rejected'   // 已拒絕
  | 'completed'  // 已完成
  | 'voided';    // 已作廢

// 交易分錄
export interface TransactionEntry {
  id: string;
  transactionId: string;
  accountId: string;
  account?: Account;
  description?: string;
  debit: number;
  credit: number;
  order: number;
  metadata?: Record<string, any>;
}

// 交易附件
export interface Attachment {
  id: string;
  transactionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

// 交易群組
export interface TransactionGroup {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 資金來源
export interface FundingSource {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'other';
  accountId: string;
  account?: Account;
  balance: number;
  organizationId: string;
  isActive: boolean;
}

// 資金流向
export interface FundingFlow {
  id: string;
  transactionId: string;
  sourceId: string;
  destinationId: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

// 表單資料型別
export interface TransactionFormData {
  date: string;
  description: string;
  amount: number;
  organizationId: string;
  entries: TransactionEntryFormData[];
  attachments?: File[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TransactionEntryFormData {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  order: number;
}

// API 回應型別
export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTransactionRequest {
  date: string;
  description: string;
  organizationId: string;
  entries: TransactionEntryFormData[];
  attachments?: File[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTransactionRequest {
  id: string;
  date?: string;
  description?: string;
  status?: TransactionStatus;
  entries?: TransactionEntryFormData[];
  attachments?: File[];
  tags?: string[];
  metadata?: Record<string, any>;
}

// 交易篩選選項
export interface TransactionFilterOptions {
  startDate?: string;
  endDate?: string;
  status?: TransactionStatus;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  organizationId?: string;
  tags?: string[];
}

// 交易統計資料
export interface TransactionStatistics {
  totalTransactions: number;
  totalAmount: number;
  statusDistribution: Record<TransactionStatus, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}