/**
 * 員工服務 V2
 * 基於統一 API 客戶端架構的員工管理服務
 */

import axios from 'axios';
import { 
  createEmployeeApiClient,
  type EmployeeQueryParams,
  type EmployeeCreateRequest,
  type EmployeeUpdateRequest,
  type EmployeeListResponse,
  type EmployeeAccountCreateRequest,
  type EmployeeAccountUpdateRequest,
  type EmployeeStats
} from '@pharmacy-pos/shared/services/employeeApiClient';
import type { HttpClient } from '@pharmacy-pos/shared/services/baseApiClient';
import type { Employee, EmployeeAccount, EmployeeWithAccount } from '@pharmacy-pos/shared/types/entities';

// 創建 axios 適配器，包含認證 header
const createAxiosAdapter = (): HttpClient => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'x-auth-token': token } : {};
  };

  return {
    get: async (url: string, config?: any) => {
      const response = await axios.get(url, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return response.data;
    },
    post: async (url: string, data?: any, config?: any) => {
      const response = await axios.post(url, data, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return response.data;
    },
    put: async (url: string, data?: any, config?: any) => {
      const response = await axios.put(url, data, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return response.data;
    },
    delete: async (url: string, config?: any) => {
      const response = await axios.delete(url, {
        ...config,
        headers: {
          ...getAuthHeaders(),
          ...config?.headers
        }
      });
      return response.data;
    }
  };
};

// 創建員工 API 客戶端實例
const apiClient = createEmployeeApiClient(createAxiosAdapter());

// 直接匯出方法，實現零重複代碼
export const getAllEmployees = apiClient.getAllEmployees.bind(apiClient);
export const getEmployeeById = apiClient.getEmployeeById.bind(apiClient);
export const createEmployee = apiClient.createEmployee.bind(apiClient);
export const updateEmployee = apiClient.updateEmployee.bind(apiClient);
export const deleteEmployee = apiClient.deleteEmployee.bind(apiClient);
export const getEmployeeStats = apiClient.getEmployeeStats.bind(apiClient);
export const searchEmployees = apiClient.searchEmployees.bind(apiClient);
export const getEmployeeAccount = apiClient.getEmployeeAccount.bind(apiClient);
export const createEmployeeAccount = apiClient.createEmployeeAccount.bind(apiClient);
export const updateEmployeeAccount = apiClient.updateEmployeeAccount.bind(apiClient);
export const deleteEmployeeAccount = apiClient.deleteEmployeeAccount.bind(apiClient);
export const getEmployeesWithAccountStatus = apiClient.getEmployeesWithAccountStatus.bind(apiClient);
export const createBatchEmployees = apiClient.createBatchEmployees.bind(apiClient);
export const updateBatchEmployees = apiClient.updateBatchEmployees.bind(apiClient);
export const getEmployeeWorkHistory = apiClient.getEmployeeWorkHistory.bind(apiClient);
export const getEmployeeOvertimeRecords = apiClient.getEmployeeOvertimeRecords.bind(apiClient);
export const getEmployeeSchedules = apiClient.getEmployeeSchedules.bind(apiClient);
export const validateEmployeeCredentials = apiClient.validateEmployeeCredentials.bind(apiClient);
export const resetEmployeePassword = apiClient.resetEmployeePassword.bind(apiClient);
export const toggleEmployeeAccountStatus = apiClient.toggleEmployeeAccountStatus.bind(apiClient);

// 業務邏輯方法
export const employeeServiceV2 = {
  // 基本 CRUD 操作
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,

  // 搜尋和統計
  searchEmployees,
  getEmployeeStats,

  // 帳號管理
  getEmployeeAccount,
  createEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  getEmployeesWithAccountStatus,
  validateEmployeeCredentials,
  resetEmployeePassword,
  toggleEmployeeAccountStatus,

  // 批量操作
  createBatchEmployees,
  updateBatchEmployees,

  // 歷史記錄
  getEmployeeWorkHistory,
  getEmployeeOvertimeRecords,
  getEmployeeSchedules,

  // 業務邏輯方法
  /**
   * 檢查員工是否有權限執行特定操作
   */
  checkEmployeePermission: (employee: Employee | EmployeeAccount, action: string): boolean => {
    if ('role' in employee) {
      const account = employee as EmployeeAccount;
      switch (action) {
        case 'manage_employees':
        case 'manage_accounts':
        case 'view_reports':
          return account.role === 'admin';
        case 'manage_inventory':
        case 'process_sales':
          return account.role === 'admin' || account.role === 'pharmacist';
        case 'basic_operations':
          return account.isActive;
        default:
          return false;
      }
    }
    return false;
  },

  /**
   * 格式化員工顯示名稱
   */
  formatEmployeeDisplayName: (employee: Employee): string => {
    return `${employee.name} (${employee.position})`;
  },

  /**
   * 格式化員工狀態
   */
  formatEmployeeStatus: (employee: EmployeeWithAccount): string => {
    if (employee.account) {
      return employee.account.isActive ? '啟用' : '停用';
    }
    return '無帳號';
  },

  /**
   * 獲取員工狀態顏色
   */
  getEmployeeStatusColor: (employee: EmployeeWithAccount): 'success' | 'warning' | 'error' => {
    if (employee.account) {
      return employee.account.isActive ? 'success' : 'error';
    }
    return 'warning';
  },

  /**
   * 驗證員工資料
   */
  validateEmployeeData: (data: EmployeeCreateRequest | EmployeeUpdateRequest): string[] => {
    const errors: string[] = [];

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push('員工姓名不能為空');
    }

    if ('phone' in data && (!data.phone || data.phone.trim().length === 0)) {
      errors.push('電話號碼不能為空');
    }

    if ('position' in data && (!data.position || data.position.trim().length === 0)) {
      errors.push('職位不能為空');
    }

    if ('email' in data && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('電子郵件格式不正確');
    }

    if ('salary' in data && data.salary !== undefined && data.salary < 0) {
      errors.push('薪資不能為負數');
    }

    return errors;
  },

  /**
   * 驗證員工帳號資料
   */
  validateEmployeeAccountData: (data: EmployeeAccountCreateRequest | EmployeeAccountUpdateRequest): string[] => {
    const errors: string[] = [];

    if ('username' in data && (!data.username || data.username.trim().length === 0)) {
      errors.push('使用者名稱不能為空');
    }

    if ('username' in data && data.username && data.username.length < 3) {
      errors.push('使用者名稱至少需要3個字元');
    }

    if ('password' in data && data.password && data.password.length < 6) {
      errors.push('密碼至少需要6個字元');
    }

    if ('email' in data && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('電子郵件格式不正確');
    }

    if ('role' in data && data.role && !['admin', 'pharmacist', 'staff'].includes(data.role)) {
      errors.push('角色必須是 admin、pharmacist 或 staff');
    }

    return errors;
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
   * 計算員工工作年資
   */
  calculateWorkYears: (hireDate: string | Date): number => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  },

  /**
   * 檢查員工是否即將生日
   */
  isUpcomingBirthday: (birthDate: string | Date, daysAhead: number = 30): boolean => {
    if (!birthDate) return false;
    
    const birth = new Date(birthDate);
    const now = new Date();
    const thisYear = now.getFullYear();
    
    // 設定今年的生日
    const thisYearBirthday = new Date(thisYear, birth.getMonth(), birth.getDate());
    
    // 如果今年生日已過，檢查明年的生日
    if (thisYearBirthday < now) {
      thisYearBirthday.setFullYear(thisYear + 1);
    }
    
    const diffTime = thisYearBirthday.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= daysAhead && diffDays >= 0;
  }
};

// 匯出類型定義
export type {
  EmployeeQueryParams,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  EmployeeListResponse,
  EmployeeAccountCreateRequest,
  EmployeeAccountUpdateRequest,
  EmployeeStats,
  Employee,
  EmployeeAccount,
  EmployeeWithAccount
};

// 預設匯出
export default employeeServiceV2;