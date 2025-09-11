# 員工管理模組 (Employee Module)

## 概述

員工管理模組是藥局 POS 系統的核心模組之一，提供完整的員工生命週期管理功能，包括員工基本資料管理、帳號管理、排班管理和加班記錄管理。

## 功能特色

### 🧑‍💼 員工基本資料管理
- 員工資料的 CRUD 操作
- 員工資料驗證和格式化
- 員工統計和報表
- 批量操作支援

### 🔐 員工帳號管理
- 帳號創建和綁定
- 密碼管理和重設
- 角色權限管理
- 帳號狀態管理

### 📅 員工排班管理
- 排班計劃制定
- 班次管理（早班、午班、晚班）
- 請假類型管理
- 排班統計分析

### ⏰ 加班記錄管理
- 加班申請和審核
- 加班時數統計
- 月度加班報表
- 排班系統整合

## 架構設計

### 目錄結構
```
frontend/src/modules/employees/
├── README.md                    # 本文件
├── index.ts                     # 模組主入口
├── core/                        # 核心業務邏輯層
│   ├── index.ts                 # 核心層統一入口
│   ├── employeeService.ts       # 員工基本服務
│   ├── employeeAccountService.ts # 員工帳號服務
│   ├── employeeScheduleService.ts # 員工排班服務
│   ├── overtimeRecordService.ts # 加班記錄服務
│   └── hooks/                   # React Hooks
│       ├── index.ts             # Hooks 統一入口
│       ├── useEmployeeAccounts.ts # 員工帳號管理 Hook
│       ├── useEmployeeScheduling.ts # 員工排班管理 Hook
│       └── useOvertimeManager.ts # 加班管理 Hook
├── types/                       # 類型定義
│   └── index.ts                 # 類型統一入口
├── adapters/                    # 適配器層
│   └── README.md                # 適配器說明文件
├── components/                  # UI 組件層
│   ├── features/                # 功能組件
│   └── ui/                      # 基礎 UI 組件
└── utils/                       # 工具函數
```

### 分層架構

#### 1. 核心服務層 (Core Services)
- **employeeService**: 員工基本資料的 CRUD 操作
- **employeeAccountService**: 員工帳號管理
- **employeeScheduleService**: 員工排班管理
- **overtimeRecordService**: 加班記錄管理

#### 2. 業務邏輯層 (Business Logic - Hooks)
- **useEmployeeAccounts**: 員工帳號管理業務邏輯
- **useEmployeeScheduling**: 員工排班管理業務邏輯
- **useOvertimeManager**: 加班管理業務邏輯

#### 3. 類型定義層 (Types)
- 統一的 TypeScript 類型定義
- 介面和枚舉定義
- 業務實體類型

#### 4. 適配器層 (Adapters)
- API 適配器
- 資料格式轉換
- 外部系統整合

## 使用方式

### 基本使用

```typescript
import { 
  employeeService, 
  useEmployeeAccounts,
  EmployeeRole 
} from '@/modules/employees';

// 在組件中使用
function EmployeeManagement() {
  const {
    employees,
    isLoading,
    handleCreateAccount,
    handleUpdateAccount
  } = useEmployeeAccounts();

  // 組件邏輯...
}
```

### 服務層使用

```typescript
import { employeeService } from '@/modules/employees';

// 獲取員工列表
const employees = await employeeService.getAllEmployees({
  limit: 20,
  page: 1
});

// 創建員工
const newEmployee = await employeeService.createEmployee({
  name: '張三',
  phone: '0912345678',
  position: '藥師'
});
```

### Hook 使用

```typescript
import { useEmployeeScheduling } from '@/modules/employees';

function ScheduleManagement() {
  const {
    schedules,
    loading,
    addSchedule,
    editSchedule,
    removeSchedule
  } = useEmployeeScheduling();

  const handleAddSchedule = async () => {
    await addSchedule({
      date: '2024-01-15',
      shift: 'morning',
      employeeId: 'emp123'
    });
  };

  // 組件邏輯...
}
```

## API 整合

### 端點配置
- **員工管理**: `/api/employees`
- **帳號管理**: `/api/employee-accounts`
- **排班管理**: `/api/employee-schedules`
- **加班記錄**: `/api/overtime-records`

### 認證機制
所有 API 請求都使用 `x-auth-token` header 進行身份驗證。

## 權限管理

### 角色定義
- **admin**: 管理員 - 完整權限
- **pharmacist**: 藥師 - 部分管理權限
- **staff**: 員工 - 基本查看權限

### 權限矩陣
| 功能 | admin | pharmacist | staff |
|------|-------|------------|-------|
| 查看員工 | ✅ | ✅ | ✅ |
| 管理員工 | ✅ | ❌ | ❌ |
| 管理帳號 | ✅ | ❌ | ❌ |
| 查看排班 | ✅ | ✅ | ✅ |
| 管理排班 | ✅ | ✅ | ❌ |
| 查看加班 | ✅ | ✅ | ✅ |
| 管理加班 | ✅ | ✅ | ❌ |

## 資料驗證

### 員工資料驗證
- 姓名：必填，不能為空
- 電話：必填，格式驗證
- 電子郵件：選填，格式驗證
- 職位：必填，不能為空
- 薪資：選填，不能為負數

### 帳號資料驗證
- 使用者名稱：至少 3 個字元
- 密碼：至少 6 個字元，建議包含大小寫字母、數字和特殊字符
- 角色：必須是有效的角色值

## 錯誤處理

### 統一錯誤格式
```typescript
interface EmployeeModuleError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}
```

### 常見錯誤碼
- `EMPLOYEE_NOT_FOUND`: 員工不存在
- `ACCOUNT_ALREADY_EXISTS`: 帳號已存在
- `INVALID_CREDENTIALS`: 無效的認證資訊
- `PERMISSION_DENIED`: 權限不足
- `VALIDATION_ERROR`: 資料驗證錯誤

## 效能優化

### 快取策略
- 員工列表資料快取 5 分鐘
- 排班資料快取 2 分鐘
- 統計資料快取 10 分鐘

### 分頁處理
- 預設每頁 20 筆資料
- 最大每頁 100 筆資料
- 支援無限滾動載入

### 批量操作
- 支援批量創建員工
- 支援批量更新員工資料
- 支援批量排班操作

## 測試策略

### 單元測試
- 服務層函數測試
- Hook 邏輯測試
- 工具函數測試

### 整合測試
- API 整合測試
- 組件整合測試
- 端到端測試

### 測試覆蓋率目標
- 核心服務層：90% 以上
- Hook 層：85% 以上
- 工具函數：95% 以上

## 部署和維護

### 版本管理
- 遵循語義化版本控制
- 主要版本變更需要遷移指南
- 向後相容性保證

### 監控指標
- API 回應時間
- 錯誤率統計
- 使用者操作統計
- 系統效能指標

### 日誌記錄
- 所有 API 請求日誌
- 錯誤和異常日誌
- 使用者操作日誌
- 效能監控日誌

## 未來規劃

### 短期目標 (1-3 個月)
- [ ] 完善組件層實現
- [ ] 增加資料匯入匯出功能
- [ ] 實現進階搜尋和篩選
- [ ] 優化行動端體驗

### 中期目標 (3-6 個月)
- [ ] 整合外部 HR 系統
- [ ] 實現自動排班功能
- [ ] 增加員工績效評估
- [ ] 實現多語言支援

### 長期目標 (6-12 個月)
- [ ] AI 輔助排班優化
- [ ] 員工自助服務入口
- [ ] 進階分析和報表
- [ ] 行動應用程式

## 貢獻指南

### 開發流程
1. Fork 專案並創建功能分支
2. 實現功能並編寫測試
3. 確保所有測試通過
4. 提交 Pull Request

### 程式碼規範
- 遵循 TypeScript 最佳實踐
- 使用 ESLint 和 Prettier
- 編寫清晰的註釋和文件
- 遵循現有的架構模式

### 提交規範
- 使用語義化提交訊息
- 包含適當的測試
- 更新相關文件
- 確保向後相容性

## 支援和聯絡

如有問題或建議，請：
1. 查看本文件和相關文件
2. 搜尋現有的 Issues
3. 創建新的 Issue 並提供詳細資訊
4. 聯絡開發團隊

---

**版本**: 1.0.0  
**最後更新**: 2024-01-16  
**維護者**: 藥局 POS 開發團隊