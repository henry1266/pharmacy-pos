import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MedicineCsvImportController from '../components/shipping-orders/import/medicine-csv/MedicineCsvImportController';
import * as medicineCsvService from '../services/medicineCsvService';

// Mock the service functions
jest.mock('../services/medicineCsvService', () => ({
  parseMedicineCsvForPreview: jest.fn(),
  importMedicineCsv: jest.fn()
}));

describe('MedicineCsvImportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders import button', () => {
    render(<MedicineCsvImportController />);
    expect(screen.getByText('匯入藥品CSV')).toBeInTheDocument();
    expect(screen.getByText('格式: 日期,健保碼,數量,健保價')).toBeInTheDocument();
  });

  test('opens dialog when button is clicked', () => {
    render(<MedicineCsvImportController />);
    fireEvent.click(screen.getByText('匯入藥品CSV'));
    expect(screen.getByText('藥品CSV導入')).toBeInTheDocument();
  });

  test('shows preview data when file is selected', async () => {
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
    });
  });

  test('shows error when file parsing fails', async () => {
    medicineCsvService.parseMedicineCsvForPreview.mockRejectedValue(new Error('CSV解析錯誤'));
    
    render(<MedicineCsvImportController />);
    fireEvent.click(screen.getByText('匯入藥品CSV'));
    
    const file = new File(['invalid csv'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText('選擇CSV文件');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('CSV解析錯誤')).toBeInTheDocument();
    });
  });

  test('imports data when import button is clicked', async () => {
    medicineCsvService.parseMedicineCsvForPreview.mockResolvedValue([
      { date: '2025-05-20', nhCode: 'A123456789', quantity: 10, nhPrice: 150.5 }
    ]);
    
    medicineCsvService.importMedicineCsv.mockResolvedValue({ success: true });
    
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
    });
  });

  test('shows error when import fails', async () => {
    medicineCsvService.parseMedicineCsvForPreview.mockResolvedValue([
      { date: '2025-05-20', nhCode: 'A123456789', quantity: 10, nhPrice: 150.5 }
    ]);
    
    medicineCsvService.importMedicineCsv.mockRejectedValue(new Error('導入失敗'));
    
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
      expect(screen.getByText('導入失敗')).toBeInTheDocument();
    });
  });
});
