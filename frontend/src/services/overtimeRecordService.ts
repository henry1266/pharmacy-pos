import axios from 'axios';

/**
 * 加班記錄服務
 * 提供與加班記錄相關的 API 操作
 * 包括獨立的加班記錄和排班系統中的加班記錄
 */

/**
 * 加班記錄狀態類型
 */
export type OvertimeRecordStatus = 'pending' | 'approved' | 'rejected';

/**
 * 加班記錄介面
 */
export interface OvertimeRecord {
  _id: string;
  employeeId: string;
  employee?: {
    _id: string;
    name: string;
    position: string;
  };
  date: string | Date;
  hours: number;
  description?: string;
  status: OvertimeRecordStatus;
  approvedBy?: string;
  approvedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 加班記錄查詢參數介面
 */
export interface OvertimeRecordQueryParams {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: OvertimeRecordStatus;
}

/**
 * 加班記錄創建數據介面
 */
export interface OvertimeRecordCreateData {
  employeeId: string;
  date: string;
  hours: number;
  description?: string;
  status?: OvertimeRecordStatus;
}

/**
 * 加班時數統計介面
 */
export interface OvertimeSummary {
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  records?: OvertimeRecord[];
}

/**
 * 員工加班時數統計介面
 */
export interface EmployeeOvertimeSummary {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
}

/**
 * 月度加班統計數據介面
 */
export interface MonthlyOvertimeStats {
  totalHours: number;
  totalRecords: number;
  employeeStats: {
    employeeId: string;
    employeeName: string;
    hours: number;
    recordCount: number;
  }[];
  dailyStats: {
    date: string;
    hours: number;
    recordCount: number;
  }[];
}

/**
 * 獲取加班記錄列表
 * @param {OvertimeRecordQueryParams} params - 查詢參數
 * @returns {Promise<OvertimeRecord[]>} - 加班記錄列表
 */
export const getOvertimeRecords = async (params: OvertimeRecordQueryParams = {}): Promise<OvertimeRecord[]> => {
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

    const response = await axios.get<OvertimeRecord[]>('/api/overtime-records', config);
    return response.data;
  } catch (error: any) {
    console.error('獲取加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 獲取指定ID的加班記錄
 * @param {string} id - 加班記錄ID
 * @returns {Promise<OvertimeRecord>} - 加班記錄
 */
export const getOvertimeRecordById = async (id: string): Promise<OvertimeRecord> => {
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

    const response = await axios.get<OvertimeRecord>(`/api/overtime-records/${id}`, config);
    return response.data;
  } catch (error: any) {
    console.error('獲取加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 創建加班記錄
 * @param {OvertimeRecordCreateData} recordData - 加班記錄資料
 * @returns {Promise<OvertimeRecord>} - 創建的加班記錄
 */
export const createOvertimeRecord = async (recordData: OvertimeRecordCreateData): Promise<OvertimeRecord> => {
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

    const response = await axios.post<OvertimeRecord>('/api/overtime-records', recordData, config);
    return response.data;
  } catch (error: any) {
    console.error('創建加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 更新加班記錄
 * @param {string} id - 加班記錄ID
 * @param {Partial<OvertimeRecordCreateData>} recordData - 加班記錄資料
 * @returns {Promise<OvertimeRecord>} - 更新後的加班記錄
 */
export const updateOvertimeRecord = async (
  id: string,
  recordData: Partial<OvertimeRecordCreateData>
): Promise<OvertimeRecord> => {
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

    const response = await axios.put<OvertimeRecord>(`/api/overtime-records/${id}`, recordData, config);
    return response.data;
  } catch (error: any) {
    console.error('更新加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 刪除加班記錄
 * @param {string} id - 加班記錄ID
 * @returns {Promise<{ success: boolean; message?: string }>} - 刪除結果
 */
export const deleteOvertimeRecord = async (id: string): Promise<{ success: boolean; message?: string }> => {
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

    const response = await axios.delete<{ success: boolean; message?: string }>(`/api/overtime-records/${id}`, config);
    return response.data;
  } catch (error: any) {
    console.error('刪除加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 獲取指定員工的加班時數統計
 * @param {string} employeeId - 員工ID
 * @param {OvertimeRecordQueryParams} params - 查詢參數
 * @returns {Promise<OvertimeSummary>} - 加班時數統計
 */
export const getEmployeeOvertimeSummary = async (
  employeeId: string,
  params: OvertimeRecordQueryParams = {}
): Promise<OvertimeSummary> => {
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

    const response = await axios.get<OvertimeSummary>(`/api/overtime-records/summary/employee/${employeeId}`, config);
    return response.data;
  } catch (error: any) {
    console.error('獲取加班時數統計失敗:', error);
    throw error;
  }
};

/**
 * 獲取所有員工的加班時數統計
 * @param {OvertimeRecordQueryParams} params - 查詢參數
 * @returns {Promise<EmployeeOvertimeSummary[]>} - 所有員工的加班時數統計
 */
export const getAllEmployeesOvertimeSummary = async (
  params: OvertimeRecordQueryParams = {}
): Promise<EmployeeOvertimeSummary[]> => {
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

    const response = await axios.get<EmployeeOvertimeSummary[]>('/api/overtime-records/summary/all', config);
    return response.data;
  } catch (error: any) {
    console.error('獲取加班時數統計失敗:', error);
    throw error;
  }
};

/**
 * 獲取月度加班統計數據
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {Promise<MonthlyOvertimeStats>} - 月度加班統計數據
 */
export const getMonthlyOvertimeStats = async (year: number, month: number): Promise<MonthlyOvertimeStats> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      },
      params: {
        year,
        month
      }
    };

    const response = await axios.get<MonthlyOvertimeStats>('/api/overtime-records/monthly-stats', config);
    return response.data;
  } catch (error: any) {
    console.error('獲取月度加班統計數據失敗:', error);
    throw error;
  }
};

/**
 * 加班記錄服務
 */
const overtimeRecordService = {
  getOvertimeRecords,
  getOvertimeRecordById,
  createOvertimeRecord,
  updateOvertimeRecord,
  deleteOvertimeRecord,
  getEmployeeOvertimeSummary,
  getAllEmployeesOvertimeSummary,
  getMonthlyOvertimeStats
};

export default overtimeRecordService;