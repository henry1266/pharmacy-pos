# Accounts Feature

會計科目功能模組，提供完整的科目管理、選擇、統計和階層管理功能。

## 📁 檔案結構

```
accounts/
├── README.md                      # 本說明文件
├── index.ts                      # 統一導出
├── AccountForm.tsx               # 科目表單組件
├── AccountSelector3.tsx          # 科目選擇器組件
├── AccountDashboard.tsx          # 科目統計儀表板
├── AccountHierarchyManager.tsx   # 科目階層管理器
├── AccountTransactionList.tsx    # 科目交易列表
├── AccountTreeViewV3.tsx         # 科目樹狀檢視
├── AccountTypeManagement.tsx     # 科目類型管理
├── components/                   # 子組件目錄
├── hooks/                       # 自定義 Hooks
├── types/                       # 類型定義
└── utils/                       # 工具函數
```

## 🎯 功能概述

此模組提供完整的會計科目管理功能，包含科目的建立、編輯、選擇、統計分析和階層管理，支援多機構環境和複雜的科目結構。

## 🧩 主要組件

### AccountForm

科目表單組件，提供新增和編輯科目的完整表單介面。

**Props:**
```typescript
interface AccountFormProps {
  open: boolean;                    // 對話框開啟狀態
  account?: Account3 | null;        // 編輯的科目（新增時為空）
  parentAccount?: Account3 | null;  // 父科目資訊
  onClose: () => void;             // 關閉回調
  onSubmit: (data: Account3FormData) => Promise<void>; // 提交回調
  loading?: boolean;               // 載入狀態
  organizations?: Organization[];   // 機構列表
  selectedOrganizationId?: string | null; // 選中的機構ID
}
```

**功能特色:**
- **智能代號生成**: 根據科目類型自動生成科目代號
- **階層繼承**: 子科目自動繼承父科目的屬性
- **表單驗證**: 完整的客戶端驗證機制
- **機構關聯**: 支援多機構科目管理
- **狀態管理**: 科目啟用/停用狀態控制

**使用範例:**
```typescript
import { AccountForm } from './accounts';

const AccountManagement = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account3 | null>(null);

  const handleSubmit = async (data: Account3FormData) => {
    if (editingAccount) {
      await updateAccount(editingAccount._id, data);
    } else {
      await createAccount(data);
    }
    setFormOpen(false);
  };

  return (
    <AccountForm
      open={formOpen}
      account={editingAccount}
      onClose={() => setFormOpen(false)}
      onSubmit={handleSubmit}
      organizations={organizations}
      selectedOrganizationId={currentOrgId}
    />
  );
};
```

**科目類型支援:**
- **資產 (Asset)**: 代號前綴 1
- **負債 (Liability)**: 代號前綴 2
- **權益 (Equity)**: 代號前綴 3
- **收入 (Revenue)**: 代號前綴 4
- **費用 (Expense)**: 代號前綴 5

### AccountSelector3

進階科目選擇器，提供樹狀結構和搜尋功能的科目選擇介面。

**Props:**
```typescript
interface AccountSelector3Props {
  selectedAccountId?: string;       // 預選科目ID
  organizationId?: string;         // 機構篩選
  onAccountSelect: (account: AccountOption) => void; // 選擇回調
  onCancel: () => void;           // 取消回調
}
```

**功能特色:**
- **階層式顯示**: 機構 → 科目類型 → 科目的三層結構
- **智能搜尋**: 支援科目名稱和代號搜尋
- **類型篩選**: 按科目類型快速篩選
- **詳細資訊**: 右側面板顯示科目詳細資訊
- **視覺化設計**: 豐富的圖示和顏色標識

**使用範例:**
```typescript
import { AccountSelector3 } from './accounts';

const TransactionForm = () => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);

  const handleAccountSelect = (account: AccountOption) => {
    setSelectedAccount(account);
    setSelectorOpen(false);
  };

  return (
    <Dialog open={selectorOpen}>
      <AccountSelector3
        selectedAccountId={selectedAccount?._id}
        organizationId={currentOrgId}
        onAccountSelect={handleAccountSelect}
        onCancel={() => setSelectorOpen(false)}
      />
    </Dialog>
  );
};
```

**顯示模式:**
- **樹狀模式**: 完整的階層結構顯示
- **搜尋模式**: 扁平化的搜尋結果顯示
- **詳情面板**: 選中科目的詳細資訊展示

### AccountDashboard

科目統計儀表板，提供科目的詳細統計分析和趨勢圖表。

**Props:**
```typescript
interface AccountDashboardProps {
  selectedAccount: Account2;        // 選中的科目
}
```

**統計指標:**
- **交易筆數**: 總交易數量統計
- **借方總額**: 累計借方金額
- **貸方總額**: 累計貸方金額
- **淨額**: 借方減貸方的淨值
- **平均交易金額**: 平均每筆交易金額
- **交易日期範圍**: 首次和最後交易日期
- **月度趨勢**: 按月統計的趨勢分析
- **狀態分佈**: 交易狀態的分佈統計

**使用範例:**
```typescript
import { AccountDashboard } from './accounts';

const AccountAnalysis = ({ accountId }) => {
  const { account, loading } = useAccount(accountId);

  if (loading) return <Loading />;

  return (
    <AccountDashboard selectedAccount={account} />
  );
};
```

**視覺化元素:**
- **統計卡片**: 關鍵指標的卡片式展示
- **趨勢圖表**: 月度趨勢的視覺化圖表
- **進度條**: 狀態分佈的進度條顯示
- **顏色編碼**: 正負值的顏色區分

### AccountHierarchyManager

科目階層管理器，提供科目樹狀結構的管理功能。

**功能特色:**
- **拖拽排序**: 支援拖拽調整科目順序
- **階層調整**: 科目父子關係的調整
- **批量操作**: 多選科目的批量操作
- **即時預覽**: 階層變更的即時預覽

### AccountTransactionList

科目交易列表，顯示特定科目的所有相關交易。

**功能特色:**
- **分頁載入**: 大量交易的分頁顯示
- **篩選排序**: 多維度的篩選和排序
- **詳情連結**: 快速跳轉到交易詳情
- **匯出功能**: 交易資料的匯出功能

### AccountTreeViewV3

科目樹狀檢視組件，提供科目的樹狀結構顯示。

**功能特色:**
- **展開收縮**: 節點的展開和收縮控制
- **多選支援**: 支援多選科目操作
- **搜尋高亮**: 搜尋結果的高亮顯示
- **自定義渲染**: 可自定義節點渲染方式

## 🎨 設計模式

### 組件組合模式
```typescript
// 完整的科目管理頁面
const AccountManagementPage = () => {
  return (
    <Container>
      <AccountTreeViewV3 
        onAccountSelect={handleAccountSelect}
        onAccountEdit={handleAccountEdit}
      />
      
      {selectedAccount && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <AccountDashboard selectedAccount={selectedAccount} />
          </Grid>
          <Grid item xs={12} md={4}>
            <AccountTransactionList accountId={selectedAccount._id} />
          </Grid>
        </Grid>
      )}
      
      <AccountForm
        open={formOpen}
        account={editingAccount}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </Container>
  );
};
```

### 狀態管理模式
```typescript
// 使用 Redux 進行狀態管理
const AccountContainer = () => {
  const dispatch = useAppDispatch();
  const { accounts, loading, error } = useAppSelector(state => state.account2);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  return (
    <AccountSelector3
      accounts={accounts}
      loading={loading}
      error={error}
      onAccountSelect={handleSelect}
    />
  );
};
```

## 🔧 工具函數

### 科目代號生成
```typescript
const generateAccountCode = (accountType: string, parentCode?: string): string => {
  const prefix = ACCOUNT_CODE_PREFIXES[accountType];
  
  if (parentCode) {
    return `${parentCode}01`; // 子科目
  } else {
    return `${prefix}101`; // 主科目
  }
};
```

### 科目階層處理
```typescript
const buildAccountTree = (accounts: Account3[], parentId: string | null = null): TreeNode[] => {
  return accounts
    .filter(account => account.parentId === parentId)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(account => ({
      ...account,
      children: buildAccountTree(accounts, account._id)
    }));
};
```

### 統計計算
```typescript
const calculateAccountStatistics = (transactions: Transaction[], accountId: string) => {
  return transactions.reduce((stats, transaction) => {
    const entry = transaction.entries.find(e => e.accountId === accountId);
    if (entry) {
      stats.totalDebit += entry.debitAmount || 0;
      stats.totalCredit += entry.creditAmount || 0;
      stats.transactionCount += 1;
    }
    return stats;
  }, { totalDebit: 0, totalCredit: 0, transactionCount: 0 });
};
```

## 📱 響應式設計

### 桌面版佈局
```typescript
<Grid container spacing={3}>
  <Grid item xs={12} md={4}>
    <AccountTreeViewV3 />
  </Grid>
  <Grid item xs={12} md={8}>
    <AccountDashboard />
  </Grid>
</Grid>
```

### 行動版佈局
```typescript
<Box sx={{ display: { xs: 'block', md: 'none' } }}>
  <Tabs value={activeTab} onChange={handleTabChange}>
    <Tab label="科目樹" />
    <Tab label="統計" />
    <Tab label="交易" />
  </Tabs>
  
  <TabPanel value={activeTab} index={0}>
    <AccountTreeViewV3 />
  </TabPanel>
  <TabPanel value={activeTab} index={1}>
    <AccountDashboard />
  </TabPanel>
</Box>
```

## 🔗 相關依賴

### UI 框架
- `@mui/material` - Material-UI 組件庫
- `@mui/icons-material` - Material-UI 圖示庫

### 狀態管理
- `@reduxjs/toolkit` - Redux 狀態管理
- `react-redux` - React Redux 綁定

### 類型定義
- `@pharmacy-pos/shared/types/accounting3` - 會計類型定義
- `@pharmacy-pos/shared/types/organization` - 機構類型定義

### 服務層
- `../../../../../services/accounting3Service` - 會計服務

## ⚠️ 注意事項

### 資料一致性
1. **科目代號唯一性**: 確保科目代號在機構內唯一
2. **階層完整性**: 維護父子關係的完整性
3. **狀態同步**: 科目狀態變更的即時同步

### 性能優化
1. **虛擬化**: 大量科目的虛擬化渲染
2. **記憶化**: 複雜計算的記憶化處理
3. **懶載入**: 統計資料的按需載入

### 安全考量
1. **權限檢查**: 科目操作的權限驗證
2. **資料驗證**: 客戶端和服務端的雙重驗證
3. **錯誤處理**: 完善的錯誤處理機制

## 🚀 未來擴展

- 支援科目模板功能
- 增加科目匯入匯出
- 實現科目合併功能
- 添加科目使用分析
- 支援多幣別科目
- 增加科目審計日誌
- 實現科目自動分類
- 支援科目標籤系統

## 🧪 測試建議

```typescript
// 組件測試
describe('AccountForm', () => {
  it('should generate account code automatically', () => {
    render(<AccountForm open={true} onSubmit={mockSubmit} onClose={mockClose} />);
    
    // 選擇資產類型
    fireEvent.change(screen.getByLabelText('科目類型'), { target: { value: 'asset' } });
    
    // 檢查代號是否自動生成
    expect(screen.getByDisplayValue(/^1/)).toBeInTheDocument();
  });

  it('should inherit parent account properties', () => {
    const parentAccount = {
      _id: 'parent1',
      code: '1101',
      name: '現金',
      accountType: 'asset',
      organizationId: 'org1'
    };

    render(
      <AccountForm 
        open={true} 
        parentAccount={parentAccount}
        onSubmit={mockSubmit} 
        onClose={mockClose} 
      />
    );

    expect(screen.getByDisplayValue('asset')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/^1101/)).toBeInTheDocument();
  });
});

// 統計計算測試
describe('calculateStatistics', () => {
  it('should calculate account statistics correctly', () => {
    const transactions = [
      {
        entries: [
          { accountId: 'acc1', debitAmount: 1000, creditAmount: 0 },
          { accountId: 'acc2', debitAmount: 0, creditAmount: 1000 }
        ]
      }
    ];

    const stats = calculateStatistics(transactions, 'acc1');
    
    expect(stats.totalDebitAmount).toBe(1000);
    expect(stats.totalCreditAmount).toBe(0);
    expect(stats.netAmount).toBe(1000);
  });
});
```

## 📚 相關文檔

- [會計科目設計規範](./docs/account-design.md)
- [科目代號編碼規則](./docs/account-coding.md)
- [多機構科目管理](./docs/multi-org-accounts.md)
- [科目統計分析](./docs/account-analytics.md)