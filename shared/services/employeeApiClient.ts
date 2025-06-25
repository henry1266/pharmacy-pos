/**
 * 員工 API 客戶端
 * 基於 BaseApiClient 的員工管理服務
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Employee, EmployeeAccount, EmployeeWithAccount } from '../types/entities';
import type { PaginationParams } from '../types/api';

/**
 * 員工查詢參數
 */
export interface EmployeeQueryParams extends Partial<PaginationParams> {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  department?: string;
  position?: string;
  isActive?: boolean;
}

/**
 * 員工創建請求
 */
export interface EmployeeCreateRequest {
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

/**
 * 員工更新請求
 */
export interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {}

/**
 * 員工列表回應
 */
export interface EmployeeListResponse {
  employees: Employee[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 員工帳號創建請求
 */
export interface EmployeeAccountCreateRequest {
  employeeId: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
  isActive?: boolean;
}

/**
 * 員工帳號更新請求
 */
export interface EmployeeAccountUpdateRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'pharmacist' | 'staff';
  isActive?: boolean;
}

/**
 * 員工統計資料
 */
export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: Record<string, number>;
  byPosition: Record<string, number>;
  withAccounts: number;
  withoutAccounts: number;
}

/**
 * 員工 API 客戶端類
 */
export class EmployeeApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient, baseUrl: string = '/api') {
    super(httpClient, `${baseUrl}/employees`);
  }

  /**
   * 獲取所有員工
   */
  async getAllEmployees(params?: EmployeeQueryParams): Promise<EmployeeListResponse> {
    const response = await this.get<{
      success: boolean;
      message: string;
      data: {
        employees: Employee[];
        totalCount: number;
        page: number;
        limit: number;
      };
    }>('', params);

    if (response.success && response.data && Array.isArray(response.data.employees)) {
      return {
        employees: response.data.employees,
        pagination: {
          total: response.data.totalCount,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: Math.ceil(response.data.totalCount / response.data.limit)
        }
      };
    }

    return {
      employees: [],
      pagination: {
        total: 0,
        page: 0,
        limit: 10,
        totalPages: 0
      }
    };
  }

  /**
   * 根據ID獲取員工
   */
  async getEmployeeById(id: string): Promise<Employee> {
    const response = await this.get<{
      success: boolean;
      message: string;
      data: Employee;
    }>(`/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('獲取員工資訊失敗');
  }

  /**
   * 創建員工
   */
  async createEmployee(data: EmployeeCreateRequest): Promise<Employee> {
    return this.createItem<Employee>('', data);
  }

  /**
   * 更新員工
   */
  async updateEmployee(id: string, data: EmployeeUpdateRequest): Promise<Employee> {
    return this.updateItem<Employee>('', id, data);
  }

  /**
   * 刪除員工
   */
  async deleteEmployee(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('', id);
  }

  /**
   * 獲取員工統計資料
   */
  async getEmployeeStats(): Promise<EmployeeStats> {
    return this.get<EmployeeStats>('/stats');
  }

  /**
   * 搜尋員工
   */
  async searchEmployees(query: string, params?: Partial<EmployeeQueryParams>): Promise<Employee[]> {
    return this.getList<Employee>('/search', { ...params, search: query });
  }

  /**
   * 獲取員工帳號
   */
  async getEmployeeAccount(employeeId: string): Promise<EmployeeAccount | null> {
    try {
      return await this.get<EmployeeAccount>(`/account/${employeeId}`);
    } catch (error: any) {
      // 如果是 404 錯誤，表示員工沒有帳號
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 創建員工帳號
   */
  async createEmployeeAccount(data: EmployeeAccountCreateRequest): Promise<EmployeeAccount> {
    return this.post<EmployeeAccount>('/account', data);
  }

  /**
   * 更新員工帳號
   */
  async updateEmployeeAccount(employeeId: string, data: EmployeeAccountUpdateRequest): Promise<EmployeeAccount> {
    return this.put<EmployeeAccount>(`/account/${employeeId}`, data);
  }

  /**
   * 刪除員工帳號
   */
  async deleteEmployeeAccount(employeeId: string): Promise<{ success: boolean; message?: string }> {
    return this.delete<{ success: boolean; message?: string }>(`/account/${employeeId}`);
  }

  /**
   * 獲取所有員工及其帳號狀態
   */
  async getEmployeesWithAccountStatus(): Promise<EmployeeWithAccount[]> {
    return this.getList<EmployeeWithAccount>('/with-accounts');
  }

  /**
   * 批量創建員工
   */
  async createBatchEmployees(employees: EmployeeCreateRequest[]): Promise<Employee[]> {
    return this.post<Employee[]>('/batch', { employees });
  }

  /**
   * 批量更新員工
   */
  async updateBatchEmployees(updates: Array<{ id: string; data: EmployeeUpdateRequest }>): Promise<Employee[]> {
    return this.put<Employee[]>('/batch', { updates });
  }

  /**
   * 獲取員工工作歷史
   */
  async getEmployeeWorkHistory(employeeId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return this.getList<any>(`/${employeeId}/work-history`, params);
  }

  /**
   * 獲取員工加班記錄
   */
  async getEmployeeOvertimeRecords(employeeId: string, params?: {
    startDate?: string;
    endDate?: string;
    status?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return this.getList<any>(`/${employeeId}/overtime`, params);
  }

  /**
   * 獲取員工排班記錄
   */
  async getEmployeeSchedules(employeeId: string, params?: {
    startDate?: string;
    endDate?: string;
    shift?: 'morning' | 'afternoon' | 'evening';
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return this.getList<any>(`/${employeeId}/schedules`, params);
  }

  /**
   * 驗證員工帳號憑證
   */
  async validateEmployeeCredentials(username: string, password: string): Promise<{
    valid: boolean;
    employee?: Employee;
    account?: EmployeeAccount;
    token?: string;
  }> {
    return this.post<{
      valid: boolean;
      employee?: Employee;
      account?: EmployeeAccount;
      token?: string;
    }>('/validate-credentials', { username, password });
  }

  /**
   * 重設員工帳號密碼
   */
  async resetEmployeePassword(employeeId: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return this.post<{ success: boolean; message?: string }>(`/account/${employeeId}/reset-password`, { 
      newPassword 
    });
  }

  /**
   * 啟用/停用員工帳號
   */
  async toggleEmployeeAccountStatus(employeeId: string, isActive: boolean): Promise<EmployeeAccount> {
    return this.put<EmployeeAccount>(`/account/${employeeId}/toggle-status`, { isActive });
  }
}

/**
 * 創建員工 API 客戶端實例的工廠函數
 */
export const createEmployeeApiClient = (httpClient: HttpClient, baseUrl?: string): EmployeeApiClient => {
  return new EmployeeApiClient(httpClient, baseUrl);
};