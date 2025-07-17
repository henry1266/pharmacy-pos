/**
 * 班次時間配置服務 - 核心服務層
 * 提供班次時間配置管理相關的 API 操作
 */

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
 * 班次時間配置介面
 */
export interface ShiftTimeConfig {
  _id: string;
  shift: 'morning' | 'afternoon' | 'evening';
  startTime: string;
  endTime: string;
  isActive: boolean;
  description?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 班次時間配置數據介面
 */
export interface ShiftTimeConfigData {
  shift: 'morning' | 'afternoon' | 'evening';
  startTime: string;
  endTime: string;
  description?: string;
}

/**
 * 班次時間配置更新數據介面
 */
export interface ShiftTimeConfigUpdateData {
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  description?: string;
}

/**
 * 班次時間映射介面
 */
export interface ShiftTimesMap {
  morning: { start: string; end: string };
  afternoon: { start: string; end: string };
  evening: { start: string; end: string };
}

/**
 * 獲取所有班次時間配置
 * @returns {Promise<ShiftTimeConfig[]>} - 班次時間配置列表
 */
export const getShiftTimeConfigs = async (): Promise<ShiftTimeConfig[]> => {
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

    const response = await axios.get<ApiResponse<ShiftTimeConfig[]>>('/api/shift-time-configs', config);
    return response.data.data;
  } catch (error: any) {
    console.error('獲取班次時間配置失敗:', error);
    throw error;
  }
};

/**
 * 獲取特定班次的時間配置
 * @param {string} shift - 班次類型
 * @returns {Promise<ShiftTimeConfig>} - 班次時間配置
 */
export const getShiftTimeConfig = async (shift: 'morning' | 'afternoon' | 'evening'): Promise<ShiftTimeConfig> => {
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

    const response = await axios.get<ApiResponse<ShiftTimeConfig>>(`/api/shift-time-configs/${shift}`, config);
    return response.data.data;
  } catch (error: any) {
    console.error('獲取班次時間配置失敗:', error);
    throw error;
  }
};

/**
 * 創建或更新班次時間配置
 * @param {ShiftTimeConfigData} configData - 班次時間配置數據
 * @returns {Promise<ShiftTimeConfig>} - 創建或更新的班次時間配置
 */
export const createOrUpdateShiftTimeConfig = async (configData: ShiftTimeConfigData): Promise<ShiftTimeConfig> => {
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

    const response = await axios.post<ApiResponse<ShiftTimeConfig>>('/api/shift-time-configs', configData, config);
    return response.data.data;
  } catch (error: any) {
    console.error('創建或更新班次時間配置失敗:', error);
    throw error;
  }
};

/**
 * 更新特定班次的時間配置
 * @param {string} shift - 班次類型
 * @param {ShiftTimeConfigUpdateData} updateData - 更新數據
 * @returns {Promise<ShiftTimeConfig>} - 更新後的班次時間配置
 */
export const updateShiftTimeConfig = async (
  shift: 'morning' | 'afternoon' | 'evening',
  updateData: ShiftTimeConfigUpdateData
): Promise<ShiftTimeConfig> => {
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

    const response = await axios.put<ApiResponse<ShiftTimeConfig>>(`/api/shift-time-configs/${shift}`, updateData, config);
    return response.data.data;
  } catch (error: any) {
    console.error('更新班次時間配置失敗:', error);
    throw error;
  }
};

/**
 * 停用班次時間配置
 * @param {string} shift - 班次類型
 * @returns {Promise<{ success: boolean; message?: string }>} - 停用結果
 */
export const deactivateShiftTimeConfig = async (shift: 'morning' | 'afternoon' | 'evening'): Promise<{ success: boolean; message?: string }> => {
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

    const response = await axios.delete<ApiResponse<null>>(`/api/shift-time-configs/${shift}`, config);
    return { success: response.data.success, message: response.data.message };
  } catch (error: any) {
    console.error('停用班次時間配置失敗:', error);
    throw error;
  }
};

/**
 * 獲取班次時間映射對象（用於快速查詢）
 * @returns {Promise<ShiftTimesMap>} - 班次時間映射
 */
export const getShiftTimesMap = async (): Promise<ShiftTimesMap> => {
  try {
    const configs = await getShiftTimeConfigs();
    const timesMap: ShiftTimesMap = {
      morning: { start: '08:30', end: '12:00' },
      afternoon: { start: '15:00', end: '18:00' },
      evening: { start: '19:00', end: '20:30' }
    };

    configs.forEach(config => {
      if (config.isActive) {
        timesMap[config.shift] = {
          start: config.startTime,
          end: config.endTime
        };
      }
    });

    return timesMap;
  } catch (error: any) {
    console.error('獲取班次時間映射失敗:', error);
    // 返回預設值
    return {
      morning: { start: '08:30', end: '12:00' },
      afternoon: { start: '15:00', end: '18:00' },
      evening: { start: '19:00', end: '20:30' }
    };
  }
};

/**
 * 計算班次工時
 * @param {string} startTime - 開始時間 (HH:MM)
 * @param {string} endTime - 結束時間 (HH:MM)
 * @returns {number} - 工時數（小時）
 */
export const calculateShiftHours = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return (endTimeInMinutes - startTimeInMinutes) / 60;
};

/**
 * 驗證時間格式
 * @param {string} time - 時間字串
 * @returns {boolean} - 是否為有效格式
 */
export const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

/**
 * 驗證時間邏輯（開始時間應早於結束時間）
 * @param {string} startTime - 開始時間
 * @param {string} endTime - 結束時間
 * @returns {boolean} - 時間邏輯是否正確
 */
export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return startTimeInMinutes < endTimeInMinutes;
};

/**
 * 班次時間配置服務
 */
export const shiftTimeConfigService = {
  getShiftTimeConfigs,
  getShiftTimeConfig,
  createOrUpdateShiftTimeConfig,
  updateShiftTimeConfig,
  deactivateShiftTimeConfig,
  getShiftTimesMap,
  calculateShiftHours,
  isValidTimeFormat,
  isValidTimeRange
};

export default shiftTimeConfigService;