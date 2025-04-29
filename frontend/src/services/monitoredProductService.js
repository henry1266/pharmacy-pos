import axios from 'axios';

const API_URL = '/api/monitored-products';

// 獲取所有監測產品
export const getMonitoredProducts = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('獲取監測產品失敗:', error.response?.data?.msg || error.message);
    throw error;
  }
};

// 新增監測產品
export const addMonitoredProduct = async (productCode) => {
  try {
    const response = await axios.post(API_URL, { productCode });
    return response.data;
  } catch (error) {
    console.error('新增監測產品失敗:', error.response?.data?.msg || error.message);
    throw error;
  }
};

// 刪除監測產品
export const deleteMonitoredProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('刪除監測產品失敗:', error.response?.data?.msg || error.message);
    throw error;
  }
};

