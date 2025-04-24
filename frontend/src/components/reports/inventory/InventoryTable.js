import React, { useState, useEffect } from 'react';
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
  TablePagination
} from '@mui/material';
import axios from 'axios';

const InventoryTable = ({ filters }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
        
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        if (response.data && response.data.data) {
          setInventoryData(response.data.data);
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

  // 處理頁碼變更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 處理每頁行數變更
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card sx={{ 
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--card-shadow)',
      mb: 4
    }}>
      <CardContent>
        <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
          庫存列表
        </Typography>
        
        <TableContainer component={Paper} sx={{ 
          boxShadow: 'none',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-sm)'
        }}>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead sx={{ bgcolor: 'var(--bg-secondary)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>商品編號</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>商品名稱</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>類別</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>供應商</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>數量</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>單位</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>進貨價</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>售價</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>庫存價值</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>潛在收入</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>潛在利潤</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>狀態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                <TableRow
                  key={item.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{item.productCode}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.supplier ? item.supplier.name : '-'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                  <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.inventoryValue)}</TableCell>
                  <TableCell>{formatCurrency(item.potentialRevenue)}</TableCell>
                  <TableCell>{formatCurrency(item.potentialProfit)}</TableCell>
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
              ))}
              
              {inventoryData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    暫無數據
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={inventoryData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每頁行數:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </CardContent>
    </Card>
  );
};

export default InventoryTable;
