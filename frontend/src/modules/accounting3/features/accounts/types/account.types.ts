/**
 * Account Types
 * 科目相關的型別定義
 */

// 基本科目型別
export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  level: number;
  isActive: boolean;
  balance: number;
  normalBalance: 'debit' | 'credit';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  description?: string;
}

// 科目類型
export type AccountType = 
  | 'asset'           // 資產
  | 'liability'       // 負債
  | 'equity'          // 權益
  | 'revenue'         // 收入
  | 'expense'         // 費用
  | 'cost';           // 成本

// 科目子類型
export interface AccountSubType {
  id: string;
  name: string;
  type: AccountType;
  code: string;
}

// 表單資料型別
export interface AccountFormData {
  name: string;
  code: string;
  type: AccountType;
  parentId?: string;
  isActive: boolean;
  balance: number;
  initialBalance: number;
  currency: string;
  normalBalance: 'debit' | 'credit';
  organizationId: string;
  createdBy: string;
  description?: string;
}

// 科目樹狀結構
export interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
  hasChildren: boolean;
  expanded?: boolean;
}

// 科目篩選選項
export interface AccountFilterOptions {
  type?: AccountType;
  isActive?: boolean;
  parentId?: string;
  search?: string;
  organizationId?: string;
}

// 科目統計資料
export interface AccountStatistics {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  balanceByType: Record<AccountType, number>;
  monthlyTrend: Array<{
    month: string;
    balance: number;
    transactions: number;
  }>;
}

// API 回應型別
export interface AccountsResponse {
  accounts: Account[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAccountRequest {
  name: string;
  code: string;
  type: AccountType;
  parentId?: string;
  organizationId: string;
  description?: string;
}

export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
  id: string;
  isActive?: boolean;
}