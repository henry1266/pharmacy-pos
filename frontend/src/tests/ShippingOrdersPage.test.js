import React from 'react';
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor 
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import ShippingOrdersPage from '../pages/ShippingOrdersPage';

// 模擬 Redux store
const mockStore = configureStore([thunk]);

// 模擬數據
const mockShippingOrders = [
  {
    _id: '1',
    soid: 'SO-001',
    sobill: 'INV-001',
    sobilldate: '2025-04-01',
    socustomer: '測試客戶',
    totalAmount: 1000,
    status: 'pending',
    paymentStatus: '未收',
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
  },
  {
    _id: '2',
    soid: 'SO-002',
    sobill: 'INV-002',
    sobilldate: '2025-04-02',
    socustomer: '測試客戶2',
    totalAmount: 2000,
    status: 'completed',
    paymentStatus: '已收款',
    items: [
      {
        did: 'P003',
        dname: '測試藥品3',
        dquantity: 20,
        dtotalCost: 2000,
        product: '3'
      }
    ]
  }
];

const mockCustomers = [
  { _id: '1', name: '測試客戶' },
  { _id: '2', name: '測試客戶2' }
];

// 測試 ShippingOrdersPage 組件
describe('ShippingOrdersPage Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      shippingOrders: {
        shippingOrders: mockShippingOrders,
        loading: false,
        error: null
      },
      customers: {
        customers: mockCustomers,
        loading: false,
        error: null
      }
    });

    // 模擬 dispatch 方法
    store.dispatch = jest.fn();
  });

  test('渲染出貨單列表', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrdersPage />
        </BrowserRouter>
      </Provider>
    );

    // 檢查頁面標題
    expect(screen.getByText('出貨單管理')).toBeInTheDocument();
    
    // 檢查出貨單數據是否顯示
    expect(screen.getByText('SO-001')).toBeInTheDocument();
    expect(screen.getByText('SO-002')).toBeInTheDocument();
    
    // 檢查篩選按鈕
    expect(screen.getByText('顯示篩選')).toBeInTheDocument();
  });

  test('顯示和隱藏篩選區域', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrdersPage />
        </BrowserRouter>
      </Provider>
    );

    // 初始狀態下篩選區域應該是隱藏的
    expect(screen.queryByText('出貨單號')).not.toBeInTheDocument();
    
    // 點擊顯示篩選按鈕
    fireEvent.click(screen.getByText('顯示篩選'));
    
    // 篩選區域應該顯示
    expect(screen.getByText('出貨單號')).toBeInTheDocument();
    expect(screen.getByText('發票號碼')).toBeInTheDocument();
    
    // 點擊隱藏篩選按鈕
    fireEvent.click(screen.getByText('隱藏篩選'));
    
    // 篩選區域應該隱藏
    expect(screen.queryByText('出貨單號')).not.toBeInTheDocument();
  });

  test('點擊新增按鈕應該導航到新增頁面', () => {
    const navigateMock = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => navigateMock
    }));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrdersPage />
        </BrowserRouter>
      </Provider>
    );

    // 找到新增按鈕並點擊
    const addButton = screen.getByLabelText('新增出貨單');
    fireEvent.click(addButton);
    
    // 檢查是否調用了 navigate 函數
    expect(navigateMock).toHaveBeenCalledWith('/shipping-orders/new');
  });
});
