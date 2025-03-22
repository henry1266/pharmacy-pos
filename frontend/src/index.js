import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';
import AppRouter from './AppRouter';
import axios from 'axios';
import './index.css';

// 檢查本地存儲中是否有令牌
const token = localStorage.getItem('token');

// 如果有令牌，則設置到axios的默認請求頭中
if (token) {
  axios.defaults.headers.common['x-auth-token'] = token;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AppRouter />
    </Provider>
  </React.StrictMode>
);
