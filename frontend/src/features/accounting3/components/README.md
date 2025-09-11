# Accounting3 組件 (Components)

## 📋 概述

組件層提供 Accounting3 模組的所有 React 組件，包括功能組件和 UI 組件。採用模組化設計，支援組件重用和維護。

## 🏗️ 架構設計

```
components/
├── features/              # 功能組件
│   ├── accounts/         # 科目相關組件
│   └── transactions/     # 交易相關組件
├── ui/                   # UI 組件
├── index.ts              # 統一導出
└── README.md             # 本文件
```

## 🎯 組件分類

### 1. 功能組件 (Features)
**特色**: 包含完整業務邏輯的高階組件

#### 科目管理組件 (Accounts)
- [`AccountTypeManagement`](./features/accounts/AccountTypeManagement.tsx) - 科目類型管理
- [`AccountForm`](./features/accounts/AccountForm.tsx) - 科目表單
- [`AccountDashboard`](./features/accounts/AccountDashboard.tsx) - 科目儀表板
- [`AccountHierarchyManager`](./features/accounts/AccountHierarchyManager.tsx) - 階層管理器
- [`AccountTransactionList`](./features/accounts/AccountTransactionList.tsx) - 科目交易列表
- [`AccountTreeViewV3`](./features/accounts/AccountTreeViewV3.tsx) - 科目樹狀檢視
- [`AccountSelector3`](./features/accounts/AccountSelector3.tsx) - 科目選擇器

#### 交易管理組件 (Transactions)
- [`TransactionDetailView`](./features/transactions/TransactionDetailView.tsx) - 交易詳情檢視
- [`DoubleEntryFormWithEntries3`](./features/transactions/DoubleEntryFormWithEntries3.tsx) - 複式記帳表單
- [`EntryTable3`](./features/transactions/EntryTable3.tsx) - 分錄表格
- [`BalanceValidator3`](./features/transactions/BalanceValidator3.tsx) - 借貸平衡驗證器
- [`TransactionEntryForm3`](./features/transactions/TransactionEntryForm3.tsx) - 交易分錄表單
- [`TransactionGroupFormWithEntries`](./features/transactions/TransactionGroupFormWithEntries.tsx) - 交易群組表單

### 2. UI 組件 (UI Components)
**特色**: 可重用的純 UI 組件

- [`FundingSourceSelector3`](./ui/FundingSourceSelector3.tsx) - 資金來源選擇器
- [`AccountingDataGridWithEntries`](./ui/AccountingDataGridWithEntries.tsx) - 會計資料表格
- [`BasicInfoSection`](./ui/BasicInfoSection.tsx) - 基本資訊區塊
- [`DoubleEntrySection3`](./ui/DoubleEntrySection3.tsx) - 複式記帳區塊

## 🚀 使用方式

### 功能組件使用
```tsx
import { AccountTypeManagement, TransactionDetailView } from '@/modules/accounting3/components';

function AccountSettingsPage() {
  return (
    <div>
      <AccountTypeManagement />
    </div>
  );
}

function TransactionPage({ transactionId }: { transactionId: string }) {
  return (
    <TransactionDetailView 
      transactionId={transactionId}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

### UI 組件使用
```tsx
import { DoubleEntrySection3, BasicInfoSection } from '@/modules/accounting3/components';

function TransactionForm() {
  return (
    <form>
      <BasicInfoSection 
        data={basicInfo}
        onChange={handleBasicInfoChange}
      />
      <DoubleEntrySection3
        entries={entries}
        onEntriesChange={handleEntriesChange}
        mode="create"
        permissions={{ canEdit: true }}
      />
    </form>
  );
}
```

## 🎨 設計原則

### 1. 單一職責原則
每個組件只負責一個特定功能
```tsx
// ✅ 好的設計 - 單一職責
const AccountSelector = ({ onSelect }) => {
  // 只負責科目選擇邏輯
};

// ❌ 避免 - 職責過多
const AccountManagerWithFormAndList = () => {
  // 包含太多職責
};
```

### 2. 組件組合
使用組合而非繼承
```tsx
// ✅ 組合設計
const TransactionDetailView = () => (
  <div>
    <TransactionBreadcrumbs />
    <TransactionActions />
    <TransactionBasicInfo />
    <TransactionFundingFlow />
  </div>
);
```

### 3. Props 介面設計
清晰的 Props 型別定義
```tsx
interface AccountFormProps {
  initialData?: Account3FormData;
  mode: 'create' | 'edit' | 'view';
  onSubmit: (data: Account3FormData) => void;
  onCancel: () => void;
}
```

## 🔧 組件開發指南

### 1. 組件結構
```tsx
import React from 'react';
import { ComponentProps } from './types';

/**
 * 組件描述
 * 
 * @param props - 組件屬性
 * @returns JSX 元素
 */
const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // 狀態管理
  const [state, setState] = useState();
  
  // 副作用
  useEffect(() => {
    // 初始化邏輯
  }, []);
  
  // 事件處理
  const handleEvent = useCallback(() => {
    // 事件處理邏輯
  }, []);
  
  // 渲染
  return (
    <div>
      {/* JSX 內容 */}
    </div>
  );
};

export default ComponentName;
```

### 2. 狀態管理
```tsx
// 使用自定義 Hook 管理複雜狀態
const useAccountForm = (initialData) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  
  const validate = useCallback(() => {
    // 驗證邏輯
  }, [formData]);
  
  return { formData, errors, validate };
};
```

### 3. 錯誤邊界
```tsx
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

## 📊 性能優化

### 1. React.memo
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 複雜渲染邏輯 */}</div>;
});
```

### 2. useMemo 和 useCallback
```tsx
const Component = ({ items, onSelect }) => {
  const sortedItems = useMemo(() => 
    items.sort((a, b) => a.name.localeCompare(b.name)), 
    [items]
  );
  
  const handleSelect = useCallback((item) => {
    onSelect(item);
  }, [onSelect]);
  
  return (
    <div>
      {sortedItems.map(item => 
        <Item key={item.id} item={item} onSelect={handleSelect} />
      )}
    </div>
  );
};
```

### 3. 虛擬化
```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedAccountList = ({ accounts }) => (
  <List
    height={400}
    itemCount={accounts.length}
    itemSize={50}
    itemData={accounts}
  >
    {AccountRow}
  </List>
);
```

## 🧪 測試策略

### 1. 單元測試
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AccountForm from './AccountForm';

describe('AccountForm', () => {
  test('should render form fields', () => {
    render(<AccountForm mode="create" onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText('科目代碼')).toBeInTheDocument();
    expect(screen.getByLabelText('科目名稱')).toBeInTheDocument();
  });
  
  test('should call onSubmit when form is submitted', () => {
    const onSubmit = jest.fn();
    render(<AccountForm mode="create" onSubmit={onSubmit} />);
    
    fireEvent.click(screen.getByText('提交'));
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

### 2. 整合測試
```tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import TransactionDetailView from './TransactionDetailView';

describe('TransactionDetailView Integration', () => {
  test('should display transaction details', async () => {
    render(
      <Provider store={store}>
        <TransactionDetailView transactionId="123" />
      </Provider>
    );
    
    await screen.findByText('交易詳情');
    expect(screen.getByText('TXN-20250116-001')).toBeInTheDocument();
  });
});
```

## 🎯 最佳實踐

### 1. 組件命名
- 使用 PascalCase
- 名稱要具描述性
- 避免縮寫

### 2. 檔案組織
```
ComponentName/
├── index.ts              # 導出
├── ComponentName.tsx     # 主組件
├── ComponentName.test.tsx # 測試
├── types.ts              # 型別定義
└── styles.ts             # 樣式（如果需要）
```

### 3. Props 驗證
```tsx
import PropTypes from 'prop-types';

ComponentName.propTypes = {
  data: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit', 'view'])
};
```

## 🔄 維護指南

### 1. 版本控制
- 遵循語義化版本
- 記錄破壞性變更
- 提供遷移指南

### 2. 文檔更新
- 保持 README 最新
- 更新 Props 介面文檔
- 提供使用範例

### 3. 重構原則
- 保持向後相容
- 逐步遷移
- 充分測試

---

**最後更新**: 2025-01-16  
**維護者**: 開發團隊