import React from 'react';
import { 
  render, 
  screen
  // 移除未使用的 import
  // fireEvent, 
  // waitFor 
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
// 移除未使用的 import
// import axios from 'axios';

import ShippingOrderDetailPage from '../pages/ShippingOrderDetailPage';

// 模擬 axios
jest.mock('axios');

// 模擬 Redux store
const mockStore = configureStore([thunk]);

// 模擬數據
const mockShippingOrder = {
  _id: '1',
  soid: 'SO-001',
  sobill: 'INV-001',
  sobilldate: '2025-04-01',
  socustomer: '測試客戶',
  totalAmount: 1000,
  status: 'pending',
  paymentStatus: '未收',
  notes: '測試備註',
  items: [
    {
      did: 'P001',
      dname: '測試藥品1',
      dquantity: 10,
      dtotalCost: 500,
      product: '1'
    },
    {
      did: 'P002',
      dname: '測試藥品2',
      dquantity: 5,
      dtotalCost: 500,
      product: '2'
    }
  ]
};

// 測試 ShippingOrderDetailPage 組件
describe('ShippingOrderDetailPage Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      shippingOrders: {
        currentShippingOrder: mockShippingOrder,
        loading: false,
        error: null
      }
    });

    // 模擬 dispatch 方法
    store.dispatch = jest.fn();
  });

  test('渲染出貨單詳情', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderDetailPage />
        </BrowserRouter>
      </Provider>
    );

    // 檢查頁面標題
    expect(screen.getByText('出貨單詳情')).toBeInTheDocument();
    
    // 檢查基本信息
    expect(screen.getByText('SO-001')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('測試客戶')).toBeInTheDocument();
    expect(screen.getByText('測試備註')).toBeInTheDocument();
    
    // 檢查藥品項目
    expect(screen.getByText('測試藥品1')).toBeInTheDocument();
    expect(screen.getByText('測試藥品2')).toBeInTheDocument();
    
    // 檢查按鈕
    expect(screen.getByText('返回列表')).toBeInTheDocument();
    expect(screen.getByText('編輯')).toBeInTheDocument();
  });

  test('測試錯誤處理 - 加載錯誤', () => {
    store = mockStore({
      shippingOrders: {
        currentShippingOrder: null,
        loading: false,
        error: '無法加載出貨單'
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderDetailPage />
        </BrowserRouter>
      </Provider>
    );

    // 檢查錯誤信息
    expect(screen.getByText('錯誤')).toBeInTheDocument();
    expect(screen.getByText('無法加載出貨單')).toBeInTheDocument();
  });

  test('測試錯誤處理 - 找不到出貨單', () => {
    store = mockStore({
      shippingOrders: {
        currentShippingOrder: null,
        loading: false,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderDetailPage />
        </BrowserRouter>
      </Provider>
    );

    // 檢查錯誤信息
    expect(screen.getByText('找不到出貨單')).toBeInTheDocument();
  });

  test('測試已取消出貨單的編輯按鈕禁用', () => {
    store = mockStore({
      shippingOrders: {
        currentShippingOrder: {
          ...mockShippingOrder,
          status: 'cancelled'
        },
        loading: false,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderDetailPage />
        </BrowserRouter>
      </Provider>
    );

    // 檢查編輯按鈕是否被禁用
    const editButton = screen.getByText('編輯');
    expect(editButton).toBeDisabled();
  });
});
