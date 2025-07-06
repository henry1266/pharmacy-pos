# Accounting2 與機構整合使用指南

## 概述

Accounting2 系統現已支援與機構管理系統的完整整合，提供**混合模式**的帳務管理：
- **個人帳務**：用戶的私人財務管理
- **機構帳務**：機構內共享的財務資料

## 🏗️ 架構設計

### 資料模型更新

所有 Accounting2 模型都新增了 `organizationId` 欄位：

```typescript
// 支援機構的資料結構
interface Account2 {
  // ... 其他欄位
  organizationId?: string; // 機構 ID（可選）
  createdBy: string;       // 建立者 ID
}
```

### 資料隔離策略

1. **個人模式**：`organizationId` 為 `null` 或不存在
2. **機構模式**：`organizationId` 指向特定機構 ID
3. **權限控制**：用戶只能存取自己建立的資料

## 🔧 API 使用方式

### 1. 獲取帳戶列表

```http
# 獲取個人帳戶
GET /api/accounts2/

# 獲取特定機構的帳戶
GET /api/accounts2/?organizationId=60f1b2c3d4e5f6789abcdef0
```

### 2. 建立帳戶

```http
POST /api/accounts2/
Content-Type: application/json

{
  "name": "公司現金帳戶",
  "type": "cash",
  "initialBalance": 100000,
  "currency": "TWD",
  "organizationId": "60f1b2c3d4e5f6789abcdef0"  // 可選
}
```

### 3. 類別管理

```http
# 獲取機構類別
GET /api/categories2/?organizationId=60f1b2c3d4e5f6789abcdef0

# 建立機構類別
POST /api/categories2/
{
  "name": "辦公用品",
  "type": "expense",
  "organizationId": "60f1b2c3d4e5f6789abcdef0"
}
```

## 💻 前端整合

### 機構選擇器

在 Accounting2Page 中加入機構選擇功能：

```tsx
const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);

// 機構切換處理
const handleOrganizationChange = (orgId: string | null) => {
  setSelectedOrganization(orgId);
  // 重新載入資料
};
```

### 服務層更新

```typescript
// 帳戶服務
export const accountService = {
  getAccounts: (organizationId?: string) => 
    api.get(`/accounts2${organizationId ? `?organizationId=${organizationId}` : ''}`),
    
  createAccount: (data: Account2FormData) => 
    api.post('/accounts2', data)
};
```

## 🎯 使用場景

### 場景 1：個人用戶
```typescript
// 不指定 organizationId，管理個人財務
const personalAccounts = await accountService.getAccounts();
```

### 場景 2：企業用戶
```typescript
// 指定 organizationId，管理機構財務
const companyAccounts = await accountService.getAccounts('org123');
```

### 場景 3：混合使用
```typescript
// 用戶可以同時管理個人和多個機構的財務
const personalAccounts = await accountService.getAccounts();
const company1Accounts = await accountService.getAccounts('org123');
const company2Accounts = await accountService.getAccounts('org456');
```

## 🔒 安全性考量

### 權限驗證
- 所有資料都必須通過 `createdBy` 驗證
- 用戶只能存取自己建立的資料
- 機構資料需要額外的機構權限驗證（未來擴展）

### 資料隔離
- 個人資料與機構資料完全隔離
- 不同機構間的資料互不干擾
- 查詢時自動過濾權限範圍

## 📊 資料庫索引優化

```javascript
// 優化的索引設計
Account2Schema.index({ createdBy: 1, isActive: 1 });
Account2Schema.index({ organizationId: 1, isActive: 1 });
Account2Schema.index({ organizationId: 1, createdBy: 1, isActive: 1 });
```

## 🚀 未來擴展

### 1. 機構權限系統
- 機構管理員角色
- 成員權限控制
- 資料共享設定

### 2. 跨機構報表
- 合併財務報表
- 機構間轉帳記錄
- 統計分析功能

### 3. 審計追蹤
- 操作日誌記錄
- 資料變更追蹤
- 合規性報告

## 📝 開發注意事項

1. **向後相容性**：現有個人資料不受影響
2. **類型安全**：所有介面都已更新 TypeScript 類型
3. **效能優化**：新增適當的資料庫索引
4. **錯誤處理**：完善的錯誤回饋機制

## 🔄 遷移指南

### 現有資料遷移
```javascript
// 現有資料無需遷移，organizationId 為可選欄位
// 新資料會根據使用情境自動設定 organizationId
```

### 前端組件更新
```tsx
// 更新表單組件以支援機構選擇
<AccountForm 
  organizationId={selectedOrganization}
  onSubmit={handleSubmit}
/>
```

---

**總結**：Accounting2 現已完全支援機構整合，提供靈活的個人與企業財務管理解決方案。