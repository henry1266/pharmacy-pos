import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Link,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// 提取排序邏輯為獨立函數，降低主函數複雜度
const sortFifoData = (data, sortConfig) => {
  if (!data?.length) return [];
  
  let sortableItems = [...data];
  
  if (sortConfig.key) {
    sortableItems.sort((a, b) => {
      // 處理不同類型的排序
      if (sortConfig.key === 'orderNumber') {
        // 提取數字部分進行比較
        const aNum = a.orderNumber?.replace(/\D/g, '') || '';
        const bNum = b.orderNumber?.replace(/\D/g, '') || '';
        
        if (aNum && bNum) {
          const numComparison = parseInt(aNum) - parseInt(bNum);
          if (numComparison !== 0) {
            return sortConfig.direction === 'asc' ? numComparison : -numComparison;
          }
        }
        
        // 如果數字部分相同或無法比較，則按完整貨單號字母順序排序
        if (a.orderNumber && b.orderNumber) {
          const strComparison = a.orderNumber.localeCompare(b.orderNumber);
          return sortConfig.direction === 'asc' ? strComparison : -strComparison;
        }
        
        // 處理一方沒有訂單號的情況
        if (a.orderNumber) return sortConfig.direction === 'asc' ? -1 : 1;
        if (b.orderNumber) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // 都沒有訂單號，按時間排序
        return sortConfig.direction === 'asc' 
          ? new Date(a.saleTime) - new Date(b.saleTime)
          : new Date(b.saleTime) - new Date(a.saleTime);
      }
      
      if (sortConfig.key === 'saleTime') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.saleTime) - new Date(b.saleTime)
          : new Date(b.saleTime) - new Date(a.saleTime);
      }
      
      if (sortConfig.key === 'totalQuantity' || 
          sortConfig.key === 'totalCost' || 
          sortConfig.key === 'totalRevenue' || 
          sortConfig.key === 'grossProfit') {
        return sortConfig.direction === 'asc' 
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      }
      
      if (sortConfig.key === 'profitMargin') {
        const aMargin = parseFloat(a.profitMargin);
        const bMargin = parseFloat(b.profitMargin);
        return sortConfig.direction === 'asc' ? aMargin - bMargin : bMargin - aMargin;
      }
      
      // 默認排序
      return 0;
    });
  }
  
  return sortableItems;
};

// 提取排序圖標元件，降低主元件複雜度
const SortIcon = ({ sortConfig, columnKey }) => {
  if (sortConfig.key !== columnKey) {
    return null;
  }
  return sortConfig.direction === 'asc' 
    ? <ArrowUpwardIcon fontSize="small" /> 
    : <ArrowDownwardIcon fontSize="small" />;
};

SortIcon.propTypes = {
  sortConfig: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired
  }).isRequired,
  columnKey: PropTypes.string.isRequired
};

// 提取訂單連結元件，降低主元件複雜度
const OrderLink = ({ orderType, orderId, orderNumber }) => {
  if (!orderNumber) return null;
  
  let to = '#';
  let icon = null;
  
  if (orderType === 'sale') {
    to = `/sales/${orderId}`;
    icon = <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />;
  } else if (orderType === 'shipping') {
    to = `/shipping-orders/${orderId}`;
    icon = <LocalShippingIcon fontSize="small" sx={{ mr: 0.5 }} />;
  } else if (orderType === 'purchase') {
    to = `/purchase-orders/${orderId}`;
    icon = <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />;
  }
  
  return (
    <Link
      component={RouterLink}
      to={to}
      sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
    >
      {icon}
      {orderNumber}
    </Link>
  );
};

OrderLink.propTypes = {
  orderType: PropTypes.string,
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  orderNumber: PropTypes.string
};

// 提取FIFO明細表格元件，降低主元件複雜度
const FifoDetailTable = ({ fifoMatches, saleTime }) => {
  return (
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
        {fifoMatches
          .filter(match => new Date(match.outTime).getTime() === new Date(saleTime).getTime())
          .flatMap(match => {
            // 對costParts進行排序，按照批次號從大到小排序
            const sortedCostParts = [...match.costParts].sort((a, b) => {
              // 提取數字部分進行比較
              const aNum = a.orderNumber?.replace(/\D/g, '') || '';
              const bNum = b.orderNumber?.replace(/\D/g, '') || '';
              
              if (aNum && bNum) {
                // 從大到小排序
                return parseInt(bNum) - parseInt(aNum);
              }
              
              // 如果無法比較數字，則按時間從新到舊排序
              return new Date(b.batchTime) - new Date(a.batchTime);
            });
            
            return sortedCostParts.map((part, partIndex) => {
              // 使用唯一識別符作為key，而不是索引
              const uniqueKey = `${part.batchTime}-${part.orderNumber || ''}-${partIndex}`;
              return (
                <TableRow key={uniqueKey}>
                  <TableCell>
                    {part.orderNumber ? (
                      <OrderLink 
                        orderType={part.orderType}
                        orderId={part.orderId}
                        orderNumber={part.orderNumber}
                      />
                    ) : (
                      new Date(part.batchTime).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell align="right">{part.quantity}</TableCell>
                  <TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
                  <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
                </TableRow>
              );
            });
          })
        }
      </TableBody>
    </Table>
  );
};

FifoDetailTable.propTypes = {
  fifoMatches: PropTypes.array.isRequired,
  saleTime: PropTypes.string.isRequired
};

const FIFOProfitCalculator = ({ productId }) => {
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: 'orderNumber',
    direction: 'desc'
  });
  
  // 切換展開/收起狀態
  const toggleRowExpand = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // 處理排序
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // 使用提取的排序函數處理數據
  const sortedData = React.useMemo(() => {
    if (!fifoData?.profitMargins) return [];
    return sortFifoData(fifoData.profitMargins, sortConfig);
  }, [fifoData, sortConfig]);

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
  
  if (!fifoData?.success) {
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

  // 提取巢狀三元運算式為獨立變數
  const renderOrderCell = (item) => {
    if (item.orderNumber) {
      return (
        <OrderLink 
          orderType={item.orderType}
          orderId={item.orderId}
          orderNumber={item.orderNumber}
        />
      );
    } else {
      return new Date(item.saleTime).toLocaleDateString();
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        FIFO毛利計算
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
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

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  '&:hover': { backgroundColor: '#e0e0e0' } 
                }}
                onClick={() => requestSort('orderNumber')}
              >
                <Tooltip title="點擊排序" arrow>
                  <Box>
                    <span>單號</span>
                    <SortIcon sortConfig={sortConfig} columnKey="orderNumber" />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  '&:hover': { backgroundColor: '#e0e0e0' } 
                }}
                onClick={() => requestSort('totalQuantity')}
              >
                <Tooltip title="點擊排序" arrow>
                  <Box>
                    <span>數量</span>
                    <SortIcon sortConfig={sortConfig} columnKey="totalQuantity" />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  '&:hover': { backgroundColor: '#e0e0e0' } 
                }}
              >
                <span>單價</span>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  '&:hover': { backgroundColor: '#e0e0e0' } 
                }}
                onClick={() => requestSort('totalRevenue')}
              >
                <Tooltip title="點擊排序" arrow>
                  <Box>
                    <span>收入</span>
                    <SortIcon sortConfig={sortConfig} columnKey="totalRevenue" />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    '&:hover': { backgroundColor: '#e0e0e0' } 
                }}
                onClick={() => requestSort('totalCost')}
              >
                <Tooltip title="點擊排序" arrow>
                  <Box>
                    <span>成本</span>
                    <SortIcon sortConfig={sortConfig} columnKey="totalCost" />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell 
                sx={{ fontWeight: 'bold',cursor: 'pointer','&:hover': { backgroundColor: '#e0e0e0' }}}
                onClick={() => requestSort('grossProfit')}
              >
                <Tooltip title="點擊排序" arrow>
                  <Box>
                    <span>毛利</span>
                    <SortIcon sortConfig={sortConfig} columnKey="grossProfit" />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#e0e0e0' }
                }}
                onClick={() => requestSort('profitMargin')}
              >
                <Tooltip title="點擊排序" arrow>
                  <Box>
                    <span>毛利率</span>
                    <SortIcon sortConfig={sortConfig} columnKey="profitMargin" />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>明細</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item, index) => {
              // 使用唯一識別符作為key，而不是索引
              const uniqueKey = `${item.orderNumber || ''}-${item.saleTime}-${index}`;
              return (
                <React.Fragment key={uniqueKey}>
                  <TableRow 
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                      '&:hover': { backgroundColor: '#f1f1f1' }
                    }}
                  >
                    <TableCell>
                      {renderOrderCell(item)}
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
                        title={expandedRows[index] ? "收起明細" : "展開明細"}
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
                            成本分佈明細
                          </Typography>
                          <FifoDetailTable 
                            fifoMatches={fifoData.fifoMatches}
                            saleTime={item.saleTime}
                          />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

FIFOProfitCalculator.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default FIFOProfitCalculator;
