import { useState, ChangeEvent } from 'react';
import axios from 'axios';

interface CsvImportHook {
  csvFile: File | null;
  csvImportLoading: boolean;
  csvImportError: string | null;
  csvImportSuccess: boolean;
  handleCsvFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleCsvImport: () => Promise<boolean>;
  resetCsvImport: () => void;
}

interface ErrorResponse {
  msg?: string;
}

interface RequestConfig {
  headers: {
    [key: string]: string | undefined;
  };
}

/**
 * CSV 導入功能的自定義 Hook
 * @param tabValue - 標籤值，用於確定產品類型 (0: 一般產品, 1: 藥品)
 * @param fetchProducts - 用於更新產品列表的回調函數
 */
const useCsvImport = (tabValue: number, fetchProducts: () => void): CsvImportHook => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportLoading, setCsvImportLoading] = useState<boolean>(false);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState<boolean>(false);

  // 處理CSV文件選擇
  const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  };

  // 處理CSV匯入
  const handleCsvImport = async (): Promise<boolean> => {
    if (!csvFile) {
      setCsvImportError('請選擇CSV文件');
      return false;
    }

    try {
      setCsvImportLoading(true);
      setCsvImportError(null);
      
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('productType', tabValue === 0 ? 'product' : 'medicine');
      
      const token = localStorage.getItem('token');
      const config: RequestConfig = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      await axios.post('/api/products/import', formData, config);
      
      // 更新產品列表
      fetchProducts();
      
      setCsvImportSuccess(true);
      setCsvImportLoading(false);
      
      // 3秒後重置成功狀態
      setTimeout(() => {
        setCsvImportSuccess(false);
      }, 3000);
      
      return true;
    } catch (err) {
      console.error(err);
      const error = err as any;
      setCsvImportError(error.response?.data?.msg ?? '匯入失敗，請檢查CSV格式');
      setCsvImportLoading(false);
      return false;
    }
  };

  // 重置CSV匯入狀態
  const resetCsvImport = () => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
  };

  return {
    csvFile,
    csvImportLoading,
    csvImportError,
    csvImportSuccess,
    handleCsvFileChange,
    handleCsvImport,
    resetCsvImport
  };
};

export default useCsvImport;