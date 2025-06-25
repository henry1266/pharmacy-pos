import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { shippingOrderServiceV2 } from '../services/shippingOrderServiceV2';
import { ShippingOrder } from '@pharmacy-pos/shared/types/entities';
import { ShippingOrderCreateRequest, ShippingOrderUpdateRequest } from '@pharmacy-pos/shared/types/api';
import { ShippingOrderSearchParams } from '@pharmacy-pos/shared/services/shippingOrderApiClient';

/**
 * 出貨訂單服務 V2 使用範例
 * 展示如何使用新的統一 API 架構進行出貨訂單管理
 */
const ShippingOrderServiceV2Example: React.FC = () => {
  // 狀態管理
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 對話框狀態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // 表單狀態
  const [createForm, setCreateForm] = useState<ShippingOrderCreateRequest>({
    sosupplier: '',
    items: []
  });
  const [editForm, setEditForm] = useState<ShippingOrderUpdateRequest>({});
  const [searchForm, setSearchForm] = useState<ShippingOrderSearchParams>({});

  // 統計資訊
  const [stats, setStats] = useState<any>(null);

  // 載入所有出貨訂單
  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shippingOrderServiceV2.getAllShippingOrders();
      setOrders(data);
      setSuccess('成功載入出貨訂單列表');
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入出貨訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入統計資訊
  const loadStats = async () => {
    try {
      const data = await shippingOrderServiceV2.getShippingOrderStats();
      setStats(data);
    } catch (err) {
      console.error('載入統計資訊失敗:', err);
    }
  };

  // 創建出貨訂單
  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await shippingOrderServiceV2.createShippingOrder(createForm);
      setOrders(prev => [newOrder, ...prev]);
      setCreateDialogOpen(false);
      setCreateForm({ sosupplier: '', items: [] });
      setSuccess('成功創建出貨訂單');
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '創建出貨訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  // 更新出貨訂單
  const handleUpdate = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    setError(null);
    try {
      const updatedOrder = await shippingOrderServiceV2.updateShippingOrder(
        selectedOrder._id, 
        editForm
      );
      setOrders(prev => prev.map(order => 
        order._id === selectedOrder._id ? updatedOrder : order
      ));
      setEditDialogOpen(false);
      setSelectedOrder(null);
      setEditForm({});
      setSuccess('成功更新出貨訂單');
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新出貨訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  // 刪除出貨訂單
  const handleDelete = async (orderId: string) => {
    if (!window.confirm('確定要刪除這個出貨訂單嗎？')) return;
    
    setLoading(true);
    setError(null);
    try {
      await shippingOrderServiceV2.deleteShippingOrder(orderId);
      setOrders(prev => prev.filter(order => order._id !== orderId));
      setSuccess('成功刪除出貨訂單');
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除出貨訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  // 搜尋出貨訂單
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shippingOrderServiceV2.searchShippingOrders(searchForm);
      setOrders(data);
      setSearchDialogOpen(false);
      setSuccess(`找到 ${data.length} 筆出貨訂單`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜尋出貨訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  // 生成訂單號
  const generateOrderNumber = async () => {
    try {
      const orderNumber = await shippingOrderServiceV2.generateOrderNumber();
      setCreateForm(prev => ({ ...prev, soid: orderNumber }));
      setSuccess('成功生成訂單號');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成訂單號失敗');
    }
  };

  // 批次更新狀態
  const handleBatchUpdateStatus = async (status: 'pending' | 'completed' | 'cancelled') => {
    const selectedIds = orders
      .filter(order => order.status === 'pending')
      .slice(0, 3) // 示例：選擇前3個待處理訂單
      .map(order => order._id);
    
    if (selectedIds.length === 0) {
      setError('沒有可更新的訂單');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await shippingOrderServiceV2.batchUpdateStatus(selectedIds, status);
      await loadOrders();
      setSuccess(`成功批次更新 ${selectedIds.length} 個訂單狀態`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批次更新失敗');
    } finally {
      setLoading(false);
    }
  };

  // 組件載入時執行
  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  // 清除訊息
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        出貨訂單服務 V2 使用範例
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        這個範例展示了如何使用新的統一 API 架構進行出貨訂單管理，
        包括 CRUD 操作、搜尋、批次處理等功能。
      </Typography>

      {/* 錯誤和成功訊息 */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* 統計資訊卡片 */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              出貨訂單統計
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  總訂單數
                </Typography>
                <Typography variant="h6">
                  {stats.totalOrders}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  總金額
                </Typography>
                <Typography variant="h6">
                  ${stats.totalAmount?.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  已完成
                </Typography>
                <Typography variant="h6">
                  {stats.completedOrders}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  待處理
                </Typography>
                <Typography variant="h6">
                  {stats.pendingOrders}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 操作按鈕 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => setCreateDialogOpen(true)}
          disabled={loading}
        >
          創建出貨訂單
        </Button>
        <Button
          variant="outlined"
          onClick={() => setSearchDialogOpen(true)}
          disabled={loading}
        >
          搜尋出貨訂單
        </Button>
        <Button
          variant="outlined"
          onClick={loadOrders}
          disabled={loading}
        >
          重新載入
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleBatchUpdateStatus('completed')}
          disabled={loading}
        >
          批次完成
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleBatchUpdateStatus('cancelled')}
          disabled={loading}
        >
          批次取消
        </Button>
      </Box>

      {/* 載入指示器 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 出貨訂單列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>訂單號</TableCell>
              <TableCell>供應商</TableCell>
              <TableCell>訂單日期</TableCell>
              <TableCell>狀態</TableCell>
              <TableCell>付款狀態</TableCell>
              <TableCell>總金額</TableCell>
              <TableCell>項目數</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.soid}</TableCell>
                <TableCell>{order.sosupplier}</TableCell>
                <TableCell>
                  {new Date(order.orderDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={shippingOrderServiceV2.formatOrderStatus(order.status)}
                    color={
                      order.status === 'completed' ? 'success' :
                      order.status === 'pending' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={shippingOrderServiceV2.formatPaymentStatus(order.paymentStatus || '未收')}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  ${order.totalAmount?.toLocaleString()}
                </TableCell>
                <TableCell>{order.items.length}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {shippingOrderServiceV2.canEditOrder(order) && (
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedOrder(order);
                          // 只設置 API 支援的狀態值
                          const apiStatus = order.status === 'shipped' || order.status === 'delivered'
                            ? 'completed'
                            : order.status as 'pending' | 'completed' | 'cancelled';
                          setEditForm({
                            sosupplier: order.sosupplier,
                            status: apiStatus,
                            paymentStatus: order.paymentStatus
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        編輯
                      </Button>
                    )}
                    {shippingOrderServiceV2.canDeleteOrder(order) && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(order._id)}
                      >
                        刪除
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 創建對話框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>創建出貨訂單</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="出貨單號"
                  value={createForm.soid || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, soid: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <Button onClick={generateOrderNumber} size="small">
                        生成
                      </Button>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="供應商"
                  value={createForm.sosupplier}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, sosupplier: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="備註"
                  value={createForm.notes || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!createForm.sosupplier}>
            創建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>編輯出貨訂單</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="供應商"
                  value={editForm.sosupplier || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sosupplier: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>狀態</InputLabel>
                  <Select
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <MenuItem value="pending">待處理</MenuItem>
                    <MenuItem value="completed">已完成</MenuItem>
                    <MenuItem value="cancelled">已取消</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>付款狀態</InputLabel>
                  <Select
                    value={editForm.paymentStatus || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                  >
                    <MenuItem value="未收">未收</MenuItem>
                    <MenuItem value="已收款">已收款</MenuItem>
                    <MenuItem value="已開立">已開立</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="備註"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleUpdate} variant="contained">
            更新
          </Button>
        </DialogActions>
      </Dialog>

      {/* 搜尋對話框 */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>搜尋出貨訂單</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="出貨單號"
                  value={searchForm.soid || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, soid: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="供應商"
                  value={searchForm.sosupplier || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, sosupplier: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="開始日期"
                  type="date"
                  value={searchForm.startDate || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="結束日期"
                  type="date"
                  value={searchForm.endDate || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>取消</Button>
          <Button onClick={() => setSearchForm({})}>清除</Button>
          <Button onClick={handleSearch} variant="contained">
            搜尋
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShippingOrderServiceV2Example;