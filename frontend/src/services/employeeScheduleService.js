import axios from 'axios';

/**
 * 獲取指定日期範圍內的員工排班資料
 * @param {string} startDate - 開始日期 (YYYY-MM-DD)
 * @param {string} endDate - 結束日期 (YYYY-MM-DD)
 * @param {string} employeeId - 員工ID (可選)
 * @returns {Promise} - 排班資料
 */
export const getSchedules = async (startDate, endDate, employeeId = null) => {
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

    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error('獲取排班資料失敗:', error);
    throw error;
  }
};

/**
 * 獲取按日期分組的排班資料
 * @param {string} startDate - 開始日期 (YYYY-MM-DD)
 * @param {string} endDate - 結束日期 (YYYY-MM-DD)
 * @returns {Promise} - 按日期分組的排班資料
 */
export const getSchedulesByDate = async (startDate, endDate) => {
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
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error('獲取排班資料失敗:', error);
    throw error;
  }
};

/**
 * 創建新的排班
 * @param {Object} scheduleData - 排班資料
 * @param {string} scheduleData.date - 日期 (YYYY-MM-DD)
 * @param {string} scheduleData.shift - 班次 (morning, afternoon, evening)
 * @param {string} scheduleData.employeeId - 員工ID
 * @param {string} scheduleData.leaveType - 請假類型 (sick, personal, overtime, null)
 * @returns {Promise} - 創建的排班資料
 */
export const createSchedule = async (scheduleData) => {
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

    const response = await axios.post('/api/employee-schedules', scheduleData, config);
    return response.data;
  } catch (error) {
    console.error('創建排班失敗:', error);
    throw error;
  }
};

/**
 * 更新排班
 * @param {string} id - 排班ID
 * @param {Object} scheduleData - 排班資料
 * @returns {Promise} - 更新後的排班資料
 */
export const updateSchedule = async (id, scheduleData) => {
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

    const response = await axios.put(`/api/employee-schedules/${id}`, scheduleData, config);
    return response.data;
  } catch (error) {
    console.error('更新排班失敗:', error);
    throw error;
  }
};

/**
 * 刪除排班
 * @param {string} id - 排班ID
 * @returns {Promise} - 刪除結果
 */
export const deleteSchedule = async (id) => {
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

    const response = await axios.delete(`/api/employee-schedules/${id}`, config);
    return response.data;
  } catch (error) {
    console.error('刪除排班失敗:', error);
    throw error;
  }
};