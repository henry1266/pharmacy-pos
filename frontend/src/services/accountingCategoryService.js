import axios from 'axios';

// 獲取所有記帳名目類別
export const getAccountingCategories = async () => {
  try {
    const res = await axios.get('/api/accounting-categories');
    return res.data;
  } catch (err) {
    console.error('獲取記帳名目類別失敗:', err);
    throw err;
  }
};

// 新增記帳名目類別
export const addAccountingCategory = async (categoryData) => {
  try {
    const res = await axios.post('/api/accounting-categories', categoryData);
    return res.data;
  } catch (err) {
    console.error('新增記帳名目類別失敗:', err);
    throw err;
  }
};

// 更新記帳名目類別
export const updateAccountingCategory = async (id, categoryData) => {
  try {
    const res = await axios.put(`/api/accounting-categories/${id}`, categoryData);
    return res.data;
  } catch (err) {
    console.error('更新記帳名目類別失敗:', err);
    throw err;
  }
};

// 刪除記帳名目類別
export const deleteAccountingCategory = async (id) => {
  try {
    const res = await axios.delete(`/api/accounting-categories/${id}`);
    return res.data;
  } catch (err) {
    console.error('刪除記帳名目類別失敗:', err);
    throw err;
  }
};
