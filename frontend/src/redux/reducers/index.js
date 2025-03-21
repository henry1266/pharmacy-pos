import { combineReducers } from 'redux';
import productReducer from './productReducer';
import supplierReducer from './supplierReducer';
import customerReducer from './customerReducer';
import inventoryReducer from './inventoryReducer';
import salesReducer from './salesReducer';
import authReducer from './authReducer';

export default combineReducers({
  auth: authReducer,
  products: productReducer,
  suppliers: supplierReducer,
  customers: customerReducer,
  inventory: inventoryReducer,
  sales: salesReducer
});
