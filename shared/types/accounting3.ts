/**
 * Accounting3 模組的 TypeScript 類型定義
 * 新一代會計系統型別，獨立於 accounting2
 */

// ===== 核心實體型別 =====

export interface Account3 {
  _id: string;
  code: string;               // 會計科目代碼 (如: 1101, 2201)
  name: string;               // 科目名稱
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;          // 父科目ID
  level: number;              // 科目層級
  isActive: boolean;
  normalBalance: 'debit' | 'credit'; // 正常餘額方向
  
  // 餘額相關
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: string;    // 機構 ID（可選，支援個人帳戶）
  
  // 時間戳記
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  
  // 階層結構
  children?: Account3[];
}

export interface Category3 {
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
  organizationId?: string;    // 機構 ID（可選，支援個人類別）
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  children?: Category3[];
}

// ===== 交易群組型別 =====

export interface TransactionGroup3 {
  _id: string;
  groupNumber: string;        // 交易群組編號 (如: TXN-20250102-001)
  description: string;        // 交易描述
  transactionDate: string | Date; // 交易日期
  organizationId?: string;    // 機構ID
  receiptUrl?: string;        // 憑證URL
  invoiceNo?: string;         // 發票號碼
  totalAmount: number;        // 交易總金額
  status: 'draft' | 'confirmed' | 'cancelled';
  
  // 資金來源追蹤功能
  linkedTransactionIds: string[];     // 被延伸使用的交易ID陣列
  sourceTransactionId?: string;       // 此交易的資金來源交易ID
  fundingType: 'original' | 'extended' | 'transfer'; // 資金類型
  
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ===== 記帳分錄型別 =====

export interface AccountingEntry3 {
  _id: string;
  transactionGroupId: string | TransactionGroup3; // 關聯交易群組
  sequence: number;           // 在群組中的順序
  
  // 借貸記帳核心欄位
  accountId: string | Account3; // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  
  // 分類與描述
  categoryId?: string | Category3; // 類別ID (可選，用於報表分類)
  description: string;        // 分錄描述
  
  // 資金來源追蹤欄位
  sourceTransactionId?: string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑
  
  // 機構與權限
  organizationId?: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ===== 內嵌分錄型別 =====

export interface EmbeddedAccountingEntry3 {
  _id?: string;               // 分錄子文檔ID (可選，由MongoDB自動生成)
  sequence: number;           // 在群組中的順序
  
  // 借貸記帳核心欄位
  accountId: string | Account3; // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  
  // 分類與描述
  categoryId?: string | Category3; // 類別ID (可選)
  description: string;        // 分錄描述
  
  // 資金來源追蹤欄位
  sourceTransactionId?: string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑
}

// ===== 包含內嵌分錄的交易群組 =====

export interface TransactionGroupWithEntries3 extends Omit<TransactionGroup3, 'totalAmount'> {
  entries: EmbeddedAccountingEntry3[]; // 內嵌分錄陣列
  totalAmount: number;        // 自動計算的交易總金額
  
  // 驗證相關欄位
  isBalanced?: boolean;       // 借貸是否平衡 (計算欄位)
  balanceDifference?: number; // 借貸差額 (計算欄位)
  entryCount?: number;        // 分錄數量 (計算欄位)
  
  // 被引用情況
  referencedByInfo?: ReferencedByInfo3[];
}

// ===== 輔助型別 =====

export interface ReferencedByInfo3 {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date | string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
}

export interface AccountTreeNode3 extends Account3 {
  children: AccountTreeNode3[];
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  path: string[];
}

export interface AccountStatistics3 {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  transactionCount: number;
  lastTransactionDate?: Date;
}

// ===== 表單型別 =====

export interface Account3FormData {
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: string;
}

export interface Category3FormData {
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  icon?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
  organizationId?: string;
}

export interface TransactionGroup3FormData {
  description: string;
  transactionDate: string | Date;
  receiptUrl?: string;
  invoiceNo?: string;
  organizationId?: string;
  
  // 資金來源追蹤表單欄位
  linkedTransactionIds?: string[];
  sourceTransactionId?: string;
  fundingType?: 'original' | 'extended' | 'transfer';
}

export interface AccountingEntry3FormData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  categoryId?: string;
  description: string;
  
  // 資金來源追蹤表單欄位
  sourceTransactionId?: string;
  fundingPath?: string[];
}

export interface EmbeddedAccountingEntry3FormData {
  sequence?: number;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  categoryId?: string;
  description: string;
  
  // 資金來源追蹤表單欄位
  sourceTransactionId?: string;
  fundingPath?: string[];
}

export interface TransactionGroupWithEntries3FormData extends TransactionGroup3FormData {
  entries: EmbeddedAccountingEntry3FormData[];
}

// ===== API 回應型別 =====

export interface Account3ListResponse {
  success: boolean;
  data: Account3[];
}

export interface Account3DetailResponse {
  success: boolean;
  data: Account3;
}

export interface Category3ListResponse {
  success: boolean;
  data: Category3[];
}

export interface Category3DetailResponse {
  success: boolean;
  data: Category3;
}

export interface TransactionGroup3ListResponse {
  success: boolean;
  data: {
    groups: TransactionGroup3[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TransactionGroup3DetailResponse {
  success: boolean;
  data: TransactionGroup3;
}

export interface TransactionGroupWithEntries3ListResponse {
  success: boolean;
  data: {
    groups: TransactionGroupWithEntries3[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TransactionGroupWithEntries3DetailResponse {
  success: boolean;
  data: TransactionGroupWithEntries3;
}

export interface AccountingEntry3ListResponse {
  success: boolean;
  data: {
    entries: AccountingEntry3[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface AccountingEntry3DetailResponse {
  success: boolean;
  data: AccountingEntry3;
}

// ===== 過濾器型別 =====

export interface Account3Filter {
  accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type?: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;
  level?: number;
  isActive?: boolean;
  organizationId?: string;
}

export interface TransactionGroup3Filter {
  status?: 'draft' | 'confirmed' | 'cancelled';
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  invoiceNo?: string;
  
  // 資金來源追蹤過濾器
  fundingType?: 'original' | 'extended' | 'transfer';
  sourceTransactionId?: string;
  hasLinkedTransactions?: boolean;
  
  page?: number;
  limit?: number;
}

export interface AccountingEntry3Filter {
  transactionGroupId?: string;
  accountId?: string;
  categoryId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  
  // 資金來源追蹤過濾器
  sourceTransactionId?: string;
  hasFundingPath?: boolean;
  
  page?: number;
  limit?: number;
}

// ===== 驗證與分析型別 =====

export interface EmbeddedEntries3ValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    difference: number;
    entryCount: number;
    errors: string[];
    warnings: string[];
  };
}

export interface DebitCreditBalance3Response {
  success: boolean;
  data: {
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    difference: number;
  };
}

// ===== 資金追蹤型別 =====

export interface FundingSource3 {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date;
  totalAmount: number;
  usedAmount: number;
  availableAmount: number;
  fundingType: 'original' | 'extended' | 'transfer';
  receiptUrl?: string;
  invoiceNo?: string;
  isAvailable: boolean;
}

export interface FundingSources3Response {
  success: boolean;
  data: {
    fundingSources: FundingSource3[];
    total: number;
  };
}

export interface FundingFlow3Data {
  sourceTransaction: TransactionGroup3;
  linkedTransactions: TransactionGroup3[];
  fundingPath: FundingFlowPathItem3[];
  totalUsedAmount: number;
  availableAmount: number;
  originalSource?: TransactionGroup3;
}

export interface FundingFlowPathItem3 {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date | string;
  totalAmount: number;
  fundingType: 'original' | 'extended' | 'transfer';
}

export interface FundingFlow3Response {
  success: boolean;
  data: FundingFlow3Data;
}

// ===== 常數定義 =====

export const ACCOUNT_TYPES_V3 = [
  { value: 'asset', label: '資產' },
  { value: 'liability', label: '負債' },
  { value: 'equity', label: '權益' },
  { value: 'revenue', label: '收入' },
  { value: 'expense', label: '費用' }
] as const;

export const ACCOUNT_TYPES_3 = [
  { value: 'cash', label: '現金' },
  { value: 'bank', label: '銀行' },
  { value: 'credit', label: '信用卡' },
  { value: 'investment', label: '投資' },
  { value: 'other', label: '其他' }
] as const;

export const NORMAL_BALANCE_TYPES_3 = [
  { value: 'debit', label: '借方' },
  { value: 'credit', label: '貸方' }
] as const;

export const TRANSACTION_STATUS_3 = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已確認' },
  { value: 'cancelled', label: '已取消' }
] as const;

export const FUNDING_TYPES_3 = [
  { value: 'original', label: '原始資金', color: '#4caf50' },
  { value: 'extended', label: '延伸使用', color: '#ff9800' },
  { value: 'transfer', label: '資金轉移', color: '#2196f3' }
] as const;

export const CATEGORY_TYPES_3 = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' }
] as const;

export const CURRENCIES_3 = [
  { value: 'TWD', label: '新台幣 (TWD)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '歐元 (EUR)' },
  { value: 'JPY', label: '日圓 (JPY)' },
  { value: 'CNY', label: '人民幣 (CNY)' }
] as const;

// ===== 型別別名 =====

export type FundingType3 = 'original' | 'extended' | 'transfer';
export type TransactionStatus3 = 'draft' | 'confirmed' | 'cancelled';
export type AccountType3 = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance3 = 'debit' | 'credit';

// ===== 錯誤與成功回應型別 =====

export interface ErrorResponse3 {
  success: false;
  message: string;
  timestamp?: Date;
}

export interface SuccessResponse3<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse3<T = any> = SuccessResponse3<T> | ErrorResponse3;