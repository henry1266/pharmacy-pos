import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  AccountTree as AccountTreeIcon,
  TrendingFlat as TrendingFlatIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { fundingTrackingService } from '../../services/transactionGroupService';
import { TransactionGroup, FundingSource } from '@pharmacy-pos/shared';

interface FundingSourceSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (transaction: TransactionGroup) => void;
  selectedTransactionId?: string;
  organizationId?: string;
  excludeTransactionIds?: string[]; // 排除的交易ID（避免循環引用）
}

// 擴展 FundingSource 以包含 TransactionGroup 的必要欄位
interface FundingSourceOption {
  // 從 FundingSource 繼承的屬性
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date;
  totalAmount: number;
  usedAmount: number;
  availableAmount: number;
  fundingType: 'original' | 'extended' | 'transfer';
  receiptUrl?: string;
  invoiceNo?: string;
  isAvailable: boolean;
  
  // TransactionGroup 的額外屬性
  status: 'draft' | 'confirmed' | 'cancelled';
  linkedTransactionIds: string[];
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  remainingAmount?: number; // 剩餘金額（計算得出，與 availableAmount 相同）
}

export const FundingSourceSelector: React.FC<FundingSourceSelectorProps> = ({
  open,
  onClose,
  onSelect,
  selectedTransactionId,
  organizationId,
  excludeTransactionIds = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<FundingSourceOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 模擬資料載入（實際應該從 API 獲取）
  useEffect(() => {
    if (open) {
      loadFundingSources();
    }
  }, [open, organizationId]);

  const loadFundingSources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 這裡應該調用實際的 API
      // const response = await api.getAvailableFundingSources({ organizationId, excludeIds: excludeTransactionIds });
      
      // 呼叫真實的 API 獲取可用資金來源
      const response = await fundingTrackingService.getAvailableFundingSources({
        organizationId,
        minAmount: 0
      });
      
      if (response.success && response.data) {
        // 轉換 API 回應為組件需要的格式
        const fundingSources: FundingSourceOption[] = response.data.fundingSources.map(source => ({
          ...source,
          status: 'confirmed' as const, // API 只返回已確認的交易
          linkedTransactionIds: [], // 這個資訊需要從 TransactionGroup 獲取
          createdBy: '', // 這個資訊需要從 TransactionGroup 獲取
          createdAt: source.transactionDate,
          updatedAt: source.transactionDate,
          remainingAmount: source.availableAmount,
          // usedAmount 和 totalAmount 已經在 FundingSource 中定義，會自動繼承
        }));
        
        // 過濾掉排除的交易
        const filteredTransactions = fundingSources.filter(
          t => !excludeTransactionIds.includes(t._id)
        );
        
        setTransactions(filteredTransactions);
      } else {
        throw new Error('獲取資金來源失敗');
      }
    } catch (err) {
      setError('載入資金來源失敗');
      console.error('載入資金來源錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 過濾交易
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    
    const term = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.groupNumber.toLowerCase().includes(term) ||
      transaction.description.toLowerCase().includes(term) ||
      transaction.invoiceNo?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  const handleSelect = (fundingSource: FundingSourceOption) => {
    // 將 FundingSourceOption 轉換為 TransactionGroup
    // 使用型別斷言來避免 TypeScript 編譯錯誤
    const transactionGroup = {
      _id: fundingSource._id,
      groupNumber: fundingSource.groupNumber,
      description: fundingSource.description,
      transactionDate: fundingSource.transactionDate,
      organizationId: '', // 這個資訊在 FundingSource 中沒有
      receiptUrl: fundingSource.receiptUrl,
      invoiceNo: fundingSource.invoiceNo,
      totalAmount: fundingSource.totalAmount,
      status: fundingSource.status,
      linkedTransactionIds: fundingSource.linkedTransactionIds,
      sourceTransactionId: undefined, // 這個資訊在 FundingSource 中沒有
      fundingType: fundingSource.fundingType,
      createdBy: fundingSource.createdBy,
      createdAt: fundingSource.createdAt,
      updatedAt: fundingSource.updatedAt
    } as TransactionGroup;
    
    onSelect(transactionGroup);
    onClose();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const getFundingTypeChip = (fundingType: 'original' | 'extended' | 'transfer') => {
    const fundingTypeConfig = {
      original: { label: '原始資金', color: '#4caf50' as const },
      extended: { label: '延伸使用', color: '#ff9800' as const },
      transfer: { label: '資金轉移', color: '#2196f3' as const }
    };
    
    const config = fundingTypeConfig[fundingType];
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.color,
          color: 'white',
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const formatAmount = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '700px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTreeIcon color="primary" />
          <Typography variant="h6" component="div">
            選擇資金來源
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* 搜尋欄 */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜尋交易編號、描述或發票號碼..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* 錯誤訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 載入中 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 交易列表 */}
        {!loading && (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>交易編號</TableCell>
                  <TableCell>描述</TableCell>
                  <TableCell>交易日期</TableCell>
                  <TableCell>資金類型</TableCell>
                  <TableCell align="right">總金額</TableCell>
                  <TableCell align="right">剩餘金額</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        {searchTerm ? '沒有符合搜尋條件的資金來源' : '沒有可用的資金來源'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow
                      key={transaction._id}
                      hover
                      selected={transaction._id === selectedTransactionId}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSelect(transaction)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.groupNumber}
                        </Typography>
                        {transaction.invoiceNo && (
                          <Typography variant="caption" color="text.secondary">
                            發票: {transaction.invoiceNo}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.description}
                        </Typography>
                        {transaction.linkedTransactionIds.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <TrendingFlatIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                              已延伸 {transaction.linkedTransactionIds.length} 筆交易
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(transaction.transactionDate), 'yyyy/MM/dd', { locale: zhTW })}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {getFundingTypeChip(transaction.fundingType)}
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatAmount(transaction.totalAmount)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={transaction.remainingAmount === 0 ? 'error.main' : 'success.main'}
                        >
                          {formatAmount(transaction.remainingAmount || transaction.totalAmount)}
                        </Typography>
                        {transaction.usedAmount && transaction.usedAmount > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            已使用: {formatAmount(transaction.usedAmount)}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="選擇此資金來源">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(transaction);
                            }}
                          >
                            <MonetizationOnIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* 說明 */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>資金來源追蹤說明：</strong>
            <br />• 只能選擇已確認狀態的交易作為資金來源
            <br />• 原始資金：初始收入或資本投入
            <br />• 延伸使用：使用其他交易的資金進行新的交易
            <br />• 資金轉移：在不同帳戶間轉移資金
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FundingSourceSelector;