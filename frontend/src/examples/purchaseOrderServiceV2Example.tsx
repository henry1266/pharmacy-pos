import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { purchaseOrderServiceV2 } from '../services/purchaseOrderServiceV2';
import { PurchaseOrder } from '@pharmacy-pos/shared/types/entities';
import { PurchaseOrderCreateRequest, PurchaseOrderUpdateRequest } from '@pharmacy-pos/shared/types/api';

/**
 * 採購訂單服務 V2 使用範例組件
 * 展示如何使用 PurchaseOrderServiceV2 的各種功能
 */
const PurchaseOrderServiceV2Example: React.FC = () => {
  // 狀態管理
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 對話框狀態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // 搜尋狀態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  
  // 表單狀態
  const [formData, setFormData] = useState<Partial<PurchaseOrderCreateRequest>>({
    supplier: '',
    items: [],
    expectedDeliveryDate: '',
    notes: ''
  });

  // 載入採購訂單列表
  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const orders = await purchaseOrderServiceV2.getAllPurchaseOrders();
      setPurchaseOrders(orders);
    } catch (err) {
      setError('載入採購訂單失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 搜尋採購訂單
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams: any = {};
      if (searchKeyword) searchParams.keyword = searchKeyword;
      if (statusFilter) searchParams.status = statusFilter;
      if (paymentStatusFilter) searchParams.paymentStatus = paymentStatusFilter;
      
      const orders = Object.keys(searchParams).length > 0 
        ? await purchaseOrderServiceV2.searchPurchaseOrders(searchParams)
        : await purchaseOrderServiceV2.getAllPurchaseOrders();
        
      setPurchaseOrders(orders);
    } catch (err) {
      setError('搜尋採購訂單失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 創建採購訂單
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!formData.supplier || !formData.items?.length) {
        setError('請填寫必要欄位');
        return;
      }
      
      const newOrder = await purchaseOrderServiceV2.createPurchaseOrder(formData as PurchaseOrderCreateRequest);
      setSuccess('採購訂單創建成功');
      setCreateDialogOpen(false);
      setFormData({ supplier: '', items: [], expectedDeliveryDate: '', notes: '' });
      await loadPurchaseOrders();
    } catch (err) {
      setError('創建採購訂單失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 更新採購訂單
  const handleUpdate = async () => {
    try {
      if (!selectedOrder) return;
      
      setLoading(true);
      setError(null);
      
      const updatedOrder = await purchaseOrderServiceV2.updatePurchaseOrder(
        selectedOrder._id,
        formData as PurchaseOrderUpdateRequest
      );
      setSuccess('採購訂單更新成功');
      setEditDialogOpen(false);
      setSelectedOrder(null);
      setFormData({ supplier: '', items: [], expectedDeliveryDate: '', notes: '' });
      await loadPurchaseOrders();
    } catch (err) {
      setError('更新採購訂單失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 刪除採購訂單
  const handleDelete = async (orderId: string) => {
    if (!window.confirm('確定要刪除這個採購訂單嗎？')) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await purchaseOrderServiceV2.deletePurchaseOrder(orderId);
      setSuccess('採購訂單刪除成功');
      await loadPurchaseOrders();
    } catch (err) {
      setError('刪除採購訂單失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 批次更新狀態
  const handleBatchUpdateStatus = async (orderIds: string[], status: 'pending' | 'completed' | 'cancelled') => {
    try {
      setLoading(true);
      setError(null);
      
      await purchaseOrderServiceV2.batchUpdateStatus(orderIds, status);
      setSuccess(`批次更新 ${orderIds.length} 個採購訂單狀態成功`);
      await loadPurchaseOrders();
    } catch (err) {
      setError('批次更新狀態失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 匯入 CSV
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await purchaseOrderServiceV2.importBasicPurchaseOrders(file);
      setSuccess(`匯入成功: ${result.success ? '成功' : '失敗'}`);
      await loadPurchaseOrders();
    } catch (err) {
      setError('匯入 CSV 失敗: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 生成訂單號
  const generateOrderNumber = async () => {
    try {
      const orderNumber = await purchaseOrderServiceV2.generateOrderNumber();
      setFormData(prev => ({ ...prev, orderNumber }));
      setSuccess(`生成訂單號: ${orderNumber}`);
    } catch (err) {
      setError('生成訂單號失敗: ' + (err as Error).message);
    }
  };

  // 開啟編輯對話框
  const openEditDialog = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setFormData({
      supplier: typeof order.supplier === 'string' ? order.supplier : order.supplier._id,
      items: order.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product._id,
        quantity: item.quantity,
        price: item.price
      })),
      expectedDeliveryDate: typeof order.expectedDeliveryDate === 'string' 
        ? order.expectedDeliveryDate 
        : order.expectedDeliveryDate?.toISOString().split('T')[0] || '',
      notes: order.notes || ''
    });
    setEditDialogOpen(true);
  };

  // 組件載入時獲取數據
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // 清除訊息
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        採購訂單服務 V2 使用範例
      </Typography>
      
      {/* 訊息顯示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 功能按鈕區 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            功能操作
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                新增採購訂單
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadPurchaseOrders}
                disabled={loading}
              >
                重新載入
              </Button>
            </Grid>
            <Grid item>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-upload"
                type="file"
                onChange={handleImportCSV}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FileUploadIcon />}
                  disabled={loading}
                >
                  匯入 CSV
                </Button>
              </label>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setSuccess('匯出功能開發中...')}
              >
                匯出資料
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 搜尋篩選區 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            搜尋與篩選
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="關鍵字搜尋"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋訂單號、供應商..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="訂單狀態"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="pending">待處理</MenuItem>
                <MenuItem value="approved">已核准</MenuItem>
                <MenuItem value="received">已接收</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="付款狀態"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="未付">未付款</MenuItem>
                <MenuItem value="已下收">已下收</MenuItem>
                <MenuItem value="已匯款">已匯款</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                搜尋
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 採購訂單列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            採購訂單列表 ({purchaseOrders.length} 筆)
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>訂單號</TableCell>
                    <TableCell>供應商</TableCell>
                    <TableCell>訂單日期</TableCell>
                    <TableCell>總金額</TableCell>
                    <TableCell>狀態</TableCell>
                    <TableCell>付款狀態</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {typeof order.supplier === 'string' ? order.supplier : order.supplier.name}
                      </TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>NT$ {order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={purchaseOrderServiceV2.formatOrderStatus(order.status)}
                          color={purchaseOrderServiceV2.getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={purchaseOrderServiceV2.formatPaymentStatus(order.paymentStatus || '未付')}
                          color={purchaseOrderServiceV2.getPaymentStatusColor(order.paymentStatus || '未付')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="編輯">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(order)}
                              disabled={!purchaseOrderServiceV2.canEditOrder(order)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="刪除">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(order._id)}
                              disabled={!purchaseOrderServiceV2.canDeleteOrder(order)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          {purchaseOrderServiceV2.canCompleteOrder(order) && (
                            <Tooltip title="完成訂單">
                              <IconButton
                                size="small"
                                onClick={() => handleBatchUpdateStatus([order._id], 'completed')}
                                color="success"
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {purchaseOrderServiceV2.canCancelOrder(order) && (
                            <Tooltip title="取消訂單">
                              <IconButton
                                size="small"
                                onClick={() => handleBatchUpdateStatus([order._id], 'cancelled')}
                                color="warning"
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary">
                          暫無採購訂單資料
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 創建採購訂單對話框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新增採購訂單</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="供應商ID"
                value={formData.supplier || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="預計交貨日期"
                type="date"
                value={formData.expectedDeliveryDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                onClick={generateOrderNumber}
                fullWidth
              >
                生成訂單號
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備註"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : '創建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯採購訂單對話框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>編輯採購訂單</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="供應商ID"
                value={formData.supplier || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="預計交貨日期"
                type="date"
                value={formData.expectedDeliveryDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備註"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderServiceV2Example;