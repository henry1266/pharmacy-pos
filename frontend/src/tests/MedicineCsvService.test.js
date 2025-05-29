import React from 'react';
// 移除未使用的 import
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { parseMedicineCsvForPreview, importMedicineCsv } from '../services/medicineCsvService';

// 驗證預設供應商資訊是否正確傳遞到API
describe('medicineCsvService', () => {
  // 模擬axios
  let mockAxios;
  let mockFormDataAppend;
  
  beforeEach(() => {
    // 模擬FormData
    mockFormDataAppend = jest.fn();
    global.FormData = jest.fn().mockImplementation(() => ({
      append: mockFormDataAppend
    }));
    
    // 模擬axios.post
    mockAxios = {
      post: jest.fn().mockResolvedValue({ data: { success: true } })
    };
    jest.spyOn(require('axios'), 'default', 'get').mockReturnValue(mockAxios);
    
    // 模擬localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue('mock-token');
  });
  
  test('importMedicineCsv should include default supplier in form data', async () => {
    const file = new File(['test csv content'], 'test.csv', { type: 'text/csv' });
    
    await importMedicineCsv(file);
    
    // 驗證FormData是否包含預設供應商資訊
    expect(mockFormDataAppend).toHaveBeenCalledWith('file', file);
    expect(mockFormDataAppend).toHaveBeenCalledWith('type', 'medicine');
    
    // 驗證預設供應商資訊
    const expectedSupplier = {
      _id: "67f246d4287ee1d681068021",
      code: "SS",
      shortCode: "WRUQ",
      name: "調劑",
      contactPerson: "",
      notes: "扣成本",
      paymentTerms: "",
      phone: "",
      taxId: ""
    };
    
    // 檢查是否將預設供應商資訊正確傳遞
    expect(mockFormDataAppend).toHaveBeenCalledWith(
      'defaultSupplier', 
      JSON.stringify(expectedSupplier)
    );
    
    // 驗證API呼叫
    expect(mockAxios.post).toHaveBeenCalled();
  });
  
  test('parseMedicineCsvForPreview should correctly parse CSV data', async () => {
    const csvContent = 'date,健保碼,數量,健保價\n2025-05-20,A123456789,10,150.5';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    // 模擬FileReader
    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null
    };
    global.FileReader = jest.fn().mockImplementation(() => mockFileReader);
    
    // 啟動解析
    const parsePromise = parseMedicineCsvForPreview(file);
    
    // 模擬FileReader完成讀取
    mockFileReader.onload({ target: { result: csvContent } });
    
    const result = await parsePromise;
    
    // 驗證解析結果
    expect(result).toEqual([
      { date: '2025-05-20', nhCode: 'A123456789', quantity: 10, nhPrice: 150.5 }
    ]);
  });
});
