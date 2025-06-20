import { createStore, combineReducers, applyMiddleware, compose, Store } from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';

/* 專案內的 reducer 與型別 */
import {
  authReducer,
  productsReducer,
  suppliersReducer,
  customersReducer,
  inventoryReducer,
  salesReducer,
  dashboardReducer,
  reportsReducer,
  purchaseOrdersReducer,
  shippingOrdersReducer,
  RootState,
  Action
} from './reducers';

// 使用 Redux DevTools 擴展（如果可用）
const composeEnhancers =
  (typeof window !== 'undefined' &&
   (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

// 合併所有reducers
const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  suppliers: suppliersReducer,
  customers: customersReducer,
  inventory: inventoryReducer,
  sales: salesReducer,
  dashboard: dashboardReducer,
  reports: reportsReducer,
  purchaseOrders: purchaseOrdersReducer,
  shippingOrders: shippingOrdersReducer
});

// 定義 AppDispatch 類型
export type AppDispatch = ThunkDispatch<RootState, unknown, Action>;

// 定義 store 類型
export type AppStore = Store<RootState> & {
  dispatch: AppDispatch;
};

// 創建Redux store


const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

// 導出 RootState 類型
export type { RootState };

export default store;