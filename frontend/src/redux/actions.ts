import { ActionTypes } from './actionTypes.ts';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig.ts';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action, RootState } from './reducers.ts';
import { NavigateFunction } from 'react-router-dom';

// 導入 shared 類型
import {
  ApiResponse,
  Product,
  Customer,
  Supplier,
  Inventory,
  Sale,
  PurchaseOrder,
  ShippingOrder,
  DashboardData,
  ReportData,
  LoginRequest,
  LoginResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  ShippingOrderCreateRequest,
  ShippingOrderUpdateRequest,
  ProductType,
  API_ENDPOINTS,
  ERROR_MESSAGES
} from '@pharmacy-pos/shared';

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
    const loginData: LoginRequest = { username, password };
    const res = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/auth/login`, loginData);
    
    if (res.data.success && res.data.data) {
      const { token, user } = res.data.data;
      
      // 儲存令牌到本地存儲
      localStorage.setItem('token', token);
      
      // 設置認證令牌
      setAuthToken(token);
      
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { token, user }
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.LOGIN_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.LOGIN_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.LOGIN_FAILED
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

// 產品相關動作創建器
export const fetchProducts = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_PRODUCTS_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<Product[]>>(API_ENDPOINTS.PRODUCTS.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_PRODUCTS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_PRODUCTS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_PRODUCTS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_PRODUCTS_FAILED
    });
  }
};

export const addProduct = (productData: ProductCreateRequest): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.ADD_PRODUCT_REQUEST });
  
  try {
    // 根據產品類型選擇正確的API端點
    const endpoint = productData.productType === ProductType.MEDICINE
      ? API_ENDPOINTS.PRODUCTS.MEDICINE
      : API_ENDPOINTS.PRODUCTS.PRODUCT;
    
    const res = await axios.post<ApiResponse<Product>>(endpoint, productData);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.ADD_PRODUCT_SUCCESS,
        payload: res.data.data
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.ADD_PRODUCT_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.ADD_PRODUCT_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.ADD_PRODUCT_FAILED
    });
  }
};

export const updateProduct = (id: string, productData: ProductUpdateRequest): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.UPDATE_PRODUCT_REQUEST });
  
  try {
    const res = await axios.put<ApiResponse<Product>>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`, productData);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.UPDATE_PRODUCT_SUCCESS,
        payload: res.data.data
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.UPDATE_PRODUCT_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.UPDATE_PRODUCT_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.UPDATE_PRODUCT_FAILED
    });
  }
};

export const deleteProduct = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.DELETE_PRODUCT_REQUEST });
  
  try {
    const res = await axios.delete<ApiResponse>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.DELETE_PRODUCT_SUCCESS,
        payload: id
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.DELETE_PRODUCT_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_PRODUCT_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.DELETE_PRODUCT_FAILED
    });
  }
};

// 供應商相關動作創建器
export const fetchSuppliers = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_SUPPLIERS_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<Supplier[]>>(API_ENDPOINTS.SUPPLIERS.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_SUPPLIERS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_SUPPLIERS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SUPPLIERS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_SUPPLIERS_FAILED
    });
  }
};

// 客戶相關動作創建器
export const fetchCustomers = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_CUSTOMERS_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<Customer[]>>(API_ENDPOINTS.CUSTOMERS.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_CUSTOMERS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_CUSTOMERS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_CUSTOMERS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_CUSTOMERS_FAILED
    });
  }
};

// 庫存相關動作創建器
export const fetchInventory = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_INVENTORY_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<Inventory[]>>(API_ENDPOINTS.INVENTORY.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_INVENTORY_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_INVENTORY_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_INVENTORY_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_INVENTORY_FAILED
    });
  }
};

// 銷售相關動作創建器
export const fetchSales = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_SALES_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<Sale[]>>(API_ENDPOINTS.SALES.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_SALES_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_SALES_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SALES_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_SALES_FAILED
    });
  }
};

// 儀表板相關動作創建器
export const fetchDashboardData = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_DASHBOARD_DATA_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<DashboardData>>(API_ENDPOINTS.DASHBOARD.DATA);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_DASHBOARD_DATA_SUCCESS,
        payload: res.data.data || {}
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_DASHBOARD_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_DASHBOARD_DATA_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_DASHBOARD_FAILED
    });
  }
};

// 報表相關動作創建器
export const fetchReportsData = (reportType: string, params: Record<string, any>): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  dispatch({ type: ActionTypes.FETCH_REPORTS_DATA_REQUEST });
  
  try {
    const res = await axios.get<ApiResponse<ReportData>>(`${API_ENDPOINTS.REPORTS.BASE}/${reportType}`, { params });
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_REPORTS_DATA_SUCCESS,
        payload: res.data.data || {}
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_REPORTS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_REPORTS_DATA_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_REPORTS_FAILED
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
    
    const res = await axios.get<ApiResponse<PurchaseOrder[]>>(API_ENDPOINTS.PURCHASE_ORDERS.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_PURCHASE_ORDERS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_PURCHASE_ORDERS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDERS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_PURCHASE_ORDERS_FAILED
    });
  }
};

// 獲取單個進貨單
export const fetchPurchaseOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.FETCH_PURCHASE_ORDER_REQUEST });
    
    const res = await axios.get<ApiResponse<PurchaseOrder>>(`${API_ENDPOINTS.PURCHASE_ORDERS.BASE}/${id}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_PURCHASE_ORDER_SUCCESS,
        payload: res.data.data || {}
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_PURCHASE_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_PURCHASE_ORDER_FAILED
    });
  }
};

// 添加進貨單
export const addPurchaseOrder = (formData: PurchaseOrderCreateRequest, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.ADD_PURCHASE_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.post<ApiResponse<PurchaseOrder>>(API_ENDPOINTS.PURCHASE_ORDERS.CREATE, formData, config);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.ADD_PURCHASE_ORDER_SUCCESS,
        payload: res.data.data
      });
      
      // 導航到進貨單列表頁面
      if (navigate) {
        navigate('/purchase-orders');
      }
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.ADD_PURCHASE_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.ADD_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.ADD_PURCHASE_ORDER_FAILED
    });
  }
};

// 更新進貨單
export const updatePurchaseOrder = (id: string, formData: PurchaseOrderUpdateRequest, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.UPDATE_PURCHASE_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.put<ApiResponse<PurchaseOrder>>(`${API_ENDPOINTS.PURCHASE_ORDERS.BASE}/${id}`, formData, config);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.UPDATE_PURCHASE_ORDER_SUCCESS,
        payload: res.data.data
      });
      
      // 導航到進貨單列表頁面
      if (navigate) {
        navigate('/purchase-orders');
      }
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.UPDATE_PURCHASE_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.UPDATE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.UPDATE_PURCHASE_ORDER_FAILED
    });
  }
};

// 刪除進貨單
export const deletePurchaseOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.DELETE_PURCHASE_ORDER_REQUEST });
    
    const res = await axios.delete<ApiResponse>(`${API_ENDPOINTS.PURCHASE_ORDERS.BASE}/${id}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.DELETE_PURCHASE_ORDER_SUCCESS,
        payload: id
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.DELETE_PURCHASE_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.DELETE_PURCHASE_ORDER_FAILED
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
    
    const res = await axios.get<ApiResponse<PurchaseOrder[]>>(`${API_ENDPOINTS.PURCHASE_ORDERS.SEARCH}?${queryParams.toString()}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.SEARCH_PURCHASE_ORDERS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.SEARCH_PURCHASE_ORDERS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.SEARCH_PURCHASE_ORDERS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.SEARCH_PURCHASE_ORDERS_FAILED
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
    
    const res = await axios.get<ApiResponse<ShippingOrder[]>>(API_ENDPOINTS.SHIPPING_ORDERS.LIST);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_SHIPPING_ORDERS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_SHIPPING_ORDERS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDERS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_SHIPPING_ORDERS_FAILED
    });
  }
};

// 獲取單個出貨單
export const fetchShippingOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.FETCH_SHIPPING_ORDER_REQUEST });
    
    const res = await axios.get<ApiResponse<ShippingOrder>>(`${API_ENDPOINTS.SHIPPING_ORDERS.BASE}/${id}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.FETCH_SHIPPING_ORDER_SUCCESS,
        payload: res.data.data || {}
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.FETCH_SHIPPING_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.FETCH_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.FETCH_SHIPPING_ORDER_FAILED
    });
  }
};

// 添加出貨單
export const addShippingOrder = (formData: ShippingOrderCreateRequest, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.ADD_SHIPPING_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.post<ApiResponse<ShippingOrder>>(API_ENDPOINTS.SHIPPING_ORDERS.CREATE, formData, config);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.ADD_SHIPPING_ORDER_SUCCESS,
        payload: res.data.data
      });
      
      // 導航到出貨單列表頁面
      if (navigate) {
        navigate('/shipping-orders');
      }
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.ADD_SHIPPING_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.ADD_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.ADD_SHIPPING_ORDER_FAILED
    });
  }
};

// 更新出貨單
export const updateShippingOrder = (id: string, formData: ShippingOrderUpdateRequest, navigate?: NavigateFunction): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.UPDATE_SHIPPING_ORDER_REQUEST });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const res = await axios.put<ApiResponse<ShippingOrder>>(`${API_ENDPOINTS.SHIPPING_ORDERS.BASE}/${id}`, formData, config);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.UPDATE_SHIPPING_ORDER_SUCCESS,
        payload: res.data.data
      });
      
      // 導航到出貨單列表頁面
      if (navigate) {
        navigate('/shipping-orders');
      }
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.UPDATE_SHIPPING_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.UPDATE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.UPDATE_SHIPPING_ORDER_FAILED
    });
  }
};

// 刪除出貨單
export const deleteShippingOrder = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: ActionTypes.DELETE_SHIPPING_ORDER_REQUEST });
    
    const res = await axios.delete<ApiResponse>(`${API_ENDPOINTS.SHIPPING_ORDERS.BASE}/${id}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.DELETE_SHIPPING_ORDER_SUCCESS,
        payload: id
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.DELETE_SHIPPING_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.DELETE_SHIPPING_ORDER_FAILED
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
    
    const res = await axios.get<ApiResponse<ShippingOrder[]>>(`${API_ENDPOINTS.SHIPPING_ORDERS.SEARCH}?${queryParams.toString()}`);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.SEARCH_SHIPPING_ORDERS_SUCCESS,
        payload: res.data.data || []
      });
    } else {
      throw new Error(res.data.message || ERROR_MESSAGES.SEARCH_SHIPPING_ORDERS_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.SEARCH_SHIPPING_ORDERS_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.SEARCH_SHIPPING_ORDERS_FAILED
    });
  }
};