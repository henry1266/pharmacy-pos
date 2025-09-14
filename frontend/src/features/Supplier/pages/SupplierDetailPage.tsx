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
  Print as PrintIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import PageHeaderSection from '@/components/common/PageHeaderSection';
import SupplierInfoCard from '../components/SupplierInfoCard';
import TwoColumnLayout from '@/components/common/TwoColumnLayout';
import { useGetSupplierByIdQuery } from '../api/supplierApi';

interface SupplierDetailParams {
  id: string;
  [key: string]: string;
}

const SupplierDetailPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<SupplierDetailParams>();

  const { data: supplier, isLoading: loading, error: queryError } = useGetSupplierByIdQuery(id as string, { skip: !id });
  const error = queryError ? ((queryError as any).data?.message || (queryError as any).message || '載入供應商詳情失敗') : null;

  const handleBack = (): void => {
    navigate('/suppliers');
  };

  const handleEdit = (): void => {
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
          載入供應商詳情發生錯誤: {String(error)}
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
        <Typography variant="h6">無相關資料</Typography>
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

  const leftContent = <SupplierInfoCard supplier={supplier as any} />;

  const rightContent = (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          關聯進貨單（待實作）
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            此區將顯示該供應商的進貨單彙整
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{
      p: { xs: 1, sm: 1, md: 1.5 },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
      width: '100%',
      flexGrow: 1,
      minHeight: '100%'
    }}>
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '供應商管理',
            path: '/suppliers',
            icon: <StoreIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: (supplier as any)?.name || '供應商詳情',
            icon: null
          }
        ]}
        actions={
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ height: 37, minWidth: 110, borderColor: 'primary.main', color: 'primary.main', mr: 1 }}
            >
              返回列表
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ height: 37, minWidth: 110, mr: 1 }}
            >
              編輯
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ height: 37, minWidth: 110 }}
            >
              列印
            </Button>
          </>
        }
      />

      <TwoColumnLayout leftContent={leftContent} rightContent={rightContent} leftWidth={4} rightWidth={8} />
    </Box>
  );
};

export default SupplierDetailPage;

