# Accounting3 功能組件 (Feature Components)

## 📋 概述

功能組件層包含具有完整業務邏輯的高階組件，按功能領域組織，提供完整的使用者互動體驗。

## 🏗️ 架構設計

```
features/
├── accounts/             # 科目管理功能組件
├── organizations/        # 機構管理功能組件
├── transactions/         # 交易管理功能組件
└── README.md            # 本文件
```

## 🎯 功能領域

### 1. 科目管理 (Accounts)
**路徑**: `./accounts/`

**核心組件**:
- [`AccountTypeManagement`](./accounts/AccountTypeManagement.tsx) - 科目類型管理介面
- [`AccountForm`](./accounts/AccountForm.tsx) - 科目建立/編輯表單
- [`AccountDashboard`](./accounts/AccountDashboard.tsx) - 科目總覽儀表板
- [`AccountHierarchyManager`](./accounts/AccountHierarchyManager.tsx) - 階層結構管理器
- [`AccountTransactionList`](./accounts/AccountTransactionList.tsx) - 科目交易記錄列表
- [`AccountTreeViewV3`](./accounts/AccountTreeViewV3.tsx) - 科目樹狀檢視
- [`AccountSelector3`](./accounts/AccountSelector3.tsx) - 科目選擇器

**功能特色**:
- 完整的科目 CRUD 操作
- 階層結構視覺化管理
- 科目類型分類展示
- 拖拽操作支援
- 搜尋和過濾功能

### 2. 機構管理 (Organizations)
**路徑**: `./organizations/`

**核心組件**:
- [`OrganizationForm`](./organizations/OrganizationForm.tsx) - 機構建立/編輯表單

**功能特色**:
- 機構基本資訊管理
- 表單驗證和錯誤處理
- 支援建立和編輯模式
- 完整的 CRUD 操作
- 響應式表單設計

### 3. 交易管理 (Transactions)
**路徑**: `./transactions/`

**核心組件**:
- [`TransactionDetailView`](./transactions/TransactionDetailView.tsx) - 交易詳情檢視
- [`DoubleEntryFormWithEntries3`](./transactions/DoubleEntryFormWithEntries3.tsx) - 複式記帳表單
- [`EntryTable3`](./transactions/EntryTable3.tsx) - 分錄表格
- [`BalanceValidator3`](./transactions/BalanceValidator3.tsx) - 借貸平衡驗證器
- [`TransactionEntryForm3`](./transactions/TransactionEntryForm3.tsx) - 交易分錄表單
- [`TransactionGroupFormWithEntries`](./transactions/TransactionGroupFormWithEntries.tsx) - 交易群組表單

**子組件**:
- [`TransactionBreadcrumbs`](./transactions/components/TransactionBreadcrumbs.tsx) - 麵包屑導航
- [`TransactionActions`](./transactions/components/TransactionActions.tsx) - 操作按鈕群組
- [`TransactionBasicInfo`](./transactions/components/TransactionBasicInfo.tsx) - 基本資訊卡片
- [`TransactionFundingFlow`](./transactions/components/TransactionFundingFlow.tsx) - 資金流向追蹤

**功能特色**:
- 複式記帳分錄管理
- 借貸平衡自動驗證
- 資金來源追蹤
- 交易狀態管理
- 批量操作支援

## 🚀 使用方式

### 1. 科目管理組件
```tsx
import {
  AccountTypeManagement,
  AccountForm,
  AccountHierarchyManager
} from '@/modules/accounting3/components/features/accounts';

// 科目類型管理頁面
function AccountTypePage() {
  return <AccountTypeManagement />;
}

// 科目表單對話框
function AccountFormDialog({ open, onClose, initialData }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <AccountForm
        initialData={initialData}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Dialog>
  );
}

// 階層管理器
function HierarchyPage() {
  return (
    <AccountHierarchyManager
      organizationId={currentOrgId}
      onAccountSelect={handleAccountSelect}
      enableDragDrop={true}
    />
  );
}
```

### 2. 機構管理組件
```tsx
import { OrganizationForm } from '@/modules/accounting3/components/features/organizations';

// 機構表單對話框
function OrganizationFormDialog({ open, onClose, organization }) {
  const handleSubmit = async (data) => {
    if (organization) {
      await updateOrganization(organization._id, data);
    } else {
      await createOrganization(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <OrganizationForm
        organization={organization}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Dialog>
  );
}

// 機構管理頁面
function OrganizationManagePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  return (
    <Container>
      <Button onClick={() => setFormOpen(true)}>
        新增機構
      </Button>
      
      <OrganizationFormDialog
        open={formOpen}
        organization={editingOrg}
        onClose={() => {
          setFormOpen(false);
          setEditingOrg(null);
        }}
      />
    </Container>
  );
}
```

### 3. 交易管理組件
```tsx
import { 
  TransactionDetailView, 
  DoubleEntryFormWithEntries3 
} from '@/modules/accounting3/components/features/transactions';

// 交易詳情頁面
function TransactionDetailPage({ transactionId }) {
  return (
    <TransactionDetailView
      transactionId={transactionId}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCopy={handleCopy}
    />
  );
}

// 交易表單
function TransactionForm({ initialData }) {
  const [entries, setEntries] = useState(initialData?.entries || []);
  
  return (
    <form>
      <DoubleEntryFormWithEntries3
        entries={entries}
        onChange={setEntries}
        organizationId={currentOrgId}
        disabled={false}
      />
    </form>
  );
}
```

## 🎨 設計模式

### 1. 容器組件模式
```tsx
// 容器組件 - 處理資料和邏輯
const AccountHierarchyContainer: React.FC = () => {
  const [accounts, setAccounts] = useState<Account3[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadAccounts();
  }, []);
  
  const loadAccounts = async () => {
    // 資料載入邏輯
  };
  
  return (
    <AccountHierarchyPresentation
      accounts={accounts}
      loading={loading}
      onAccountSelect={handleAccountSelect}
    />
  );
};

// 展示組件 - 純 UI 渲染
const AccountHierarchyPresentation: React.FC<Props> = ({
  accounts,
  loading,
  onAccountSelect
}) => {
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {accounts.map(account => (
        <AccountNode key={account._id} account={account} />
      ))}
    </div>
  );
};
```

### 2. 複合組件模式
```tsx
// 主組件
const TransactionDetailView = ({ transactionId }) => (
  <div>
    <TransactionDetailView.Breadcrumbs />
    <TransactionDetailView.Actions />
    <TransactionDetailView.BasicInfo />
    <TransactionDetailView.FundingFlow />
  </div>
);

// 子組件
TransactionDetailView.Breadcrumbs = TransactionBreadcrumbs;
TransactionDetailView.Actions = TransactionActions;
TransactionDetailView.BasicInfo = TransactionBasicInfo;
TransactionDetailView.FundingFlow = TransactionFundingFlow;
```

### 3. 自定義 Hook 模式
```tsx
// 自定義 Hook
const useTransactionDetail = (transactionId: string) => {
  const [transaction, setTransaction] = useState<TransactionGroupWithEntries3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadTransaction();
  }, [transactionId]);
  
  const loadTransaction = async () => {
    try {
      setLoading(true);
      const response = await accounting3Service.transactions.getById(transactionId);
      if (response.success) {
        setTransaction(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  };
  
  return { transaction, loading, error, reload: loadTransaction };
};

// 在組件中使用
const TransactionDetailView = ({ transactionId }) => {
  const { transaction, loading, error } = useTransactionDetail(transactionId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <TransactionDetails transaction={transaction} />;
};
```

## 🔧 組件開發規範

### 1. 組件結構
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ComponentProps } from './types';
import { useComponentLogic } from './hooks';

/**
 * 組件功能描述
 * 
 * 功能特色：
 * - 特色 1
 * - 特色 2
 * 
 * @param props - 組件屬性
 */
const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  onAction,
  ...restProps
}) => {
  // 1. 狀態定義
  const [localState, setLocalState] = useState();
  
  // 2. 自定義 Hook
  const { data, loading, error } = useComponentLogic();
  
  // 3. 副作用
  useEffect(() => {
    // 初始化邏輯
  }, []);
  
  // 4. 事件處理
  const handleAction = useCallback(() => {
    // 事件處理邏輯
    onAction?.();
  }, [onAction]);
  
  // 5. 渲染邏輯
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div {...restProps}>
      {/* 組件內容 */}
    </div>
  );
};

export default ComponentName;
```

### 2. Props 介面設計
```tsx
interface ComponentProps {
  // 必需屬性
  id: string;
  data: DataType;
  
  // 可選屬性
  title?: string;
  disabled?: boolean;
  
  // 事件處理
  onSubmit: (data: DataType) => void;
  onCancel?: () => void;
  
  // 配置選項
  options?: {
    showHeader: boolean;
    enableEdit: boolean;
  };
  
  // 樣式相關
  className?: string;
  style?: React.CSSProperties;
}
```

### 3. 錯誤處理
```tsx
const ComponentWithErrorHandling: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  
  const handleAsyncAction = async () => {
    try {
      setError(null);
      await performAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    }
  };
  
  return (
    <div>
      {error && <Alert severity="error">{error}</Alert>}
      <Button onClick={handleAsyncAction}>執行操作</Button>
    </div>
  );
};
```

## 📊 性能優化

### 1. 記憶化組件
```tsx
const ExpensiveComponent = React.memo<Props>(({ data, onSelect }) => {
  const processedData = useMemo(() => 
    processLargeDataSet(data), [data]
  );
  
  const handleSelect = useCallback((item) => {
    onSelect(item);
  }, [onSelect]);
  
  return (
    <div>
      {processedData.map(item => 
        <Item key={item.id} item={item} onSelect={handleSelect} />
      )}
    </div>
  );
});
```

### 2. 虛擬化長列表
```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedTransactionList: React.FC<Props> = ({ transactions }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TransactionRow transaction={transactions[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={transactions.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. 懶載入
```tsx
const LazyTransactionDetail = React.lazy(() => 
  import('./TransactionDetailView')
);

const TransactionPage: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyTransactionDetail transactionId={transactionId} />
  </Suspense>
);
```

## 🧪 測試策略

### 1. 組件測試
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountForm } from './AccountForm';

describe('AccountForm', () => {
  const defaultProps = {
    mode: 'create' as const,
    onSubmit: jest.fn(),
    onCancel: jest.fn()
  };
  
  test('should render form fields correctly', () => {
    render(<AccountForm {...defaultProps} />);
    
    expect(screen.getByLabelText('科目代碼')).toBeInTheDocument();
    expect(screen.getByLabelText('科目名稱')).toBeInTheDocument();
    expect(screen.getByLabelText('科目類型')).toBeInTheDocument();
  });
  
  test('should call onSubmit with correct data', async () => {
    const onSubmit = jest.fn();
    render(<AccountForm {...defaultProps} onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('科目代碼'), {
      target: { value: '1101' }
    });
    fireEvent.change(screen.getByLabelText('科目名稱'), {
      target: { value: '現金' }
    });
    
    fireEvent.click(screen.getByText('提交'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        code: '1101',
        name: '現金',
        // ... 其他欄位
      });
    });
  });
});
```

### 2. 整合測試
```tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { TransactionDetailView } from './TransactionDetailView';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('TransactionDetailView Integration', () => {
  test('should load and display transaction details', async () => {
    renderWithProviders(<TransactionDetailView transactionId="123" />);
    
    await screen.findByText('交易詳情');
    expect(screen.getByText('TXN-20250116-001')).toBeInTheDocument();
    expect(screen.getByText('借方總額: $1,000')).toBeInTheDocument();
  });
});
```

## 🔮 未來規劃

### 短期目標
- [ ] 完善組件文檔
- [ ] 增加單元測試覆蓋率
- [ ] 優化組件性能
- [ ] 統一錯誤處理

### 長期目標
- [ ] 組件庫標準化
- [ ] 自動化測試流程
- [ ] 組件設計系統
- [ ] 無障礙功能支援

---

**最後更新**: 2025-01-16  
**維護者**: 開發團隊