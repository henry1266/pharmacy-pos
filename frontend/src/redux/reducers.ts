import { ActionTypes } from './actionTypes';
import { 
  Product, 
  Supplier, 
  Customer, 
  Inventory, 
  Sale, 
  PurchaseOrder, 
  ShippingOrder 
} from '../types/entities';

/**
 * 認證狀態介面
 */
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * 藥品狀態介面
 */
export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

/**
 * 供應商狀態介面
 */
export interface SuppliersState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

/**
 * 會員狀態介面
 */
export interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

/**
 * 庫存狀態介面
 */
export interface InventoryState {
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
}

/**
 * 銷售狀態介面
 */
export interface SalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

/**
 * 儀表板狀態介面
 */
export interface DashboardState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * 報表狀態介面
 */
export interface ReportsState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * 進貨單狀態介面
 */
export interface PurchaseOrdersState {
  purchaseOrders: PurchaseOrder[];
  currentPurchaseOrder: PurchaseOrder | null;
  loading: boolean;
  error: string | null;
}

/**
 * 出貨單狀態介面
 */
export interface ShippingOrdersState {
  shippingOrders: ShippingOrder[];
  currentShippingOrder: ShippingOrder | null;
  loading: boolean;
  error: string | null;
}

/**
 * Action 介面
 */
export interface Action {
  type: string;
  payload?: any;
}

// 初始認證狀態
const initialAuthState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: localStorage.getItem('token') !== null,
  user: null,
  loading: false,
  error: null
};

// 認證reducer
export const authReducer = (state: AuthState = initialAuthState, action: Action): AuthState => {
  switch (action.type) {
    case ActionTypes.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null
      };
    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case ActionTypes.LOGOUT:
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

// 初始藥品狀態
const initialProductsState: ProductsState = {
  products: [],
  loading: false,
  error: null
};

// 藥品reducer
export const productsReducer = (state: ProductsState = initialProductsState, action: Action): ProductsState => {
  switch (action.type) {
    case ActionTypes.FETCH_PRODUCTS_REQUEST:
    case ActionTypes.ADD_PRODUCT_REQUEST:
    case ActionTypes.UPDATE_PRODUCT_REQUEST:
    case ActionTypes.DELETE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_PRODUCTS_SUCCESS:
      return {
        ...state,
        products: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.ADD_PRODUCT_SUCCESS:
      return {
        ...state,
        products: [...state.products, action.payload],
        loading: false,
        error: null
      };
    case ActionTypes.UPDATE_PRODUCT_SUCCESS:
      return {
        ...state,
        products: state.products.map(product => 
          product._id === action.payload._id ? action.payload : product
        ),
        loading: false,
        error: null
      };
    case ActionTypes.DELETE_PRODUCT_SUCCESS:
      return {
        ...state,
        products: state.products.filter(product => product._id !== action.payload),
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_PRODUCTS_FAILURE:
    case ActionTypes.ADD_PRODUCT_FAILURE:
    case ActionTypes.UPDATE_PRODUCT_FAILURE:
    case ActionTypes.DELETE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 初始供應商狀態
const initialSuppliersState: SuppliersState = {
  suppliers: [],
  loading: false,
  error: null
};

// 供應商reducer
export const suppliersReducer = (state: SuppliersState = initialSuppliersState, action: Action): SuppliersState => {
  switch (action.type) {
    case ActionTypes.FETCH_SUPPLIERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_SUPPLIERS_SUCCESS:
      return {
        ...state,
        suppliers: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_SUPPLIERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 初始會員狀態
const initialCustomersState: CustomersState = {
  customers: [],
  loading: false,
  error: null
};

// 會員reducer
export const customersReducer = (state: CustomersState = initialCustomersState, action: Action): CustomersState => {
  switch (action.type) {
    case ActionTypes.FETCH_CUSTOMERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_CUSTOMERS_SUCCESS:
      return {
        ...state,
        customers: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_CUSTOMERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 初始庫存狀態
const initialInventoryState: InventoryState = {
  inventory: [],
  loading: false,
  error: null
};

// 庫存reducer
export const inventoryReducer = (state: InventoryState = initialInventoryState, action: Action): InventoryState => {
  switch (action.type) {
    case ActionTypes.FETCH_INVENTORY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_INVENTORY_SUCCESS:
      return {
        ...state,
        inventory: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_INVENTORY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 初始銷售狀態
const initialSalesState: SalesState = {
  sales: [],
  loading: false,
  error: null
};

// 銷售reducer
export const salesReducer = (state: SalesState = initialSalesState, action: Action): SalesState => {
  switch (action.type) {
    case ActionTypes.FETCH_SALES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_SALES_SUCCESS:
      return {
        ...state,
        sales: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_SALES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 初始儀表板狀態
const initialDashboardState: DashboardState = {
  data: null,
  loading: false,
  error: null
};

// 儀表板reducer
export const dashboardReducer = (state: DashboardState = initialDashboardState, action: Action): DashboardState => {
  switch (action.type) {
    case ActionTypes.FETCH_DASHBOARD_DATA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_DASHBOARD_DATA_SUCCESS:
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_DASHBOARD_DATA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 初始報表狀態
const initialReportsState: ReportsState = {
  data: null,
  loading: false,
  error: null
};

// 報表reducer
export const reportsReducer = (state: ReportsState = initialReportsState, action: Action): ReportsState => {
  switch (action.type) {
    case ActionTypes.FETCH_REPORTS_DATA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_REPORTS_DATA_SUCCESS:
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_REPORTS_DATA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 進貨單狀態
const initialPurchaseOrdersState: PurchaseOrdersState = {
  purchaseOrders: [],
  currentPurchaseOrder: null,
  loading: false,
  error: null
};

// 進貨單reducer
export const purchaseOrdersReducer = (state: PurchaseOrdersState = initialPurchaseOrdersState, action: Action): PurchaseOrdersState => {
  switch (action.type) {
    case ActionTypes.FETCH_PURCHASE_ORDERS_REQUEST:
    case ActionTypes.FETCH_PURCHASE_ORDER_REQUEST:
    case ActionTypes.ADD_PURCHASE_ORDER_REQUEST:
    case ActionTypes.UPDATE_PURCHASE_ORDER_REQUEST:
    case ActionTypes.DELETE_PURCHASE_ORDER_REQUEST:
    case ActionTypes.SEARCH_PURCHASE_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_PURCHASE_ORDERS_SUCCESS:
    case ActionTypes.SEARCH_PURCHASE_ORDERS_SUCCESS:
      return {
        ...state,
        purchaseOrders: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_PURCHASE_ORDER_SUCCESS:
      return {
        ...state,
        currentPurchaseOrder: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.ADD_PURCHASE_ORDER_SUCCESS:
      return {
        ...state,
        purchaseOrders: [...state.purchaseOrders, action.payload],
        loading: false,
        error: null
      };
    case ActionTypes.UPDATE_PURCHASE_ORDER_SUCCESS:
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.map(po => 
          po._id === action.payload._id ? action.payload : po
        ),
        currentPurchaseOrder: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.DELETE_PURCHASE_ORDER_SUCCESS:
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.filter(po => po._id !== action.payload),
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_PURCHASE_ORDERS_FAILURE:
    case ActionTypes.FETCH_PURCHASE_ORDER_FAILURE:
    case ActionTypes.ADD_PURCHASE_ORDER_FAILURE:
    case ActionTypes.UPDATE_PURCHASE_ORDER_FAILURE:
    case ActionTypes.DELETE_PURCHASE_ORDER_FAILURE:
    case ActionTypes.SEARCH_PURCHASE_ORDERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// 出貨單狀態
const initialShippingOrdersState: ShippingOrdersState = {
  shippingOrders: [],
  currentShippingOrder: null,
  loading: false,
  error: null
};

// 出貨單reducer
export const shippingOrdersReducer = (state: ShippingOrdersState = initialShippingOrdersState, action: Action): ShippingOrdersState => {
  switch (action.type) {
    case ActionTypes.FETCH_SHIPPING_ORDERS_REQUEST:
    case ActionTypes.FETCH_SHIPPING_ORDER_REQUEST:
    case ActionTypes.ADD_SHIPPING_ORDER_REQUEST:
    case ActionTypes.UPDATE_SHIPPING_ORDER_REQUEST:
    case ActionTypes.DELETE_SHIPPING_ORDER_REQUEST:
    case ActionTypes.SEARCH_SHIPPING_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ActionTypes.FETCH_SHIPPING_ORDERS_SUCCESS:
    case ActionTypes.SEARCH_SHIPPING_ORDERS_SUCCESS:
      return {
        ...state,
        shippingOrders: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_SHIPPING_ORDER_SUCCESS:
      return {
        ...state,
        currentShippingOrder: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.ADD_SHIPPING_ORDER_SUCCESS:
      return {
        ...state,
        shippingOrders: [...state.shippingOrders, action.payload],
        loading: false,
        error: null
      };
    case ActionTypes.UPDATE_SHIPPING_ORDER_SUCCESS:
      return {
        ...state,
        shippingOrders: state.shippingOrders.map(so => 
          so._id === action.payload._id ? action.payload : so
        ),
        currentShippingOrder: action.payload,
        loading: false,
        error: null
      };
    case ActionTypes.DELETE_SHIPPING_ORDER_SUCCESS:
      return {
        ...state,
        shippingOrders: state.shippingOrders.filter(so => so._id !== action.payload),
        loading: false,
        error: null
      };
    case ActionTypes.FETCH_SHIPPING_ORDERS_FAILURE:
    case ActionTypes.FETCH_SHIPPING_ORDER_FAILURE:
    case ActionTypes.ADD_SHIPPING_ORDER_FAILURE:
    case ActionTypes.UPDATE_SHIPPING_ORDER_FAILURE:
    case ActionTypes.DELETE_SHIPPING_ORDER_FAILURE:
    case ActionTypes.SEARCH_SHIPPING_ORDERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

/**
 * 根狀態介面
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