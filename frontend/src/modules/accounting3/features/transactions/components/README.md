# Transaction Components

交易功能相關的 React 組件集合，提供交易詳情顯示、操作控制和導航功能。

## 📁 檔案結構

```
components/
├── README.md                    # 本說明文件
├── index.ts                    # 統一導出
├── TransactionActions.tsx      # 交易操作按鈕組件
├── TransactionBasicInfo.tsx    # 交易基本資訊卡片
├── TransactionBreadcrumbs.tsx  # 麵包屑導航組件
└── TransactionFundingFlow.tsx  # 資金流向圖組件
```

## 🎯 功能概述

此模組提供交易詳情頁面所需的各種 UI 組件，包含資訊展示、操作控制、導航等功能，確保一致的使用者體驗和良好的代碼重用性。

## 🧩 組件說明

### TransactionActions

交易操作按鈕組件，提供編輯、複製、刪除等操作功能。

**Props:**
```typescript
interface TransactionActionsProps {
  showActions?: boolean;        // 是否顯示操作按鈕
  onEdit: () => void;          // 編輯回調
  onCopy: () => void;          // 複製回調
  onDelete: () => void;        // 刪除回調
  onBackToList: () => void;    // 返回列表回調
}
```

**功能特色:**
- 響應式按鈕佈局
- 圖示和文字提示
- 可選擇性顯示/隱藏
- 統一的操作風格

**使用範例:**
```typescript
import { TransactionActions } from './components';

const TransactionDetailPage = () => {
  const handleEdit = () => {
    // 編輯邏輯
  };

  const handleCopy = () => {
    // 複製邏輯
  };

  const handleDelete = () => {
    // 刪除邏輯
  };

  const handleBackToList = () => {
    // 返回列表邏輯
  };

  return (
    <TransactionActions
      onEdit={handleEdit}
      onCopy={handleCopy}
      onDelete={handleDelete}
      onBackToList={handleBackToList}
    />
  );
};
```

**按鈕說明:**
- **返回列表**: 導航回交易列表頁面
- **編輯**: 進入交易編輯模式
- **複製**: 複製當前交易建立新交易
- **刪除**: 刪除當前交易（需確認）

### TransactionBasicInfo

交易基本資訊卡片組件，展示交易的核心資訊。

**Props:**
```typescript
interface TransactionBasicInfoProps {
  transaction: TransactionGroupWithEntries3;
}
```

**顯示資訊:**
- **交易日期**: 格式化的交易日期
- **交易描述**: 交易的詳細描述
- **交易流向**: 視覺化的科目流向圖
- **交易金額**: 格式化的金額顯示
- **交易狀態**: 帶顏色的狀態標籤
- **資金類型**: 資金類型標籤
- **發票號碼**: 可選的發票資訊
- **憑證連結**: 可選的憑證查看功能

**功能特色:**
- 響應式網格佈局
- 智能的資料處理
- 視覺化流向圖
- 條件性資訊顯示
- 統一的格式化

**使用範例:**
```typescript
import { TransactionBasicInfo } from './components';

const TransactionDetailPage = ({ transaction }) => {
  return (
    <TransactionBasicInfo transaction={transaction} />
  );
};
```

**交易流向圖:**
- 自動識別借方和貸方科目
- 視覺化箭頭指示流向
- 智能的科目名稱提取
- 響應式標籤設計

### TransactionBreadcrumbs

麵包屑導航組件，提供頁面層級導航。

**Props:**
```typescript
interface TransactionBreadcrumbsProps {
  onNavigateToList: () => void;
}
```

**功能特色:**
- 清晰的導航路徑
- 圖示增強識別
- 點擊導航功能
- 一致的視覺風格

**使用範例:**
```typescript
import { TransactionBreadcrumbs } from './components';

const TransactionDetailPage = () => {
  const handleNavigateToList = () => {
    router.push('/transactions');
  };

  return (
    <TransactionBreadcrumbs onNavigateToList={handleNavigateToList} />
  );
};
```

**導航結構:**
```
交易管理 > 交易詳情
```

### TransactionFundingFlow

資金流向圖組件，視覺化展示交易的資金流動。

**功能特色:**
- 動態流向圖生成
- 科目關係視覺化
- 金額流向指示
- 互動式圖表

**使用範例:**
```typescript
import { TransactionFundingFlow } from './components';

const TransactionDetailPage = ({ transaction }) => {
  return (
    <TransactionFundingFlow 
      entries={transaction.entries}
      totalAmount={transaction.totalAmount}
    />
  );
};
```

## 🎨 設計原則

### 一致性
- 統一的顏色主題
- 一致的間距和字體
- 標準化的圖示使用
- 統一的互動模式

### 響應式設計
```typescript
// 響應式網格範例
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    {/* 內容 */}
  </Grid>
</Grid>
```

### 可訪問性
- 適當的 ARIA 標籤
- 鍵盤導航支援
- 顏色對比度考量
- 螢幕閱讀器友好

### 性能優化
```typescript
// 記憶化組件
const MemoizedTransactionBasicInfo = React.memo(TransactionBasicInfo);

// 條件渲染
{showActions && <TransactionActions {...actionProps} />}
```

## 🔧 共用功能

### 格式化工具
所有組件都使用統一的格式化工具：
```typescript
import { 
  formatAmount, 
  formatDate, 
  getStatusInfo, 
  getFundingTypeInfo 
} from '../utils/transactionUtils';
```

### 狀態管理
```typescript
// 狀態顯示範例
const statusInfo = getStatusInfo(transaction.status);
<Chip 
  label={statusInfo.label} 
  color={statusInfo.color as any} 
/>
```

### 錯誤處理
```typescript
// 安全的資料存取
const getAccountName = (entry: any) => {
  if (typeof entry.accountId === 'object' && entry.accountId?.name) {
    return entry.accountId.name;
  }
  return entry.accountName || entry.account?.name || '未知科目';
};
```

## 📱 響應式行為

### 桌面版 (md+)
- 完整的資訊展示
- 多欄位佈局
- 詳細的操作按鈕

### 平板版 (sm-md)
- 適中的資訊密度
- 兩欄佈局
- 簡化的操作介面

### 手機版 (xs)
- 單欄佈局
- 精簡的資訊顯示
- 觸控友好的按鈕

## 🎯 使用模式

### 完整頁面組合
```typescript
const TransactionDetailPage = ({ transactionId }) => {
  const { transaction, loading, error } = useTransactionDetail(transactionId);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <Container>
      <TransactionBreadcrumbs onNavigateToList={handleNavigateToList} />
      
      <Box sx={{ mb: 2 }}>
        <TransactionActions
          onEdit={handleEdit}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onBackToList={handleBackToList}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TransactionBasicInfo transaction={transaction} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TransactionFundingFlow 
            entries={transaction.entries}
            totalAmount={transaction.totalAmount}
          />
        </Grid>
      </Grid>
    </Container>
  );
};
```

### 模組化使用
```typescript
// 只使用特定組件
const TransactionSummary = ({ transaction }) => {
  return (
    <Card>
      <CardContent>
        <TransactionBasicInfo transaction={transaction} />
      </CardContent>
    </Card>
  );
};
```

## 🔗 相關依賴

### UI 框架
- `@mui/material` - Material-UI 組件
- `@mui/icons-material` - Material-UI 圖示

### 類型定義
- `@pharmacy-pos/shared/types/accounting3` - 交易類型定義

### 工具函數
- `../utils/transactionUtils` - 格式化和工具函數

## ⚠️ 注意事項

### 資料安全
1. **空值檢查**: 始終檢查資料是否存在
2. **類型驗證**: 確保資料類型正確
3. **錯誤邊界**: 設置適當的錯誤處理

### 性能考量
1. **記憶化**: 對複雜計算使用 `useMemo`
2. **條件渲染**: 避免不必要的組件渲染
3. **懶載入**: 對大型組件考慮懶載入

### 可維護性
1. **組件分離**: 保持組件職責單一
2. **Props 介面**: 明確定義 Props 類型
3. **文檔更新**: 保持文檔與代碼同步

## 🚀 未來擴展

- 增加更多互動功能
- 支援自定義主題
- 添加動畫效果
- 擴展可訪問性功能
- 支援多語言
- 增加單元測試覆蓋率

## 🧪 測試建議

```typescript
// 組件測試範例
describe('TransactionBasicInfo', () => {
  it('should display transaction information correctly', () => {
    const mockTransaction = {
      transactionDate: '2024-01-15',
      description: '測試交易',
      totalAmount: 1000,
      status: 'confirmed'
    };

    render(<TransactionBasicInfo transaction={mockTransaction} />);
    
    expect(screen.getByText('測試交易')).toBeInTheDocument();
    expect(screen.getByText('NT$1,000')).toBeInTheDocument();
  });

  it('should handle missing data gracefully', () => {
    const incompleteTransaction = {
      description: '不完整交易'
    };

    expect(() => {
      render(<TransactionBasicInfo transaction={incompleteTransaction} />);
    }).not.toThrow();
  });
});