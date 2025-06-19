import React, { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import SupplierInfoCard from '../components/suppliers/SupplierInfoCard';
import TwoColumnLayout from '../components/common/TwoColumnLayout.tsx';

// 定義供應商資料介面
interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  [key: string]: any;
}

// 定義路由參數介面
interface SupplierDetailParams {
  id: string;
  [key: string]: string;
}

/**
 * 供應商詳情頁面
 */
const SupplierDetailPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<SupplierDetailParams>();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSupplierData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/suppliers/${id}`);
        setSupplier(response.data as Supplier);
        setLoading(false);
      } catch (err: any) {
        console.error('獲取供應商詳情失敗:', err);
        setError(err.response?.data?.message || '獲取供應商詳情失敗');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchSupplierData();
    }
  }, [id]);
  
  const handleBack = (): void => {
    navigate('/suppliers'); // 導航回供應商列表頁面
  };
  
  const handleEdit = (): void => {
    // 導航到供應商編輯頁面或打開編輯對話框
    navigate('/suppliers', { state: { editSupplierId: id } });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          載入供應商詳情時發生錯誤: {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回供應商列表
        </Button>
      </Box>
    );
  }
  
  if (!supplier) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          找不到供應商
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回供應商列表
        </Button>
      </Box>
    );
  }

  // 左側欄：供應商資訊
  const leftContent = <SupplierInfoCard supplier={supplier} />;

  // 右側欄：相關資訊（例如進貨單）
  const rightContent = (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          相關進貨單 (待實作)
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            此處將顯示與此供應商相關的進貨單列表。
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          供應商詳情
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            返回列表
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()} // 基本列印功能
          >
            列印
          </Button>
        </Box>
      </Box>
      
      <TwoColumnLayout 
        leftContent={leftContent} 
        rightContent={rightContent} 
        leftWidth={4} 
        rightWidth={8} 
      />
    </Box>
  );
};

export default SupplierDetailPage;