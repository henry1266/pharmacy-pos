// Accounting2 模組的 TypeScript 類型定義

export interface Account2 {
  _id: string;
  code: string;               // 會計科目代碼 (如: 1101, 2201)
  name: string;               // 科目名稱
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other'; // 保留原有類型相容性
  parentId?: string;          // 父科目ID
  level: number;              // 科目層級
  isActive: boolean;
  normalBalance: 'debit' | 'credit'; // 正常餘額方向
  
  // 原有欄位
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: string; // 機構 ID（可選，支援個人帳戶）
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  children?: Account2[];
}

export interface Category2 {
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
  organizationId?: string; // 機構 ID（可選，支援個人類別）
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  children?: Category2[];
}

export interface AccountingRecord2 {
  _id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  categoryId: string | Category2;
  accountId: string | Account2;
  date: string | Date;
  description?: string;
  tags?: string[];
  attachments?: string[];
  organizationId?: string; // 機構 ID（可選，支援個人記錄）
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
}

// 交易群組介面 (原始版本，保持向後相容)
export interface TransactionGroup {
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
  fundingType: 'original' | 'extended' | 'transfer'; // 資金類型：原始/延伸/轉帳
  
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 內嵌分錄介面 (子文檔結構)
export interface EmbeddedAccountingEntry {
  _id?: string;               // 分錄子文檔ID (可選，由MongoDB自動生成)
  sequence: number;           // 在群組中的順序
  
  // 借貸記帳核心欄位
  accountId: string | Account2; // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  
  // 原有欄位保留相容性
  categoryId?: string | Category2; // 類別ID (可選，用於報表分類)
  description: string;        // 分錄描述
  
  // 資金來源追蹤欄位
  sourceTransactionId?: string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑 (交易ID陣列的字串表示)
}

// 被引用情況資訊介面
export interface ReferencedByInfo {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date | string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
}

// 包含內嵌分錄的交易群組介面 (新版本)
export interface TransactionGroupWithEntries extends Omit<TransactionGroup, 'totalAmount'> {
  entries: EmbeddedAccountingEntry[]; // 內嵌分錄陣列
  totalAmount: number;        // 自動計算的交易總金額
  
  // 新增驗證相關欄位
  isBalanced?: boolean;       // 借貸是否平衡 (計算欄位)
  balanceDifference?: number; // 借貸差額 (計算欄位)
  entryCount?: number;        // 分錄數量 (計算欄位)
  
  // 被引用情況 (後端查詢時提供)
  referencedByInfo?: ReferencedByInfo[];
}

// 記帳分錄介面
export interface AccountingEntry {
  _id: string;
  transactionGroupId: string | TransactionGroup; // 關聯交易群組
  sequence: number;           // 在群組中的順序
  
  // 借貸記帳核心欄位
  accountId: string | Account2; // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  
  // 原有欄位保留相容性
  categoryId?: string | Category2; // 類別ID (可選，用於報表分類)
  description: string;        // 分錄描述
  
  // 資金來源追蹤欄位
  sourceTransactionId?: string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑 (交易ID陣列的字串表示)
  
  // 機構與權限
  organizationId?: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 表單相關類型
export interface Account2FormData {
  code: string;               // 會計科目代碼
  name: string;               // 科目名稱
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;          // 父科目ID
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: string; // 機構 ID（可選）
}

export interface TransactionGroupFormData {
  description: string;        // 交易描述
  transactionDate: string | Date; // 交易日期
  receiptUrl?: string;        // 憑證URL
  invoiceNo?: string;         // 發票號碼
  organizationId?: string;    // 機構ID
  
  // 資金來源追蹤表單欄位
  linkedTransactionIds?: string[];     // 被延伸使用的交易ID陣列
  sourceTransactionId?: string;        // 此交易的資金來源交易ID
  fundingType?: 'original' | 'extended' | 'transfer'; // 資金類型
}

export interface AccountingEntryFormData {
  accountId: string;          // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  categoryId?: string;        // 類別ID (可選)
  description: string;        // 分錄描述
  
  // 資金來源追蹤表單欄位
  sourceTransactionId?: string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑
}

// 內嵌分錄表單數據類型
export interface EmbeddedAccountingEntryFormData {
  sequence?: number;          // 在群組中的順序 (可選，自動生成)
  accountId: string;          // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  categoryId?: string;        // 類別ID (可選)
  description: string;        // 分錄描述
  
  // 資金來源追蹤表單欄位
  sourceTransactionId?: string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑
}

// 包含內嵌分錄的交易群組表單數據類型
export interface TransactionGroupWithEntriesFormData extends TransactionGroupFormData {
  entries: EmbeddedAccountingEntryFormData[]; // 內嵌分錄表單數據陣列
}

export interface Category2FormData {
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  icon?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
  organizationId?: string; // 機構 ID（可選）
}

export interface AccountingRecord2FormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  categoryId: string;
  accountId: string;
  date: string | Date;
  description?: string;
  tags?: string[];
  attachments?: string[];
  organizationId?: string; // 機構 ID（可選）
}

// API 回應類型
export interface Account2ListResponse {
  success: boolean;
  data: Account2[];
}

export interface Account2DetailResponse {
  success: boolean;
  data: Account2;
}

export interface Category2ListResponse {
  success: boolean;
  data: Category2[];
}

export interface Category2DetailResponse {
  success: boolean;
  data: Category2;
}

export interface AccountingRecord2ListResponse {
  success: boolean;
  data: {
    records: AccountingRecord2[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface AccountingRecord2DetailResponse {
  success: boolean;
  data: AccountingRecord2;
}

export interface AccountingRecord2SummaryResponse {
  success: boolean;
  data: {
    income: number;
    expense: number;
    balance: number;
    recordCount: number;
  };
}

// 新增複式記帳 API 回應類型
export interface TransactionGroupListResponse {
  success: boolean;
  data: {
    groups: TransactionGroup[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TransactionGroupDetailResponse {
  success: boolean;
  data: TransactionGroup;
}

// 包含內嵌分錄的交易群組 API 回應類型
export interface TransactionGroupWithEntriesListResponse {
  success: boolean;
  data: {
    groups: TransactionGroupWithEntries[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TransactionGroupWithEntriesDetailResponse {
  success: boolean;
  data: TransactionGroupWithEntries;
}

// 內嵌分錄驗證回應
export interface EmbeddedEntriesValidationResponse {
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

export interface AccountingEntryListResponse {
  success: boolean;
  data: {
    entries: AccountingEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface AccountingEntryDetailResponse {
  success: boolean;
  data: AccountingEntry;
}

// 借貸平衡驗證回應
export interface DebitCreditBalanceResponse {
  success: boolean;
  data: {
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    difference: number;
  };
}

// 資金來源追蹤回應
export interface FundingTrackingResponse {
  success: boolean;
  data: {
    transactionId: string;
    fundingChain: {
      transactionId: string;
      groupNumber: string;
      description: string;
      amount: number;
      fundingType: 'original' | 'extended' | 'transfer';
      transactionDate: string | Date;
    }[];
    totalFundingAmount: number;
    fundingDepth: number;
  };
}

// 資金流向分析回應
export interface FundingFlowResponse {
  success: boolean;
  data: {
    sourceTransaction: TransactionGroup;
    linkedTransactions: TransactionGroup[];
    flowChart: {
      nodes: {
        id: string;
        label: string;
        amount: number;
        type: 'original' | 'extended' | 'transfer';
      }[];
      edges: {
        from: string;
        to: string;
        amount: number;
        label: string;
      }[];
    };
  };
}

// 過濾器類型
export interface AccountingRecord2Filter {
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  organizationId?: string; // 機構過濾
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// 新增複式記帳過濾器
export interface TransactionGroupFilter {
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

export interface AccountingEntryFilter {
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

export interface Account2Filter {
  accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type?: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;
  level?: number;
  isActive?: boolean;
  organizationId?: string;
}

// 帳戶餘額類型
export interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

// 類別重新排序類型
export interface CategoryReorderItem {
  id: string;
  sortOrder: number;
}

// 錯誤回應類型
export interface ErrorResponse {
  success: false;
  message: string;
  timestamp?: Date;
}

// 成功回應類型
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// 聯合類型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// 會計科目類型選項
export const ACCOUNT_TYPES_V2 = [
  { value: 'asset', label: '資產' },
  { value: 'liability', label: '負債' },
  { value: 'equity', label: '權益' },
  { value: 'revenue', label: '收入' },
  { value: 'expense', label: '費用' }
] as const;

// 帳戶類型選項 (保留相容性)
export const ACCOUNT_TYPES = [
  { value: 'cash', label: '現金' },
  { value: 'bank', label: '銀行' },
  { value: 'credit', label: '信用卡' },
  { value: 'investment', label: '投資' },
  { value: 'other', label: '其他' }
] as const;

// 正常餘額方向選項
export const NORMAL_BALANCE_TYPES = [
  { value: 'debit', label: '借方' },
  { value: 'credit', label: '貸方' }
] as const;

// 交易狀態選項
export const TRANSACTION_STATUS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已確認' },
  { value: 'cancelled', label: '已取消' }
] as const;

// 資金類型選項
export const FUNDING_TYPES = [
  { value: 'original', label: '原始資金', color: '#4caf50' },
  { value: 'extended', label: '延伸使用', color: '#ff9800' },
  { value: 'transfer', label: '資金轉移', color: '#2196f3' }
] as const;

// 記錄類型選項
export const RECORD_TYPES = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
  { value: 'transfer', label: '轉帳' }
] as const;

// 類別類型選項
export const CATEGORY_TYPES = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' }
] as const;

// 幣別選項
export const CURRENCIES = [
  { value: 'TWD', label: '新台幣 (TWD)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '歐元 (EUR)' },
  { value: 'JPY', label: '日圓 (JPY)' },
  { value: 'CNY', label: '人民幣 (CNY)' }
] as const;

// 資金來源追蹤相關 API 回應型別
export interface FundingSource {
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

export interface FundingSourcesResponse {
  success: boolean;
  data: {
    fundingSources: FundingSource[];
    total: number;
  };
}

export interface FundingFlowTransaction {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date;
  totalAmount: number;
  fundingType: 'original' | 'extended' | 'transfer';
  status: 'draft' | 'confirmed' | 'cancelled';
}

export interface FundingFlowData {
  sourceTransaction: TransactionGroup;
  linkedTransactions: FundingFlowTransaction[];
  fundingPath: FundingFlowTransaction[];
  totalUsedAmount: number;
  availableAmount: number;
  originalSource?: TransactionGroup;
}

export interface FundingValidationResult {
  sourceId: string;
  isValid: boolean;
  sourceTransaction?: {
    _id: string;
    groupNumber: string;
    description: string;
    totalAmount: number;
    usedAmount: number;
    availableAmount: number;
  };
  error?: string;
}

export interface FundingValidationData {
  validationResults: FundingValidationResult[];
  totalAvailableAmount: number;
  requiredAmount: number;
  isSufficient: boolean;
  summary: {
    validSources: number;
    invalidSources: number;
    totalSources: number;
  };
}

export interface FundingValidationResponse {
  success: boolean;
  data: FundingValidationData;
}

// 資金來源分錄查詢回應
export interface FundingSourceEntriesResponse {
  success: boolean;
  data: {
    sourceTransaction: {
      _id: string;
      groupNumber: string;
      description: string;
      transactionDate: Date;
      totalAmount: number;
      fundingType: 'original' | 'extended' | 'transfer';
    };
    entries: AccountingEntry[];
    statistics: {
      source: {
        totalDebit: number;
        totalCredit: number;
        balance: number;
        recordCount: number;
      };
      linked: {
        totalDebit: number;
        totalCredit: number;
        balance: number;
        recordCount: number;
      };
      overall: {
        totalDebit: number;
        totalCredit: number;
        balance: number;
        recordCount: number;
      };
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// 資金路徑追蹤回應
export interface FundingPathLevel {
  transaction: {
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date;
    totalAmount: number;
    fundingType: 'original' | 'extended' | 'transfer';
    status: 'draft' | 'confirmed' | 'cancelled';
  };
  entries: AccountingEntry[];
  level: number;
}

export interface FundingPathEntriesResponse {
  success: boolean;
  data: {
    targetTransaction: {
      _id: string;
      groupNumber: string;
      description: string;
      transactionDate: Date;
      totalAmount: number;
      fundingType: 'original' | 'extended' | 'transfer';
    };
    fundingPath: FundingPathLevel[];
    pathLength: number;
    isOriginalSource: boolean;
  };
}

// 型別別名，用於向後相容
export type FundingType = 'original' | 'extended' | 'transfer';
export type TransactionStatus = 'draft' | 'confirmed' | 'cancelled';