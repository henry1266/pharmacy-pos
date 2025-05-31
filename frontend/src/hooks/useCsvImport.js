import { useState } from 'react';
import axios from 'axios';

const useCsvImport = (tabValue, fetchProducts) => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);

  // 處理CSV文件選擇
  const handleCsvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  };

  // 處理CSV匯入
  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvImportError('請選擇CSV文件');
      return;
    }

    try {
      setCsvImportLoading(true);
      setCsvImportError(null);
      
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('productType', tabValue === 0 ? 'product' : 'medicine');
      
      const token = localStorage.getItem('token');
      const config = {
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
      setCsvImportError(err.response?.data?.msg ?? '匯入失敗，請檢查CSV格式');
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
