import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MedicineCsvImportController from '../components/shipping-orders/import/medicine-csv/MedicineCsvImportController';
import * as medicineCsvService from '../services/medicineCsvService';

// Mock the service functions
jest.mock('../services/medicineCsvService', () => ({
  parseMedicineCsvForPreview: jest.fn(),
  importMedicineCsv: jest.fn(),
  generateShippingOrderNumber: jest.fn()
}));

describe('MedicineCsvImportController with Auto Order Number', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders import button with auto-generate message', () => {
    render(<MedicineCsvImportController />);
    expect(screen.getByText('匯入藥品CSV')).toBeInTheDocument();
    expect(screen.getByText('格式: 日期,健保碼,數量,健保價 (自動產生出貨單號)')).toBeInTheDocument();
  });

  test('shows preview data and auto-generate message when file is selected', async () => {
    const mockPreviewData = [
      { date: '2025-05-20', nhCode: 'A123456789', quantity: 10, nhPrice: 150.5 },
      { date: '2025-05-20', nhCode: 'B987654321', quantity: 5, nhPrice: 200.75 }
    ];
    
    medicineCsvService.parseMedicineCsvForPreview.mockResolvedValue(mockPreviewData);
    
    render(<MedicineCsvImportController />);
    fireEvent.click(screen.getByText('匯入藥品CSV'));
    
    const file = new File(['test csv content'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText('選擇CSV文件');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(medicineCsvService.parseMedicineCsvForPreview).toHaveBeenCalledWith(file);
      expect(screen.getByText('數據預覽 (前5筆)')).toBeInTheDocument();
      expect(screen.getByText('A123456789')).toBeInTheDocument();
      expect(screen.getByText('供應商將預設為：調劑 (SS)')).toBeInTheDocument();
      expect(screen.getByText('出貨單號將自動產生')).toBeInTheDocument();
    });
  });

  test('displays order number after successful import', async () => {
    const mockPreviewData = [
      { date: '2025-05-20', nhCode: 'A123456789', quantity: 10, nhPrice: 150.5 }
    ];
    
    medicineCsvService.parseMedicineCsvForPreview.mockResolvedValue(mockPreviewData);
    medicineCsvService.importMedicineCsv.mockResolvedValue({ 
      success: true,
      orderNumber: 'SO-2025-001' 
    });
    
    render(<MedicineCsvImportController />);
    fireEvent.click(screen.getByText('匯入藥品CSV'));
    
    const file = new File(['test csv content'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText('選擇CSV文件');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('導入')).not.toBeDisabled();
    });
    
    fireEvent.click(screen.getByText('導入'));
    
    await waitFor(() => {
      expect(medicineCsvService.importMedicineCsv).toHaveBeenCalledWith(file);
      expect(screen.getByText('藥品CSV導入成功！')).toBeInTheDocument();
      expect(screen.getByText('藥品CSV已成功匯入！出貨單號: SO-2025-001')).toBeInTheDocument();
    });
  });
});
