import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
// 使用內建的compose替代redux-devtools-extension
import { compose } from 'redux';
import { 
  authReducer, 
  productsReducer, 
  suppliersReducer, 
  customersReducer, 
  inventoryReducer, 
  salesReducer, 
  dashboardReducer, 
  reportsReducer 
} from './reducers';

// 合併所有reducers
const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  suppliers: suppliersReducer,
  customers: customersReducer,
  inventory: inventoryReducer,
  sales: salesReducer,
  dashboard: dashboardReducer,
  reports: reportsReducer
});

// 創建Redux store
const store = createStore(
  rootReducer,
  compose(applyMiddleware(thunk))
);

export default store;
