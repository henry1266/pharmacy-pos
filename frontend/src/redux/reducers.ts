import { ActionTypes } from './actionTypes';
import { 
  Product, 
  Supplier, 
  Customer, 
  Inventory, 
  Sale, 
  PurchaseOrder, 
  ShippingOrder 
} from '@pharmacy-pos/shared/types/entities';

/**
 * 通用狀態介面
 */


// 為了向後兼容，保持原有的屬性名稱
interface PurchaseOrdersStateCompat {
  data: PurchaseOrder[];
  purchaseOrders: PurchaseOrder[];
  currentPurchaseOrder: PurchaseOrder | null;
  loading: boolean;
  error: string | null;
}

interface ShippingOrdersStateCompat {
  data: ShippingOrder[];
  shippingOrders: ShippingOrder[];
  currentShippingOrder: ShippingOrder | null;
  loading: boolean;
  error: string | null;
}

// 兼容的狀態介面，保持原有屬性名稱
interface SuppliersStateCompat {
  data: Supplier[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

interface CustomersStateCompat {
  data: Customer[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

interface InventoryStateCompat {
  data: Inventory[];
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
}

interface SalesStateCompat {
  data: Sale[];
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

interface ProductsStateCompat {
  data: Product[];
  products: Product[];
  loading: boolean;
  error: string | null;
}

interface DataState {
  data: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

/**
 * 認證狀態介面
 */
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

/**
 * 各模組狀態介面
 */
export interface ProductsState extends ProductsStateCompat {}
export interface SuppliersState extends SuppliersStateCompat {}
export interface CustomersState extends CustomersStateCompat {}
export interface InventoryState extends InventoryStateCompat {}
export interface SalesState extends SalesStateCompat {}
export interface DashboardState extends DataState {}
export interface ReportsState extends DataState {}
export interface PurchaseOrdersState extends PurchaseOrdersStateCompat {}
export interface ShippingOrdersState extends ShippingOrdersStateCompat {}

/**
 * Action 介面
 */
export interface Action {
  type: string;
  payload?: any;
}

/**
 * 重構後的 Redux Reducers
 * 保持向後兼容性，同時減少重複程式碼
 */

/**
 * 兼容的進貨單 reducer 工廠函數
 */
function createPurchaseOrdersReducer(
  initialState: PurchaseOrdersState
) {
  return (state: PurchaseOrdersState = initialState, action: Action): PurchaseOrdersState => {
    switch (action.type) {
      // 請求狀態
      case ActionTypes.FETCH_PURCHASE_ORDERS_REQUEST:
      case ActionTypes.FETCH_PURCHASE_ORDER_REQUEST:
      case ActionTypes.ADD_PURCHASE_ORDER_REQUEST:
      case ActionTypes.UPDATE_PURCHASE_ORDER_REQUEST:
      case ActionTypes.DELETE_PURCHASE_ORDER_REQUEST:
      case ActionTypes.SEARCH_PURCHASE_ORDERS_REQUEST:
        return { ...state, loading: true, error: null };

      // 成功狀態
      case ActionTypes.FETCH_PURCHASE_ORDERS_SUCCESS:
      case ActionTypes.SEARCH_PURCHASE_ORDERS_SUCCESS:
        return { ...state, data: action.payload, purchaseOrders: action.payload, loading: false, error: null };

      case ActionTypes.FETCH_PURCHASE_ORDER_SUCCESS:
        return { ...state, currentPurchaseOrder: action.payload, loading: false, error: null };

      case ActionTypes.ADD_PURCHASE_ORDER_SUCCESS: {
        const newPOs = [...state.data, action.payload];
        return { ...state, data: newPOs, purchaseOrders: newPOs, loading: false, error: null };
      }

      case ActionTypes.UPDATE_PURCHASE_ORDER_SUCCESS: {
        const updatedPOs = state.data.map(po => po._id === action.payload._id ? action.payload : po);
        return {
          ...state,
          data: updatedPOs,
          purchaseOrders: updatedPOs,
          currentPurchaseOrder: action.payload,
          loading: false,
          error: null
        };
      }

      case ActionTypes.DELETE_PURCHASE_ORDER_SUCCESS: {
        const filteredPOs = state.data.filter(po => po._id !== action.payload);
        return {
          ...state,
          data: filteredPOs,
          purchaseOrders: filteredPOs,
          loading: false,
          error: null
        };
      }

      // 失敗狀態
      case ActionTypes.FETCH_PURCHASE_ORDERS_FAILURE:
      case ActionTypes.FETCH_PURCHASE_ORDER_FAILURE:
      case ActionTypes.ADD_PURCHASE_ORDER_FAILURE:
      case ActionTypes.UPDATE_PURCHASE_ORDER_FAILURE:
      case ActionTypes.DELETE_PURCHASE_ORDER_FAILURE:
      case ActionTypes.SEARCH_PURCHASE_ORDERS_FAILURE:
        return { ...state, loading: false, error: action.payload };

      default:
        return state;
    }
  };
}

/**
 * 兼容的出貨單 reducer 工廠函數
 */
function createShippingOrdersReducer(
  initialState: ShippingOrdersState
) {
  return (state: ShippingOrdersState = initialState, action: Action): ShippingOrdersState => {
    switch (action.type) {
      // 請求狀態
      case ActionTypes.FETCH_SHIPPING_ORDERS_REQUEST:
      case ActionTypes.FETCH_SHIPPING_ORDER_REQUEST:
      case ActionTypes.ADD_SHIPPING_ORDER_REQUEST:
      case ActionTypes.UPDATE_SHIPPING_ORDER_REQUEST:
      case ActionTypes.DELETE_SHIPPING_ORDER_REQUEST:
      case ActionTypes.SEARCH_SHIPPING_ORDERS_REQUEST:
        return { ...state, loading: true, error: null };

      // 成功狀態
      case ActionTypes.FETCH_SHIPPING_ORDERS_SUCCESS:
      case ActionTypes.SEARCH_SHIPPING_ORDERS_SUCCESS:
        return { ...state, data: action.payload, shippingOrders: action.payload, loading: false, error: null };

      case ActionTypes.FETCH_SHIPPING_ORDER_SUCCESS:
        return { ...state, currentShippingOrder: action.payload, loading: false, error: null };

      case ActionTypes.ADD_SHIPPING_ORDER_SUCCESS: {
        const newSOs = [...state.data, action.payload];
        return { ...state, data: newSOs, shippingOrders: newSOs, loading: false, error: null };
      }

      case ActionTypes.UPDATE_SHIPPING_ORDER_SUCCESS: {
        const updatedSOs = state.data.map(so => so._id === action.payload._id ? action.payload : so);
        return {
          ...state,
          data: updatedSOs,
          shippingOrders: updatedSOs,
          currentShippingOrder: action.payload,
          loading: false,
          error: null
        };
      }

      case ActionTypes.DELETE_SHIPPING_ORDER_SUCCESS: {
        const filteredSOs = state.data.filter(so => so._id !== action.payload);
        return {
          ...state,
          data: filteredSOs,
          shippingOrders: filteredSOs,
          loading: false,
          error: null
        };
      }

      // 失敗狀態
      case ActionTypes.FETCH_SHIPPING_ORDERS_FAILURE:
      case ActionTypes.FETCH_SHIPPING_ORDER_FAILURE:
      case ActionTypes.ADD_SHIPPING_ORDER_FAILURE:
      case ActionTypes.UPDATE_SHIPPING_ORDER_FAILURE:
      case ActionTypes.DELETE_SHIPPING_ORDER_FAILURE:
      case ActionTypes.SEARCH_SHIPPING_ORDERS_FAILURE:
        return { ...state, loading: false, error: action.payload };

      default:
        return state;
    }
  };
}

// 初始狀態工廠函數

const createInitialPurchaseOrdersState = (): PurchaseOrdersState => ({
  data: [],
  purchaseOrders: [],
  currentPurchaseOrder: null,
  loading: false,
  error: null
});

const createInitialShippingOrdersState = (): ShippingOrdersState => ({
  data: [],
  shippingOrders: [],
  currentShippingOrder: null,
  loading: false,
  error: null
});

const createInitialDataState = (): DataState => ({
  data: null,
  loading: false,
  error: null
});

// 認證 reducer（特殊處理）
const initialAuthState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: localStorage.getItem('token') !== null,
  user: null,
  loading: false,
  error: null
};

export const authReducer = (state: AuthState = initialAuthState, action: Action): AuthState => {
  switch (action.type) {
    case ActionTypes.LOGIN_REQUEST:
      return { ...state, loading: true, error: null };
    
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

// 創建兼容的初始狀態
const createInitialCompatState = <T>(entityName: string): any => ({
  data: [],
  [entityName]: [],
  loading: false,
  error: null
});

// 使用工廠函數創建各模組的 reducer
export const productsReducer = (state: ProductsState = createInitialCompatState<Product>('products'), action: Action): ProductsState => {
  switch (action.type) {
    case ActionTypes.FETCH_PRODUCTS_REQUEST:
    case ActionTypes.ADD_PRODUCT_REQUEST:
    case ActionTypes.UPDATE_PRODUCT_REQUEST:
    case ActionTypes.DELETE_PRODUCT_REQUEST:
      return { ...state, loading: true, error: null };
    
    case ActionTypes.FETCH_PRODUCTS_SUCCESS:
      return { ...state, data: action.payload, products: action.payload, loading: false, error: null };
    
    case ActionTypes.ADD_PRODUCT_SUCCESS: {
      const newProducts = [...state.data, action.payload];
      return { ...state, data: newProducts, products: newProducts, loading: false, error: null };
    }
    
    case ActionTypes.UPDATE_PRODUCT_SUCCESS: {
      const updatedProducts = state.data.map(product =>
        product._id === action.payload._id ? action.payload : product
      );
      return { ...state, data: updatedProducts, products: updatedProducts, loading: false, error: null };
    }
    case ActionTypes.DELETE_PRODUCT_SUCCESS: {
      const filteredProducts = state.data.filter(product => product._id !== action.payload);
      return { ...state, data: filteredProducts, products: filteredProducts, loading: false, error: null };
    }
    
    case ActionTypes.FETCH_PRODUCTS_FAILURE:
    case ActionTypes.ADD_PRODUCT_FAILURE:
    case ActionTypes.UPDATE_PRODUCT_FAILURE:
    case ActionTypes.DELETE_PRODUCT_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export const suppliersReducer = (state: SuppliersState = createInitialCompatState<Supplier>('suppliers'), action: Action): SuppliersState => {
  switch (action.type) {
    case ActionTypes.FETCH_SUPPLIERS_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.FETCH_SUPPLIERS_SUCCESS:
      return { ...state, data: action.payload, suppliers: action.payload, loading: false, error: null };
    case ActionTypes.FETCH_SUPPLIERS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const customersReducer = (state: CustomersState = createInitialCompatState<Customer>('customers'), action: Action): CustomersState => {
  switch (action.type) {
    case ActionTypes.FETCH_CUSTOMERS_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.FETCH_CUSTOMERS_SUCCESS:
      return { ...state, data: action.payload, customers: action.payload, loading: false, error: null };
    case ActionTypes.FETCH_CUSTOMERS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const inventoryReducer = (state: InventoryState = createInitialCompatState<Inventory>('inventory'), action: Action): InventoryState => {
  switch (action.type) {
    case ActionTypes.FETCH_INVENTORY_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.FETCH_INVENTORY_SUCCESS:
      return { ...state, data: action.payload, inventory: action.payload, loading: false, error: null };
    case ActionTypes.FETCH_INVENTORY_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const salesReducer = (state: SalesState = createInitialCompatState<Sale>('sales'), action: Action): SalesState => {
  switch (action.type) {
    case ActionTypes.FETCH_SALES_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.FETCH_SALES_SUCCESS:
      return { ...state, data: action.payload, sales: action.payload, loading: false, error: null };
    case ActionTypes.FETCH_SALES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const dashboardReducer = (state: DashboardState = createInitialDataState(), action: Action): DashboardState => {
  switch (action.type) {
    case ActionTypes.FETCH_DASHBOARD_DATA_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.FETCH_DASHBOARD_DATA_SUCCESS:
      return { ...state, data: action.payload, loading: false, error: null };
    case ActionTypes.FETCH_DASHBOARD_DATA_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const reportsReducer = (state: ReportsState = createInitialDataState(), action: Action): ReportsState => {
  switch (action.type) {
    case ActionTypes.FETCH_REPORTS_DATA_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.FETCH_REPORTS_DATA_SUCCESS:
      return { ...state, data: action.payload, loading: false, error: null };
    case ActionTypes.FETCH_REPORTS_DATA_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const purchaseOrdersReducer = createPurchaseOrdersReducer(
  createInitialPurchaseOrdersState()
);

export const shippingOrdersReducer = createShippingOrdersReducer(
  createInitialShippingOrdersState()
);

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