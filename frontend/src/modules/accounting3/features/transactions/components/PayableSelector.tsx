import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Box,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { accounting3Service } from '../../../services/accounting3Service';
import apiService from '../../../../../utils/apiService';

// 應付帳款資訊介面
interface PayableTransactionInfo {
  _id: string;
  groupNumber: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  supplierInfo?: {
    supplierId: string;
    supplierName: string;
  };
  isPaidOff: boolean;
  paymentHistory: Array<{
    paymentTransactionId: string;
    paidAmount: number;
    paymentDate: Date;
    paymentMethod?: string;
  }>;
  transactionDate: Date;
  status?: 'draft' | 'confirmed' | 'cancelled'; // 新增交易狀態
}

interface PayableSelectorProps {
  organizationId?: string;
  onSelectionChange: (selectedPayables: PayableTransactionInfo[]) => void;
  excludePaidOff?: boolean;
  disabled?: boolean;
}

// 格式化金額
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// 格式化日期
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-TW');
};

// 計算到期狀態
const getDueStatus = (dueDate?: Date): { status: 'overdue' | 'due-soon' | 'normal'; label: string; color: 'error' | 'warning' | 'default' } => {
  if (!dueDate) return { status: 'normal', label: '無到期日', color: 'default' };
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'overdue', label: `逾期 ${Math.abs(diffDays)} 天`, color: 'error' };
  } else if (diffDays <= 7) {
    return { status: 'due-soon', label: `${diffDays} 天內到期`, color: 'warning' };
  } else {
    return { status: 'normal', label: `${diffDays} 天後到期`, color: 'default' };
  }
};

export const PayableSelector: React.FC<PayableSelectorProps> = ({
  organizationId,
  onSelectionChange,
  excludePaidOff = true,
  disabled = false
}) => {
  const navigate = useNavigate();
  const [payables, setPayables] = useState<PayableTransactionInfo[]>([]);
  const [selectedPayables, setSelectedPayables] = useState<PayableTransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 獲取應付帳款列表
  const fetchPayables = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 獲取應付帳款列表:', { organizationId, excludePaidOff });
      
      // 使用 apiService 來處理認證
      const params = new URLSearchParams();
      if (organizationId) {
        params.append('organizationId', organizationId);
      }
      params.append('excludePaidOff', excludePaidOff.toString());

      const response = await apiService.get(`/api/accounting2/transactions/payables?${params.toString()}`);
      
      if (response.data.success) {
        setPayables(response.data.data || []);
        console.log('✅ 應付帳款列表獲取成功:', response.data.data?.length || 0, '筆');
      } else {
        throw new Error(response.data.message || '獲取應付帳款失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '獲取應付帳款失敗';
      console.error('❌ 獲取應付帳款失敗:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [organizationId, excludePaidOff]);

  // 處理選擇變更
  const handleSelectionChange = (payable: PayableTransactionInfo, selected: boolean) => {
    if (disabled) return;
    
    let newSelection: PayableTransactionInfo[];
    if (selected) {
      newSelection = [...selectedPayables, payable];
    } else {
      newSelection = selectedPayables.filter(p => p._id !== payable._id);
    }
    
    setSelectedPayables(newSelection);
    onSelectionChange(newSelection);
    
    console.log('📋 應付帳款選擇變更:', {
      selected: newSelection.length,
      totalAmount: newSelection.reduce((sum, p) => sum + p.remainingAmount, 0)
    });
  };

  // 全選/取消全選
  const handleSelectAll = (selected: boolean) => {
    if (disabled) return;
    
    const availablePayables = filteredPayables.filter(p => !p.isPaidOff);
    const newSelection = selected ? availablePayables : [];
    
    setSelectedPayables(newSelection);
    onSelectionChange(newSelection);
  };

  // 過濾應付帳款
  const filteredPayables = payables.filter(payable => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      payable.groupNumber.toLowerCase().includes(searchLower) ||
      payable.description.toLowerCase().includes(searchLower) ||
      payable.supplierInfo?.supplierName?.toLowerCase().includes(searchLower)
    );
  });

  // 計算選擇摘要
  const selectionSummary = {
    count: selectedPayables.length,
    totalAmount: selectedPayables.reduce((sum, p) => sum + p.remainingAmount, 0),
    overdueCount: selectedPayables.filter(p => p.dueDate && getDueStatus(p.dueDate).status === 'overdue').length
  };

  // 初始載入
  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  // 檢查是否全選
  const availablePayables = filteredPayables.filter(p => !p.isPaidOff);
  const isAllSelected = availablePayables.length > 0 && selectedPayables.length === availablePayables.length;
  const isIndeterminate = selectedPayables.length > 0 && selectedPayables.length < availablePayables.length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            選擇應付帳款
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="搜尋交易編號、描述或供應商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 250 }}
            />
            
            <IconButton onClick={fetchPayables} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={disabled || availablePayables.length === 0}
                      />
                    </TableCell>
                    <TableCell>交易編號</TableCell>
                    <TableCell>描述</TableCell>
                    <TableCell>供應商</TableCell>
                    <TableCell align="right">應付金額</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayables.map((payable) => {
                    const isSelected = selectedPayables.some(p => p._id === payable._id);
                    const dueStatus = getDueStatus(payable.dueDate);
                    
                    return (
                      <TableRow 
                        key={payable._id}
                        hover
                        sx={{
                          backgroundColor: payable.isPaidOff ? '#f5f5f5' : 'inherit',
                          opacity: payable.isPaidOff ? 0.6 : 1
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleSelectionChange(payable, e.target.checked)}
                            disabled={disabled || payable.isPaidOff}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => navigate(`/accounting3/transaction/${payable._id}`)}
                          >
                            {payable.groupNumber}
                          </Button>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={payable.description} arrow>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {payable.description}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell>
                          {payable.supplierInfo?.supplierName || '-'}
                        </TableCell>
                        
                        <TableCell align="right">
                          {formatAmount(payable.totalAmount)}
                        </TableCell>
                        
                        
                        
                        
                        
                        <TableCell>
                          {payable.paymentHistory.length > 0 && (
                            <Tooltip title={`已有 ${payable.paymentHistory.length} 筆付款記錄`} arrow>
                              <IconButton size="small">
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {filteredPayables.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm ? '沒有符合搜尋條件的應付帳款' : '沒有可用的應付帳款'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {selectionSummary.count > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  已選擇 {selectionSummary.count} 筆應付帳款
                </Typography>
                <Typography variant="body2">
                  總付款金額: {formatAmount(selectionSummary.totalAmount)}
                </Typography>
                {selectionSummary.overdueCount > 0 && (
                  <Typography variant="body2" color="error">
                    其中 {selectionSummary.overdueCount} 筆已逾期
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PayableSelector;