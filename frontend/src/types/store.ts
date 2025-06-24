/**
 * Redux 狀態型別定義
 */

import { Product, Supplier, Customer, Inventory, Sale, PurchaseOrder, ShippingOrder } from '@pharmacy-pos/shared/types/entities';

/**
 * Action 型別定義
 */
export enum ActionType {
  // 認證相關
  LOGIN_REQUEST = 'LOGIN_REQUEST',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  
  // 藥品相關
  FETCH_PRODUCTS_REQUEST = 'FETCH_PRODUCTS_REQUEST',
  FETCH_PRODUCTS_SUCCESS = 'FETCH_PRODUCTS_SUCCESS',
  FETCH_PRODUCTS_FAILURE = 'FETCH_PRODUCTS_FAILURE',
  ADD_PRODUCT_REQUEST = 'ADD_PRODUCT_REQUEST',
  ADD_PRODUCT_SUCCESS = 'ADD_PRODUCT_SUCCESS',
  ADD_PRODUCT_FAILURE = 'ADD_PRODUCT_FAILURE',
  UPDATE_PRODUCT_REQUEST = 'UPDATE_PRODUCT_REQUEST',
  UPDATE_PRODUCT_SUCCESS = 'UPDATE_PRODUCT_SUCCESS',
  UPDATE_PRODUCT_FAILURE = 'UPDATE_PRODUCT_FAILURE',
  DELETE_PRODUCT_REQUEST = 'DELETE_PRODUCT_REQUEST',
  DELETE_PRODUCT_SUCCESS = 'DELETE_PRODUCT_SUCCESS',
  DELETE_PRODUCT_FAILURE = 'DELETE_PRODUCT_FAILURE',
  
  // 供應商相關
  FETCH_SUPPLIERS_REQUEST = 'FETCH_SUPPLIERS_REQUEST',
  FETCH_SUPPLIERS_SUCCESS = 'FETCH_SUPPLIERS_SUCCESS',
  FETCH_SUPPLIERS_FAILURE = 'FETCH_SUPPLIERS_FAILURE',
  
  // 會員相關
  FETCH_CUSTOMERS_REQUEST = 'FETCH_CUSTOMERS_REQUEST',
  FETCH_CUSTOMERS_SUCCESS = 'FETCH_CUSTOMERS_SUCCESS',
  FETCH_CUSTOMERS_FAILURE = 'FETCH_CUSTOMERS_FAILURE',
  
  // 庫存相關
  FETCH_INVENTORY_REQUEST = 'FETCH_INVENTORY_REQUEST',
  FETCH_INVENTORY_SUCCESS = 'FETCH_INVENTORY_SUCCESS',
  FETCH_INVENTORY_FAILURE = 'FETCH_INVENTORY_FAILURE',
  
  // 銷售相關
  FETCH_SALES_REQUEST = 'FETCH_SALES_REQUEST',
  FETCH_SALES_SUCCESS = 'FETCH_SALES_SUCCESS',
  FETCH_SALES_FAILURE = 'FETCH_SALES_FAILURE',
  
  // 儀表板相關
  FETCH_DASHBOARD_DATA_REQUEST = 'FETCH_DASHBOARD_DATA_REQUEST',
  FETCH_DASHBOARD_DATA_SUCCESS = 'FETCH_DASHBOARD_DATA_SUCCESS',
  FETCH_DASHBOARD_DATA_FAILURE = 'FETCH_DASHBOARD_DATA_FAILURE',
  
  // 報表相關
  FETCH_REPORTS_DATA_REQUEST = 'FETCH_REPORTS_DATA_REQUEST',
  FETCH_REPORTS_DATA_SUCCESS = 'FETCH_REPORTS_DATA_SUCCESS',
  FETCH_REPORTS_DATA_FAILURE = 'FETCH_REPORTS_DATA_FAILURE',
  
  // 進貨單相關
  FETCH_PURCHASE_ORDERS_REQUEST = 'FETCH_PURCHASE_ORDERS_REQUEST',
  FETCH_PURCHASE_ORDERS_SUCCESS = 'FETCH_PURCHASE_ORDERS_SUCCESS',
  FETCH_PURCHASE_ORDERS_FAILURE = 'FETCH_PURCHASE_ORDERS_FAILURE',
  FETCH_PURCHASE_ORDER_REQUEST = 'FETCH_PURCHASE_ORDER_REQUEST',
  FETCH_PURCHASE_ORDER_SUCCESS = 'FETCH_PURCHASE_ORDER_SUCCESS',
  FETCH_PURCHASE_ORDER_FAILURE = 'FETCH_PURCHASE_ORDER_FAILURE',
  ADD_PURCHASE_ORDER_REQUEST = 'ADD_PURCHASE_ORDER_REQUEST',
  ADD_PURCHASE_ORDER_SUCCESS = 'ADD_PURCHASE_ORDER_SUCCESS',
  ADD_PURCHASE_ORDER_FAILURE = 'ADD_PURCHASE_ORDER_FAILURE',
  UPDATE_PURCHASE_ORDER_REQUEST = 'UPDATE_PURCHASE_ORDER_REQUEST',
  UPDATE_PURCHASE_ORDER_SUCCESS = 'UPDATE_PURCHASE_ORDER_SUCCESS',
  UPDATE_PURCHASE_ORDER_FAILURE = 'UPDATE_PURCHASE_ORDER_FAILURE',
  DELETE_PURCHASE_ORDER_REQUEST = 'DELETE_PURCHASE_ORDER_REQUEST',
  DELETE_PURCHASE_ORDER_SUCCESS = 'DELETE_PURCHASE_ORDER_SUCCESS',
  DELETE_PURCHASE_ORDER_FAILURE = 'DELETE_PURCHASE_ORDER_FAILURE',
  SEARCH_PURCHASE_ORDERS_REQUEST = 'SEARCH_PURCHASE_ORDERS_REQUEST',
  SEARCH_PURCHASE_ORDERS_SUCCESS = 'SEARCH_PURCHASE_ORDERS_SUCCESS',
  SEARCH_PURCHASE_ORDERS_FAILURE = 'SEARCH_PURCHASE_ORDERS_FAILURE',
  
  // 出貨單相關
  FETCH_SHIPPING_ORDERS_REQUEST = 'FETCH_SHIPPING_ORDERS_REQUEST',
  FETCH_SHIPPING_ORDERS_SUCCESS = 'FETCH_SHIPPING_ORDERS_SUCCESS',
  FETCH_SHIPPING_ORDERS_FAILURE = 'FETCH_SHIPPING_ORDERS_FAILURE',
  FETCH_SHIPPING_ORDER_REQUEST = 'FETCH_SHIPPING_ORDER_REQUEST',
  FETCH_SHIPPING_ORDER_SUCCESS = 'FETCH_SHIPPING_ORDER_SUCCESS',
  FETCH_SHIPPING_ORDER_FAILURE = 'FETCH_SHIPPING_ORDER_FAILURE',
  ADD_SHIPPING_ORDER_REQUEST = 'ADD_SHIPPING_ORDER_REQUEST',
  ADD_SHIPPING_ORDER_SUCCESS = 'ADD_SHIPPING_ORDER_SUCCESS',
  ADD_SHIPPING_ORDER_FAILURE = 'ADD_SHIPPING_ORDER_FAILURE',
  UPDATE_SHIPPING_ORDER_REQUEST = 'UPDATE_SHIPPING_ORDER_REQUEST',
  UPDATE_SHIPPING_ORDER_SUCCESS = 'UPDATE_SHIPPING_ORDER_SUCCESS',
  UPDATE_SHIPPING_ORDER_FAILURE = 'UPDATE_SHIPPING_ORDER_FAILURE',
  DELETE_SHIPPING_ORDER_REQUEST = 'DELETE_SHIPPING_ORDER_REQUEST',
  DELETE_SHIPPING_ORDER_SUCCESS = 'DELETE_SHIPPING_ORDER_SUCCESS',
  DELETE_SHIPPING_ORDER_FAILURE = 'DELETE_SHIPPING_ORDER_FAILURE',
  SEARCH_SHIPPING_ORDERS_REQUEST = 'SEARCH_SHIPPING_ORDERS_REQUEST',
  SEARCH_SHIPPING_ORDERS_SUCCESS = 'SEARCH_SHIPPING_ORDERS_SUCCESS',
  SEARCH_SHIPPING_ORDERS_FAILURE = 'SEARCH_SHIPPING_ORDERS_FAILURE'
}

/**
 * 各模組 State 型別
 */

// 認證狀態
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null;
  loading: boolean;
  error: string | null;
}

// 藥品狀態
export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

// 供應商狀態
export interface SuppliersState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

// 會員狀態
export interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

// 庫存狀態
export interface InventoryState {
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
}

// 銷售狀態
export interface SalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

// 儀表板狀態
export interface DashboardState {
  data: {
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
  } | null;
  loading: boolean;
  error: string | null;
}

// 報表狀態
export interface ReportsState {
  data: any; // 報表數據結構可能會根據報表類型而變化
  loading: boolean;
  error: string | null;
}

// 進貨單狀態
export interface PurchaseOrdersState {
  purchaseOrders: PurchaseOrder[];
  currentPurchaseOrder: PurchaseOrder | null;
  loading: boolean;
  error: string | null;
}

// 出貨單狀態
export interface ShippingOrdersState {
  shippingOrders: ShippingOrder[];
  currentShippingOrder: ShippingOrder | null;
  loading: boolean;
  error: string | null;
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
 * Action 型別定義
 */
interface Action<T, P = undefined> {
  type: T;
  payload?: P;
}

// 認證相關 Action
export type LoginRequestAction = Action<ActionType.LOGIN_REQUEST>;
export type LoginSuccessAction = Action<ActionType.LOGIN_SUCCESS, { token: string; user: { id: string; username: string; email?: string; role: string; permissions?: string[] } }>;
export type LoginFailureAction = Action<ActionType.LOGIN_FAILURE, string>;
export type LogoutAction = Action<ActionType.LOGOUT>;

// 藥品相關 Action
export type FetchProductsRequestAction = Action<ActionType.FETCH_PRODUCTS_REQUEST>;
export type FetchProductsSuccessAction = Action<ActionType.FETCH_PRODUCTS_SUCCESS, Product[]>;
export type FetchProductsFailureAction = Action<ActionType.FETCH_PRODUCTS_FAILURE, string>;
export type AddProductRequestAction = Action<ActionType.ADD_PRODUCT_REQUEST>;
export type AddProductSuccessAction = Action<ActionType.ADD_PRODUCT_SUCCESS, Product>;
export type AddProductFailureAction = Action<ActionType.ADD_PRODUCT_FAILURE, string>;
export type UpdateProductRequestAction = Action<ActionType.UPDATE_PRODUCT_REQUEST>;
export type UpdateProductSuccessAction = Action<ActionType.UPDATE_PRODUCT_SUCCESS, Product>;
export type UpdateProductFailureAction = Action<ActionType.UPDATE_PRODUCT_FAILURE, string>;
export type DeleteProductRequestAction = Action<ActionType.DELETE_PRODUCT_REQUEST>;
export type DeleteProductSuccessAction = Action<ActionType.DELETE_PRODUCT_SUCCESS, string>;
export type DeleteProductFailureAction = Action<ActionType.DELETE_PRODUCT_FAILURE, string>;

// 供應商相關 Action
export type FetchSuppliersRequestAction = Action<ActionType.FETCH_SUPPLIERS_REQUEST>;
export type FetchSuppliersSuccessAction = Action<ActionType.FETCH_SUPPLIERS_SUCCESS, Supplier[]>;
export type FetchSuppliersFailureAction = Action<ActionType.FETCH_SUPPLIERS_FAILURE, string>;

// 會員相關 Action
export type FetchCustomersRequestAction = Action<ActionType.FETCH_CUSTOMERS_REQUEST>;
export type FetchCustomersSuccessAction = Action<ActionType.FETCH_CUSTOMERS_SUCCESS, Customer[]>;
export type FetchCustomersFailureAction = Action<ActionType.FETCH_CUSTOMERS_FAILURE, string>;

// 庫存相關 Action
export type FetchInventoryRequestAction = Action<ActionType.FETCH_INVENTORY_REQUEST>;
export type FetchInventorySuccessAction = Action<ActionType.FETCH_INVENTORY_SUCCESS, Inventory[]>;
export type FetchInventoryFailureAction = Action<ActionType.FETCH_INVENTORY_FAILURE, string>;

// 銷售相關 Action
export type FetchSalesRequestAction = Action<ActionType.FETCH_SALES_REQUEST>;
export type FetchSalesSuccessAction = Action<ActionType.FETCH_SALES_SUCCESS, Sale[]>;
export type FetchSalesFailureAction = Action<ActionType.FETCH_SALES_FAILURE, string>;

// 儀表板相關 Action
export type FetchDashboardDataRequestAction = Action<ActionType.FETCH_DASHBOARD_DATA_REQUEST>;
export type FetchDashboardDataSuccessAction = Action<ActionType.FETCH_DASHBOARD_DATA_SUCCESS, any>;
export type FetchDashboardDataFailureAction = Action<ActionType.FETCH_DASHBOARD_DATA_FAILURE, string>;

// 報表相關 Action
export type FetchReportsDataRequestAction = Action<ActionType.FETCH_REPORTS_DATA_REQUEST>;
export type FetchReportsDataSuccessAction = Action<ActionType.FETCH_REPORTS_DATA_SUCCESS, any>;
export type FetchReportsDataFailureAction = Action<ActionType.FETCH_REPORTS_DATA_FAILURE, string>;

// 進貨單相關 Action
export type FetchPurchaseOrdersRequestAction = Action<ActionType.FETCH_PURCHASE_ORDERS_REQUEST>;
export type FetchPurchaseOrdersSuccessAction = Action<ActionType.FETCH_PURCHASE_ORDERS_SUCCESS, PurchaseOrder[]>;
export type FetchPurchaseOrdersFailureAction = Action<ActionType.FETCH_PURCHASE_ORDERS_FAILURE, string>;
export type FetchPurchaseOrderRequestAction = Action<ActionType.FETCH_PURCHASE_ORDER_REQUEST>;
export type FetchPurchaseOrderSuccessAction = Action<ActionType.FETCH_PURCHASE_ORDER_SUCCESS, PurchaseOrder>;
export type FetchPurchaseOrderFailureAction = Action<ActionType.FETCH_PURCHASE_ORDER_FAILURE, string>;
export type AddPurchaseOrderRequestAction = Action<ActionType.ADD_PURCHASE_ORDER_REQUEST>;
export type AddPurchaseOrderSuccessAction = Action<ActionType.ADD_PURCHASE_ORDER_SUCCESS, PurchaseOrder>;
export type AddPurchaseOrderFailureAction = Action<ActionType.ADD_PURCHASE_ORDER_FAILURE, string>;
export type UpdatePurchaseOrderRequestAction = Action<ActionType.UPDATE_PURCHASE_ORDER_REQUEST>;
export type UpdatePurchaseOrderSuccessAction = Action<ActionType.UPDATE_PURCHASE_ORDER_SUCCESS, PurchaseOrder>;
export type UpdatePurchaseOrderFailureAction = Action<ActionType.UPDATE_PURCHASE_ORDER_FAILURE, string>;
export type DeletePurchaseOrderRequestAction = Action<ActionType.DELETE_PURCHASE_ORDER_REQUEST>;
export type DeletePurchaseOrderSuccessAction = Action<ActionType.DELETE_PURCHASE_ORDER_SUCCESS, string>;
export type DeletePurchaseOrderFailureAction = Action<ActionType.DELETE_PURCHASE_ORDER_FAILURE, string>;
export type SearchPurchaseOrdersRequestAction = Action<ActionType.SEARCH_PURCHASE_ORDERS_REQUEST>;
export type SearchPurchaseOrdersSuccessAction = Action<ActionType.SEARCH_PURCHASE_ORDERS_SUCCESS, PurchaseOrder[]>;
export type SearchPurchaseOrdersFailureAction = Action<ActionType.SEARCH_PURCHASE_ORDERS_FAILURE, string>;

// 出貨單相關 Action
export type FetchShippingOrdersRequestAction = Action<ActionType.FETCH_SHIPPING_ORDERS_REQUEST>;
export type FetchShippingOrdersSuccessAction = Action<ActionType.FETCH_SHIPPING_ORDERS_SUCCESS, ShippingOrder[]>;
export type FetchShippingOrdersFailureAction = Action<ActionType.FETCH_SHIPPING_ORDERS_FAILURE, string>;
export type FetchShippingOrderRequestAction = Action<ActionType.FETCH_SHIPPING_ORDER_REQUEST>;
export type FetchShippingOrderSuccessAction = Action<ActionType.FETCH_SHIPPING_ORDER_SUCCESS, ShippingOrder>;
export type FetchShippingOrderFailureAction = Action<ActionType.FETCH_SHIPPING_ORDER_FAILURE, string>;
export type AddShippingOrderRequestAction = Action<ActionType.ADD_SHIPPING_ORDER_REQUEST>;
export type AddShippingOrderSuccessAction = Action<ActionType.ADD_SHIPPING_ORDER_SUCCESS, ShippingOrder>;
export type AddShippingOrderFailureAction = Action<ActionType.ADD_SHIPPING_ORDER_FAILURE, string>;
export type UpdateShippingOrderRequestAction = Action<ActionType.UPDATE_SHIPPING_ORDER_REQUEST>;
export type UpdateShippingOrderSuccessAction = Action<ActionType.UPDATE_SHIPPING_ORDER_SUCCESS, ShippingOrder>;
export type UpdateShippingOrderFailureAction = Action<ActionType.UPDATE_SHIPPING_ORDER_FAILURE, string>;
export type DeleteShippingOrderRequestAction = Action<ActionType.DELETE_SHIPPING_ORDER_REQUEST>;
export type DeleteShippingOrderSuccessAction = Action<ActionType.DELETE_SHIPPING_ORDER_SUCCESS, string>;
export type DeleteShippingOrderFailureAction = Action<ActionType.DELETE_SHIPPING_ORDER_FAILURE, string>;
export type SearchShippingOrdersRequestAction = Action<ActionType.SEARCH_SHIPPING_ORDERS_REQUEST>;
export type SearchShippingOrdersSuccessAction = Action<ActionType.SEARCH_SHIPPING_ORDERS_SUCCESS, ShippingOrder[]>;
export type SearchShippingOrdersFailureAction = Action<ActionType.SEARCH_SHIPPING_ORDERS_FAILURE, string>;

// 所有 Action 的聯合型別
export type AppAction =
  | LoginRequestAction
  | LoginSuccessAction
  | LoginFailureAction
  | LogoutAction
  | FetchProductsRequestAction
  | FetchProductsSuccessAction
  | FetchProductsFailureAction
  | AddProductRequestAction
  | AddProductSuccessAction
  | AddProductFailureAction
  | UpdateProductRequestAction
  | UpdateProductSuccessAction
  | UpdateProductFailureAction
  | DeleteProductRequestAction
  | DeleteProductSuccessAction
  | DeleteProductFailureAction
  | FetchSuppliersRequestAction
  | FetchSuppliersSuccessAction
  | FetchSuppliersFailureAction
  | FetchCustomersRequestAction
  | FetchCustomersSuccessAction
  | FetchCustomersFailureAction
  | FetchInventoryRequestAction
  | FetchInventorySuccessAction
  | FetchInventoryFailureAction
  | FetchSalesRequestAction
  | FetchSalesSuccessAction
  | FetchSalesFailureAction
  | FetchDashboardDataRequestAction
  | FetchDashboardDataSuccessAction
  | FetchDashboardDataFailureAction
  | FetchReportsDataRequestAction
  | FetchReportsDataSuccessAction
  | FetchReportsDataFailureAction
  | FetchPurchaseOrdersRequestAction
  | FetchPurchaseOrdersSuccessAction
  | FetchPurchaseOrdersFailureAction
  | FetchPurchaseOrderRequestAction
  | FetchPurchaseOrderSuccessAction
  | FetchPurchaseOrderFailureAction
  | AddPurchaseOrderRequestAction
  | AddPurchaseOrderSuccessAction
  | AddPurchaseOrderFailureAction
  | UpdatePurchaseOrderRequestAction
  | UpdatePurchaseOrderSuccessAction
  | UpdatePurchaseOrderFailureAction
  | DeletePurchaseOrderRequestAction
  | DeletePurchaseOrderSuccessAction
  | DeletePurchaseOrderFailureAction
  | SearchPurchaseOrdersRequestAction
  | SearchPurchaseOrdersSuccessAction
  | SearchPurchaseOrdersFailureAction
  | FetchShippingOrdersRequestAction
  | FetchShippingOrdersSuccessAction
  | FetchShippingOrdersFailureAction
  | FetchShippingOrderRequestAction
  | FetchShippingOrderSuccessAction
  | FetchShippingOrderFailureAction
  | AddShippingOrderRequestAction
  | AddShippingOrderSuccessAction
  | AddShippingOrderFailureAction
  | UpdateShippingOrderRequestAction
  | UpdateShippingOrderSuccessAction
  | UpdateShippingOrderFailureAction
  | DeleteShippingOrderRequestAction
  | DeleteShippingOrderSuccessAction
  | DeleteShippingOrderFailureAction
  | SearchShippingOrdersRequestAction
  | SearchShippingOrdersSuccessAction
  | SearchShippingOrdersFailureAction;

/**
 * Redux Thunk 型別
 */
export type AppThunk<ReturnType = void> = (
  dispatch: (action: AppAction) => void,
  getState: () => RootState
) => ReturnType;