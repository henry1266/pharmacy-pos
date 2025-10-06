import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductsPage from '../pages/ProductsPage';

type MockedProduct = {
  id: string;
  _id?: string;
  name: string;
  code: string;
  unit: string;
  productType?: 'product' | 'medicine';
};

const mockUseProductData = jest.fn();
const mockUseInventoryData = jest.fn();
const mockUseCsvImport = jest.fn();

jest.mock('../../../hooks/useProductData', () => ({
  __esModule: true,
  default: () => mockUseProductData(),
}));

jest.mock('../../../hooks/useInventoryData', () => ({
  __esModule: true,
  default: (productId?: string) => mockUseInventoryData(productId),
}));

jest.mock('../../../hooks/useCsvImport', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseCsvImport(...args),
}));

jest.mock('../components/CsvImportDialog', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="product-csv-dialog">CSV Dialog</div> : null),
}));

jest.mock('../components/ProductSearchBar', () => ({
  __esModule: true,
  default: ({ resultCount, totalCount }: { resultCount: number; totalCount: number }) => (
    <div data-testid="product-search-bar">results: {resultCount}/{totalCount}</div>
  ),
}));

jest.mock('../components/ProductDetailCard', () => ({
  __esModule: true,
  default: ({ product }: { product: MockedProduct }) => (
    <div data-testid="product-detail-card">{product?.name}</div>
  ),
}));

jest.mock('../../../components/DataTable', () => ({
  __esModule: true,
  default: ({ rows, onRowClick }: { rows: MockedProduct[]; onRowClick?: (params: { row: MockedProduct }) => void }) => (
    <div role="grid" data-testid="product-data-grid">
      {rows.map((row) => (
        <div key={row.id} role="row">
          <button
            type="button"
            data-testid={`product-row-${row.id}`}
            onClick={() => onRowClick?.({ row })}
          >
            {row.name}
          </button>
        </div>
      ))}
    </div>
  ),
}));

describe('ProductsPage UI regression', () => {
  const sampleProduct: MockedProduct = {
    id: 'prod-1',
    _id: 'prod-1',
    name: '測試商品',
    code: 'P001',
    unit: '瓶',
    productType: 'product',
  };

  beforeEach(() => {
    mockUseProductData.mockReturnValue({
      products: [sampleProduct],
      medicines: [],
      allProducts: [sampleProduct],
      suppliers: [],
      categories: [],
      loading: false,
      error: null,
      fetchProducts: jest.fn(),
      fetchFilteredProducts: jest.fn(),
      handleDeleteProduct: jest.fn(),
      handleSaveProduct: jest.fn(),
    });

    mockUseInventoryData.mockReturnValue({
      getTotalInventory: jest.fn().mockReturnValue(42),
    });

    mockUseCsvImport.mockReturnValue({
      csvFile: null,
      csvImportLoading: false,
      csvImportError: null,
      csvImportSuccess: false,
      handleCsvFileChange: jest.fn(),
      handleCsvImport: jest.fn(),
      resetCsvImport: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Routes>
          <Route path="/products" element={<ProductsPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('displays products from SSOT data and shows detail card on selection', async () => {
    renderPage();

    const rowButton = await waitFor(() => screen.getByTestId('product-row-prod-1'));

    expect(rowButton).toHaveTextContent('測試商品');

    fireEvent.click(rowButton);

    await waitFor(() => {
      expect(screen.getByTestId('product-detail-card')).toHaveTextContent('測試商品');
    });
  });
});
