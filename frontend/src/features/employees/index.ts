/**
 * 員工模組 - 主要入口文件
 * 統一匯出所有員工相關的功能和類型定義
 */

// 核心服務層
export * from './core';
export { default as employeeService } from './core/employeeService';
export { default as employeeAccountService } from './core/employeeAccountService';
export { default as employeeScheduleService } from './core/employeeScheduleService';
export { default as overtimeRecordService } from './core/overtimeRecordService';

// 核心 Hooks
export * from './core/hooks';
export { useEmployeeAccounts, default as useEmployeeAccountsDefault } from './core/hooks/useEmployeeAccounts';
export { useEmployeeScheduling, default as useEmployeeSchedulingDefault } from './core/hooks/useEmployeeScheduling';
export { useOvertimeManager, default as useOvertimeManagerDefault } from './core/hooks/useOvertimeManager';

// 類型定義
export * from './types';

// 工具函數
export * from './utils';

// 組件
export * from './components';

// 頁面
export * from './pages';

// 模組資訊
export const EMPLOYEE_MODULE_INFO = {
  name: 'employees',
  version: '1.0.0',
  description: '員工管理模組 - 提供員工基本資料、帳號管理、排班和加班記錄功能',
  features: [
    '員工基本資料管理',
    '員工帳號管理',
    '員工排班管理',
    '加班記錄管理',
    '員工統計報表',
    '員工資料匯入匯出'
  ],
  dependencies: [
    '@pharmacy-pos/shared/services/employeeApiClient',
    '@pharmacy-pos/shared/types/entities',
    '@pharmacy-pos/shared/types/api',
    '@pharmacy-pos/shared/types/utils'
  ]
} as const;

// 模組配置
export const EMPLOYEE_MODULE_CONFIG = {
  // API 端點配置
  apiEndpoints: {
    employees: '/api/employees',
    employeeAccounts: '/api/employee-accounts',
    employeeSchedules: '/api/employee-schedules',
    overtimeRecords: '/api/overtime-records'
  },
  
  // 預設設定
  defaults: {
    pageSize: 20,
    maxPageSize: 100,
    defaultRole: 'staff' as const,
    passwordMinLength: 6,
    usernameMinLength: 3
  },
  
  // 功能開關
  features: {
    enableAccountManagement: true,
    enableScheduleManagement: true,
    enableOvertimeManagement: true,
    enableBulkOperations: true,
    enableDataExport: true,
    enableDataImport: true
  },
  
  // 權限設定
  permissions: {
    viewEmployees: ['admin', 'pharmacist', 'staff'],
    manageEmployees: ['admin'],
    manageAccounts: ['admin'],
    viewSchedules: ['admin', 'pharmacist', 'staff'],
    manageSchedules: ['admin', 'pharmacist'],
    viewOvertime: ['admin', 'pharmacist', 'staff'],
    manageOvertime: ['admin', 'pharmacist']
  }
} as const;

// 工具函數
export const employeeModuleUtils = {
  /**
   * 檢查用戶是否有特定權限
   */
  hasPermission: (userRole: string, permission: keyof typeof EMPLOYEE_MODULE_CONFIG.permissions): boolean => {
    const allowedRoles = EMPLOYEE_MODULE_CONFIG.permissions[permission];
    return allowedRoles.includes(userRole as any);
  },
  
  /**
   * 獲取 API 端點 URL
   */
  getApiEndpoint: (endpoint: keyof typeof EMPLOYEE_MODULE_CONFIG.apiEndpoints): string => {
    return EMPLOYEE_MODULE_CONFIG.apiEndpoints[endpoint];
  },
  
  /**
   * 檢查功能是否啟用
   */
  isFeatureEnabled: (feature: keyof typeof EMPLOYEE_MODULE_CONFIG.features): boolean => {
    return EMPLOYEE_MODULE_CONFIG.features[feature];
  },
  
  /**
   * 格式化員工顯示名稱
   */
  formatEmployeeDisplayName: (employee: { name: string; position?: string }): string => {
    return employee.position ? `${employee.name} (${employee.position})` : employee.name;
  },
  
  /**
   * 格式化角色顯示名稱
   */
  formatRoleDisplayName: (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: '管理員',
      pharmacist: '藥師',
      staff: '員工'
    };
    return roleMap[role] || role;
  },
  
  /**
   * 驗證員工資料
   */
  validateEmployeeData: (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('員工姓名不能為空');
    }
    
    if (!data.phone || data.phone.trim().length === 0) {
      errors.push('電話號碼不能為空');
    }
    
    if (!data.position || data.position.trim().length === 0) {
      errors.push('職位不能為空');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('電子郵件格式不正確');
    }
    
    if (data.salary !== undefined && data.salary < 0) {
      errors.push('薪資不能為負數');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// 預設匯出模組資訊
export default EMPLOYEE_MODULE_INFO;