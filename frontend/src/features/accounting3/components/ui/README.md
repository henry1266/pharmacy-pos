# Accounting3 UI 組件 (UI Components)

## 📋 概述

UI 組件層提供可重用的純 UI 組件，專注於視覺呈現和使用者互動，不包含業務邏輯。這些組件可以在不同的功能組件中重複使用。

## 🏗️ 架構設計

```
ui/
├── FundingSourceSelector3.tsx           # 資金來源選擇器
├── AccountingDataGridWithEntries.tsx    # 會計資料表格
├── AccountingDataGridWithEntries3.tsx   # 會計資料表格 v3
├── BasicInfoSection.tsx                 # 基本資訊區塊
├── BasicInfoSection3.tsx                # 基本資訊區塊 v3
├── DoubleEntrySection3.tsx              # 複式記帳區塊
├── index.ts                             # 統一導出
└── README.md                            # 本文件
```

## 🎯 組件分類

### 1. 表單組件

#### FundingSourceSelector3
**功能**: 資金來源選擇器組件

**特色**:
- 支援多種資金來源類型
- 自動過濾可用資金
- 即時餘額顯示
- 搜尋和過濾功能

**使用範例**:
```tsx
import { FundingSourceSelector3 } from '@/modules/accounting3/components/ui';

const TransactionForm = () => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  return (
    <FundingSourceSelector3
      organizationId={currentOrgId}
      selectedSourceId={selectedSource}
      onSourceSelect={setSelectedSource}
      filterAvailable={true}
      showBalance={true}
    />
  );
};
```

#### BasicInfoSection / BasicInfoSection3
**功能**: 基本資訊輸入區塊

**特色**:
- 統一的基本資訊佈局
- 表單驗證支援
- 響應式設計
- 可配置欄位顯示

**使用範例**:
```tsx
import { BasicInfoSection } from '@/modules/accounting3/components/ui';

const AccountForm = () => {
  const [basicInfo, setBasicInfo] = useState({
    code: '',
    name: '',
    description: ''
  });
  
  return (
    <BasicInfoSection
      data={basicInfo}
      onChange={setBasicInfo}
      errors={validationErrors}
      disabled={isReadOnly}
    />
  );
};
```

### 2. 資料展示組件

#### AccountingDataGridWithEntries
**功能**: 會計資料表格組件

**特色**:
- 支援大量資料虛擬化
- 可排序和過濾
- 自定義欄位配置
- 批量操作支援
- 匯出功能

**使用範例**:
```tsx
import { AccountingDataGridWithEntries } from '@/modules/accounting3/components/ui';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  
  return (
    <AccountingDataGridWithEntries
      data={transactions}
      columns={columnConfig}
      selectedRows={selectedRows}
      onSelectionChange={setSelectedRows}
      onRowClick={handleRowClick}
      enableVirtualization={true}
      pageSize={50}
    />
  );
};
```

### 3. 複合組件

#### DoubleEntrySection3
**功能**: 複式記帳分錄區塊

**特色**:
- 完整的借貸分錄管理
- 自動平衡驗證
- 快速操作按鈕
- 分錄模板支援
- 借貸對調功能

**使用範例**:
```tsx
import { DoubleEntrySection3 } from '@/modules/accounting3/components/ui';

const TransactionForm = () => {
  const [entries, setEntries] = useState([]);
  const [balanceInfo, setBalanceInfo] = useState({
    isBalanced: false,
    totalDebit: 0,
    totalCredit: 0,
    difference: 0
  });
  
  return (
    <DoubleEntrySection3
      entries={entries}
      onEntriesChange={setEntries}
      organizationId={currentOrgId}
      mode="create"
      permissions={{ canEdit: true }}
      errors={validationErrors}
      balanceError={balanceError}
      balanceInfo={balanceInfo}
      onOpenTemplateDialog={handleOpenTemplate}
      onOpenQuickStartDialog={handleOpenQuickStart}
      onSwapDebitCredit={handleSwapDebitCredit}
      onQuickBalance={handleQuickBalance}
    />
  );
};
```

## 🚀 使用方式

### 1. 基本使用
```tsx
import { 
  FundingSourceSelector3, 
  BasicInfoSection, 
  DoubleEntrySection3 
} from '@/modules/accounting3/components/ui';

const MyForm = () => {
  return (
    <form>
      <BasicInfoSection {...basicProps} />
      <FundingSourceSelector3 {...fundingProps} />
      <DoubleEntrySection3 {...entryProps} />
    </form>
  );
};
```

### 2. 組合使用
```tsx
const TransactionFormLayout = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <BasicInfoSection {...basicInfoProps} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FundingSourceSelector3 {...fundingProps} />
      </Grid>
      <Grid item xs={12}>
        <DoubleEntrySection3 {...entryProps} />
      </Grid>
    </Grid>
  );
};
```

### 3. 自定義樣式
```tsx
import { styled } from '@mui/material/styles';
import { BasicInfoSection } from '@/modules/accounting3/components/ui';

const StyledBasicInfoSection = styled(BasicInfoSection)(({ theme }) => ({
  '& .MuiCard-root': {
    boxShadow: theme.shadows[3],
    borderRadius: theme.spacing(2)
  },
  '& .MuiCardHeader-root': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  }
}));
```

## 🎨 設計原則

### 1. 單一職責
每個 UI 組件只負責特定的視覺功能
```tsx
// ✅ 好的設計 - 單一職責
const FundingSourceSelector = ({ sources, onSelect }) => {
  // 只負責資金來源選擇的 UI
};

// ❌ 避免 - 職責混合
const FundingSourceSelectorWithValidation = ({ sources, onSelect }) => {
  // 包含選擇 UI + 驗證邏輯 + 資料載入
};
```

### 2. 可組合性
組件應該易於組合和重用
```tsx
// 可組合的設計
const FormSection = ({ title, children }) => (
  <Card>
    <CardHeader title={title} />
    <CardContent>{children}</CardContent>
  </Card>
);

// 使用組合
const MyForm = () => (
  <div>
    <FormSection title="基本資訊">
      <BasicInfoSection {...props} />
    </FormSection>
    <FormSection title="分錄資訊">
      <DoubleEntrySection3 {...props} />
    </FormSection>
  </div>
);
```

### 3. 可配置性
提供豐富的配置選項
```tsx
interface ComponentProps {
  // 基本配置
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  
  // 功能配置
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  
  // 顯示配置
  showHeader?: boolean;
  showFooter?: boolean;
  compact?: boolean;
  
  // 行為配置
  autoFocus?: boolean;
  clearable?: boolean;
  searchable?: boolean;
}
```

## 🔧 組件開發指南

### 1. 組件結構模板
```tsx
import React, { forwardRef } from 'react';
import { ComponentProps } from './types';

/**
 * UI 組件描述
 * 
 * @param props - 組件屬性
 * @param ref - 組件引用
 */
const UIComponent = forwardRef<HTMLDivElement, ComponentProps>(({
  variant = 'standard',
  size = 'medium',
  disabled = false,
  className,
  children,
  ...restProps
}, ref) => {
  return (
    <div
      ref={ref}
      className={`ui-component ${variant} ${size} ${className || ''}`}
      {...restProps}
    >
      {children}
    </div>
  );
});

UIComponent.displayName = 'UIComponent';

export default UIComponent;
```

### 2. Props 型別定義
```tsx
interface UIComponentProps {
  // 基本屬性
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  
  // 內容屬性
  title?: string;
  description?: string;
  children?: React.ReactNode;
  
  // 事件處理
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (value: any) => void;
  
  // 樣式屬性
  className?: string;
  style?: React.CSSProperties;
  
  // HTML 屬性
  id?: string;
  'data-testid'?: string;
}
```

### 3. 樣式處理
```tsx
import { styled } from '@mui/material/styles';

const StyledComponent = styled('div')<{ variant: string; size: string }>(
  ({ theme, variant, size }) => ({
    // 基本樣式
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),
    
    // 變體樣式
    ...(variant === 'outlined' && {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius
    }),
    
    // 尺寸樣式
    ...(size === 'small' && {
      padding: theme.spacing(0.5),
      fontSize: theme.typography.body2.fontSize
    }),
    
    // 響應式樣式
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column'
    }
  })
);
```

## 📊 性能優化

### 1. React.memo 優化
```tsx
const OptimizedComponent = React.memo<Props>(({ data, onSelect }) => {
  return (
    <div>
      {data.map(item => (
        <Item key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定義比較邏輯
  return prevProps.data === nextProps.data && 
         prevProps.onSelect === nextProps.onSelect;
});
```

### 2. 虛擬化支援
```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedDataGrid = ({ items, itemHeight = 50 }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <DataRow item={items[index]} />
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. 懶載入圖片
```tsx
const LazyImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} {...props}>
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </div>
  );
};
```

## 🧪 測試策略

### 1. 單元測試
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FundingSourceSelector3 } from './FundingSourceSelector3';

describe('FundingSourceSelector3', () => {
  const mockSources = [
    { _id: '1', groupNumber: 'TXN-001', availableAmount: 1000 },
    { _id: '2', groupNumber: 'TXN-002', availableAmount: 500 }
  ];
  
  test('should render funding sources', () => {
    render(
      <FundingSourceSelector3
        sources={mockSources}
        onSourceSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('TXN-001')).toBeInTheDocument();
    expect(screen.getByText('TXN-002')).toBeInTheDocument();
  });
  
  test('should call onSourceSelect when source is selected', () => {
    const onSourceSelect = jest.fn();
    render(
      <FundingSourceSelector3
        sources={mockSources}
        onSourceSelect={onSourceSelect}
      />
    );
    
    fireEvent.click(screen.getByText('TXN-001'));
    expect(onSourceSelect).toHaveBeenCalledWith('1');
  });
});
```

### 2. 視覺回歸測試
```tsx
import { render } from '@testing-library/react';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

describe('Visual Regression Tests', () => {
  test('BasicInfoSection should match snapshot', () => {
    const { container } = render(
      <BasicInfoSection
        data={{ code: '1101', name: '現金' }}
        onChange={jest.fn()}
      />
    );
    
    expect(container.firstChild).toMatchImageSnapshot();
  });
});
```

### 3. 無障礙測試
```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(
      <FundingSourceSelector3
        sources={mockSources}
        onSourceSelect={jest.fn()}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 🎯 最佳實踐

### 1. 組件命名
- 使用描述性名稱
- 遵循一致的命名規範
- 避免縮寫和簡稱

### 2. Props 設計
- 提供合理的預設值
- 使用聯合型別限制選項
- 保持 API 的一致性

### 3. 錯誤處理
```tsx
const RobustComponent = ({ data, onError }) => {
  try {
    return <div>{processData(data)}</div>;
  } catch (error) {
    onError?.(error);
    return <ErrorFallback error={error} />;
  }
};
```

### 4. 文檔和範例
```tsx
/**
 * 資金來源選擇器
 * 
 * @example
 * ```tsx
 * <FundingSourceSelector3
 *   organizationId="org123"
 *   onSourceSelect={(sourceId) => console.log(sourceId)}
 *   filterAvailable={true}
 * />
 * ```
 */
const FundingSourceSelector3 = (props) => {
  // 組件實作
};
```

## 🔮 未來規劃

### 短期目標
- [ ] 完善組件文檔和範例
- [ ] 增加無障礙功能支援
- [ ] 優化組件性能
- [ ] 統一設計語言

### 長期目標
- [ ] 建立設計系統
- [ ] 自動化視覺測試
- [ ] 組件庫發布
- [ ] 主題系統支援

---

**最後更新**: 2025-01-16  
**維護者**: 開發團隊