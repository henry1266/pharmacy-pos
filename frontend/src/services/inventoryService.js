import axios from 'axios';

const API_URL = '/api/inventory';

/**
 * Fetches inventory records for a specific product.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<Array>} A promise that resolves to an array of inventory records.
 * @throws {Error} If the request fails.
 */
export const getInventoryByProduct = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/product/${productId}`);
    return response.data;
  } catch (err) {
    console.error(`獲取產品 ${productId} 的庫存記錄失敗 (service):`, err);
    throw new Error(err.response?.data?.msg || `獲取產品 ${productId} 的庫存記錄失敗`);
  }
};

const inventoryService = {
  getInventoryByProduct,
};

export default inventoryService;

