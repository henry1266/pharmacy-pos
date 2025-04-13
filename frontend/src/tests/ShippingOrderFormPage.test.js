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

import ShippingOrderFormPage from '../pages/ShippingOrderFormPage';

// 模擬 Redux store
const mockStore = configureStore([thunk]);

// 模擬數據
const mockProducts = [
  { _id: '1', code: 'P001', name: '測試藥品1' },
  { _id: '2', code: 'P002', name: '測試藥品2' },
  { _id: '3', code: 'P003', name: '測試藥品3' }
];

const mockCustomers = [
  { _id: '1', name: '測試客戶' },
  { _id: '2', name: '測試客戶2' }
];

const mockInventory = [
  { _id: '1', product: '1', quantity: 100 },
  { _id: '2', product: '2', quantity: 50 },
  { _id: '3', product: '3', quantity: 0 } // 庫存為0，用於測試庫存不足情況
];

// 測試 ShippingOrderFormPage 組件
describe('ShippingOrderFormPage Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      shippingOrders: {
        currentShippingOrder: null,
        loading: false,
        error: null
      },
      customers: {
        customers: mockCustomers,
        loading: false,
        error: null
      },
      products: {
        products: mockProducts,
        loading: false,
        error: null
      },
      inventory: {
        inventory: mockInventory,
        loading: false,
        error: null
      }
    });

    // 模擬 dispatch 方法
    store.dispatch = jest.fn();
  });

  test('渲染新增出貨單表單', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderFormPage />
        </BrowserRouter>
      </Provider>
    );

    // 檢查頁面標題
    expect(screen.getByText('新增出貨單')).toBeInTheDocument();
    
    // 檢查基本信息表單
    expect(screen.getByText('基本資訊')).toBeInTheDocument();
    expect(screen.getByText('藥品項目')).toBeInTheDocument();
    
    // 檢查按鈕
    expect(screen.getByText('創建')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  test('測試庫存檢查功能 - 庫存充足', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderFormPage />
        </BrowserRouter>
      </Provider>
    );

    // 選擇客戶
    const customerInput = screen.getByLabelText('客戶');
    fireEvent.change(customerInput, { target: { value: '測試客戶' } });
    
    // 選擇藥品（庫存充足的藥品）
    const productInput = screen.getByLabelText('藥品');
    fireEvent.change(productInput, { target: { value: '測試藥品1' } });
    
    // 輸入數量（小於庫存）
    const quantityInput = screen.getByLabelText('數量');
    fireEvent.change(quantityInput, { target: { value: '50' } });
    
    // 輸入總金額
    const totalCostInput = screen.getByLabelText('總金額');
    fireEvent.change(totalCostInput, { target: { value: '5000' } });
    
    // 點擊添加按鈕
    const addButton = screen.getByText('添加');
    fireEvent.click(addButton);
    
    // 檢查是否成功添加到表格
    await waitFor(() => {
      expect(screen.getByText('測試藥品1')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('5000 元')).toBeInTheDocument();
    });
    
    // 不應該顯示庫存不足警告
    expect(screen.queryByText('庫存不足')).not.toBeInTheDocument();
  });

  test('測試庫存檢查功能 - 庫存不足', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ShippingOrderFormPage />
        </BrowserRouter>
      </Provider>
    );

    // 選擇客戶
    const customerInput = screen.getByLabelText('客戶');
    fireEvent.change(customerInput, { target: { value: '測試客戶' } });
    
    // 選擇藥品（庫存為0的藥品）
    const productInput = screen.getByLabelText('藥品');
    fireEvent.change(productInput, { target: { value: '測試藥品3' } });
    
    // 輸入數量
    const quantityInput = screen.getByLabelText('數量');
    fireEvent.change(quantityInput, { target: { value: '10' } });
    
    // 輸入總金額
    const totalCostInput = screen.getByLabelText('總金額');
    fireEvent.change(totalCostInput, { target: { value: '1000' } });
    
    // 應該顯示庫存不足警告
    await waitFor(() => {
      expect(screen.getByText('庫存不足')).toBeInTheDocument();
    });
    
    // 添加按鈕應該被禁用
    const addButton = screen.getByText('添加');
    expect(addButton).toBeDisabled();
  });
});
