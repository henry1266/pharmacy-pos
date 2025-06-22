import axios from 'axios';
import { Category, Product } from '@shared/types/entities';

/**
 * 獲取所有產品分類
 * @returns {Promise<Category[]>} 包含所有產品分類的Promise
 */
export const getProductCategories = async (): Promise<Category[]> => {
  try {
    const res = await axios.get('/api/product-categories');
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (res.data as any)?.data || [];
  } catch (err: any) {
    console.error('獲取產品分類失敗:', err);
    throw err;
  }
};

/**
 * 新增產品分類
 * @param {Partial<Category>} categoryData - 新產品分類的數據
 * @returns {Promise<Category>} 包含新創建的產品分類的Promise
 */
export const addProductCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  try {
    const res = await axios.post('/api/product-categories', categoryData);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (res.data as any)?.data;
  } catch (err: any) {
    console.error('新增產品分類失敗:', err);
    throw err;
  }
};

/**
 * 更新產品分類
 * @param {string} id - 要更新的產品分類ID
 * @param {Partial<Category>} categoryData - 產品分類的更新數據
 * @returns {Promise<Category>} 包含更新後的產品分類的Promise
 */
export const updateProductCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
  try {
    const res = await axios.put(`/api/product-categories/${id}`, categoryData);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (res.data as any)?.data;
  } catch (err: any) {
    console.error('更新產品分類失敗:', err);
    throw err;
  }
};

/**
 * 刪除產品分類
 * @param {string} id - 要刪除的產品分類ID
 * @returns {Promise<{ success: boolean; message?: string }>} 包含刪除結果的Promise
 */
export const deleteProductCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await axios.delete<{ success: boolean; message?: string }>(`/api/product-categories/${id}`);
    return res.data;
  } catch (err: any) {
    console.error('刪除產品分類失敗:', err);
    throw err;
  }
};

/**
 * 獲取單一產品分類
 * @param {string} id - 要獲取的產品分類ID
 * @returns {Promise<Category>} 包含產品分類的Promise
 */
export const getProductCategory = async (id: string): Promise<Category> => {
  try {
    const res = await axios.get(`/api/product-categories/${id}`);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (res.data as any)?.data;
  } catch (err: any) {
    console.error('獲取產品分類失敗:', err);
    throw err;
  }
};

/**
 * 獲取分類下的所有產品
 * @param {string} categoryId - 產品分類ID
 * @returns {Promise<Product[]>} 包含該分類下所有產品的Promise
 */
export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    const res = await axios.get('/api/products');
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    const products = (res.data as any)?.data || [];
    // 在前端過濾屬於該分類的產品
    // 注意：後端使用 populate 填充 category，所以 category 是物件而不是字串
    return products.filter((product: Product) => {
      // 處理 category 可能是字串 ID 或填充後的物件
      if (typeof product.category === 'string') {
        return product.category === categoryId;
      } else if (product.category && typeof product.category === 'object' && '_id' in product.category) {
        return (product.category as any)._id === categoryId;
      }
      return false;
    });
  } catch (err: any) {
    console.error('獲取分類產品失敗:', err);
    throw err;
  }
};

/**
 * 產品分類服務
 */
const productCategoryService = {
  getProductCategories,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory,
  getProductCategory,
  getProductsByCategory
};

export default productCategoryService;