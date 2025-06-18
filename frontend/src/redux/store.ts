import { createStore, combineReducers, applyMiddleware, compose, Store } from 'redux';
import thunk from 'redux-thunk';
// 使用內建的compose替代redux-devtools-extension
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
  RootState
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


// 創建Redux store
const store: Store<RootState> = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

export default store;