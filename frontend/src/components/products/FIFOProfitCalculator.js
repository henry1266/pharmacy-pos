import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Collapse,
  Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const FIFOProfitCalculator = ({ productId }) => {
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  
  // 切換展開/收起狀態
  const toggleRowExpand = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    const fetchFIFOData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/fifo/product/${productId}`);
        setFifoData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('獲取FIFO數據失敗:', err);
        setError(err.response?.data?.message || '獲取FIFO數據失敗');
        setLoading(false);
      }
    };

    if (productId) {
      fetchFIFOData();
    }
  }, [productId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (!fifoData || !fifoData.success) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          {fifoData?.error || '無法計算FIFO數據'}
        </Typography>
      </Box>
    );
  }

  if (fifoData.profitMargins.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">無銷售記錄，無法計算毛利</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        FIFO毛利計算
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            毛利摘要
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ mr: 3, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                總成本:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${fifoData.summary.totalCost.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mr: 3, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                總收入:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${fifoData.summary.totalRevenue.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mr: 3, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                總毛利:
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="medium"
                color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
              >
                ${fifoData.summary.totalProfit.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                平均毛利率:
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="medium"
                color={parseFloat(fifoData.summary.averageProfitMargin) >= 0 ? 'success.main' : 'error.main'}
              >
                {fifoData.summary.averageProfitMargin}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" gutterBottom>
        銷售毛利明細
      </Typography>


      <TableContainer component={Paper} sx={{ maxWidth: 1000, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>銷售時間</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>單價</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>收入</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>成本</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>毛利</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>毛利率</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>FIFO明細</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fifoData.profitMargins.map((item, index) => (
              <React.Fragment key={index}>
                <TableRow 
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                    '&:hover': { backgroundColor: '#f1f1f1' }
                  }}
                >
                  <TableCell>
                    {item.orderNumber ? (
                      <Link
                        component={RouterLink}
                        to={
                          item.orderType === 'sale'
                            ? `/sales/${item.orderId}`
                            : item.orderType === 'shipping'
                            ? `/shipping/${item.orderId}`
                            : '#'
                        }
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                      >
                        {item.orderType === 'sale' && <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />}
                        {item.orderType === 'shipping' && <LocalShippingIcon fontSize="small" sx={{ mr: 0.5 }} />}
                        {item.orderNumber}
                      </Link>
                    ) : (
                      new Date(item.saleTime).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell align="right">{item.totalQuantity}</TableCell>
                  <TableCell align="right">
                    ${(item.totalRevenue / item.totalQuantity).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">${item.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell align="right">${item.totalCost.toFixed(2)}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: item.grossProfit >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    ${item.grossProfit.toFixed(2)}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: parseFloat(item.profitMargin) >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {item.profitMargin}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      onClick={() => toggleRowExpand(index)}
                      title={expandedRows[index] ? "收起FIFO明細" : "展開FIFO明細"}
                    >
                      {expandedRows[index] ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                
                {/* FIFO明細展開區域 */}
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={expandedRows[index]} timeout="auto" unmountOnExit>
                      <Box sx={{ maxWidth: 380, marginLeft: 28, backgroundColor: '#f8f9fa', p: 1, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                          FIFO成本分佈明細
                        </Typography>
                        <Table size="small" aria-label="fifo-details">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#e9ecef' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>批次時間</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
							  <TableCell align="right" sx={{ fontWeight: 'bold' }}>單價</TableCell>                              
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>小計</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fifoData.fifoMatches
                              .filter(match => new Date(match.outTime).getTime() === new Date(item.saleTime).getTime())
                              .flatMap(match => 
                                match.costParts.map((part, partIndex) => (
                                  <TableRow key={partIndex}>
                                    <TableCell>
                                      {part.orderNumber ? (
                                        <Link
                                          component={RouterLink}
                                          to={
                                            part.orderType === 'purchase'
                                              ? `/purchase-orders/${part.orderId}`
                                              : '#'
                                          }
                                          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                                        >
                                          {part.orderType === 'purchase' && <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />}
                                          {part.orderNumber}
                                        </Link>
                                      ) : (
                                        new Date(part.batchTime).toLocaleDateString()
                                      )}
                                    </TableCell>
                                    <TableCell align="right">{part.quantity}</TableCell>
									<TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
                                    <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))
                              )
                            }
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FIFOProfitCalculator;
