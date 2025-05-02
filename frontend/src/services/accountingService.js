import axios from 'axios';

/**
 * 獲取指定日期尚未標記的監控產品銷售記錄
 * @param {string} date - 日期字串 (格式: yyyy-MM-dd)
 * @returns {Promise<Array>} - 未結算銷售記錄陣列
 * @throws {Error} - 如果請求失敗
 */
export const getUnaccountedSales = async (date) => {
  try {
    const response = await axios.get('/api/accounting/unaccounted-sales', {
      params: {
        date: date,
      },
    });
    return response.data;
  } catch (err) {
    console.error('獲取未結算銷售記錄失敗 (service):', err);
    // 重新拋出錯誤，讓調用者可以處理
    throw new Error(err.response?.data?.msg || '獲取未結算銷售記錄失敗');
  }
};

