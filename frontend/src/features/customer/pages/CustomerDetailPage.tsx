import React, { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

// Import Hook
import useCustomerDetailData from '../hooks/useCustomerDetailData';

// Import Presentation Components
import CustomerInfoCard from '../components/CustomerInfoCard';
import TwoColumnLayout from '../../../components/common/TwoColumnLayout';

// 定義路由參數介面
interface CustomerDetailParams {
  id: string;
  [key: string]: string;
}

/**
 * 客戶詳情頁面
 * 使用 useCustomerDetailData hook 進行資料獲取和狀態管理
 */
const CustomerDetailPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<CustomerDetailParams>();

  // 使用自定義 hook 進行資料和狀態管理
  const { customer, loading, error } = useCustomerDetailData(id ?? '');

  // 事件處理函數
  const handleBack = (): void => {
    navigate('/customers'); // 導航回客戶列表頁面
  };

  const handleEdit = (): void => {
    // 導航到客戶編輯頁面或打開編輯對話框
    navigate('/customers', { state: { editCustomerId: id } });
  };

  // 渲染邏輯

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
          載入客戶詳情時發生錯誤: {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回客戶列表
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          找不到客戶
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回客戶列表
        </Button>
      </Box>
    );
  }

  // 左側欄：客戶資訊
  const leftContent = <CustomerInfoCard customer={customer} />;

  // 右側欄：相關資訊（例如出貨單）
  const rightContent = (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          相關出貨單 (待實作)
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            此處將顯示與此客戶相關的出貨單列表。
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          客戶詳情
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

export default CustomerDetailPage;