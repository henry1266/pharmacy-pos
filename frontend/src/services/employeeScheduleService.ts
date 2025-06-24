import axios from 'axios';

/**
 * API 回應格式介面
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

/**
 * 員工排班記錄介面
 */
export interface EmployeeSchedule {
  _id: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'evening';
  employeeId: string;
  employee?: {
    _id: string;
    name: string;
    position: string;
  };
  leaveType: 'sick' | 'personal' | 'overtime' | null;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 排班數據介面
 */
export interface ScheduleData {
  date: string;
  shift: 'morning' | 'afternoon' | 'evening';
  employeeId: string;
  leaveType?: 'sick' | 'personal' | 'overtime' | null;
  notes?: string;
}

/**
 * 按日期分組的排班數據介面
 */
export interface SchedulesByDate {
  [date: string]: {
    morning: EmployeeSchedule[];
    afternoon: EmployeeSchedule[];
    evening: EmployeeSchedule[];
  };
}

/**
 * 獲取指定日期範圍內的員工排班資料
 * @param {string} startDate - 開始日期 (YYYY-MM-DD)
 * @param {string} endDate - 結束日期 (YYYY-MM-DD)
 * @param {string} employeeId - 員工ID (可選)
 * @returns {Promise<EmployeeSchedule[]>} - 排班資料
 */
export const getSchedules = async (
  startDate: string,
  endDate: string,
  employeeId: string | null = null
): Promise<EmployeeSchedule[]> => {
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

    let url = `/api/employee-schedules?startDate=${startDate}&endDate=${endDate}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }

    const response = await axios.get<ApiResponse<EmployeeSchedule[]>>(url, config);
    return response.data.data;
  } catch (error: any) {
    console.error('獲取排班資料失敗:', error);
    throw error;
  }
};

/**
 * 獲取按日期分組的排班資料
 * @param {string} startDate - 開始日期 (YYYY-MM-DD)
 * @param {string} endDate - 結束日期 (YYYY-MM-DD)
 * @returns {Promise<SchedulesByDate>} - 按日期分組的排班資料
 */
export const getSchedulesByDate = async (
  startDate: string,
  endDate: string
): Promise<SchedulesByDate> => {
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

    const url = `/api/employee-schedules/by-date?startDate=${startDate}&endDate=${endDate}`;
    const response = await axios.get<ApiResponse<SchedulesByDate>>(url, config);
    return response.data.data;
  } catch (error: any) {
    console.error('獲取排班資料失敗:', error);
    throw error;
  }
};

/**
 * 創建新的排班
 * @param {ScheduleData} scheduleData - 排班資料
 * @returns {Promise<EmployeeSchedule>} - 創建的排班資料
 */
export const createSchedule = async (scheduleData: ScheduleData): Promise<EmployeeSchedule> => {
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

    const response = await axios.post<ApiResponse<EmployeeSchedule>>('/api/employee-schedules', scheduleData, config);
    return response.data.data;
  } catch (error: any) {
    console.error('創建排班失敗:', error);
    throw error;
  }
};

/**
 * 更新排班
 * @param {string} id - 排班ID
 * @param {Partial<ScheduleData>} scheduleData - 排班資料
 * @returns {Promise<EmployeeSchedule>} - 更新後的排班資料
 */
export const updateSchedule = async (
  id: string,
  scheduleData: Partial<ScheduleData>
): Promise<EmployeeSchedule> => {
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

    const response = await axios.put<ApiResponse<EmployeeSchedule>>(`/api/employee-schedules/${id}`, scheduleData, config);
    return response.data.data;
  } catch (error: any) {
    console.error('更新排班失敗:', error);
    throw error;
  }
};

/**
 * 刪除排班
 * @param {string} id - 排班ID
 * @returns {Promise<{ success: boolean; message?: string }>} - 刪除結果
 */
export const deleteSchedule = async (id: string): Promise<{ success: boolean; message?: string }> => {
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

    const response = await axios.delete<ApiResponse<null>>(`/api/employee-schedules/${id}`, config);
    return { success: response.data.success, message: response.data.message };
  } catch (error: any) {
    console.error('刪除排班失敗:', error);
    throw error;
  }
};

/**
 * 員工排班服務
 */
const employeeScheduleService = {
  getSchedules,
  getSchedulesByDate,
  createSchedule,
  updateSchedule,
  deleteSchedule
};

export default employeeScheduleService;