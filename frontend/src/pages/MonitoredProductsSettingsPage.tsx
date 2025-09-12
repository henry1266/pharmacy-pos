import React, { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Launch as LaunchIcon,
  Visibility as VisibilityIcon,
  Monitor as MonitorIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

import PageHeaderSection from '../components/common/PageHeaderSection';
import {
  getMonitoredProducts,
  addMonitoredProduct,
  deleteMonitoredProduct,
  MonitoredProduct
} from '../services/monitoredProductService';

// 定義箭頭動畫
const arrowBounce = keyframes`
  0%, 100% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(-15px);
  }
`;

const MonitoredProductsSettingsPage: React.FC = () => {
  const [products, setProducts] = useState<MonitoredProduct[]>([]);
  const [newProductCode, setNewProductCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<MonitoredProduct | null>(null);
  
  // 提示訊息狀態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch monitored products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonitoredProducts();
      setProducts(data);
    } catch (err) {
      setError('獲取監測產品列表失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (): Promise<void> => {
    if (!newProductCode.trim()) {
      setAddError('請輸入產品編號');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await addMonitoredProduct(newProductCode.trim());
      setNewProductCode(''); // Clear input
      fetchProducts(); // Refresh the list
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAddError(error.response?.data?.message ?? '新增失敗，請檢查產品編號是否存在或已在列表中');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProduct = async (id: string): Promise<void> => {
    // Optional: Add confirmation dialog here
    try {
      await deleteMonitoredProduct(id);
      fetchProducts(); // Refresh the list
      if (selectedProduct && selectedProduct._id === id) {
        setSelectedProduct(null);
      }
    } catch (err) {
      setError('刪除失敗'); // Show general error for delete
      console.error(err);
    }
  };

  // 處理搜尋
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  
  // 關閉提示訊息
  const handleCloseSnackbar = (): void => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 過濾產品
  const filteredProducts = products.filter(product => 
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理產品點擊
  const handleProductClick = (product: MonitoredProduct) => {
    setSelectedProduct(product);
  };

  // 渲染產品項目
  const renderProductItem = (product: MonitoredProduct): JSX.Element => {
    return (
      <ListItem
        key={product._id}
        onClick={() => handleProductClick(product)}
        sx={{
          borderRadius: 1,
          mb: 1,
          bgcolor: 'transparent',
          cursor: 'pointer',
          color: 'text.primary',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
            borderColor: 'rgba(0, 0, 0, 0.15)'
          },
          '& .MuiListItemText-primary': {
            color: 'text.primary',
            fontWeight: 500
          },
          '& .MuiListItemText-secondary': {
            color: 'text.secondary'
          }
        }}
        secondaryAction={
          <Box>
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/products/code/${product.productCode}`, '_blank');
              }}
              color="primary"
              size="small"
              title="查看產品詳情"
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProduct(product._id);
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={product.productCode}
                color="primary"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Typography
                variant="body1"
                component="span"
                sx={{ color: '#333', fontWeight: 'medium' }}
              >
                {product.productName}
              </Typography>
            </Box>
          }
          primaryTypographyProps={{
            color: 'text.primary',
            fontWeight: 'medium'
          }}
        />
      </ListItem>
    );
  };
  
  // 渲染產品列表
  const renderProductList = (): JSX.Element => {
    return (
      <List
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 1,
          '& > div:nth-of-type(odd)': {
            bgcolor: 'rgba(150, 150, 150, 0.04)'
          },
          border: 'none',
          boxShadow: 'none'
        }}
      >
        {filteredProducts.map(renderProductItem)}
      </List>
    );
  };

  // 渲染主要內容
  const renderMainContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }
    
    if (!Array.isArray(products) || products.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography align="center">尚無監測產品，請新增產品</Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          點擊產品可查看詳情，點擊刪除按鈕可移除監測產品。
        </Typography>
        {renderProductList()}
      </Box>
    );
  };

  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <TextField
        size="small"
        label="搜尋"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="產品編號或名稱..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        sx={{ minWidth: '250px' }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="新增產品編號"
          variant="outlined"
          size="small"
          value={newProductCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProductCode(e.target.value)}
          error={!!addError}
          helperText={addError}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={adding ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          onClick={handleAddProduct}
          disabled={adding}
        >
          新增
        </Button>
      </Box>
    </Box>
  );

  // 詳情面板
  const detailPanel = selectedProduct ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        <Typography component="div" sx={{ fontWeight: 600 }}>產品詳情</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>產品編號:</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{selectedProduct.productCode}</Typography>
          
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>產品名稱:</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{selectedProduct.productName}</Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              onClick={() => window.open(`/products/code/${selectedProduct.productCode}`, '_blank')}
              variant="contained"
              color="primary"
              size="small"
              sx={{ textTransform: 'none', mr: 1 }}
              startIcon={<VisibilityIcon />}
            >
              查看產品詳情
            </Button>
            <Button
              onClick={() => handleDeleteProduct(selectedProduct._id)}
              variant="outlined"
              color="error"
              size="small"
              sx={{ textTransform: 'none' }}
              startIcon={<DeleteIcon />}
            >
              移除監測
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  ) : (
    <Card
      elevation={2}
      className="product-card"
      sx={{
        borderRadius: '0.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6
        },
        '&:hover .arrow-icon': {
          animation: `${arrowBounce} 0.8s infinite`,
          color: 'primary.dark'
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
        {/* 大型監測圖標 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <MonitorIcon
            color="primary"
            sx={{
              fontSize: '4rem',
              mb: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                color: 'primary.dark'
              }
            }}
          />
        </Box>
        
        {/* 內容區域 */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <ArrowBackIcon
              color="primary"
              className="arrow-icon"
              sx={{
                fontSize: '2rem',
                mr: 1,
                transform: 'translateX(-10px)',
                animation: 'arrowPulse 1.5s infinite',
                transition: 'color 0.3s ease'
              }}
            />
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
              左側列表
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            選擇一個產品查看詳情
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      {/* 頁面標題和操作按鈕 */}
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '首頁',
            path: '/',
            icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: '監測產品管理',
            icon: <MonitorIcon sx={{ fontSize: '1.1rem' }} />
          }
        ]}
        actions={actionButtons}
      />

      {/* 主要內容 */}
      <Grid container spacing={2}>
        {/* 左側：產品列表 */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0} 
            variant="outlined"
            sx={{
              p: { xs: 0, md: 0 },
              mb: { xs: 0, md: 0 },
              height: '74vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {renderMainContent()}
          </Paper>
        </Grid>

        {/* 右側：詳情面板 - 始終顯示 */}
        <Grid item xs={12} md={3}>
          {detailPanel}
        </Grid>
      </Grid>
      
      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonitoredProductsSettingsPage;