import axios from 'axios';

/**
 * 加班記錄服務
 * 提供與加班記錄相關的 API 操作
 */

/**
 * 獲取加班記錄列表
 * @param {Object} params - 查詢參數
 * @param {string} params.employeeId - 員工ID (可選)
 * @param {string} params.startDate - 開始日期 (YYYY-MM-DD) (可選)
 * @param {string} params.endDate - 結束日期 (YYYY-MM-DD) (可選)
 * @param {string} params.status - 狀態 (pending, approved, rejected) (可選)
 * @returns {Promise} - 加班記錄列表
 */
export const getOvertimeRecords = async (params = {}) => {
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

    const response = await axios.get('/api/overtime-records', config);
    return response.data;
  } catch (error) {
    console.error('獲取加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 獲取指定ID的加班記錄
 * @param {string} id - 加班記錄ID
 * @returns {Promise} - 加班記錄
 */
export const getOvertimeRecordById = async (id) => {
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

    const response = await axios.get(`/api/overtime-records/${id}`, config);
    return response.data;
  } catch (error) {
    console.error('獲取加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 創建加班記錄
 * @param {Object} recordData - 加班記錄資料
 * @param {string} recordData.employeeId - 員工ID
 * @param {string} recordData.date - 日期 (YYYY-MM-DD)
 * @param {number} recordData.hours - 加班時數
 * @param {string} recordData.description - 加班原因/說明 (可選)
 * @param {string} recordData.status - 狀態 (pending, approved, rejected) (可選，預設為 pending)
 * @returns {Promise} - 創建的加班記錄
 */
export const createOvertimeRecord = async (recordData) => {
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

    const response = await axios.post('/api/overtime-records', recordData, config);
    return response.data;
  } catch (error) {
    console.error('創建加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 更新加班記錄
 * @param {string} id - 加班記錄ID
 * @param {Object} recordData - 加班記錄資料
 * @returns {Promise} - 更新後的加班記錄
 */
export const updateOvertimeRecord = async (id, recordData) => {
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

    const response = await axios.put(`/api/overtime-records/${id}`, recordData, config);
    return response.data;
  } catch (error) {
    console.error('更新加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 刪除加班記錄
 * @param {string} id - 加班記錄ID
 * @returns {Promise} - 刪除結果
 */
export const deleteOvertimeRecord = async (id) => {
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

    const response = await axios.delete(`/api/overtime-records/${id}`, config);
    return response.data;
  } catch (error) {
    console.error('刪除加班記錄失敗:', error);
    throw error;
  }
};

/**
 * 獲取指定員工的加班時數統計
 * @param {string} employeeId - 員工ID
 * @param {Object} params - 查詢參數
 * @param {string} params.startDate - 開始日期 (YYYY-MM-DD) (可選)
 * @param {string} params.endDate - 結束日期 (YYYY-MM-DD) (可選)
 * @returns {Promise} - 加班時數統計
 */
export const getEmployeeOvertimeSummary = async (employeeId, params = {}) => {
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

    const response = await axios.get(`/api/overtime-records/summary/employee/${employeeId}`, config);
    return response.data;
  } catch (error) {
    console.error('獲取加班時數統計失敗:', error);
    throw error;
  }
};

/**
 * 獲取所有員工的加班時數統計
 * @param {Object} params - 查詢參數
 * @param {string} params.startDate - 開始日期 (YYYY-MM-DD) (可選)
 * @param {string} params.endDate - 結束日期 (YYYY-MM-DD) (可選)
 * @returns {Promise} - 所有員工的加班時數統計
 */
export const getAllEmployeesOvertimeSummary = async (params = {}) => {
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

    const response = await axios.get('/api/overtime-records/summary/all', config);
    return response.data;
  } catch (error) {
    console.error('獲取加班時數統計失敗:', error);
    throw error;
  }
};

// 導出所有函數作為默認導出
const overtimeRecordService = {
  getOvertimeRecords,
  getOvertimeRecordById,
  createOvertimeRecord,
  updateOvertimeRecord,
  deleteOvertimeRecord,
  getEmployeeOvertimeSummary,
  getAllEmployeesOvertimeSummary
};

export default overtimeRecordService;