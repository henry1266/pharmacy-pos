import { createStore, combineReducers, applyMiddleware, compose, Store } from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { setupListeners } from '@reduxjs/toolkit/query';

// 導入 RTK Query API 和 Slice
import { saleApi } from '../features/sale/api/saleApi';
import saleReducer from '../features/sale/model/saleSlice';

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
  account2Reducer,
  category2Reducer,
  organization2Reducer,
  transactionGroup2Reducer,
  accountingEntry2Reducer,
  accountBalance2Reducer,
  transactionGroupWithEntriesReducer,
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
  shippingOrders: shippingOrdersReducer,
  // 複式記帳系統 reducers
  account2: account2Reducer,
  category2: category2Reducer,
  organization: organization2Reducer,
  transactionGroup2: transactionGroup2Reducer,
  accountingEntry2: accountingEntry2Reducer,
  accountBalance2: accountBalance2Reducer,
  // 內嵌分錄交易群組 reducer
  transactionGroupWithEntries: transactionGroupWithEntriesReducer,
  // 添加 RTK Query API 和 Slice
  [saleApi.reducerPath]: saleApi.reducer,
  sale: saleReducer
});

// 定義 AppDispatch 類型
export type AppDispatch = ThunkDispatch<RootState, unknown, Action>;

// 定義 store 類型
export type AppStore = Store<RootState> & {
  dispatch: AppDispatch;
};

// 創建Redux store


// 創建 Redux store
// 使用類型斷言來解決類型兼容性問題
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk, saleApi.middleware as any))
);

// 啟用 RTK Query 的 refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// 導出 RootState 類型
export type { RootState };

export default store;