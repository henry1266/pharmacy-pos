# Accounting2 到 Accounting3 遷移指南

## 概述

本指南將協助您將專案從 accounting2 遷移到獨立的 accounting3 模組，減少依賴並提升架構品質。

## 遷移策略

### 階段 1：建立獨立型別系統 ✅

已完成的工作：
- ✅ 建立 `frontend/src/modules/accounting3/types/core.ts` - 獨立的核心型別
- ✅ 建立 `frontend/src/modules/accounting3/adapters/compatibility.ts` - 相容性適配器
- ✅ 更新 `frontend/src/modules/accounting3/types.ts` - 使用新的型別系統
- ✅ 更新 `frontend/src/modules/accounting3/index.ts` - 統一導出介面

### 階段 2：逐步遷移檔案

需要遷移的檔案清單（基於搜尋結果）：

#### 高優先級檔案
1. `frontend/src/modules/accounting3/core/AccountHierarchyService.ts`
2. `frontend/src/modules/accounting3/core/AccountHierarchyBuilder.ts`
3. `frontend/src/services/accounting3Service.ts`

#### 中優先級檔案
4. `frontend/src/utils/transactionUtils.ts`
5. `frontend/src/services/accounting2Service.ts`

#### 低優先級檔案（accounting2 模組內部）
6. `frontend/src/modules/accounting2/core/services/index.ts`
7. `frontend/src/modules/accounting2/core/hooks/useOptimizedAccountList.ts`
8. `frontend/src/modules/accounting2/core/services/TransactionService.ts`
9. `frontend/src/modules/accounting2/core/hooks/useAccountManagement.ts`
10. `frontend/src/modules/accounting2/core/hooks/useAccountForm.ts`
11. `frontend/src/modules/accounting2/core/services/AccountService.ts`
12. `frontend/src/modules/accounting2/core/stores/useAccountStore.ts`
13. `frontend/src/modules/accounting2/core/api-clients/CategoryApiClient.ts`

## 手動遷移步驟

### 步驟 1：更新 AccountHierarchyService

```typescript
// 原始 import
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { AccountManagementAdapter } from '@pharmacy-pos/shared/adapters/accounting2to3';

// 遷移後 import
import { Account3 } from '../types/core';
import { Accounting2To3Adapter } from '../adapters/compatibility';
```

### 步驟 2：更新型別引用

```typescript
// 原始型別
Account2 → Account3
TransactionGroupWithEntries → TransactionGroupWithEntries3
EmbeddedAccountingEntry → AccountingEntry3
Category2 → Category3
```

### 步驟 3：更新函數呼叫

```typescript
// 原始函數呼叫
AccountManagementAdapter.normalizeAccounts(response.data)
// 遷移後
Accounting2To3Adapter.convertAccounts(response.data)

// 原始函數呼叫
AccountManagementAdapter.normalizeAccount(account)
// 遷移後
Accounting2To3Adapter.convertAccount(account)
```

### 步驟 4：更新服務層

建立新的 accounting3 專用服務：

```typescript
// frontend/src/services/accounting3ServiceV2.ts
import { 
  Account3, 
  TransactionGroupWithEntries3,
  Account3ListResponse,
  TransactionGroupWithEntries3ListResponse 
} from '../modules/accounting3';

export class Accounting3ServiceV2 {
  async getAccounts(organizationId?: string): Promise<Account3ListResponse> {
    // 實作獨立的 API 呼叫
  }

  async getTransactions(filters?: any): Promise<TransactionGroupWithEntries3ListResponse> {
    // 實作獨立的 API 呼叫
  }
}
```

## 遷移檢查清單

### 型別遷移
- [ ] 將所有 `Account2` 替換為 `Account3`
- [ ] 將所有 `TransactionGroupWithEntries` 替換為 `TransactionGroupWithEntries3`
- [ ] 將所有 `EmbeddedAccountingEntry` 替換為 `AccountingEntry3`
- [ ] 更新所有相關的表單型別

### Import 遷移
- [ ] 移除 `@pharmacy-pos/shared/types/accounting2` 的 import
- [ ] 添加 `../modules/accounting3` 的 import
- [ ] 更新適配器的 import 路徑

### 函數遷移
- [ ] 更新所有適配器函數呼叫
- [ ] 驗證資料轉換的正確性
- [ ] 測試 API 回應的相容性

### 測試遷移
- [ ] 更新單元測試的型別引用
- [ ] 驗證整合測試的正確性
- [ ] 執行端到端測試

## 相容性考量

### 暫時保留的相容性
在遷移過程中，可以暫時保留以下相容性機制：

1. **雙向適配器**：使用 `Accounting2To3Adapter` 和 `Accounting3To2Adapter`
2. **漸進式遷移**：一次遷移一個模組，避免大規模破壞性變更
3. **型別別名**：在過渡期間提供型別別名

```typescript
// 過渡期間的型別別名
export type Account2Compatible = Account3;
export type TransactionGroupCompatible = TransactionGroupWithEntries3;
```

### 最終清理
完成遷移後需要清理：

1. 移除所有 accounting2 的依賴
2. 刪除相容性適配器（如果不再需要）
3. 清理未使用的 import
4. 更新文件和註釋

## 驗證步驟

### 功能驗證
1. **科目管理**：確保科目的 CRUD 操作正常
2. **交易處理**：驗證交易群組和分錄的處理
3. **階層結構**：測試科目階層的展開和操作
4. **資料一致性**：確保遷移前後資料一致

### 效能驗證
1. **載入時間**：比較遷移前後的載入效能
2. **記憶體使用**：監控記憶體使用情況
3. **API 回應**：驗證 API 回應時間

### 相容性驗證
1. **向後相容**：確保現有功能不受影響
2. **資料格式**：驗證資料格式的相容性
3. **API 介面**：確保 API 介面保持一致

## 常見問題

### Q: 遷移過程中如何處理資料庫？
A: 資料庫結構不需要變更，只需要更新前端的型別定義和資料處理邏輯。

### Q: 如何確保遷移不會破壞現有功能？
A: 使用相容性適配器進行漸進式遷移，並在每個階段進行充分測試。

### Q: 遷移完成後如何移除 accounting2？
A: 確認所有功能正常後，逐步移除 accounting2 的檔案和依賴，最後清理 package.json。

### Q: 如何處理第三方套件的依賴？
A: 檢查是否有第三方套件依賴 accounting2 型別，如有需要建立適配器或更新套件。

## 支援資源

- **型別定義**：`frontend/src/modules/accounting3/types/core.ts`
- **適配器**：`frontend/src/modules/accounting3/adapters/compatibility.ts`
- **遷移腳本**：`scripts/migrate-accounting2-to-accounting3.ts`
- **測試檔案**：待建立相關測試檔案

## 時程規劃

建議的遷移時程：

- **第 1 週**：遷移核心服務和型別
- **第 2 週**：遷移 UI 組件和 hooks
- **第 3 週**：測試和驗證
- **第 4 週**：清理和文件更新

遵循此指南可以確保平滑且安全的遷移過程。