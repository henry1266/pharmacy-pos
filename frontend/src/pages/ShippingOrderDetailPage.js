import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { fetchShippingOrder } from '../redux/actions';
import StatusChip from '../components/shipping-orders/common/StatusChip';
import PaymentStatusChip from '../components/shipping-orders/common/PaymentStatusChip';
import { getApiBaseUrl } from '../utils/apiConfig';

/**
 * 出貨單詳情頁面
 * @returns {React.ReactElement} 出貨單詳情頁面
 */
const ShippingOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const API_BASE_URL = getApiBaseUrl();
  
  const { currentShippingOrder, loading, error } = useSelector(state => state.shippingOrders);
  const [productDetails, setProductDetails] = useState({});
  
  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);
  
  // 當currentShippingOrder更新時，獲取完整的產品資料
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (currentShippingOrder && currentShippingOrder.items && currentShippingOrder.items.length > 0) {
        const details = {};
        
        // 為每個產品獲取詳細資料
        for (const item of currentShippingOrder.items) {
          if (item.did) {
            try {
              const response = await axios.get(`${API_BASE_URL}/products/code/${item.did}`);
              if (response.data) {
                details[item.did] = response.data;
              }
            } catch (error) {
              console.error(`獲取產品詳情失敗: ${item.did}`, error);
            }
          }
        }
        
        setProductDetails(details);
      }
    };
    
    fetchProductDetails();
  }, [currentShippingOrder, API_BASE_URL]);
  
  const handleBack = () => {
    navigate('/shipping-orders');
  };
  
  const handleEdit = () => {
    navigate(`/shipping-orders/edit/${id}`);
  };
  
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          載入中...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          錯誤
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Box>
    );
  }
  
  if (!currentShippingOrder) {
    return (
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          找不到出貨單
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          出貨單詳情
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
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            disabled={currentShippingOrder.status === 'cancelled'}
          >
            編輯
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            基本資訊
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                出貨單號
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.soid}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                客戶
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.sosupplier}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                狀態
              </Typography>
              <StatusChip status={currentShippingOrder.status} />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                付款狀態
              </Typography>
              <PaymentStatusChip status={currentShippingOrder.paymentStatus} />
            </Grid>
            
            {currentShippingOrder.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  備註
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                  <Typography variant="body2">
                    {currentShippingOrder.notes}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            藥品項目
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="15%">藥品代碼</TableCell>
                  <TableCell width="15%">健保代碼</TableCell>
                  <TableCell width="30%">藥品名稱</TableCell>
                  <TableCell width="10%" align="right">數量</TableCell>
                  <TableCell width="10%" align="right">單價</TableCell>
                  <TableCell width="15%" align="right">總金額</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentShippingOrder.items && currentShippingOrder.items.length > 0 ? (
                  currentShippingOrder.items.map((item, index) => {
                    // 從productDetails中獲取健保代碼
                    const productDetail = productDetails[item.did] || {};
                    const healthInsuranceCode = productDetail.healthInsuranceCode || '-';
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.did}</TableCell>
                        <TableCell>{healthInsuranceCode}</TableCell>
                        <TableCell>{item.dname}</TableCell>
                        <TableCell align="right">{item.dquantity}</TableCell>
                        <TableCell align="right">
                          {item.dquantity > 0 
                            ? (item.dtotalCost / item.dquantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0.00'
                          }
                        </TableCell>
                        <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      無藥品項目
                    </TableCell>
                  </TableRow>
                )}
                
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                    總金額
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {Number(currentShippingOrder.totalAmount).toLocaleString()} 元
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ShippingOrderDetailPage;
