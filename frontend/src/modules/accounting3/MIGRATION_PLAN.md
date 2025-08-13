# Accounting3 模組架構重構遷移計劃

## 📋 概述

本文檔詳細說明從現有的 `features/` 目錄結構重構為更直觀的功能導向扁平架構的遷移計劃。

## 🏗️ 架構映射

### 現有架構
```
frontend/src/modules/accounting3/
├── components/         # 共用 UI 元件
│   └── ui/            # UI 元件
├── core/              # 核心服務
├── features/          # 功能模組
│   ├── accounts/      # 科目管理功能
│   ├── organizations/ # 機構管理功能
│   └── transactions/  # 交易管理功能
├── pages/             # 頁面元件
├── services/          # 全局服務
└── types/             # 全局類型定義
```

### 目標架構
```
frontend/src/modules/accounting3/
├── ui/                # 共用 UI 元件 (原 components/ui/)
├── core/              # 核心服務 (保持不變)
├── shared/            # 跨功能模組共享資源 (新增)
├── accounts/          # 科目管理功能 (原 features/accounts/)
│   ├── components/    # 科目相關元件
│   ├── hooks/         # 科目相關 hooks
│   ├── services/      # 科目相關服務
│   ├── types/         # 科目相關類型
│   ├── utils/         # 科目相關工具函數
│   └── pages/         # 科目相關頁面 (從 pages/ 遷移)
├── organizations/     # 機構管理功能 (原 features/organizations/)
│   ├── components/    # 機構相關元件
│   ├── hooks/         # 機構相關 hooks
│   ├── services/      # 機構相關服務
│   ├── types/         # 機構相關類型
│   ├── utils/         # 機構相關工具函數
│   └── pages/         # 機構相關頁面 (從 pages/ 遷移)
└── transactions/      # 交易管理功能 (原 features/transactions/)
    ├── components/    # 交易相關元件
    ├── hooks/         # 交易相關 hooks
    ├── services/      # 交易相關服務
    ├── types/         # 交易相關類型
    ├── utils/         # 交易相關工具函數
    └── pages/         # 交易相關頁面 (從 pages/ 遷移)
```

## 📅 遷移時間表

| 階段 | 任務 | 預計時間 | 負責人 |
|------|------|----------|--------|
| 1 | 架構設計與規劃 | 1週 | 架構師 |
| 2 | 建立新的檔案結構 | 1天 | 前端開發 |
| 3 | 遷移 accounts 功能模組 | 3天 | 前端開發 |
| 4 | 遷移 organizations 功能模組 | 2天 | 前端開發 |
| 5 | 遷移 transactions 功能模組 | 3天 | 前端開發 |
| 6 | 重構共享資源 | 2天 | 前端開發 |
| 7 | 更新導出策略 | 1天 | 前端開發 |
| 8 | 測試與驗證 | 3天 | QA |
| 9 | 文檔更新 | 1天 | 技術文檔 |
| **總計** | | **2週** | |

## 🔄 遷移策略

### 1. 準備工作
- 建立遷移分支 `feature/accounting3-restructure`
- 確保所有測試通過
- 備份關鍵文件

### 2. 建立新的檔案結構
- 在不刪除現有文件的情況下，創建新的目錄結構
- 保留現有的 `features/`、`components/` 和 `pages/` 目錄，直到遷移完成

### 3. 文件遷移方法
- **複製優先於移動**：先複製文件到新位置，確認功能正常後再刪除原文件
- **逐個模組遷移**：一次只遷移一個功能模組，確保每個模組遷移後都能正常工作
- **保持導入兼容**：使用重新導出（re-export）保持向後兼容

### 4. 導入路徑兼容策略

#### 階段 1: 雙路徑支持
在 `features/accounts/index.ts` 中添加：
```typescript
// 重新導出新路徑的內容，保持向後兼容
export * from '../../accounts';
```

#### 階段 2: 導入路徑更新
使用搜尋替換功能，更新所有導入路徑：
- 從: `import { X } from '@/modules/accounting3/features/accounts'`
- 到: `import { X } from '@/modules/accounting3/accounts'`

#### 階段 3: 移除舊路徑
完成所有導入路徑更新後，移除舊的目錄和重新導出。

## 📝 詳細遷移步驟

### 1. 遷移 accounts 功能模組

#### 1.1 創建目標目錄結構
```
accounting3/accounts/
├── components/
├── hooks/
├── services/
├── types/
├── utils/
└── pages/
```

#### 1.2 複製文件
- 從 `features/accounts/components/` 到 `accounts/components/`
- 從 `features/accounts/hooks/` 到 `accounts/hooks/`
- 從 `features/accounts/services/` 到 `accounts/services/`
- 從 `features/accounts/types/` 到 `accounts/types/`
- 從 `features/accounts/utils/` 到 `accounts/utils/`
- 從 `pages/AccountPage/` 到 `accounts/pages/`

#### 1.3 更新導入路徑
- 在新文件中更新所有相對導入路徑
- 添加重新導出以保持向後兼容

#### 1.4 測試功能
- 確保所有單元測試通過
- 手動測試關鍵功能

### 2. 遷移 organizations 功能模組

#### 2.1 創建目標目錄結構
```
accounting3/organizations/
├── components/
├── hooks/
├── services/
├── types/
├── utils/
└── pages/
```

#### 2.2 複製文件
- 從 `features/organizations/components/` 到 `organizations/components/`
- 從 `features/organizations/hooks/` 到 `organizations/hooks/`
- 從 `features/organizations/services/` 到 `organizations/services/`
- 從 `features/organizations/types/` 到 `organizations/types/`
- 從 `features/organizations/utils/` 到 `organizations/utils/`
- 從 `pages/OrganizationPage/` 到 `organizations/pages/`

#### 2.3 更新導入路徑
- 在新文件中更新所有相對導入路徑
- 添加重新導出以保持向後兼容

#### 2.4 測試功能
- 確保所有單元測試通過
- 手動測試關鍵功能

### 3. 遷移 transactions 功能模組

#### 3.1 創建目標目錄結構
```
accounting3/transactions/
├── components/
├── hooks/
├── services/
├── types/
├── utils/
└── pages/
```

#### 3.2 複製文件
- 從 `features/transactions/components/` 到 `transactions/components/`
- 從 `features/transactions/hooks/` 到 `transactions/hooks/`
- 從 `features/transactions/services/` 到 `transactions/services/`
- 從 `features/transactions/types/` 到 `transactions/types/`
- 從 `features/transactions/utils/` 到 `transactions/utils/`
- 從 `pages/TransactionPage/` 到 `transactions/pages/`

#### 3.3 更新導入路徑
- 在新文件中更新所有相對導入路徑
- 添加重新導出以保持向後兼容

#### 3.4 測試功能
- 確保所有單元測試通過
- 手動測試關鍵功能

### 4. 重構共享資源

#### 4.1 創建共享目錄
```
accounting3/
├── ui/        # 從 components/ui/ 遷移
└── shared/    # 新增目錄
    ├── constants/
    └── helpers/
```

#### 4.2 遷移 UI 組件
- 從 `components/ui/` 到 `ui/`
- 更新導入路徑

#### 4.3 識別並遷移共享資源
- 識別跨功能模組使用的常量、工具函數等
- 將它們遷移到 `shared/` 目錄下

### 5. 更新導出策略

#### 5.1 更新根目錄 `index.ts`
```typescript
// 導出核心功能
export * from './core';

// 導出共用 UI 元件
export * from './ui';

// 導出共享資源
export * from './shared';

// 導出功能模組的公共 API
export * from './accounts';
export * from './organizations';
export * from './transactions';

// 向後兼容 (臨時)
export * as features from './features';
export * as components from './components';
export * as pages from './pages';
```

#### 5.2 更新各功能模組 `index.ts`
```typescript
// 導出公共 API
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
export * from './utils';

// 導出頁面
export * from './pages';
```

### 6. 測試與驗證

#### 6.1 單元測試
- 執行所有單元測試
- 修復任何失敗的測試

#### 6.2 整合測試
- 執行所有整合測試
- 確保模組間的交互正常

#### 6.3 端到端測試
- 執行關鍵功能的端到端測試
- 確保用戶體驗不受影響

### 7. 清理與完成

#### 7.1 移除舊目錄
- 確認所有功能正常後，移除 `features/`、`components/` 和 `pages/` 目錄
- 移除臨時的向後兼容導出

#### 7.2 更新文檔
- 更新 README.md
- 更新開發指南
- 建立架構說明文檔

## 🛠️ 工具與資源

### 搜尋替換命令
```bash
# 更新導入路徑 - accounts
grep -r "from '@/modules/accounting3/features/accounts" --include="*.ts" --include="*.tsx" . | cut -d: -f1 | xargs sed -i 's|from '"'"'@/modules/accounting3/features/accounts|from '"'"'@/modules/accounting3/accounts|g'

# 更新導入路徑 - organizations
grep -r "from '@/modules/accounting3/features/organizations" --include="*.ts" --include="*.tsx" . | cut -d: -f1 | xargs sed -i 's|from '"'"'@/modules/accounting3/features/organizations|from '"'"'@/modules/accounting3/organizations|g'

# 更新導入路徑 - transactions
grep -r "from '@/modules/accounting3/features/transactions" --include="*.ts" --include="*.tsx" . | cut -d: -f1 | xargs sed -i 's|from '"'"'@/modules/accounting3/features/transactions|from '"'"'@/modules/accounting3/transactions|g'

# 更新導入路徑 - components/ui
grep -r "from '@/modules/accounting3/components/ui" --include="*.ts" --include="*.tsx" . | cut -d: -f1 | xargs sed -i 's|from '"'"'@/modules/accounting3/components/ui|from '"'"'@/modules/accounting3/ui|g'
```

### 測試腳本
```bash
# 執行所有 accounting3 相關測試
npm test -- --testPathPattern=accounting3
```

## 🔍 風險評估與緩解策略

### 潛在風險
1. **導入路徑錯誤**：遷移過程中可能出現導入路徑錯誤
2. **功能中斷**：重構可能導致某些功能暫時中斷
3. **測試覆蓋不足**：某些邊緣情況可能未被測試覆蓋

### 緩解策略
1. **漸進式遷移**：一次只遷移一個功能模組，確保每個模組遷移後都能正常工作
2. **雙路徑支持**：使用重新導出保持向後兼容，減少中斷風險
3. **全面測試**：增加測試覆蓋率，特別是關鍵功能
4. **回滾計劃**：準備回滾策略，以便在出現嚴重問題時快速恢復

## 📊 成功指標

1. **所有測試通過**：單元測試、整合測試和端到端測試全部通過
2. **無功能退化**：所有現有功能正常工作，無退化
3. **代碼質量提升**：代碼可讀性和可維護性提升
4. **開發體驗改善**：開發者反饋積極，導航和開發效率提升

## 📝 結論

本遷移計劃提供了從現有架構遷移到功能導向扁平架構的詳細步驟。通過遵循這些步驟，我們可以實現更直觀、更易於維護的代碼組織結構，同時確保現有功能不受影響。

---

**最後更新**: 2025-08-13
**版本**: 1.0.0
**維護者**: 開發團隊