# Transaction Hooks

交易功能相關的 React Hooks 集合，提供交易操作和狀態管理的可重用邏輯。

## 📁 檔案結構

```
hooks/
├── README.md                    # 本說明文件
├── index.ts                    # 統一導出
├── useTransactionActions.ts    # 交易操作 Hook
└── useTransactionDetail.ts     # 交易詳情 Hook
```

## 🎯 功能概述

此模組提供交易相關的自定義 Hooks，封裝了常用的交易操作邏輯，提高代碼重用性和維護性。

## 🪝 Hooks 說明

### useTransactionActions

提供交易的基本 CRUD 操作和狀態管理。

**功能特色:**
- 交易建立、更新、刪除操作
- 批量操作支援
- 錯誤處理和狀態管理
- 樂觀更新機制
- 自動重新載入

**使用方式:**
```typescript
import { useTransactionActions } from './hooks';

const MyComponent = () => {
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loading,
    error,
    success
  } = useTransactionActions();

  const handleCreate = async (data) => {
    await createTransaction(data);
  };

  return (
    // 組件內容
  );
};
```

**返回值:**
```typescript
interface UseTransactionActionsReturn {
  // 操作方法
  createTransaction: (data: TransactionFormData) => Promise<void>;
  updateTransaction: (id: string, data: TransactionFormData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  
  // 狀態
  loading: boolean;
  error: string | null;
  success: string | null;
  
  // 控制方法
  clearError: () => void;
  clearSuccess: () => void;
}
```

### useTransactionDetail

管理單一交易的詳細資訊和相關操作。

**功能特色:**
- 交易詳情載入和快取
- 相關分錄管理
- 即時狀態更新
- 錯誤邊界處理
- 自動重新驗證

**使用方式:**
```typescript
import { useTransactionDetail } from './hooks';

const TransactionDetailPage = ({ transactionId }) => {
  const {
    transaction,
    entries,
    loading,
    error,
    refresh,
    updateStatus
  } = useTransactionDetail(transactionId);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <TransactionInfo data={transaction} />
      <EntriesList entries={entries} />
    </div>
  );
};
```

**參數:**
```typescript
interface UseTransactionDetailParams {
  transactionId: string;
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    includeEntries?: boolean;
  };
}
```

**返回值:**
```typescript
interface UseTransactionDetailReturn {
  // 資料
  transaction: Transaction | null;
  entries: TransactionEntry[];
  
  // 狀態
  loading: boolean;
  error: string | null;
  
  // 操作方法
  refresh: () => Promise<void>;
  updateStatus: (status: TransactionStatus) => Promise<void>;
  addEntry: (entry: TransactionEntryData) => Promise<void>;
  updateEntry: (id: string, entry: TransactionEntryData) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}
```

## 🔧 共用功能

### 錯誤處理
所有 Hooks 都包含統一的錯誤處理機制：
- 自動錯誤捕獲和格式化
- 用戶友好的錯誤訊息
- 錯誤狀態管理
- 重試機制

### 載入狀態
提供細粒度的載入狀態管理：
- 全域載入狀態
- 操作特定載入狀態
- 載入指示器支援

### 快取策略
實現智能快取機制：
- 記憶體快取
- 自動失效
- 手動刷新
- 背景更新

## 🎨 最佳實踐

### 1. 錯誤邊界
```typescript
const MyComponent = () => {
  const { error, clearError } = useTransactionActions();

  useEffect(() => {
    if (error) {
      // 記錄錯誤
      console.error('Transaction error:', error);
      
      // 顯示通知
      showNotification(error, 'error');
      
      // 清除錯誤（可選）
      setTimeout(clearError, 5000);
    }
  }, [error, clearError]);
};
```

### 2. 載入狀態處理
```typescript
const MyComponent = () => {
  const { loading } = useTransactionDetail(id);

  return (
    <div>
      {loading && <Skeleton />}
      {!loading && <Content />}
    </div>
  );
};
```

### 3. 樂觀更新
```typescript
const MyComponent = () => {
  const { updateTransaction } = useTransactionActions();

  const handleUpdate = async (data) => {
    // 樂觀更新 UI
    setLocalData(data);
    
    try {
      await updateTransaction(id, data);
    } catch (error) {
      // 回滾 UI 狀態
      setLocalData(originalData);
    }
  };
};
```

## 🔗 相關依賴

- `../../../services/transactionGroupService` - 交易服務
- `../../../services/transactionGroupWithEntriesService` - 分錄服務
- `@pharmacy-pos/shared/types/accounting3` - 類型定義
- `react` - React Hooks API

## 📊 性能考量

### 記憶化
使用 `useMemo` 和 `useCallback` 優化性能：
```typescript
const memoizedActions = useMemo(() => ({
  create: createTransaction,
  update: updateTransaction,
  delete: deleteTransaction
}), [createTransaction, updateTransaction, deleteTransaction]);
```

### 防抖處理
對頻繁操作進行防抖：
```typescript
const debouncedSearch = useCallback(
  debounce((query: string) => {
    searchTransactions(query);
  }, 300),
  [searchTransactions]
);
```

## ⚠️ 注意事項

1. **記憶體洩漏**：確保在組件卸載時清理訂閱和計時器
2. **競態條件**：使用取消令牌避免過期請求更新狀態
3. **錯誤邊界**：在上層組件設置錯誤邊界捕獲未處理的錯誤
4. **權限檢查**：在執行操作前檢查用戶權限

## 🚀 未來擴展

- 離線支援和同步
- 實時更新（WebSocket）
- 更細粒度的權限控制
- 操作歷史記錄
- 批量操作優化
- 自動儲存草稿