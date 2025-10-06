import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

import axios from 'axios';
import ProductDetailPage from '../pages/ProductDetailPage';

const mockAxios = axios as jest.Mocked<typeof axios>;

const mockGetProductCategories = jest.fn();

jest.mock('../../../services/productCategoryService', () => ({
  __esModule: true,
  getProductCategories: () => mockGetProductCategories(),
}));

jest.mock('../components/ProductDetailCard', () => ({
  __esModule: true,
  default: ({ product }: { product: { id: string; name: string } }) => (
    <div data-testid="product-detail-card">{product?.name}</div>
  ),
}));

jest.mock('../components/FIFOProfitCalculator', () => ({
  __esModule: true,
  default: ({ productId }: { productId: string }) => (
    <div data-testid="fifo-calculator">FIFO:{productId}</div>
  ),
}));

describe('ProductDetailPage UI regression', () => {
  const supplierResponse: ApiSuccess<Array<{ _id: string; name: string }>> = {
    success: true,
    message: 'ok',
    data: [{ _id: 'sup-1', name: '經銷商A' }],
    timestamp: new Date().toISOString(),
  };

  const productResponse: ApiSuccess<{ _id: string; name: string; productType: 'product'; code: string; unit: string }> = {
    success: true,
    message: 'ok',
    data: {
      _id: 'prod-123',
      name: '測試商品',
      productType: 'product',
      code: 'P123',
      unit: '瓶',
    },
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProductCategories.mockResolvedValue([{ _id: 'cat-1', name: '一般用品' }]);
    mockAxios.delete.mockResolvedValue({ data: { success: true } });
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/products/prod-123']}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('loads product detail and opens edit window via HITL path', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: supplierResponse });
    mockAxios.get.mockResolvedValueOnce({ data: productResponse });

    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('product-detail-card')).toHaveTextContent('測試商品');
    });

    expect(mockGetProductCategories).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenNthCalledWith(1, '/api/suppliers');
    expect(mockAxios.get).toHaveBeenNthCalledWith(2, '/api/products/prod-123');

    const editButton = screen.getAllByRole('button').find((button) => button.textContent?.includes('編輯'));
    expect(editButton).toBeDefined();

    if (!editButton) {
      throw new Error('Edit button not found');
    }

    fireEvent.click(editButton);

    expect(openSpy).toHaveBeenCalledWith('/products/edit/prod-123', '_blank');

    openSpy.mockRestore();
  });
});
