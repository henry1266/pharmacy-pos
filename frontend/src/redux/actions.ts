import { ActionTypes } from './actionTypes.ts';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig.ts';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action } from './reducers.ts';
import { RootState } from './reducers.ts';
import { NavigateFunction } from 'react-router-dom';

// API基礎URL
export const API_BASE_URL = getApiBaseUrl();

// 設置認證令牌
const setAuthToken = (token: string | null): void => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// 定義 Thunk 類型
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;

// 認證相關動作創建器
export const login = (username: string, password: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.LOGIN_REQUEST });
  
  try {
    interface LoginResponse {
      token: string;
      user: any;
    }
    
    const res = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { username, password });
    
    const { token } = res.data;
    
    // 儲存令牌到本地存儲
    localStorage.setItem('token', token);
    
    // 設置認證令牌
    setAuthToken(token);
    
    dispatch({
      type: ActionTypes.LOGIN_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.LOGIN_FAILURE,
      payload: err.response?.data?.msg || '登入失敗'
    });
  }
};

export const logout = (): AppThunk => (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  // 清除本地存儲中的令牌
  localStorage.removeItem('token');
  
  // 清除認證令牌
  setAuthToken(null);
  
  dispatch({ type: ActionTypes.LOGOUT });
};

// 藥品相關動作創建器
export const fetchProducts = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_PRODUCTS_REQUEST });
  
  try {
    const res = await axios.get('/api/products');
    
    dispatch({
      type: ActionTypes.FETCH_PRODUCTS_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_PRODUCTS_FAILURE,
      payload: err.response?.data?.msg || '獲取藥品失敗'
    });
  }
};

export const addProduct = (productData: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.ADD_PRODUCT_REQUEST });
  
  try {
    // 根據產品類型選擇正確的API端點
    const endpoint = productData.productType === 'medicine' 
      ? '/api/products/medicine' 
      : '/api/products/product';
    
    const res = await axios.post(endpoint, productData);
    
    dispatch({
      type: ActionTypes.ADD_PRODUCT_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.ADD_PRODUCT_FAILURE,
      payload: err.response?.data?.msg || '添加藥品失敗'
    });
  }
};

export const updateProduct = (id: string, productData: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.UPDATE_PRODUCT_REQUEST });
  
  try {
    const res = await axios.put(`/api/products/${id}`, productData);
    
    dispatch({
      type: ActionTypes.UPDATE_PRODUCT_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.UPDATE_PRODUCT_FAILURE,
      payload: err.response?.data?.msg || '更新藥品失敗'
    });
  }
};

export const deleteProduct = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.DELETE_PRODUCT_REQUEST });
  
  try {
    await axios.delete(`/api/products/${id}`);
    
    dispatch({
      type: ActionTypes.DELETE_PRODUCT_SUCCESS,
      payload: id
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_PRODUCT_FAILURE,
      payload: err.response?.data?.msg || '刪除藥品失敗'
    });
  }
};

// 供應商相關動作創建器
export const fetchSuppliers = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_SUPPLIERS_REQUEST });
  
  try {
    const res = await axios.get('/api/suppliers');
    
    dispatch({
      type: ActionTypes.FETCH_SUPPLIERS_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SUPPLIERS_FAILURE,
      payload: err.response?.data?.msg || '獲取供應商失敗'
    });
  }
};

// 會員相關動作創建器
export const fetchCustomers = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_CUSTOMERS_REQUEST });
  
  try {
    const res = await axios.get('/api/customers');
    
    dispatch({
      type: ActionTypes.FETCH_CUSTOMERS_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_CUSTOMERS_FAILURE,
      payload: err.response?.data?.msg || '獲取會員失敗'
    });
  }
};

// 庫存相關動作創建器
export const fetchInventory = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_INVENTORY_REQUEST });
  
  try {
    const res = await axios.get('/api/inventory');
    
    // 不再過濾庫存記錄，保留所有庫存數據
    dispatch({
      type: ActionTypes.FETCH_INVENTORY_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_INVENTORY_FAILURE,
      payload: err.response?.data?.msg || '獲取庫存失敗'
    });
  }
};

// 銷售相關動作創建器
export const fetchSales = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_SALES_REQUEST });
  
  try {
    const res = await axios.get('/api/sales');
    
    dispatch({
      type: ActionTypes.FETCH_SALES_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SALES_FAILURE,
      payload: err.response?.data?.msg || '獲取銷售訂單失敗'
    });
  }
};

// 儀表板相關動作創建器
export const fetchDashboardData = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_DASHBOARD_DATA_REQUEST });
  
  try {
    const res = await axios.get('/api/dashboard');
    
    dispatch({
      type: ActionTypes.FETCH_DASHBOARD_DATA_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_DASHBOARD_DATA_FAILURE,
      payload: err.response?.data?.msg || '獲取儀表板數據失敗'
    });
  }
};

// 報表相關動作創建器
export const fetchReportsData = (reportType: string, params: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_REPORTS_DATA_REQUEST });
  
  try {
    const res = await axios.get(`/api/reports/${reportType}`, { params });
    
    dispatch({
      type: ActionTypes.FETCH_REPORTS_DATA_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_REPORTS_DATA_FAILURE,
      payload: err.response?.data?.msg || '獲取報表數據失敗'
    });
  }
};


// 進貨單相關 Actions

// 獲取所有進貨單
export const fetchPurchaseOrders = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.FETCH_PURCHASE_ORDERS_REQUEST });
    
    const res = await axios.get('/api/purchase-orders');
    
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDERS_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '獲取進貨單失敗'
    });
  }
};

// 獲取單個進貨單
export const fetchPurchaseOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.FETCH_PURCHASE_ORDER_REQUEST });
    
    const res = await axios.get(`/api/purchase-orders/${id}`);
    
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDER_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '獲取進貨單詳情失敗'
    });
  }
};

// 添加進貨單
export const addPurchaseOrder = (formData: any, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
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
  } catch (err: any) {
    dispatch({
      type: ActionTypes.ADD_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '添加進貨單失敗'
    });
  }
};

// 更新進貨單
export const updatePurchaseOrder = (id: string, formData: any, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
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
  } catch (err: any) {
    dispatch({
      type: ActionTypes.UPDATE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '更新進貨單失敗'
    });
  }
};

// 刪除進貨單
export const deletePurchaseOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.DELETE_PURCHASE_ORDER_REQUEST });
    
    await axios.delete(`/api/purchase-orders/${id}`);
    
    dispatch({
      type: ActionTypes.DELETE_PURCHASE_ORDER_SUCCESS,
      payload: id
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.msg || '刪除進貨單失敗'
    });
  }
};

// 搜索進貨單
export const searchPurchaseOrders = (searchParams: Record<string, string>): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
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
  } catch (err: any) {
    dispatch({
      type: ActionTypes.SEARCH_PURCHASE_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '搜索進貨單失敗'
    });
  }
};

// 出貨單相關 Actions

// 獲取所有出貨單
export const fetchShippingOrders = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.FETCH_SHIPPING_ORDERS_REQUEST });
    
    const res = await axios.get('/api/shipping-orders');
    
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDERS_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '獲取出貨單失敗'
    });
  }
};

// 獲取單個出貨單
export const fetchShippingOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.FETCH_SHIPPING_ORDER_REQUEST });
    
    const res = await axios.get(`/api/shipping-orders/${id}`);
    
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDER_SUCCESS,
      payload: res.data
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '獲取出貨單詳情失敗'
    });
  }
};

// 添加出貨單
export const addShippingOrder = (formData: any, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
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
  } catch (err: any) {
    dispatch({
      type: ActionTypes.ADD_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '添加出貨單失敗'
    });
  }
};

// 更新出貨單
export const updateShippingOrder = (id: string, formData: any, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
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
  } catch (err: any) {
    dispatch({
      type: ActionTypes.UPDATE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '更新出貨單失敗'
    });
  }
};

// 刪除出貨單
export const deleteShippingOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.DELETE_SHIPPING_ORDER_REQUEST });
    
    await axios.delete(`/api/shipping-orders/${id}`);
    
    dispatch({
      type: ActionTypes.DELETE_SHIPPING_ORDER_SUCCESS,
      payload: id
    });
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.msg || '刪除出貨單失敗'
    });
  }
};

// 搜索出貨單
export const searchShippingOrders = (searchParams: Record<string, string>): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
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
  } catch (err: any) {
    dispatch({
      type: ActionTypes.SEARCH_SHIPPING_ORDERS_FAILURE,
      payload: err.response?.data?.msg || '搜索出貨單失敗'
    });
  }
};