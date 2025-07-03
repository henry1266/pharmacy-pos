import {
  ActionTypes,
  Product,
  Customer,
  Supplier,
  Inventory,
  Sale,
  PurchaseOrder,
  ShippingOrder,
  DashboardData,
  ReportData,
  ProductCreateRequest,
  ProductUpdateRequest,
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  ShippingOrderCreateRequest,
  ShippingOrderUpdateRequest,
  ProductType,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  ApiResponse,
  LoginRequest,
  LoginResponse
} from '@pharmacy-pos/shared';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action, RootState } from './reducers';
import { NavigateFunction } from 'react-router-dom';

// API基礎URL
export const API_BASE_URL = getApiBaseUrl();

// 設置認證令牌
const setAuthToken = (token: string | null): void => {
  if (token) {
    // 同時設定兩種認證方式以確保相容性
    axios.defaults.headers.common['x-auth-token'] = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    delete axios.defaults.headers.common['Authorization'];
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.LOGIN_FAILED);
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_PRODUCTS_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.ADD_PRODUCT_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.UPDATE_PRODUCT_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.DELETE_PRODUCT_FAILED);
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_SUPPLIERS_FAILED);
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_CUSTOMERS_FAILED);
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_INVENTORY_FAILED);
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_SALES_FAILED);
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
        payload: res.data.data ?? {}
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_DASHBOARD_FAILED);
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
        payload: res.data.data ?? {}
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_REPORTS_FAILED);
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_PURCHASE_ORDERS_FAILED);
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
        payload: res.data.data ?? {}
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_PURCHASE_ORDER_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.ADD_PURCHASE_ORDER_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.UPDATE_PURCHASE_ORDER_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.DELETE_PURCHASE_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_PURCHASE_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.DELETE_PURCHASE_ORDER_FAILED
    });
  }
};

// 搜索進貨單 - 已棄用，使用 usePurchaseOrdersData hook 中的前端過濾功能替代
// @deprecated 此函數已棄用，請使用 usePurchaseOrdersData hook 中的前端過濾功能
export const searchPurchaseOrders = (searchParams: Record<string, string>): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  console.warn('searchPurchaseOrders 已棄用，請使用 usePurchaseOrdersData hook 中的前端過濾功能');
  dispatch({
    type: ActionTypes.SEARCH_PURCHASE_ORDERS_FAILURE,
    payload: '此 API 已棄用，請使用前端過濾功能'
  });
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
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_SHIPPING_ORDERS_FAILED);
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
        payload: res.data.data ?? {}
      });
    } else {
      throw new Error(res.data.message ?? ERROR_MESSAGES.FETCH_SHIPPING_ORDER_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.ADD_SHIPPING_ORDER_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.UPDATE_SHIPPING_ORDER_FAILED);
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
      throw new Error(res.data.message ?? ERROR_MESSAGES.DELETE_SHIPPING_ORDER_FAILED);
    }
  } catch (err: any) {
    dispatch({
      type: ActionTypes.DELETE_SHIPPING_ORDER_FAILURE,
      payload: err.response?.data?.message ?? ERROR_MESSAGES.DELETE_SHIPPING_ORDER_FAILED
    });
  }
};

// 搜索出貨單 - 已棄用，使用 useShippingOrdersData hook 中的前端過濾功能替代
// @deprecated 此函數已棄用，請使用 useShippingOrdersData hook 中的前端過濾功能
export const searchShippingOrders = (searchParams: Record<string, string>): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  console.warn('searchShippingOrders 已棄用，請使用 useShippingOrdersData hook 中的前端過濾功能');
  dispatch({
    type: ActionTypes.SEARCH_SHIPPING_ORDERS_FAILURE,
    payload: '此 API 已棄用，請使用前端過濾功能'
  });
};

// 會計科目管理相關 Actions

// 獲取所有會計科目
export const fetchAccounts2 = (organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 fetchAccounts2 開始，organizationId:', organizationId);
    dispatch({ type: 'FETCH_ACCOUNTS2_REQUEST' });
    
    const params = organizationId ? { organizationId } : {};
    console.log('📡 API 請求參數:', params);
    
    // 確保請求包含正確的認證標頭
    const config = {
      params,
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/accounting2/accounts`, config);
    console.log('📡 API 回應:', res.data);
    
    if (res.data.success) {
      // 確保回傳的資料是陣列
      const accounts = Array.isArray(res.data.data) ? res.data.data : [];
      dispatch({
        type: 'FETCH_ACCOUNTS2_SUCCESS',
        payload: accounts
      });
      console.log('✅ fetchAccounts2 成功，資料筆數:', accounts.length);
    } else {
      throw new Error(res.data.message ?? '獲取會計科目失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchAccounts2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    console.error('❌ 錯誤狀態碼:', err.response?.status);
    
    let errorMessage = '獲取會計科目失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'FETCH_ACCOUNTS2_FAILURE',
      payload: errorMessage
    });
  }
};

// 創建會計科目
export const createAccount2 = (accountData: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 createAccount2 開始:', accountData);
    dispatch({ type: 'CREATE_ACCOUNT2_REQUEST' });
    
    // 確保請求包含正確的認證標頭
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/accounting2/accounts`, accountData, config);
    console.log('📡 創建會計科目 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'CREATE_ACCOUNT2_SUCCESS',
        payload: res.data.data
      });
      console.log('✅ createAccount2 成功:', res.data.data);
      
      // 創建成功後重新載入會計科目列表
      setTimeout(() => {
        console.log('🔄 重新載入會計科目列表');
        dispatch(fetchAccounts2(accountData.organizationId) as any);
      }, 100);
      
      return res.data.data; // 返回創建的資料
    } else {
      throw new Error(res.data.message ?? '創建會計科目失敗');
    }
  } catch (err: any) {
    console.error('❌ createAccount2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    console.error('❌ 錯誤狀態碼:', err.response?.status);
    
    let errorMessage = '創建會計科目失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.status === 400) {
      errorMessage = err.response?.data?.message || '請求資料格式錯誤';
    } else if (err.response?.status === 500) {
      errorMessage = err.response?.data?.message || '伺服器內部錯誤';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'CREATE_ACCOUNT2_FAILURE',
      payload: errorMessage
    });
    throw new Error(errorMessage); // 重新拋出錯誤，讓前端組件可以處理
  }
};

// 更新會計科目
export const updateAccount2 = (id: string, accountData: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: 'UPDATE_ACCOUNT2_REQUEST' });
    
    const res = await axios.put<ApiResponse<any>>(`${API_BASE_URL}/accounting2/accounts/${id}`, accountData);
    
    if (res.data.success) {
      dispatch({
        type: 'UPDATE_ACCOUNT2_SUCCESS',
        payload: res.data.data
      });
      // 更新成功後重新載入會計科目列表
      dispatch(fetchAccounts2(accountData.organizationId) as any);
    } else {
      throw new Error(res.data.message ?? '更新會計科目失敗');
    }
  } catch (err: any) {
    dispatch({
      type: 'UPDATE_ACCOUNT2_FAILURE',
      payload: err.response?.data?.message ?? '更新會計科目失敗'
    });
  }
};

// 刪除會計科目
export const deleteAccount2 = (id: string, organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: 'DELETE_ACCOUNT2_REQUEST' });
    
    const res = await axios.delete<ApiResponse>(`${API_BASE_URL}/accounting2/accounts/${id}`);
    
    if (res.data.success) {
      dispatch({
        type: 'DELETE_ACCOUNT2_SUCCESS',
        payload: id
      });
      // 刪除成功後重新載入會計科目列表
      dispatch(fetchAccounts2(organizationId) as any);
    } else {
      throw new Error(res.data.message ?? '刪除會計科目失敗');
    }
  } catch (err: any) {
    dispatch({
      type: 'DELETE_ACCOUNT2_FAILURE',
      payload: err.response?.data?.message ?? '刪除會計科目失敗'
    });
  }
};

// 搜尋會計科目
export const searchAccounts2 = (searchTerm: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: 'SEARCH_ACCOUNTS2_REQUEST' });
    
    const res = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/accounting2/accounts/search`, {
      params: { q: searchTerm }
    });
    
    if (res.data.success) {
      dispatch({
        type: 'SEARCH_ACCOUNTS2_SUCCESS',
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? '搜尋會計科目失敗');
    }
  } catch (err: any) {
    dispatch({
      type: 'SEARCH_ACCOUNTS2_FAILURE',
      payload: err.response?.data?.message ?? '搜尋會計科目失敗'
    });
  }
};

// 建立標準會計科目表
export const createStandardChart = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: 'CREATE_STANDARD_CHART_REQUEST' });
    
    const res = await axios.post<ApiResponse<any[]>>(`${API_BASE_URL}/accounting2/accounts/setup/standard-chart`);
    
    if (res.data.success) {
      dispatch({
        type: 'CREATE_STANDARD_CHART_SUCCESS',
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? '建立標準會計科目表失敗');
    }
  } catch (err: any) {
    dispatch({
      type: 'CREATE_STANDARD_CHART_FAILURE',
      payload: err.response?.data?.message ?? '建立標準會計科目表失敗'
    });
  }
};

// 獲取會計科目樹狀結構
export const fetchAccountsHierarchy = (organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🌳 fetchAccountsHierarchy 開始，organizationId:', organizationId);
    dispatch({ type: 'FETCH_ACCOUNTS2_REQUEST' });
    
    const params = organizationId ? { organizationId } : {};
    console.log('📡 樹狀結構 API 請求參數:', params);
    
    const res = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/accounting2/accounts/tree/hierarchy`, { params });
    console.log('📡 樹狀結構 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'FETCH_ACCOUNTS2_SUCCESS',
        payload: res.data.data ?? []
      });
      console.log('✅ fetchAccountsHierarchy 成功，資料筆數:', res.data.data?.length || 0);
    } else {
      throw new Error(res.data.message ?? '獲取會計科目樹狀結構失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchAccountsHierarchy 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    dispatch({
      type: 'FETCH_ACCOUNTS2_FAILURE',
      payload: err.response?.data?.message ?? err.message ?? '獲取會計科目樹狀結構失敗'
    });
  }
};

// 依類型獲取會計科目
export const fetchAccountsByType = (accountType: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    dispatch({ type: 'FETCH_ACCOUNTS2_REQUEST' });
    
    const res = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/accounting2/accounts/by-type/${accountType}`);
    
    if (res.data.success) {
      dispatch({
        type: 'FETCH_ACCOUNTS2_SUCCESS',
        payload: res.data.data ?? []
      });
    } else {
      throw new Error(res.data.message ?? '依類型獲取會計科目失敗');
    }
  } catch (err: any) {
    dispatch({
      type: 'FETCH_ACCOUNTS2_FAILURE',
      payload: err.response?.data?.message ?? '依類型獲取會計科目失敗'
    });
  }
};

// 交易群組相關 Actions

// 獲取所有交易群組
export const fetchTransactionGroups2 = (organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 fetchTransactionGroups2 開始，organizationId:', organizationId);
    dispatch({ type: 'FETCH_TRANSACTION_GROUPS2_REQUEST' });
    
    const params = organizationId ? { organizationId } : {};
    console.log('📡 API 請求參數:', params);
    
    // 確保請求包含正確的認證標頭
    const config = {
      params,
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/accounting2/transaction-groups`, config);
    console.log('📡 API 回應:', res.data);
    
    if (res.data.success) {
      // 處理後端回傳的新結構：{ data: { transactionGroups: [...], pagination: {...} } }
      let transactionGroups = [];
      if (res.data.data && res.data.data.transactionGroups) {
        transactionGroups = Array.isArray(res.data.data.transactionGroups) ? res.data.data.transactionGroups : [];
      } else if (Array.isArray(res.data.data)) {
        // 向後兼容舊格式
        transactionGroups = res.data.data;
      }
      
      // 確保每個交易群組都有完整的資料結構
      const processedTransactionGroups = transactionGroups.map(group => ({
        ...group,
        entries: Array.isArray(group.entries) ? group.entries : [],
        totalAmount: typeof group.totalAmount === 'number' ? group.totalAmount : 0,
        isBalanced: typeof group.isBalanced === 'boolean' ? group.isBalanced : false
      }));
      
      dispatch({
        type: 'FETCH_TRANSACTION_GROUPS2_SUCCESS',
        payload: processedTransactionGroups
      });
      console.log('✅ fetchTransactionGroups2 成功，資料筆數:', processedTransactionGroups.length);
      console.log('📋 第一筆資料範例:', processedTransactionGroups[0]);
    } else {
      throw new Error(res.data.message ?? '獲取交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchTransactionGroups2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    console.error('❌ 錯誤狀態碼:', err.response?.status);
    
    let errorMessage = '獲取交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'FETCH_TRANSACTION_GROUPS2_FAILURE',
      payload: errorMessage
    });
  }
};

// 創建交易群組
export const createTransactionGroup2 = (transactionData: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 createTransactionGroup2 開始:', transactionData);
    dispatch({ type: 'CREATE_TRANSACTION_GROUP2_REQUEST' });
    
    // 確保請求包含正確的認證標頭
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/accounting2/transaction-groups`, transactionData, config);
    console.log('📡 創建交易群組 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'CREATE_TRANSACTION_GROUP2_SUCCESS',
        payload: res.data.data
      });
      console.log('✅ createTransactionGroup2 成功:', res.data.data);
      // 創建成功後重新載入交易群組列表
      dispatch(fetchTransactionGroups2(transactionData.organizationId) as any);
    } else {
      throw new Error(res.data.message ?? '創建交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ createTransactionGroup2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    console.error('❌ 錯誤狀態碼:', err.response?.status);
    
    let errorMessage = '創建交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.status === 400) {
      errorMessage = err.response?.data?.message || '請求資料格式錯誤';
    } else if (err.response?.status === 500) {
      errorMessage = err.response?.data?.message || '伺服器內部錯誤';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'CREATE_TRANSACTION_GROUP2_FAILURE',
      payload: errorMessage
    });
    throw new Error(errorMessage); // 重新拋出錯誤，讓前端組件可以處理
  }
};

// 更新交易群組
export const updateTransactionGroup2 = (id: string, transactionData: any): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 updateTransactionGroup2 開始:', { id, transactionData });
    dispatch({ type: 'UPDATE_TRANSACTION_GROUP2_REQUEST' });
    
    // 確保請求包含正確的認證標頭
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.put<ApiResponse<any>>(`${API_BASE_URL}/accounting2/transaction-groups/${id}`, transactionData, config);
    console.log('📡 更新交易群組 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'UPDATE_TRANSACTION_GROUP2_SUCCESS',
        payload: res.data.data
      });
      console.log('✅ updateTransactionGroup2 成功:', res.data.data);
      // 更新成功後重新載入交易群組列表
      dispatch(fetchTransactionGroups2(transactionData.organizationId) as any);
    } else {
      throw new Error(res.data.message ?? '更新交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ updateTransactionGroup2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    dispatch({
      type: 'UPDATE_TRANSACTION_GROUP2_FAILURE',
      payload: err.response?.data?.message ?? err.message ?? '更新交易群組失敗'
    });
    throw err; // 重新拋出錯誤，讓前端組件可以處理
  }
};

// 刪除交易群組
export const deleteTransactionGroup2 = (id: string, organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 deleteTransactionGroup2 開始:', { id, organizationId });
    dispatch({ type: 'DELETE_TRANSACTION_GROUP2_REQUEST' });
    
    // 確保請求包含正確的認證標頭
    const config = {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.delete<ApiResponse>(`${API_BASE_URL}/accounting2/transaction-groups/${id}`, config);
    console.log('📡 刪除交易群組 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'DELETE_TRANSACTION_GROUP2_SUCCESS',
        payload: id
      });
      console.log('✅ deleteTransactionGroup2 成功:', id);
      // 刪除成功後重新載入交易群組列表
      dispatch(fetchTransactionGroups2(organizationId) as any);
    } else {
      throw new Error(res.data.message ?? '刪除交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ deleteTransactionGroup2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    dispatch({
      type: 'DELETE_TRANSACTION_GROUP2_FAILURE',
      payload: err.response?.data?.message ?? err.message ?? '刪除交易群組失敗'
    });
    throw err; // 重新拋出錯誤，讓前端組件可以處理
  }
};

// 獲取單一交易群組
export const fetchTransactionGroup2 = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 fetchTransactionGroup2 開始:', id);
    dispatch({ type: 'FETCH_TRANSACTION_GROUP2_REQUEST' });
    
    const res = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/accounting2/transaction-groups/${id}`);
    console.log('📡 獲取單一交易群組 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'FETCH_TRANSACTION_GROUP2_SUCCESS',
        payload: res.data.data
      });
      console.log('✅ fetchTransactionGroup2 成功:', res.data.data);
    } else {
      throw new Error(res.data.message ?? '獲取交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchTransactionGroup2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    dispatch({
      type: 'FETCH_TRANSACTION_GROUP2_FAILURE',
      payload: err.response?.data?.message ?? err.message ?? '獲取交易群組失敗'
    });
  }
};

// 機構管理相關 Actions

// 獲取所有機構
export const fetchOrganizations2 = (): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🏢 fetchOrganizations2 開始');
    dispatch({ type: 'FETCH_ORGANIZATIONS2_REQUEST' });
    
    // 確保請求包含正確的認證標頭
    const config = {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/organizations`, config);
    console.log('📡 機構 API 回應:', res.data);
    
    if (res.data.success) {
      const organizations = Array.isArray(res.data.data) ? res.data.data : [];
      dispatch({
        type: 'FETCH_ORGANIZATIONS2_SUCCESS',
        payload: organizations
      });
      console.log('✅ fetchOrganizations2 成功，資料筆數:', organizations.length);
    } else {
      throw new Error(res.data.message ?? '獲取機構列表失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchOrganizations2 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '獲取機構列表失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'FETCH_ORGANIZATIONS2_FAILURE',
      payload: errorMessage
    });
  }
};

// 科目餘額相關 Actions

// 計算單一科目餘額
export const calculateAccountBalance = (accountId: string, organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🧮 calculateAccountBalance 開始:', { accountId, organizationId });
    dispatch({ type: 'CALCULATE_ACCOUNT_BALANCE_REQUEST' });
    
    const params = organizationId ? { organizationId } : {};
    const config = {
      params,
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/accounting2/balances/${accountId}`, config);
    console.log('📡 科目餘額計算 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'CALCULATE_ACCOUNT_BALANCE_SUCCESS',
        payload: res.data.data
      });
      console.log('✅ calculateAccountBalance 成功:', res.data.data);
    } else {
      throw new Error(res.data.message ?? '計算科目餘額失敗');
    }
  } catch (err: any) {
    console.error('❌ calculateAccountBalance 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '計算科目餘額失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'CALCULATE_ACCOUNT_BALANCE_FAILURE',
      payload: errorMessage
    });
  }
};

// 批量計算科目餘額
export const calculateAccountBalancesBatch = (accountIds: string[], organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🧮 calculateAccountBalancesBatch 開始:', { accountIds: accountIds.length, organizationId });
    dispatch({ type: 'CALCULATE_ACCOUNT_BALANCES_BATCH_REQUEST' });
    
    const requestData = {
      accountIds,
      organizationId
    };
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/accounting2/balances/batch`, requestData, config);
    console.log('📡 批量科目餘額計算 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: 'CALCULATE_ACCOUNT_BALANCES_BATCH_SUCCESS',
        payload: res.data.data
      });
      console.log('✅ calculateAccountBalancesBatch 成功，計算筆數:', res.data.data?.count || 0);
    } else {
      throw new Error(res.data.message ?? '批量計算科目餘額失敗');
    }
  } catch (err: any) {
    console.error('❌ calculateAccountBalancesBatch 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '批量計算科目餘額失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'CALCULATE_ACCOUNT_BALANCES_BATCH_FAILURE',
      payload: errorMessage
    });
  }
};

// 獲取科目餘額摘要
export const fetchAccountBalancesSummary = (organizationId?: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('📊 fetchAccountBalancesSummary 開始:', { organizationId });
    dispatch({ type: 'FETCH_ACCOUNT_BALANCES_SUMMARY_REQUEST' });
    
    const params = organizationId ? { organizationId } : {};
    const config = {
      params,
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    
    const res = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/accounting2/balances/summary`, config);
    console.log('📡 科目餘額摘要 API 回應:', res.data);
    
    if (res.data.success) {
      // 後端返回的數據結構：{ success: true, organizationId, totalAccounts, summary }
      // 需要將整個 res.data 傳遞給 reducer，而不只是 res.data.data
      dispatch({
        type: 'FETCH_ACCOUNT_BALANCES_SUMMARY_SUCCESS',
        payload: res.data
      });
      console.log('✅ fetchAccountBalancesSummary 成功，總科目數:', (res.data as any).totalAccounts || 0);
    } else {
      throw new Error(res.data.message ?? '獲取科目餘額摘要失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchAccountBalancesSummary 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '獲取科目餘額摘要失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: 'FETCH_ACCOUNT_BALANCES_SUMMARY_FAILURE',
      payload: errorMessage
    });
  }
};