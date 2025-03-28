import { ActionTypes } from './actionTypes';
import axios from 'axios';

// API基礎URL
const API_BASE_URL = 'http://localhost:5000/api';

// 設置認證令牌
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// 認證相關動作創建器
export const login = (username, password) => async (dispatch) => {
  dispatch({ type: ActionTypes.LOGIN_REQUEST });
  
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
    
    const { token } = res.data;
    
    // 儲存令牌到本地存儲
    localStorage.setItem('token', token);
    
    // 設置認證令牌
    setAuthToken(token);
    
    dispatch({
      type: ActionTypes.LOGIN_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.LOGIN_FAILURE,
      payload: err.response?.data?.msg || '登入失敗'
    });
  }
};

export const logout = () => (dispatch) => {
  // 清除本地存儲中的令牌
  localStorage.removeItem('token');
  
  // 清除認證令牌
  setAuthToken(null);
  
  dispatch({ type: ActionTypes.LOGOUT });
};

// 藥品相關動作創建器
export const fetchProducts = () => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_PRODUCTS_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/products`);
    
    dispatch({
      type: ActionTypes.FETCH_PRODUCTS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_PRODUCTS_FAILURE,
      payload: err.response?.data?.msg || '獲取藥品失敗'
    });
  }
};

export const addProduct = (productData) => async (dispatch) => {
  dispatch({ type: ActionTypes.ADD_PRODUCT_REQUEST });
  
  try {
    const res = await axios.post(`${API_BASE_URL}/products`, productData);
    
    dispatch({
      type: ActionTypes.ADD_PRODUCT_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.ADD_PRODUCT_FAILURE,
      payload: err.response?.data?.msg || '添加藥品失敗'
    });
  }
};

export const updateProduct = (id, productData) => async (dispatch) => {
  dispatch({ type: ActionTypes.UPDATE_PRODUCT_REQUEST });
  
  try {
    const res = await axios.put(`${API_BASE_URL}/products/${id}`, productData);
    
    dispatch({
      type: ActionTypes.UPDATE_PRODUCT_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.UPDATE_PRODUCT_FAILURE,
      payload: err.response?.data?.msg || '更新藥品失敗'
    });
  }
};

export const deleteProduct = (id) => async (dispatch) => {
  dispatch({ type: ActionTypes.DELETE_PRODUCT_REQUEST });
  
  try {
    await axios.delete(`${API_BASE_URL}/products/${id}`);
    
    dispatch({
      type: ActionTypes.DELETE_PRODUCT_SUCCESS,
      payload: id
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.DELETE_PRODUCT_FAILURE,
      payload: err.response?.data?.msg || '刪除藥品失敗'
    });
  }
};

// 供應商相關動作創建器
export const fetchSuppliers = () => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_SUPPLIERS_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/suppliers`);
    
    dispatch({
      type: ActionTypes.FETCH_SUPPLIERS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_SUPPLIERS_FAILURE,
      payload: err.response?.data?.msg || '獲取供應商失敗'
    });
  }
};

// 會員相關動作創建器
export const fetchCustomers = () => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_CUSTOMERS_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/customers`);
    
    dispatch({
      type: ActionTypes.FETCH_CUSTOMERS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_CUSTOMERS_FAILURE,
      payload: err.response?.data?.msg || '獲取會員失敗'
    });
  }
};

// 庫存相關動作創建器
export const fetchInventory = () => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_INVENTORY_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/inventory`);
    
    dispatch({
      type: ActionTypes.FETCH_INVENTORY_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_INVENTORY_FAILURE,
      payload: err.response?.data?.msg || '獲取庫存失敗'
    });
  }
};

// 銷售相關動作創建器
export const fetchSales = () => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_SALES_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/sales`);
    
    dispatch({
      type: ActionTypes.FETCH_SALES_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_SALES_FAILURE,
      payload: err.response?.data?.msg || '獲取銷售訂單失敗'
    });
  }
};

// 儀表板相關動作創建器
export const fetchDashboardData = () => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_DASHBOARD_DATA_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/dashboard`);
    
    dispatch({
      type: ActionTypes.FETCH_DASHBOARD_DATA_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_DASHBOARD_DATA_FAILURE,
      payload: err.response?.data?.msg || '獲取儀表板數據失敗'
    });
  }
};

// 報表相關動作創建器
export const fetchReportsData = (reportType, params) => async (dispatch) => {
  dispatch({ type: ActionTypes.FETCH_REPORTS_DATA_REQUEST });
  
  try {
    const res = await axios.get(`${API_BASE_URL}/reports/${reportType}`, { params });
    
    dispatch({
      type: ActionTypes.FETCH_REPORTS_DATA_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_REPORTS_DATA_FAILURE,
      payload: err.response?.data?.msg || '獲取報表數據失敗'
    });
  }
};
