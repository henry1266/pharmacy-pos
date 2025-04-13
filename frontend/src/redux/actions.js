import { ActionTypes } from './actionTypes';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

// API基礎URL
export const API_BASE_URL = getApiBaseUrl();

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
    // 根據產品類型選擇正確的API端點
    const endpoint = productData.productType === 'medicine' 
      ? `${API_BASE_URL}/products/medicine` 
      : `${API_BASE_URL}/products/product`;
    
    const res = await axios.post(endpoint, productData);
    
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
    
    // 過濾庫存記錄：只顯示有saleNumber的記錄（銷售單）
    const filteredInventory = res.data.filter(item => {
      const hasSaleNumber = item.saleNumber && item.saleNumber.trim() !== '';
      return hasSaleNumber;
    });
    
    // 按照銷售單號從小到大排序
    const sortedInventory = filteredInventory.sort((a, b) => {
      const saleNumberA = a.saleNumber || '';
      const saleNumberB = b.saleNumber || '';
      
      // 按saleNumber從小到大排序
      return saleNumberA.localeCompare(saleNumberB);
    });
    
    dispatch({
      type: ActionTypes.FETCH_INVENTORY_SUCCESS,
      payload: sortedInventory
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


// 進貨單相關 Actions

// 獲取所有進貨單
export const fetchPurchaseOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.FETCH_PURCHASE_ORDERS_REQUEST });
    
    const res = await axios.get('/api/purchase-orders');
    
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDERS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '獲取進貨單失敗'
    });
  }
};

// 獲取單個進貨單
export const fetchPurchaseOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.FETCH_PURCHASE_ORDER_REQUEST });
    
    const res = await axios.get(`/api/purchase-orders/${id}`);
    
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDER_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '獲取進貨單詳情失敗'
    });
  }
};

// 添加進貨單
export const addPurchaseOrder = (formData, navigate) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.ADD_PURCHASE_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.post('/api/purchase-orders', formData, config);
    
    dispatch({
      type: ActionTypes.ADD_PURCHASE_ORDER_SUCCESS,
      payload: res.data
    });
    
    // 導航到進貨單列表頁面
    if (navigate) {
      navigate('/purchase-orders');
    }
  } catch (err) {
    dispatch({
      type: ActionTypes.ADD_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '添加進貨單失敗'
    });
  }
};

// 更新進貨單
export const updatePurchaseOrder = (id, formData, navigate) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.UPDATE_PURCHASE_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.put(`/api/purchase-orders/${id}`, formData, config);
    
    dispatch({
      type: ActionTypes.UPDATE_PURCHASE_ORDER_SUCCESS,
      payload: res.data
    });
    
    // 導航到進貨單列表頁面
    if (navigate) {
      navigate('/purchase-orders');
    }
  } catch (err) {
    dispatch({
      type: ActionTypes.UPDATE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '更新進貨單失敗'
    });
  }
};

// 刪除進貨單
export const deletePurchaseOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.DELETE_PURCHASE_ORDER_REQUEST });
    
    await axios.delete(`/api/purchase-orders/${id}`);
    
    dispatch({
      type: ActionTypes.DELETE_PURCHASE_ORDER_SUCCESS,
      payload: id
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.DELETE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '刪除進貨單失敗'
    });
  }
};

// 搜索進貨單
export const searchPurchaseOrders = (searchParams) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.SEARCH_PURCHASE_ORDERS_REQUEST });
    
    // 構建查詢字符串
    const queryParams = new URLSearchParams();
    for (const key in searchParams) {
      if (searchParams[key]) {
        queryParams.append(key, searchParams[key]);
      }
    }
    
    const res = await axios.get(`/api/purchase-orders/search/query?${queryParams.toString()}`);
    
    dispatch({
      type: ActionTypes.SEARCH_PURCHASE_ORDERS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.SEARCH_PURCHASE_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '搜索進貨單失敗'
    });
  }
};

// 出貨單相關 Actions

// 獲取所有出貨單
export const fetchShippingOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.FETCH_SHIPPING_ORDERS_REQUEST });
    
    const res = await axios.get('/api/shipping-orders');
    
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDERS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '獲取出貨單失敗'
    });
  }
};

// 獲取單個出貨單
export const fetchShippingOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.FETCH_SHIPPING_ORDER_REQUEST });
    
    const res = await axios.get(`/api/shipping-orders/${id}`);
    
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDER_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '獲取出貨單詳情失敗'
    });
  }
};

// 添加出貨單
export const addShippingOrder = (formData, navigate) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.ADD_SHIPPING_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.post('/api/shipping-orders', formData, config);
    
    dispatch({
      type: ActionTypes.ADD_SHIPPING_ORDER_SUCCESS,
      payload: res.data
    });
    
    // 導航到出貨單列表頁面
    if (navigate) {
      navigate('/shipping-orders');
    }
  } catch (err) {
    dispatch({
      type: ActionTypes.ADD_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '添加出貨單失敗'
    });
  }
};

// 更新出貨單
export const updateShippingOrder = (id, formData, navigate) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.UPDATE_SHIPPING_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.put(`/api/shipping-orders/${id}`, formData, config);
    
    dispatch({
      type: ActionTypes.UPDATE_SHIPPING_ORDER_SUCCESS,
      payload: res.data
    });
    
    // 導航到出貨單列表頁面
    if (navigate) {
      navigate('/shipping-orders');
    }
  } catch (err) {
    dispatch({
      type: ActionTypes.UPDATE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '更新出貨單失敗'
    });
  }
};

// 刪除出貨單
export const deleteShippingOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.DELETE_SHIPPING_ORDER_REQUEST });
    
    await axios.delete(`/api/shipping-orders/${id}`);
    
    dispatch({
      type: ActionTypes.DELETE_SHIPPING_ORDER_SUCCESS,
      payload: id
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.DELETE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '刪除出貨單失敗'
    });
  }
};

// 搜索出貨單
export const searchShippingOrders = (searchParams) => async (dispatch) => {
  try {
    dispatch({ type: ActionTypes.SEARCH_SHIPPING_ORDERS_REQUEST });
    
    // 構建查詢字符串
    const queryParams = new URLSearchParams();
    for (const key in searchParams) {
      if (searchParams[key]) {
        queryParams.append(key, searchParams[key]);
      }
    }
    
    const res = await axios.get(`/api/shipping-orders/search/query?${queryParams.toString()}`);
    
    dispatch({
      type: ActionTypes.SEARCH_SHIPPING_ORDERS_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ActionTypes.SEARCH_SHIPPING_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '搜索出貨單失敗'
    });
  }
};
