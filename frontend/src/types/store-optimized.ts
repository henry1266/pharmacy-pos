/**
 * Redux 狀態型別定義 - 優化版本
 */

import { Product, Supplier, Customer, Inventory, Sale, PurchaseOrder, ShippingOrder } from '@pharmacy-pos/shared/types/entities';

/**
 * 通用非同步狀態介面
 */
export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * 通用列表狀態介面
 */
export interface ListState<T> extends AsyncState<T[]> {}

/**
 * 通用單項狀態介面
 */
export interface ItemState<T> extends AsyncState<T | null> {}

/**
 * 通用 Action 型別工廠
 */
export interface AsyncAction<T = any> {
  type: string;
  payload?: T;
}

/**
 * 建立非同步 Action 型別的工廠函數
 */
export const createAsyncActionTypes = <T extends string>(prefix: T) => ({
  REQUEST: `${prefix}_REQUEST` as const,
  SUCCESS: `${prefix}_SUCCESS` as const,
  FAILURE: `${prefix}_FAILURE` as const,
});

/**
 * 建立 CRUD Action 型別的工廠函數
 */
export const createCrudActionTypes = <T extends string>(prefix: T) => ({
  ...createAsyncActionTypes(`FETCH_${prefix}`),
  ...createAsyncActionTypes(`ADD_${prefix}`),
  ...createAsyncActionTypes(`UPDATE_${prefix}`),
  ...createAsyncActionTypes(`DELETE_${prefix}`),
  ...createAsyncActionTypes(`SEARCH_${prefix}`),
});

/**
 * Action 型別常數
 */
export const ActionTypes = {
  // 認證相關
  AUTH: createAsyncActionTypes('LOGIN'),
  LOGOUT: 'LOGOUT' as const,
  
  // 各模組 CRUD 操作
  PRODUCTS: createCrudActionTypes('PRODUCTS'),
  SUPPLIERS: createAsyncActionTypes('FETCH_SUPPLIERS'),
  CUSTOMERS: createAsyncActionTypes('FETCH_CUSTOMERS'),
  INVENTORY: createAsyncActionTypes('FETCH_INVENTORY'),
  SALES: createAsyncActionTypes('FETCH_SALES'),
  DASHBOARD: createAsyncActionTypes('FETCH_DASHBOARD_DATA'),
  REPORTS: createAsyncActionTypes('FETCH_REPORTS_DATA'),
  PURCHASE_ORDERS: {
    ...createCrudActionTypes('PURCHASE_ORDERS'),
    FETCH_SINGLE: createAsyncActionTypes('FETCH_PURCHASE_ORDER'),
  },
  SHIPPING_ORDERS: {
    ...createCrudActionTypes('SHIPPING_ORDERS'),
    FETCH_SINGLE: createAsyncActionTypes('FETCH_SHIPPING_ORDER'),
  },
} as const;

/**
 * 建立非同步 Action 創建器的型別
 */
export type AsyncActionCreators<T, P = any> = {
  request: () => AsyncAction;
  success: (payload: T) => AsyncAction<T>;
  failure: (error: string) => AsyncAction<string>;
};

/**
 * 各模組 State 型別
 */

// 認證狀態
export interface AuthState extends AsyncState<{
  token: string | null;
  isAuthenticated: boolean;
  user: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null;
}> {}

// 藥品狀態
export interface ProductsState extends ListState<Product> {}

// 供應商狀態
export interface SuppliersState extends ListState<Supplier> {}

// 會員狀態
export interface CustomersState extends ListState<Customer> {}

// 庫存狀態
export interface InventoryState extends ListState<Inventory> {}

// 銷售狀態
export interface SalesState extends ListState<Sale> {}

// 儀表板狀態
export interface DashboardState extends AsyncState<{
  salesSummary?: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  inventorySummary?: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  recentSales?: Sale[];
  topSellingProducts?: {
    productId: string;
    productName: string;
    quantity: number;
    totalSales: number;
  }[];
} | null> {}

// 報表狀態
export interface ReportsState extends AsyncState<any> {}

// 進貨單狀態
export interface PurchaseOrdersState extends ListState<PurchaseOrder> {
  currentPurchaseOrder: PurchaseOrder | null;
}

// 出貨單狀態
export interface ShippingOrdersState extends ListState<ShippingOrder> {
  currentShippingOrder: ShippingOrder | null;
}

/**
 * RootState 型別
 */
export interface RootState {
  auth: AuthState;
  products: ProductsState;
  suppliers: SuppliersState;
  customers: CustomersState;
  inventory: InventoryState;
  sales: SalesState;
  dashboard: DashboardState;
  reports: ReportsState;
  purchaseOrders: PurchaseOrdersState;
  shippingOrders: ShippingOrdersState;
}

/**
 * 通用 Action 型別
 */
export type AppAction = AsyncAction;

/**
 * Redux Thunk 型別
 */
export type AppThunk<ReturnType = void> = (
  dispatch: (action: AppAction) => void,
  getState: () => RootState
) => ReturnType;

/**
 * 建立非同步 Action 創建器的工廠函數
 */
export const createAsyncActionCreators = <T, P = any>(
  actionTypes: ReturnType<typeof createAsyncActionTypes>
): AsyncActionCreators<T, P> => ({
  request: () => ({ type: actionTypes.REQUEST }),
  success: (payload: T) => ({ type: actionTypes.SUCCESS, payload }),
  failure: (error: string) => ({ type: actionTypes.FAILURE, payload: error }),
});

/**
 * 建立非同步 Reducer 的工廠函數
 */
export const createAsyncReducer = <T>(
  actionTypes: ReturnType<typeof createAsyncActionTypes>,
  initialData: T
) => {
  const initialState: AsyncState<T> = {
    data: initialData,
    loading: false,
    error: null,
  };

  return (state = initialState, action: AppAction): AsyncState<T> => {
    switch (action.type) {
      case actionTypes.REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case actionTypes.SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
          error: null,
        };
      case actionTypes.FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
};