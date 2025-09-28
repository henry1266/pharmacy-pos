import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// 導入現有的 reducers
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
} from '../../redux/reducers';

// 導入 RTK Query API 和 Slice
import { saleApi } from '../../features/sale/api/saleApi';
import { supplierApi } from '../../features/supplier/api/supplierApi';
import { customerApi } from '../../features/customer/api/customerApi';
import { productApi } from '../../features/product/api/productApi';
import { purchaseOrderApi } from '../../features/purchase-order/api/purchaseOrderApi';
import { shippingOrderApi } from '../../features/shipping-order/api/shippingOrderApi';
import saleReducer from '../../features/sale/model/saleSlice';

/**
 * 配置 Redux store
 * 使用 Redux Toolkit 的 configureStore 函數
 */
export const store = configureStore({
  reducer: {
    // 保留現有的 reducers
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
    account2: account2Reducer,
    category2: category2Reducer,
    organization: organization2Reducer,
    transactionGroup2: transactionGroup2Reducer,
    accountingEntry2: accountingEntry2Reducer,
    accountBalance2: accountBalance2Reducer,
    transactionGroupWithEntries: transactionGroupWithEntriesReducer,
    
    // 添加 RTK Query API 和 Slice
    [saleApi.reducerPath]: saleApi.reducer,
    [supplierApi.reducerPath]: supplierApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [purchaseOrderApi.reducerPath]: purchaseOrderApi.reducer,
    [shippingOrderApi.reducerPath]: shippingOrderApi.reducer,
    sale: saleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略非序列化的值，例如日期對象
        ignoredActions: ['persist/PERSIST'],
      },
    })
    // 添加 RTK Query middleware
    .concat(saleApi.middleware)
    .concat(supplierApi.middleware)
    .concat(customerApi.middleware)
    .concat(productApi.middleware)
    .concat(purchaseOrderApi.middleware)
    .concat(shippingOrderApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// 啟用 RTK Query 的 refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// 導出 RootState 和 AppDispatch 類型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
