# 員工服務 V2 文檔

## 概述

員工服務 V2 是基於統一 API 客戶端架構的員工管理服務，提供完整的員工和員工帳號管理功能。

## 架構設計

### 核心組件

1. **共享 API 客戶端** - [`shared/services/employeeApiClient.ts`](../shared/services/employeeApiClient.ts)
2. **前端服務包裝器** - [`frontend/src/services/employeeServiceV2.ts`](../frontend/src/services/employeeServiceV2.ts)
3. **使用範例** - [`frontend/src/examples/employeeServiceV2Example.tsx`](../frontend/src/examples/employeeServiceV2Example.tsx)
4. **測試文件** - [`frontend/src/tests/employeeServiceV2.test.ts`](../frontend/src/tests/employeeServiceV2.test.ts)

### 設計模式

- **適配器模式**: 使用 AxiosHttpClient 適配器統一 HTTP 請求介面
- **工廠模式**: 使用 `createEmployeeApiClient` 工廠函數創建客戶端實例
- **單一責任原則**: API 邏輯與業務邏輯分離
- **依賴注入**: 支援不同的 HTTP 客戶端實現

## API 功能

### 基本 CRUD 操作

```typescript
import { 
  getAllEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} from '../services/employeeServiceV2';

// 獲取員工列表
const employeeList = await getAllEmployees({
  page: 1,
  limit: 10,
  search: '張三',
  department: '藥局部'
});

// 獲取單一員工
const employee = await getEmployeeById('employee-id');

// 創建員工
const newEmployee = await createEmployee({
  name: '李四',
  phone: '0912345678',
  position: '藥師',
  hireDate: '2023-12-01'
});

// 更新員工
const updatedEmployee = await updateEmployee('employee-id', {
  position: '資深藥師',
  salary: 60000
});

// 刪除員工
await deleteEmployee('employee-id');
```

### 帳號管理

```typescript
import { 
  getEmployeeAccount,
  createEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  toggleEmployeeAccountStatus,
  resetEmployeePassword
} from '../services/employeeServiceV2';

// 獲取員工帳號
const account = await getEmployeeAccount('employee-id');

// 創建員工帳號
const newAccount = await createEmployeeAccount({
  employeeId: 'employee-id',
  username: 'zhang.san',
  password: 'password123',
  role: 'pharmacist'
});

// 更新帳號
const updatedAccount = await updateEmployeeAccount('employee-id', {
  role: 'admin',
  isActive: true
});

// 切換帳號狀態
await toggleEmployeeAccountStatus('employee-id', false);

// 重設密碼
await resetEmployeePassword('employee-id', 'newPassword123');

// 刪除帳號
await deleteEmployeeAccount('employee-id');
```

### 搜尋和統計

```typescript
import { 
  searchEmployees,
  getEmployeeStats,
  getEmployeesWithAccountStatus
} from '../services/employeeServiceV2';

// 搜尋員工
const searchResults = await searchEmployees('張三', {
  department: '藥局部',
  position: '藥師'
});

// 獲取統計資料
const stats = await getEmployeeStats();
console.log(stats);
// {
//   totalEmployees: 10,
//   activeEmployees: 8,
//   inactiveEmployees: 2,
//   byDepartment: { '藥局部': 5, '行政部': 3 },
//   byPosition: { '藥師': 4, '助理': 3 },
//   withAccounts: 7,
//   withoutAccounts: 3
// }

// 獲取員工及帳號狀態
const employeesWithAccounts = await getEmployeesWithAccountStatus();
```

### 批量操作

```typescript
import { 
  createBatchEmployees,
  updateBatchEmployees
} from '../services/employeeServiceV2';

// 批量創建員工
const employees = await createBatchEmployees([
  {
    name: '員工A',
    phone: '0912345678',
    position: '助理',
    hireDate: '2023-12-01'
  },
  {
    name: '員工B',
    phone: '0923456789',
    position: '藥師',
    hireDate: '2023-12-01'
  }
]);

// 批量更新員工
const updatedEmployees = await updateBatchEmployees([
  {
    id: 'employee-1',
    data: { salary: 50000 }
  },
  {
    id: 'employee-2',
    data: { position: '資深藥師' }
  }
]);
```

### 歷史記錄

```typescript
import { 
  getEmployeeWorkHistory,
  getEmployeeOvertimeRecords,
  getEmployeeSchedules
} from '../services/employeeServiceV2';

// 獲取工作歷史
const workHistory = await getEmployeeWorkHistory('employee-id', {
  startDate: '2023-01-01',
  endDate: '2023-12-31'
});

// 獲取加班記錄
const overtimeRecords = await getEmployeeOvertimeRecords('employee-id', {
  status: 'approved'
});

// 獲取排班記錄
const schedules = await getEmployeeSchedules('employee-id', {
  startDate: '2023-12-01',
  endDate: '2023-12-31'
});
```

## 業務邏輯方法

### 權限檢查

```typescript
import employeeServiceV2 from '../services/employeeServiceV2';

const account = {
  role: 'pharmacist',
  isActive: true
};

// 檢查權限
const canManageEmployees = employeeServiceV2.checkEmployeePermission(account, 'manage_employees'); // false
const canManageInventory = employeeServiceV2.checkEmployeePermission(account, 'manage_inventory'); // true
const canProcessSales = employeeServiceV2.checkEmployeePermission(account, 'process_sales'); // true
```

### 格式化方法

```typescript
import employeeServiceV2 from '../services/employeeServiceV2';

const employee = {
  name: '張三',
  position: '藥師',
  account: {
    isActive: true
  }
};

// 格式化顯示名稱
const displayName = employeeServiceV2.formatEmployeeDisplayName(employee);
// "張三 (藥師)"

// 格式化狀態
const status = employeeServiceV2.formatEmployeeStatus(employee);
// "啟用"

// 獲取狀態顏色
const color = employeeServiceV2.getEmployeeStatusColor(employee);
// "success"

// 格式化角色
const roleDisplay = employeeServiceV2.formatRoleDisplayName('pharmacist');
// "藥師"
```

### 資料驗證

```typescript
import employeeServiceV2 from '../services/employeeServiceV2';

// 驗證員工資料
const employeeErrors = employeeServiceV2.validateEmployeeData({
  name: '',
  phone: '',
  position: '',
  hireDate: '2023-01-01',
  email: 'invalid-email',
  salary: -1000
});
// ['員工姓名不能為空', '電話號碼不能為空', '職位不能為空', '電子郵件格式不正確', '薪資不能為負數']

// 驗證帳號資料
const accountErrors = employeeServiceV2.validateEmployeeAccountData({
  employeeId: '123',
  username: 'ab',
  password: '123',
  role: 'admin'
});
// ['使用者名稱至少需要3個字元', '密碼至少需要6個字元']
```

### 計算方法

```typescript
import employeeServiceV2 from '../services/employeeServiceV2';

// 計算工作年資
const years = employeeServiceV2.calculateWorkYears('2021-01-15');
// 2 (假設現在是2023年)

// 檢查即將到來的生日
const isUpcoming = employeeServiceV2.isUpcomingBirthday('1990-05-20', 30);
// true/false (根據當前日期判斷30天內是否有生日)
```

## 類型定義

### 員工相關類型

```typescript
interface Employee {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  position: string;
  hireDate: string | Date;
  birthDate?: string | Date;
  idNumber?: string;
  gender?: 'male' | 'female' | 'other' | '男' | '女' | '其他';
  department?: string;
  salary?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface EmployeeAccount {
  _id: string;
  employeeId: string;
  username: string;
  email?: string;
  role: 'admin' | 'pharmacist' | 'staff';
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface EmployeeWithAccount extends Employee {
  account: EmployeeAccount | null;
}
```

### 請求類型

```typescript
interface EmployeeCreateRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  position: string;
  hireDate: string | Date;
  birthDate?: string | Date;
  idNumber?: string;
  gender?: 'male' | 'female' | 'other' | '男' | '女' | '其他';
  department?: string;
  salary?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
}

interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {}

interface EmployeeAccountCreateRequest {
  employeeId: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
  isActive?: boolean;
}

interface EmployeeAccountUpdateRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'pharmacist' | 'staff';
  isActive?: boolean;
}
```

### 查詢參數

```typescript
interface EmployeeQueryParams {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  department?: string;
  position?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}
```

### 統計類型

```typescript
interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: Record<string, number>;
  byPosition: Record<string, number>;
  withAccounts: number;
  withoutAccounts: number;
}
```

## 錯誤處理

服務使用統一的錯誤處理機制：

```typescript
try {
  const employee = await getEmployeeById('invalid-id');
} catch (error) {
  console.error('錯誤:', error.message);
  // 錯誤會包含詳細的錯誤訊息和狀態碼
}
```

## 認證

所有 API 請求都會自動包含認證 header：

```typescript
// 自動從 localStorage 獲取 token
const token = localStorage.getItem('token');
// 自動添加到請求 header: 'x-auth-token': token
```

## 最佳實踐

### 1. 錯誤處理

```typescript
import { getAllEmployees } from '../services/employeeServiceV2';

const loadEmployees = async () => {
  try {
    setLoading(true);
    const data = await getAllEmployees();
    setEmployees(data.employees);
  } catch (error) {
    setError(error.message || '載入失敗');
  } finally {
    setLoading(false);
  }
};
```

### 2. 資料驗證

```typescript
import employeeServiceV2 from '../services/employeeServiceV2';

const handleSubmit = async (formData) => {
  // 先驗證資料
  const errors = employeeServiceV2.validateEmployeeData(formData);
  if (errors.length > 0) {
    setErrors(errors);
    return;
  }

  // 再提交
  try {
    await createEmployee(formData);
  } catch (error) {
    setError(error.message);
  }
};
```

### 3. 權限檢查

```typescript
import employeeServiceV2 from '../services/employeeServiceV2';

const EmployeeManagement = ({ currentUser }) => {
  const canManageEmployees = employeeServiceV2.checkEmployeePermission(
    currentUser.account, 
    'manage_employees'
  );

  if (!canManageEmployees) {
    return <div>您沒有權限管理員工</div>;
  }

  return (
    // 員工管理介面
  );
};
```

### 4. 狀態管理

```typescript
const [employees, setEmployees] = useState<EmployeeWithAccount[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// 使用 useEffect 載入資料
useEffect(() => {
  loadEmployees();
}, []);
```

## 效能優化

### 1. 分頁載入

```typescript
const loadEmployees = async (page = 1, limit = 10) => {
  const data = await getAllEmployees({ page, limit });
  return data;
};
```

### 2. 搜尋防抖

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query) => {
  const results = await searchEmployees(query);
  setSearchResults(results);
}, 300);
```

### 3. 快取策略

```typescript
// 可以在上層實現快取邏輯
const employeeCache = new Map();

const getCachedEmployee = async (id) => {
  if (employeeCache.has(id)) {
    return employeeCache.get(id);
  }
  
  const employee = await getEmployeeById(id);
  employeeCache.set(id, employee);
  return employee;
};
```

## 測試

### 單元測試

```typescript
import { describe, test, expect } from '@jest/globals';
import employeeServiceV2 from '../services/employeeServiceV2';

describe('EmployeeServiceV2', () => {
  test('應該正確驗證員工資料', () => {
    const errors = employeeServiceV2.validateEmployeeData({
      name: '',
      phone: '',
      position: '',
      hireDate: '2023-01-01'
    });

    expect(errors).toContain('員工姓名不能為空');
    expect(errors).toContain('電話號碼不能為空');
    expect(errors).toContain('職位不能為空');
  });

  test('應該正確檢查權限', () => {
    const adminAccount = { role: 'admin', isActive: true };
    const result = employeeServiceV2.checkEmployeePermission(adminAccount, 'manage_employees');
    expect(result).toBe(true);
  });
});
```

### 整合測試

```typescript
describe('員工管理流程', () => {
  test('完整的員工管理流程', async () => {
    // 1. 創建員工
    const employee = await createEmployee({
      name: '測試員工',
      phone: '0912345678',
      position: '測試職位',
      hireDate: '2023-12-01'
    });

    // 2. 創建帳號
    const account = await createEmployeeAccount({
      employeeId: employee._id,
      username: 'test.user',
      password: 'password123',
      role: 'staff'
    });

    // 3. 更新員工
    const updatedEmployee = await updateEmployee(employee._id, {
      position: '資深測試職位'
    });

    // 4. 刪除帳號和員工
    await deleteEmployeeAccount(employee._id);
    await deleteEmployee(employee._id);
  });
});
```

## 遷移指南

### 從舊版員工服務遷移

1. **更新導入**：
```typescript
// 舊版
import { getEmployees } from '../services/employeeService';

// 新版
import { getAllEmployees } from '../services/employeeServiceV2';
```

2. **更新 API 調用**：
```typescript
// 舊版
const { employees } = await getEmployees();

// 新版
const { employees } = await getAllEmployees();
```

3. **更新錯誤處理**：
```typescript
// 新版有統一的錯誤處理機制
try {
  const data = await getAllEmployees();
} catch (error) {
  // error.message 包含詳細錯誤訊息
  console.error(error.message);
}
```

## 總結

員工服務 V2 提供了：

1. **完整的員工管理功能** - CRUD、搜尋、統計、批量操作
2. **帳號管理功能** - 創建、更新、刪除、權限控制
3. **豐富的業務邏輯方法** - 權限檢查、資料驗證、格式化
4. **類型安全** - 完整的 TypeScript 類型定義
5. **統一的錯誤處理** - 一致的錯誤處理機制
6. **高度可測試** - 清晰的介面和依賴注入
7. **效能優化** - 支援分頁、搜尋、快取等優化策略

這個架構為員工管理提供了堅實的基礎，並為未來的功能擴展提供了靈活的框架。