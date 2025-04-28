import axios from 'axios';

// 獲取所有產品分類
export const getProductCategories = async () => {
  try {
    const res = await axios.get('/api/product-categories');
    return res.data;
  } catch (err) {
    console.error('獲取產品分類失敗:', err);
    throw err;
  }
};

// 新增產品分類
export const addProductCategory = async (categoryData) => {
  try {
    const res = await axios.post('/api/product-categories', categoryData);
    return res.data;
  } catch (err) {
    console.error('新增產品分類失敗:', err);
    throw err;
  }
};

// 更新產品分類
export const updateProductCategory = async (id, categoryData) => {
  try {
    const res = await axios.put(`/api/product-categories/${id}`, categoryData);
    return res.data;
  } catch (err) {
    console.error('更新產品分類失敗:', err);
    throw err;
  }
};

// 刪除產品分類
export const deleteProductCategory = async (id) => {
  try {
    const res = await axios.delete(`/api/product-categories/${id}`);
    return res.data;
  } catch (err) {
    console.error('刪除產品分類失敗:', err);
    throw err;
  }
};

// 獲取單一產品分類
export const getProductCategory = async (id) => {
  try {
    const res = await axios.get(`/api/product-categories/${id}`);
    return res.data;
  } catch (err) {
    console.error('獲取產品分類失敗:', err);
    throw err;
  }
};

// 獲取分類下的所有產品
export const getProductsByCategory = async (categoryId) => {
  try {
    const res = await axios.get('/api/products');
    // 在前端過濾屬於該分類的產品
    return res.data.filter(product => product.category === categoryId);
  } catch (err) {
    console.error('獲取分類產品失敗:', err);
    throw err;
  }
};
