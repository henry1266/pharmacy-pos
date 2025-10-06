import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductEditPage from '../pages/ProductEditPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseProductData = jest.fn();
const mockGetAllSuppliers = jest.fn();
const mockGetProductCategories = jest.fn();
const mockGetProductById = jest.fn();

jest.mock('../../../hooks/useProductData', () => ({
  __esModule: true,
  default: () => mockUseProductData(),
}));

jest.mock('../../../services/supplierServiceV2', () => ({
  __esModule: true,
  getAllSuppliers: () => mockGetAllSuppliers(),
}));

jest.mock('../../../services/productCategoryService', () => ({
  __esModule: true,
  getProductCategories: () => mockGetProductCategories(),
}));

jest.mock('../../../services/productServiceV2', () => ({
  __esModule: true,
  getProductById: (id: string) => mockGetProductById(id),
}));

jest.mock('../../../components/package-units', () => ({
  __esModule: true,
  PackageUnitsConfig: () => <div data-testid="package-units-config" />,
}));

jest.mock('../components/ProductNoteEditorV2', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (next: string) => void }) => (
    <textarea
      data-testid="product-note-editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe('ProductEditPage UI regression', () => {
  const renderRoute = (initialEntry: string) =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/products/edit/:id" element={<ProductEditPage />} />
        </Routes>
      </MemoryRouter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseProductData.mockReturnValue({
      handleSaveProduct: jest.fn(),
    });
    mockGetAllSuppliers.mockResolvedValue([
      { _id: 'sup-1', name: '供應商A' },
    ]);
    mockGetProductCategories.mockResolvedValue([
      { _id: 'cat-1', name: '分類A' },
    ]);
    mockGetProductById.mockResolvedValue(null);
  });

  const waitForInput = async (selector: string): Promise<HTMLInputElement> => {
    await waitFor(() => {
      expect(document.querySelector(selector)).not.toBeNull();
    });
    return document.querySelector(selector) as HTMLInputElement;
  };

  const fillRequiredFields = async () => {
    const nameInput = await waitForInput('input[name="name"]');
    const unitInput = await waitForInput('input[name="unit"]');

    fireEvent.change(nameInput, { target: { value: 'Test Product' } });
    fireEvent.change(unitInput, { target: { value: '瓶' } });
  };

  const clickSave = () => {
    const saveButton = document.querySelector('button.MuiButton-contained') as HTMLButtonElement | null;
    if (!saveButton) {
      throw new Error('Save button not found');
    }
    fireEvent.click(saveButton);
  };

  it('submits create flow and navigates to detail page', async () => {
    const mockSaveProduct = jest.fn().mockResolvedValue({ id: 'prod-999' });

    mockUseProductData.mockReturnValue({
      handleSaveProduct: mockSaveProduct,
    });

    renderRoute('/products/edit/new');

    await waitFor(() => expect(mockGetAllSuppliers).toHaveBeenCalled());

    await fillRequiredFields();

    clickSave();

    await waitFor(() => expect(mockSaveProduct).toHaveBeenCalled());

    expect(mockSaveProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Product',
        unit: '瓶',
        productType: 'product',
      }),
      false,
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/products/prod-999'));
  });

  it('hydrates update flow and persists edited data', async () => {
    const mockSaveProduct = jest.fn().mockResolvedValue({ id: 'prod-123' });
    mockUseProductData.mockReturnValue({
      handleSaveProduct: mockSaveProduct,
    });

    mockGetProductById.mockResolvedValue({
      _id: 'prod-123',
      name: 'Existing Product',
      unit: '盒',
      code: 'PR-01',
      productType: 'product',
    });

    renderRoute('/products/edit/prod-123');

    await waitFor(() => {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement | null;
      expect(nameInput?.value).toBe('Existing Product');
    });

    const nameInput = await waitForInput('input[name="name"]');
    fireEvent.change(nameInput, { target: { value: 'Existing Product Updated' } });

    clickSave();

    await waitFor(() => expect(mockSaveProduct).toHaveBeenCalled());

    expect(mockSaveProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'prod-123',
        name: 'Existing Product Updated',
        productType: 'product',
      }),
      true,
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/products/prod-123'));
  });
});
