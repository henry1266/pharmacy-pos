import { ActionTypes } from './actionTypes';

// 初始認證狀態
const initialAuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: localStorage.getItem('token') !== null,
  user: null,
  loading: false,
  error: null
};

// 認證reducer
export const authReducer = (state = initialAuthState, action) => {
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
const initialProductsState = {
  products: [],
  loading: false,
  error: null
};

// 藥品reducer
export const productsReducer = (state = initialProductsState, action) => {
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
const initialSuppliersState = {
  suppliers: [],
  loading: false,
  error: null
};

// 供應商reducer
export const suppliersReducer = (state = initialSuppliersState, action) => {
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
const initialCustomersState = {
  customers: [],
  loading: false,
  error: null
};

// 會員reducer
export const customersReducer = (state = initialCustomersState, action) => {
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
const initialInventoryState = {
  inventory: [],
  loading: false,
  error: null
};

// 庫存reducer
export const inventoryReducer = (state = initialInventoryState, action) => {
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
const initialSalesState = {
  sales: [],
  loading: false,
  error: null
};

// 銷售reducer
export const salesReducer = (state = initialSalesState, action) => {
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
const initialDashboardState = {
  data: null,
  loading: false,
  error: null
};

// 儀表板reducer
export const dashboardReducer = (state = initialDashboardState, action) => {
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
const initialReportsState = {
  data: null,
  loading: false,
  error: null
};

// 報表reducer
export const reportsReducer = (state = initialReportsState, action) => {
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
const initialPurchaseOrdersState = {
  purchaseOrders: [],
  currentPurchaseOrder: null,
  loading: false,
  error: null
};

// 進貨單reducer
export const purchaseOrdersReducer = (state = initialPurchaseOrdersState, action) => {
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
const initialShippingOrdersState = {
  shippingOrders: [],
  currentShippingOrder: null,
  loading: false,
  error: null
};

// 出貨單reducer
export const shippingOrdersReducer = (state = initialShippingOrdersState, action) => {
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
