import axios from 'axios';

// 根據 improvement_proposal.md 的建議，將 API 呼叫集中到 services 層

const API_URL = '/api/customers'; // 假設後端 API 路徑

/**
 * 獲取所有客戶列表
 * @returns {Promise<Array>} 客戶列表
 */
export const getCustomers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    // 拋出標準化錯誤或根據需要處理
    throw error; // 暫時直接拋出，可在攔截器中統一處理
  }
};

// 可在此處添加其他與客戶相關的 API 服務函數

