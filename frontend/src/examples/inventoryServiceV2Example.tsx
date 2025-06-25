/**
 * 庫存服務 V2 使用範例
 * 展示新的統一 API 客戶端架構的使用方式
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

// 使用新的庫存服務 V2
import {
  getAllInventory,
  getInventoryByProduct,
  createInventory,
  getInventoryStats,
  type Inventory,
  type InventoryCreateRequest
} from '../services/inventoryServiceV2';

const InventoryServiceV2Example: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState<InventoryCreateRequest>({
    product: '',
    quantity: 0,
    type: 'purchase',
    totalAmount: 0,
    notes: ''
  });

  // 載入所有庫存記錄
  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllInventory();
      setInventoryList(data);
      setSuccess('庫存記錄載入成功');
    } catch (err: any) {
      setError(err.message || '載入庫存記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入庫存統計
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getInventoryStats();
      setStats(data);
      setSuccess('庫存統計載入成功');
    } catch (err: any) {
      setError(err.message || '載入庫存統計失敗');
    } finally {
      setLoading(false);
    }
  };

  // 根據產品ID搜尋庫存
  const searchByProduct = async (productId: string) => {
    if (!productId.trim()) {
      setError('請輸入產品ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getInventoryByProduct(productId);
      setInventoryList(data);
      setSuccess(`找到 ${data.length} 筆產品庫存記錄`);
    } catch (err: any) {
      setError(err.message || '搜尋庫存記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 創建庫存記錄
  const handleCreateInventory = async () => {
    if (!formData.product || formData.quantity <= 0) {
      setError('請填寫完整的庫存資訊');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await createInventory(formData);
      setSuccess('庫存記錄創建成功');
      
      // 重新載入庫存列表
      await loadInventory();
      
      // 重置表單
      setFormData({
        product: '',
        quantity: 0,
        type: 'purchase',
        totalAmount: 0,
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || '創建庫存記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 組件載入時獲取初始數據
  useEffect(() => {
    loadInventory();
    loadStats();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        庫存服務 V2 使用範例
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        展示基於統一 API 客戶端架構的庫存管理功能
      </Typography>

      {/* 錯誤和成功訊息 */}
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

      <Grid container spacing={3}>
        {/* 操作面板 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                操作面板
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={loadInventory}
                  disabled={loading}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  載入所有庫存
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={loadStats}
                  disabled={loading}
                  fullWidth
                >
                  載入統計資料
                </Button>
              </Box>

              <TextField
                label="產品ID搜尋"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mb: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchByProduct((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* 創建庫存記錄表單 */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                創建庫存記錄
              </Typography>
              
              <TextField
                label="產品ID"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="數量"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="總金額"
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="備註"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={handleCreateInventory}
                disabled={loading}
                fullWidth
              >
                創建記錄
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 數據顯示區域 */}
        <Grid item xs={12} md={8}>
          {/* 統計資料 */}
          {stats && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  庫存統計
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      總記錄數
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalRecords}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      總數量
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalQuantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      總金額
                    </Typography>
                    <Typography variant="h6">
                      ${stats.totalAmount?.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* 庫存記錄表格 */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  庫存記錄 ({inventoryList.length})
                </Typography>
                {loading && <CircularProgress size={24} />}
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>產品</TableCell>
                      <TableCell align="right">數量</TableCell>
                      <TableCell align="right">金額</TableCell>
                      <TableCell>類型</TableCell>
                      <TableCell>日期</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryList.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item._id.slice(-6)}</TableCell>
                        <TableCell>
                          {typeof item.product === 'string' ? item.product.slice(-6) : item.product._id?.slice(-6)}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ${item.totalAmount?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventoryList.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          暫無庫存記錄
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryServiceV2Example;