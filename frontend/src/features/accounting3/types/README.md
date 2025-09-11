# Accounting3 型別定義 (Types)

## 📋 概述

型別定義層提供 Accounting3 模組的所有 TypeScript 型別定義，包括核心實體型別、表單型別、API 回應型別等。

## 🏗️ 架構設計

```
types/
├── core.ts              # 核心型別（已遷移至 shared）
└── README.md            # 本文件
```

## 🎯 型別分類

### 1. 核心實體型別
**位置**: `@pharmacy-pos/shared/types/accounting3`

#### 基礎實體
- `Account3` - 會計科目
- `Category3` - 分類
- `TransactionGroup3` - 交易群組
- `AccountingEntry3` - 記帳分錄

#### 複合實體
- `TransactionGroupWithEntries3` - 包含分錄的交易群組
- `EmbeddedAccountingEntry3` - 內嵌分錄
- `AccountTreeNode3` - 科目樹節點

### 2. 表單型別
**用途**: 表單資料處理和驗證

#### 表單資料型別
```typescript
// 科目表單
interface Account3FormData {
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

// 交易群組表單
interface TransactionGroup3FormData {
  description: string;
  transactionDate: string | Date;
  receiptUrl?: string;
  invoiceNo?: string;
  organizationId?: string;
  linkedTransactionIds?: string[];
  sourceTransactionId?: string;
  fundingType?: 'original' | 'extended' | 'transfer';
}

// 分錄表單
interface EmbeddedAccountingEntry3FormData {
  sequence?: number;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  categoryId?: string;
  description: string;
  sourceTransactionId?: string;
  fundingPath?: string[];
}
```

### 3. API 回應型別
**用途**: API 介面的型別安全

#### 列表回應
```typescript
interface Account3ListResponse {
  success: boolean;
  data: Account3[];
}

interface TransactionGroup3ListResponse {
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
```

#### 詳情回應
```typescript
interface Account3DetailResponse {
  success: boolean;
  data: Account3;
}

interface TransactionGroupWithEntries3DetailResponse {
  success: boolean;
  data: TransactionGroupWithEntries3;
}
```

### 4. 過濾器型別
**用途**: 資料查詢和過濾

```typescript
interface Account3Filter {
  accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type?: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;
  level?: number;
  isActive?: boolean;
  organizationId?: string;
}

interface TransactionGroup3Filter {
  status?: 'draft' | 'confirmed' | 'cancelled';
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  invoiceNo?: string;
  fundingType?: 'original' | 'extended' | 'transfer';
  sourceTransactionId?: string;
  hasLinkedTransactions?: boolean;
  page?: number;
  limit?: number;
}
```

### 5. 階層管理型別
**位置**: `./types.ts`

#### 階層節點
```typescript
interface AccountHierarchyNode extends Account3 {
  children: AccountHierarchyNode[];
  hasChildren: boolean;
  isExpanded: boolean;
  path: string[];
  version: 'v3';
  compatibilityMode: 'accounting2' | 'accounting3' | 'hybrid';
  
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canAddChild: boolean;
    canMove: boolean;
  };
  
  statistics?: {
    totalTransactions: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    totalBalance: number;
    childCount: number;
    descendantCount: number;
    hasTransactions: boolean;
    lastTransactionDate?: Date | string;
  };
}
```

#### 階層配置
```typescript
interface AccountHierarchyConfig {
  showBalances: boolean;
  showStatistics: boolean;
  showInactiveAccounts: boolean;
  maxDepth: number;
  autoExpand: boolean;
  defaultExpandLevel: number;
  enableAccounting2Compatibility: boolean;
  enableAccounting3Features: boolean;
  organizationId?: string | null;
  multiOrganizationMode: boolean;
}
```

### 6. 資金追蹤型別
**用途**: 資金來源追蹤功能

```typescript
interface FundingSource3 {
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

interface FundingFlow3Data {
  sourceTransaction: TransactionGroup3;
  linkedTransactions: TransactionGroup3[];
  fundingPath: FundingFlowPathItem3[];
  totalUsedAmount: number;
  availableAmount: number;
  originalSource?: TransactionGroup3;
}
```

## 🚀 使用方式

### 1. 基本型別使用
```typescript
import { Account3, TransactionGroup3 } from '@pharmacy-pos/shared/types/accounting3';

// 定義變數
const account: Account3 = {
  _id: '123',
  code: '1101',
  name: '現金',
  accountType: 'asset',
  type: 'cash',
  level: 1,
  isActive: true,
  normalBalance: 'debit',
  balance: 1000,
  initialBalance: 0,
  currency: 'TWD',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user123'
};
```

### 2. 表單型別使用
```typescript
import { Account3FormData } from '@pharmacy-pos/shared/types/accounting3';

const AccountForm: React.FC = () => {
  const [formData, setFormData] = useState<Account3FormData>({
    code: '',
    name: '',
    accountType: 'asset',
    type: 'cash',
    initialBalance: 0,
    currency: 'TWD'
  });

  const handleSubmit = (data: Account3FormData) => {
    // 型別安全的表單處理
  };
};
```

### 3. API 型別使用
```typescript
import { Account3ListResponse } from '@pharmacy-pos/shared/types/accounting3';

const fetchAccounts = async (): Promise<Account3ListResponse> => {
  const response = await fetch('/api/accounting3/accounts');
  return response.json();
};

// 使用時有完整的型別提示
const { success, data } = await fetchAccounts();
if (success) {
  data.forEach(account => {
    console.log(account.name); // 型別安全
  });
}
```

### 4. 階層型別使用
```typescript
import { AccountHierarchyNode, AccountHierarchyConfig } from '@/modules/accounting3/types';

const HierarchyComponent: React.FC = () => {
  const [nodes, setNodes] = useState<AccountHierarchyNode[]>([]);
  const [config, setConfig] = useState<AccountHierarchyConfig>({
    showBalances: true,
    showStatistics: true,
    showInactiveAccounts: false,
    maxDepth: 10,
    autoExpand: false,
    defaultExpandLevel: 2,
    enableAccounting2Compatibility: true,
    enableAccounting3Features: true,
    multiOrganizationMode: true
  });
};
```

## 🔧 型別擴展

### 1. 自定義型別
```typescript
// 擴展基礎型別
interface ExtendedAccount3 extends Account3 {
  customField: string;
  calculatedBalance: number;
}

// 組合型別
type AccountWithStatistics = Account3 & {
  statistics: AccountStatistics3;
};
```

### 2. 泛型型別
```typescript
// 通用 API 回應型別
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

// 使用泛型
type AccountResponse = ApiResponse<Account3>;
type AccountListResponse = ApiResponse<Account3[]>;
```

### 3. 條件型別
```typescript
// 根據模式決定型別
type FormData<T extends 'create' | 'edit'> = T extends 'create'
  ? Omit<Account3FormData, '_id'>
  : Account3FormData & { _id: string };

// 使用條件型別
const createFormData: FormData<'create'> = {
  code: '1101',
  name: '現金'
  // 不需要 _id
};

const editFormData: FormData<'edit'> = {
  _id: '123',
  code: '1101',
  name: '現金'
  // 需要 _id
};
```

## 📊 型別安全最佳實踐

### 1. 嚴格型別檢查
```typescript
// ✅ 好的做法 - 使用嚴格型別
interface StrictAccountForm {
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

// ❌ 避免 - 使用 any
interface LooseAccountForm {
  code: any;
  name: any;
  accountType: any;
}
```

### 2. 型別守衛
```typescript
// 型別守衛函數
function isAccount3(obj: any): obj is Account3 {
  return obj && 
    typeof obj._id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    ['asset', 'liability', 'equity', 'revenue', 'expense'].includes(obj.accountType);
}

// 使用型別守衛
if (isAccount3(data)) {
  // 這裡 data 被確認為 Account3 型別
  console.log(data.code);
}
```

### 3. 型別斷言
```typescript
// 謹慎使用型別斷言
const account = response.data as Account3;

// 更好的做法 - 使用型別守衛
if (isAccount3(response.data)) {
  const account = response.data; // 自動推斷為 Account3
}
```

## 🧪 型別測試

### 1. 型別測試工具
```typescript
// 使用 TypeScript 編譯器 API 進行型別測試
import { expectType } from 'tsd';

// 測試型別推斷
expectType<Account3>(account);
expectType<string>(account.code);
expectType<number>(account.balance);
```

### 2. 執行時型別驗證
```typescript
import Joi from 'joi';

// 定義驗證 schema
const account3Schema = Joi.object({
  _id: Joi.string().required(),
  code: Joi.string().required(),
  name: Joi.string().required(),
  accountType: Joi.string().valid('asset', 'liability', 'equity', 'revenue', 'expense').required(),
  balance: Joi.number().required()
});

// 驗證資料
const { error, value } = account3Schema.validate(data);
if (!error) {
  // 資料符合 Account3 型別
}
```

## 🔄 型別遷移

### 1. 版本升級
```typescript
// v2 到 v3 的型別遷移
type Account2 = {
  id: string; // 舊版使用 id
  code: string;
  name: string;
};

type Account3 = {
  _id: string; // 新版使用 _id
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
};

// 遷移函數
function migrateAccount2To3(account2: Account2): Account3 {
  return {
    _id: account2.id,
    code: account2.code,
    name: account2.name,
    accountType: 'asset' // 預設值
  };
}
```

### 2. 向後相容
```typescript
// 支援多版本的聯合型別
type AccountUnion = Account2 | Account3;

// 型別判斷函數
function isAccount3(account: AccountUnion): account is Account3 {
  return '_id' in account;
}
```

## 🔮 未來規劃

### 短期目標
- [ ] 完善型別文檔
- [ ] 增加型別測試
- [ ] 優化型別推斷
- [ ] 統一型別命名

### 長期目標
- [ ] 自動生成型別定義
- [ ] 型別版本管理
- [ ] 跨模組型別共享
- [ ] 執行時型別檢查

---

**最後更新**: 2025-01-16  
**維護者**: 開發團隊