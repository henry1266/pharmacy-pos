import axios from 'axios';

// 根據 improvement_proposal.md 的建議，將 API 呼叫集中到 services 層

const API_URL = '/api/sales'; // 假設後端 API 路徑

/**
 * 根據日期前綴獲取最新的銷貨單號
 * @param {string} datePrefix - 日期前綴 (YYYYMMDD)
 * @returns {Promise<string|null>} 最新的銷貨單號或 null
 */
export const getLatestSaleNumber = async (datePrefix) => {
  try {
    const response = await axios.get(`${API_URL}/latest-number/${datePrefix}`);
    return response.data.latestNumber;
  } catch (error) {
    console.error('Error fetching latest sale number:', error);
    // 根據需要處理錯誤，例如返回 null 或拋出
    if (error.response && error.response.status === 404) {
      // 如果找不到，可能表示當天還沒有單號，返回 null
      return null;
    }
    throw error; // 其他錯誤暫時拋出
  }
};

/**
 * 創建新的銷售記錄
 * @param {object} saleData - 銷售記錄數據
 * @returns {Promise<object>} 已創建的銷售記錄
 */
export const createSale = async (saleData) => {
  try {
    const response = await axios.post(API_URL, saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    // 拋出標準化錯誤或根據需要處理
    throw error; // 暫時直接拋出，可在攔截器中統一處理
  }
};

// 可在此處添加其他與銷售相關的 API 服務函數



/**
 * 獲取所有銷售記錄
 * @returns {Promise<Array<object>>} 包含所有銷售記錄的陣列
 */
export const getAllSales = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching all sales:', error);
    // 拋出標準化錯誤或根據需要處理
    throw error; // 暫時直接拋出，可在攔截器中統一處理
  }
};

