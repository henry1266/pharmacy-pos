# Organizations Feature

機構管理功能模組，提供完整的機構資訊管理和階層結構支援。

## 📁 檔案結構

```
organizations/
├── README.md           # 本說明文件
├── index.ts           # 統一導出
└── OrganizationForm.tsx # 機構表單組件
```

## 🎯 功能概述

### 核心功能
- **機構建立與編輯**：支援新增和修改機構資訊
- **階層管理**：支援上下級機構關係設定
- **多類型支援**：藥局、診所、總部等不同機構類型
- **狀態管理**：營業中、暫停營業、停業等狀態控制
- **資料驗證**：完整的表單驗證和錯誤處理

### 機構類型
- `PHARMACY` - 藥局
- `CLINIC` - 診所  
- `HEADQUARTERS` - 總部

### 機構狀態
- `ACTIVE` - 營業中
- `INACTIVE` - 暫停營業
- `SUSPENDED` - 停業

## 🧩 組件說明

### OrganizationForm
機構表單組件，支援建立和編輯模式。

**Props:**
```typescript
interface OrganizationFormProps {
  organizationId?: string;  // 機構ID（編輯模式）
  mode: 'create' | 'edit';  // 表單模式
}
```

**功能特色:**
- 響應式表單設計
- 即時驗證和錯誤提示
- 父機構選擇器（避免循環引用）
- 多語言和時區設定
- 自動儲存和導航

## 🔧 使用方式

### 基本導入
```typescript
import { OrganizationForm } from '../organizations';
```

### 建立新機構
```tsx
<OrganizationForm mode="create" />
```

### 編輯現有機構
```tsx
<OrganizationForm 
  mode="edit" 
  organizationId="org-123" 
/>
```

## 🔗 相關服務

此功能模組使用以下服務：
- `organizationService` - 機構資料 CRUD 操作
- 共享類型定義來自 `@pharmacy-pos/shared/types/organization`

## 📋 表單欄位

### 基本資訊
- 機構代碼（必填，2-10位英數字）
- 機構名稱（必填）
- 機構類型（必選）
- 營業狀態
- 上級機構（可選）

### 聯絡資訊
- 地址（必填）
- 聯絡電話（必填）
- 電子郵件（可選）
- 統一編號（可選，8位數字）

### 營業資訊
- 成立日期（必填）
- 營業執照號碼（可選）

### 系統設定
- 時區（預設：Asia/Taipei）
- 預設貨幣（預設：TWD）
- 預設語言（預設：zh-TW）

### 備註
- 機構備註（可選，最多1000字）

## 🎨 UI/UX 特色

- **卡片式佈局**：清晰的資訊分組
- **響應式設計**：適配不同螢幕尺寸
- **即時驗證**：輸入時即時檢查和提示
- **圖示支援**：不同機構類型的視覺化圖示
- **自動完成**：父機構選擇器支援搜尋和篩選

## 🔄 狀態管理

組件內部管理以下狀態：
- `formData` - 表單資料
- `loading` - 載入狀態
- `saving` - 儲存狀態
- `errors` - 驗證錯誤
- `parentOrganizations` - 可選父機構列表

## ⚠️ 注意事項

1. **循環引用防護**：系統會自動排除可能造成循環引用的父機構選項
2. **代碼唯一性**：機構代碼必須在系統中唯一
3. **權限控制**：需要適當的權限才能建立或編輯機構
4. **資料完整性**：刪除機構前需確保沒有相關的子機構或業務資料

## 🚀 未來擴展

- 批量匯入機構資料
- 機構績效統計
- 地理位置整合
- 多語言介面支援
- 機構間資料同步