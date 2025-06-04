import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axios from 'axios';
import SingleProductProfitLossChart from './SingleProductProfitLossChart';

// 計算單筆交易的損益 (Moved to module scope)
const calculateTransactionProfitLoss = (transaction) => {
  if (transaction.type === '進貨') {
    // 進貨為負數
    return -(transaction.quantity * transaction.price);
  } else if (transaction.type === '銷售' || transaction.type === '出貨') {
    // 銷售為正數
    return transaction.quantity * transaction.price;
  }
  return 0;
};

// 展開行組件
const ExpandableRow = ({ item, formatCurrency }) => {
  const [open, setOpen] = useState(false);

  // 根據交易類型獲取對應的單號
  const getOrderNumber = (transaction) => {
    // 記錄交易數據到控制台
    console.log('交易記錄數據:', transaction);
    
    if (transaction.type === '進貨') {
      return transaction.purchaseOrderNumber || '-';
    } else if (transaction.type === '出貨') {
      return transaction.shippingOrderNumber || '-';
    } else if (transaction.type === '銷售') {
      return transaction.saleNumber || '-';  // 使用saleNumber而不是salesOrderNumber
    }
    return '-';
  };

  // 獲取交易類型對應的顏色
  const getTypeColor = (type) => {
    switch (type) {
      case '進貨':
        return 'var(--primary-color)';
      case '出貨':
        return 'var(--warning-color)';
      case '銷售':
        return 'var(--danger-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  // 獲取交易類型對應的背景色
  const getTypeBgColor = (type) => {
    switch (type) {
      case '進貨':
        return 'rgba(98, 75, 255, 0.1)';
      case '出貨':
        return 'rgba(245, 166, 35, 0.1)';
      case '銷售':
        return 'rgba(229, 63, 60, 0.1)';
      default:
        return 'rgba(0, 0, 0, 0.05)';
    }
  };

  // calculateTransactionProfitLoss is now in module scope

  // 按貨單號排序交易記錄（由小到大）
  const sortedTransactions = [...item.transactions].sort((a, b) => {
    const aOrderNumber = getOrderNumber(a);
    const bOrderNumber = getOrderNumber(b);
    return aOrderNumber.localeCompare(bOrderNumber); // 由小到大排序，確保時間順序
  });

  // 計算累積庫存和損益總和
  const calculateCumulativeValues = () => {
    let cumulativeStock = 0;
    let cumulativeProfitLoss = 0;
    
    return sortedTransactions.map(transaction => {
      // 計算庫存變化
      cumulativeStock += transaction.quantity;

      
      // 計算損益變化
      	  if (transaction.type === '進貨') {
        cumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
      } else if (transaction.type === '銷售' || transaction.type === '出貨') {
        cumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
      }
	  
      return {
        ...transaction,
        cumulativeStock,
        cumulativeProfitLoss
      };
    });
  };

  const transactionsWithCumulativeValues = calculateCumulativeValues();

  // 按貨單號排序（由大到小）用於顯示
  const displayTransactions = [...transactionsWithCumulativeValues].sort((a, b) => {
    const aOrderNumber = getOrderNumber(a);
    const bOrderNumber = getOrderNumber(b);
    return bOrderNumber.localeCompare(aOrderNumber); // 由大到小排序，顯示最新的在前面
  });

  return (
    <>
      <TableRow
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          bgcolor: open ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
        }}
      >
        <TableCell>
          <IconButton
            aria-label="展開行"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{item.productCode}</TableCell>
        <TableCell>{item.productName}</TableCell>
        <TableCell>{item.category}</TableCell>
        <TableCell>{item.supplier ? item.supplier.name : '-'}</TableCell>
        <TableCell align="right">{item.totalQuantity}</TableCell>
        <TableCell>{item.unit}</TableCell>
        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
        <TableCell align="right">{formatCurrency(item.totalInventoryValue)}</TableCell>
        <TableCell>
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 500,
              bgcolor: item.status === 'low' ? 'rgba(229, 63, 60, 0.1)' : 'rgba(0, 217, 126, 0.1)',
              color: item.status === 'low' ? 'var(--danger-color)' : 'var(--success-color)',
            }}
          >
            {item.status === 'low' ? '低庫存' : '正常'}
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={13}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div" fontSize="1rem">
                交易記錄
              </Typography>
              <Table size="small" aria-label="交易記錄">
                <TableHead>
                  <TableRow>
                    <TableCell>貨單號</TableCell>
                    <TableCell>類型</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell align="right">庫存</TableCell>
                    <TableCell align="right">損益總和</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayTransactions.map((transaction) => (
                    <TableRow key={`${transaction.type}-${getOrderNumber(transaction)}-${transaction.price}`}>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            color: getTypeColor(transaction.type),
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {getOrderNumber(transaction)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type}
                          size="small"
                          sx={{
                            bgcolor: getTypeBgColor(transaction.type),
                            color: getTypeColor(transaction.type),
                            fontWeight: 400,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: getTypeColor(transaction.type),
                        fontWeight: 400
                      }}>
                        {transaction.quantity}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(transaction.price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {transaction.cumulativeStock}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: transaction.cumulativeProfitLoss >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        {formatCurrency(transaction.cumulativeProfitLoss)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 添加單一品項的盈虧圖表 */}
              <SingleProductProfitLossChart transactions={sortedTransactions} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// 新增 ExpandableRow 的 props validation
ExpandableRow.propTypes = {
  item: PropTypes.shape({
    productCode: PropTypes.string,
    productName: PropTypes.string,
    category: PropTypes.string,
    supplier: PropTypes.shape({
      name: PropTypes.string
    }),
    totalQuantity: PropTypes.number,
    unit: PropTypes.string,
    price: PropTypes.number,
    totalInventoryValue: PropTypes.number,
    status: PropTypes.string,
    transactions: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        quantity: PropTypes.number,
        price: PropTypes.number,
        purchaseOrderNumber: PropTypes.string,
        shippingOrderNumber: PropTypes.string,
        saleNumber: PropTypes.string
      })
    )
  }).isRequired,
  formatCurrency: PropTypes.func.isRequired
};

const InventoryTable = ({ filters }) => {
  // 移除未使用的 inventoryData 變數
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalInventoryQuantity, setTotalInventoryQuantity] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 獲取庫存數據
  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      try {
        // 構建查詢參數
        const params = new URLSearchParams();
        if (filters.supplier) params.append('supplier', filters.supplier);
        if (filters.category) params.append('category', filters.category);
        if (filters.productCode) params.append('productCode', filters.productCode);
        if (filters.productName) params.append('productName', filters.productName);
        if (filters.productType) params.append('productType', filters.productType);
        
        // 添加參數以獲取完整的交易歷史記錄
        params.append('includeTransactionHistory', 'true');
        params.append('useSequentialProfitLoss', 'true');
        
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        
        // 記錄API返回的原始數據到控制台
        console.log('API返回的原始數據:', response.data);
        
        if (response?.data?.data) {
          // 處理數據分組
          processInventoryData(response.data.data);
        }
        setError(null);
      } catch (err) {
        console.error('獲取庫存數據失敗:', err);
        setError('獲取庫存數據失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [filters]);

  // 處理庫存數據分組
  const processInventoryData = (data) => {
    // 記錄處理前的數據到控制台
    console.log('處理前的庫存數據:', data);
    
    // 按產品ID分組
    const groupedByProduct = {};
    let totalQuantity = 0;
    let profitLossSum = 0;
    
    data.forEach(item => {
      // 記錄每個項目的數據到控制台
      console.log('處理項目:', item);
      console.log('項目類型:', item.type);
      console.log('項目單號信息:', {
        purchaseOrderNumber: item.purchaseOrderNumber,
        shippingOrderNumber: item.shippingOrderNumber,
        saleNumber: item.saleNumber
      });
      
      const productId = item.productId;
      
      if (!groupedByProduct[productId]) {
        groupedByProduct[productId] = {
          productId: productId,
          productCode: item.productCode,
          productName: item.productName,
          category: item.category,
          supplier: item.supplier,
          unit: item.unit,
          price: item.price || (item.type === 'purchase' ? item.purchasePrice : item.sellingPrice),
          status: item.status,
          totalQuantity: 0,
          totalInventoryValue: 0,
          totalPotentialRevenue: 0,
          totalPotentialProfit: 0,
          transactions: []
        };
      }
      
      // 計算總數量和價值
      groupedByProduct[productId].totalQuantity += item.quantity;
      groupedByProduct[productId].totalInventoryValue += item.inventoryValue;
      groupedByProduct[productId].totalPotentialRevenue += item.potentialRevenue;
      groupedByProduct[productId].totalPotentialProfit += item.potentialProfit;
      
      // 確定交易類型
      let transactionType = '其他';
      if (item.type === 'purchase') {
        transactionType = '進貨';
      } else if (item.type === 'ship') {  // 使用'ship'而不是'shipping'
        transactionType = '出貨';
      } else if (item.type === 'sale') {  // 使用'sale'而不是'sales'
        transactionType = '銷售';
      }
      
      // 添加交易記錄
      // 修正巢狀三元運算式
      let itemPrice;
      if (item.totalAmount && item.quantity) {
        itemPrice = Math.abs(item.totalAmount / item.quantity);
      } else if (item.type === 'purchase') {
        itemPrice = item.price || item.purchasePrice;
      } else {
        itemPrice = item.price || item.sellingPrice;
      }
      
      const transaction = {
        purchaseOrderNumber: item.purchaseOrderNumber || '-',
        shippingOrderNumber: item.shippingOrderNumber || '-',
        saleNumber: item.saleNumber || '-',  // 使用saleNumber而不是salesOrderNumber
        type: transactionType,
        quantity: item.quantity,
        currentStock: item.currentStock || 0, // 使用後端提供的當前庫存，如果沒有則默認為0
        price: itemPrice,
        date: item.date || item.lastUpdated || new Date(),
        orderNumber: item.orderNumber || ''
      };
      
      // 記錄創建的交易記錄到控制台
      console.log('創建的交易記錄:', transaction);
      
      groupedByProduct[productId].transactions.push(transaction);
      
      // 更新總計
      totalQuantity += item.quantity;
      // 不再在這裡累加損益總和，將在後面處理
    });
    
    // 轉換為數組
    const groupedArray = Object.values(groupedByProduct);
    
    // 按總數量排序
    groupedArray.sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    // 計算每個商品的損益總和並取貨單號最大的那筆作為最終值
    groupedArray.forEach(product => {
      if (product.transactions.length > 0) {
        // calculateTransactionProfitLoss is now in module scope
        
        // 獲取訂單號函數
        const getOrderNumber = (transaction) => {
          if (transaction.type === '進貨') {
            return transaction.purchaseOrderNumber || '-';
          } else if (transaction.type === '出貨') {
            return transaction.shippingOrderNumber || '-';
          } else if (transaction.type === '銷售') {
            return transaction.saleNumber || '-';
          }
          return '-';
        };
        
        // 按貨單號排序交易記錄（由小到大）
        const sortedTransactions = [...product.transactions].sort((a, b) => {
          const aOrderNumber = getOrderNumber(a);
          const bOrderNumber = getOrderNumber(b);
          return aOrderNumber.localeCompare(bOrderNumber); // 由小到大排序，確保時間順序
        });
        
        // 計算累積損益
        let cumulativeProfitLoss = 0;
        sortedTransactions.forEach(transaction => {
          if (transaction.type === '進貨') {
            cumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
          } else if (transaction.type === '銷售' || transaction.type === '出貨') {
            cumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
          }
        });
        
        // 按貨單號排序（由大到小）
        const sortedByDescending = [...product.transactions].sort((a, b) => {
          const aOrderNumber = getOrderNumber(a);
          const bOrderNumber = getOrderNumber(b);
          return bOrderNumber.localeCompare(aOrderNumber); // 由大到小排序，最新的在前面
        });
        
        // 計算貨單號最大的那筆交易的累積損益
        if (sortedByDescending.length > 0) {
          // 將最新交易的損益總和加入總計
          profitLossSum += cumulativeProfitLoss;
        }
      }
    });
    
    // 更新狀態
    setGroupedData(groupedArray);
    setTotalInventoryQuantity(totalQuantity);
    setTotalProfitLoss(profitLossSum);
  };

  // 處理頁碼變更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 處理每頁顯示筆數變更
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 計算分頁後的數據
  const paginatedData = groupedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // 如果正在載入，顯示載入中訊息
  if (loading) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </CardContent>
      </Card>
    );
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 如果沒有數據，顯示無數據訊息
  if (groupedData.length === 0) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Alert severity="info">
            沒有符合條件的庫存數據
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 顯示庫存表格
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div">
            庫存列表
          </Typography>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
              總庫存數量: <strong>{totalInventoryQuantity}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
              總損益: <strong style={{ color: totalProfitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {formatCurrency(totalProfitLoss)}
              </strong>
            </Typography>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="庫存表格">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>產品代碼</TableCell>
                <TableCell>產品名稱</TableCell>
                <TableCell>類別</TableCell>
                <TableCell>供應商</TableCell>
                <TableCell align="right">數量</TableCell>
                <TableCell>單位</TableCell>
                <TableCell align="right">單價</TableCell>
                <TableCell align="right">庫存價值</TableCell>
                <TableCell>狀態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((item) => (
                <ExpandableRow key={item.productId} item={item} formatCurrency={formatCurrency} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={groupedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每頁顯示筆數:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 筆`}
        />
      </CardContent>
    </Card>
  );
};

// 添加 InventoryTable 的 PropTypes 驗證
InventoryTable.propTypes = {
  filters: PropTypes.shape({
    supplier: PropTypes.string,
    category: PropTypes.string,
    productCode: PropTypes.string,
    productName: PropTypes.string,
    productType: PropTypes.string
  }).isRequired
};

export default InventoryTable;
