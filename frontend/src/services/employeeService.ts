import axios from 'axios';
import { Employee, EmployeeAccount } from '@pharmacy-pos/shared/types/entities';
import { PaginationParams } from '@pharmacy-pos/shared/types/api';

const API_URL = '/api/employees';

/**
 * 員工查詢參數介面
 */
interface EmployeeQueryParams extends Partial<PaginationParams> {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 員工列表回應介面
 */
interface EmployeeListResponse {
  employees: Employee[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 獲取所有員工資訊
 * @param {EmployeeQueryParams} params - 查詢參數
 * @returns {Promise<EmployeeListResponse>} 員工資訊列表
 */
export const getEmployees = async (params: EmployeeQueryParams = {}): Promise<EmployeeListResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      },
      params
    };

    const response = await axios.get<{
      success: boolean;
      message: string;
      data: {
        employees: Employee[];
        totalCount: number;
        page: number;
        limit: number;
      };
      timestamp: Date;
    }>(API_URL, config);
    
    // 確保回應結構正確
    if (response.data.success && response.data.data && Array.isArray(response.data.data.employees)) {
      return {
        employees: response.data.data.employees,
        pagination: {
          total: response.data.data.totalCount,
          page: response.data.data.page,
          limit: response.data.data.limit,
          totalPages: Math.ceil(response.data.data.totalCount / response.data.data.limit)
        }
      };
    } else {
      // 如果回應結構不正確，返回空陣列
      console.warn('API 回應結構不正確:', response.data);
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
  } catch (err: any) {
    console.error('獲取員工資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '獲取員工資訊失敗，請稍後再試'
    );
  }
};

/**
 * 獲取單一員工資訊
 * @param {string} id - 員工ID
 * @returns {Promise<Employee>} 員工資訊
 */
export const getEmployee = async (id: string): Promise<Employee> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.get<{
      success: boolean;
      message: string;
      data: Employee;
      timestamp: Date;
    }>(`${API_URL}/${id}`, config);
    
    // 確保回應結構正確
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('API 回應結構不正確');
    }
  } catch (err: any) {
    console.error('獲取員工資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '獲取員工資訊失敗，請稍後再試'
    );
  }
};

/**
 * 員工與帳號狀態介面
 */
interface EmployeeWithAccount extends Employee {
  account: EmployeeAccount | null;
}

/**
 * 獲取所有員工資訊及其帳號狀態
 * 這個方法會獲取所有員工，並檢查每個員工是否有關聯的帳號
 * @returns {Promise<EmployeeWithAccount[]>} 員工資訊列表，包含帳號狀態
 */
export const getEmployeesWithAccountStatus = async (): Promise<EmployeeWithAccount[]> => {
  try {
    // 獲取所有員工
    const { employees } = await getEmployees({ limit: 1000 }); // 獲取所有員工，設置較大的limit
    
    // 獲取所有用戶帳號
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }
    
    // 獲取所有員工的帳號狀態
    const employeesWithAccounts: EmployeeWithAccount[] = [];
    
    // 逐個處理員工，避免並行請求可能導致的問題
    for (const employee of employees) {
      try {
        // 嘗試獲取員工帳號
        const response = await axios.get<EmployeeAccount>(`/api/employee-accounts/${employee._id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        // 如果成功獲取帳號，將帳號資訊添加到員工資料中
        employeesWithAccounts.push({
          ...employee,
          account: response.data
        });
      } catch (error: any) {
        // 只有當錯誤是 404 Not Found（表示員工沒有帳號）時才處理
        if (error.response && error.response.status === 404) {
          employeesWithAccounts.push({
            ...employee,
            account: null
          });
        } else {
          // 其他錯誤需要記錄並重新拋出
          console.error(`獲取員工 ${employee.name} (${employee._id}) 帳號時發生錯誤:`, error);
          throw error;
        }
      }
    }
    
    return employeesWithAccounts;
  } catch (err: any) {
    console.error('獲取員工帳號狀態失敗:', err);
    throw new Error(
      err.response?.data?.msg ??
      '獲取員工帳號狀態失敗，請稍後再試'
    );
  }
};

const employeeService = {
  getEmployees,
  getEmployee,
  getEmployeesWithAccountStatus
};

export default employeeService;