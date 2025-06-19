import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store.ts';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import App from './App.tsx';
import './index.css';

// 使用 TypeScript 類型定義
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);