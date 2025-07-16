# Accounting3 核心服務 (Core Services)

## 📋 概述

核心服務層提供 Accounting3 模組的基礎業務邏輯，包括科目階層管理、統計計算、資料建構等核心功能。

## 🏗️ 架構設計

```
core/
├── AccountHierarchyService.ts     # 科目階層管理服務
├── AccountStatisticsService.ts    # 科目統計服務
├── AccountHierarchyBuilder.ts     # 階層建構器
├── AccountHierarchyFilter.ts      # 階層過濾器
├── hooks/                         # 自定義 Hooks
│   └── useTransactionForm3.ts     # 交易表單 Hook
└── index.ts                       # 統一導出
```

## 🎯 核心服務

### 1. AccountHierarchyService
**主要職責**: 科目階層管理的核心服務

**功能特色**:
- 單例模式設計，確保全域一致性
- 支援階層資料載入和管理
- 提供拖拽操作驗證
- 支援 CRUD 操作

**使用範例**:
```typescript
import { accountHierarchyService } from '@/modules/accounting3/core';

// 載入階層資料
const hierarchy = await accountHierarchyService.loadHierarchy(organizationId);

// 過濾階層節點
const filtered = accountHierarchyService.filterHierarchy(nodes, filter);

// 執行階層操作
const result = await accountHierarchyService.executeOperation('create', nodeId, data);
```

### 2. AccountStatisticsService
**主要職責**: 科目統計資料計算

**功能特色**:
- 餘額計算
- 交易統計
- 階層統計聚合
- 效能優化的批量計算

**使用範例**:
```typescript
import { accountStatisticsService } from '@/modules/accounting3/core';

// 計算統計資料
await accountStatisticsService.calculateStatistics(nodes, organizationId);
```

### 3. AccountHierarchyBuilder
**主要職責**: 階層結構建構

**功能特色**:
- 平面資料轉樹狀結構
- 階層關係驗證
- 循環依賴檢測
- 排序和層級計算

**使用範例**:
```typescript
import { createAccountHierarchyBuilder } from '@/modules/accounting3/core';

const builder = createAccountHierarchyBuilder(config);
const tree = builder.buildHierarchyTree(accounts);
```

### 4. AccountHierarchyFilter
**主要職責**: 階層資料過濾和搜尋

**功能特色**:
- 多條件過濾
- 文字搜尋
- 路徑查找
- 階層展開控制

**使用範例**:
```typescript
import { accountHierarchyFilterService } from '@/modules/accounting3/core';

// 搜尋階層
const results = accountHierarchyFilterService.searchHierarchy(nodes, searchText);

// 獲取節點路徑
const path = accountHierarchyFilterService.getNodePath(nodes, nodeId);
```

## 🔧 自定義 Hooks

### useTransactionForm3
**主要職責**: 交易表單狀態管理

**功能特色**:
- 表單資料管理
- 驗證邏輯
- 借貸平衡檢查
- 分錄操作

**使用範例**:
```typescript
import { useTransactionForm3 } from '@/modules/accounting3/core/hooks';

const {
  formData,
  validation,
  handleBasicInfoChange,
  handleEntriesChange,
  validateForm
} = useTransactionForm3({
  initialData,
  mode: 'create',
  defaultAccountId,
  defaultOrganizationId
});
```

## 📊 設計模式

### 1. 單例模式 (Singleton)
- `AccountHierarchyService` 使用單例模式
- 確保全域狀態一致性
- 避免重複初始化

### 2. 工廠模式 (Factory)
- `createAccountHierarchyBuilder` 工廠函數
- 根據配置創建不同的建構器實例
- 支援配置化的建構邏輯

### 3. 策略模式 (Strategy)
- 不同的過濾策略
- 可擴展的統計計算策略
- 靈活的驗證策略

## 🚀 性能優化

### 1. 記憶化 (Memoization)
```typescript
// 使用 useMemo 快取複雜計算
const statistics = useMemo(() => 
  calculateStatistics(accounts), [accounts]
);
```

### 2. 批量處理
```typescript
// 批量計算統計資料
await accountStatisticsService.calculateStatistics(allNodes, organizationId);
```

### 3. 懶載入
```typescript
// 按需載入階層資料
const loadHierarchy = useCallback(async () => {
  if (!loaded) {
    const data = await accountHierarchyService.loadHierarchy(orgId);
    setLoaded(true);
  }
}, [loaded, orgId]);
```

## 🧪 測試策略

### 單元測試
```typescript
describe('AccountHierarchyService', () => {
  test('should load hierarchy correctly', async () => {
    const service = AccountHierarchyService.getInstance();
    const result = await service.loadHierarchy('org1');
    expect(result).toBeDefined();
  });
});
```

### 整合測試
```typescript
describe('Core Services Integration', () => {
  test('should work together correctly', async () => {
    // 測試服務間的協作
  });
});
```

## 🔄 錯誤處理

### 統一錯誤處理
```typescript
try {
  const result = await accountHierarchyService.executeOperation(operation, nodeId, data);
  if (!result.success) {
    throw new Error(result.error);
  }
} catch (error) {
  console.error('操作失敗:', error);
  // 統一錯誤處理邏輯
}
```

## 📈 監控和日誌

### 性能監控
```typescript
console.time('loadHierarchy');
const hierarchy = await accountHierarchyService.loadHierarchy(orgId);
console.timeEnd('loadHierarchy');
```

### 操作日誌
```typescript
console.log('🔄 [Accounting3] 執行操作:', {
  operation,
  nodeId,
  timestamp: new Date().toISOString()
});
```

## 🔮 擴展指南

### 新增服務
1. 創建服務類別
2. 實作核心介面
3. 加入統一導出
4. 撰寫測試

### 新增 Hook
1. 創建 Hook 檔案
2. 實作狀態邏輯
3. 加入型別定義
4. 撰寫使用範例

---

**最後更新**: 2025-01-16  
**維護者**: 開發團隊