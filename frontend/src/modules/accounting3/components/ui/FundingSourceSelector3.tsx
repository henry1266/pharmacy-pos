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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  AccountTree as AccountTreeIcon,
  TrendingFlat as TrendingFlatIcon,
  MonetizationOn as MonetizationOnIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { accounting3Service } from '../../../../services/accounting3Service';
import { TransactionGroup, FundingSource } from '@pharmacy-pos/shared';

interface FundingSourceSelector3Props {
  open: boolean;
  onClose: () => void;
  onSelect: (transaction: TransactionGroup) => void;
  selectedTransactionId?: string;
  organizationId?: string;
  excludeTransactionIds?: string[]; // 排除的交易ID（避免循環引用）
  showSyncOption?: boolean; // 是否顯示同步到分錄的選項
  onSelectWithSync?: (transaction: TransactionGroup, syncToEntries: boolean) => void; // 帶同步選項的選擇回調
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

export const FundingSourceSelector3: React.FC<FundingSourceSelector3Props> = ({
  open,
  onClose,
  onSelect,
  selectedTransactionId,
  organizationId,
  excludeTransactionIds = [],
  showSyncOption = false,
  onSelectWithSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<FundingSourceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed'>('confirmed');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [syncToEntries, setSyncToEntries] = useState(true); // 預設啟用同步到分錄
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入資金來源（根據狀態篩選）
  useEffect(() => {
    if (open) {
      loadFundingSources();
    }
  }, [open, organizationId, statusFilter]);

  const loadFundingSources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[Accounting3] 🔍 載入資金來源:', { statusFilter, organizationId });
      
      if (statusFilter === 'confirmed' || statusFilter === 'all') {
        // 載入已確認的交易（可用作資金來源）
        const response = await accounting3Service.getAvailableFundingSources({
          organizationId,
          minAmount: 0
        });
        
        if (response.success && response.data) {
          // 轉換 API 回應為組件需要的格式
          const fundingSources: FundingSourceOption[] = response.data.fundingSources.map(source => ({
            ...source,
            status: 'confirmed' as const,
            linkedTransactionIds: [],
            createdBy: '',
            createdAt: source.transactionDate,
            updatedAt: source.transactionDate,
            remainingAmount: source.availableAmount,
          }));
          
          // 過濾掉排除的交易
          const filteredTransactions = fundingSources.filter(
            t => !excludeTransactionIds.includes(t._id)
          );
          
          setTransactions(filteredTransactions);
        } else {
          throw new Error('獲取已確認資金來源失敗');
        }
      }
      
      if (statusFilter === 'draft' || statusFilter === 'all') {
        // 載入草稿狀態的交易（需要確認才能作為資金來源）
        const response = await accounting3Service.getAll({
          status: 'draft'
        });
        
        if (response.success && response.data) {
          const responseData = Array.isArray(response.data) ? response.data : (response.data as any).groups || [];
          const draftTransactions: FundingSourceOption[] = responseData
            .filter(tx => tx.fundingType && tx.totalAmount > 0) // 只顯示有資金追蹤欄位且金額大於0的交易
            .filter(tx => !excludeTransactionIds.includes(tx._id)) // 過濾排除的交易
            .map(tx => ({
              _id: tx._id,
              groupNumber: tx.groupNumber,
              description: tx.description,
              transactionDate: new Date(tx.transactionDate), // 確保轉換為 Date 物件
              totalAmount: tx.totalAmount || 0,
              usedAmount: 0, // 草稿狀態的交易還沒有被使用
              availableAmount: tx.totalAmount || 0,
              fundingType: tx.fundingType || 'original',
              receiptUrl: tx.receiptUrl,
              invoiceNo: tx.invoiceNo,
              isAvailable: true,
              status: tx.status,
              linkedTransactionIds: tx.linkedTransactionIds || [],
              createdBy: tx.createdBy,
              createdAt: tx.createdAt,
              updatedAt: tx.updatedAt,
              remainingAmount: tx.totalAmount || 0
            }));
          
          if (statusFilter === 'draft') {
            setTransactions(draftTransactions);
          } else if (statusFilter === 'all') {
            // 合併已確認和草稿交易
            setTransactions(prev => [...prev, ...draftTransactions]);
          }
        }
      }
    } catch (err) {
      setError('載入資金來源失敗');
      console.error('[Accounting3] 載入資金來源錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 確認交易狀態
  const handleConfirmTransaction = async (transactionId: string) => {
    setConfirmingId(transactionId);
    try {
      console.log('[Accounting3] 🔍 確認交易:', transactionId);
      const response = await accounting3Service.confirm(transactionId);
      if (response.success) {
        setSnackbar({
          open: true,
          message: '交易確認成功！現在可以作為資金來源使用。',
          severity: 'success'
        });
        // 重新載入資金來源
        await loadFundingSources();
      } else {
        throw new Error('確認交易失敗');
      }
    } catch (error) {
      console.error('[Accounting3] 確認交易錯誤:', error);
      setSnackbar({
        open: true,
        message: '確認交易失敗，請稍後再試。',
        severity: 'error'
      });
    } finally {
      setConfirmingId(null);
    }
  };

  // 關閉提示訊息
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
    console.log('[Accounting3] 🔍 選擇資金來源:', fundingSource);
    
    // 將 FundingSourceOption 轉換為 TransactionGroup
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
    
    // 如果有同步回調且顯示同步選項，使用同步回調
    if (showSyncOption && onSelectWithSync) {
      onSelectWithSync(transactionGroup, syncToEntries);
    } else {
      onSelect(transactionGroup);
    }
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
            選擇資金來源 (Accounting3)
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* 篩選器區域 */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 搜尋欄 */}
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
          
          {/* 狀態篩選器 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>交易狀態</InputLabel>
            <Select
              value={statusFilter}
              label="交易狀態"
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'confirmed')}
            >
              <MenuItem value="confirmed">已確認</MenuItem>
              <MenuItem value="draft">草稿</MenuItem>
              <MenuItem value="all">全部</MenuItem>
            </Select>
          </FormControl>
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
                  <TableCell>狀態</TableCell>
                  <TableCell>資金類型</TableCell>
                  <TableCell align="right">總金額</TableCell>
                  <TableCell align="right">剩餘金額</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
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
                        <Chip
                          label={transaction.status === 'confirmed' ? '已確認' : '草稿'}
                          size="small"
                          color={transaction.status === 'confirmed' ? 'success' : 'warning'}
                          variant={transaction.status === 'confirmed' ? 'filled' : 'outlined'}
                        />
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
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {transaction.status === 'draft' && (
                            <Tooltip title="確認交易">
                              <IconButton
                                size="small"
                                color="success"
                                disabled={confirmingId === transaction._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmTransaction(transaction._id);
                                }}
                              >
                                {confirmingId === transaction._id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CheckCircleIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="選擇此資金來源">
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={transaction.status === 'draft'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(transaction);
                              }}
                            >
                              <MonetizationOnIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
            <strong>資金來源追蹤說明 (Accounting3)：</strong>
            <br />• 只能選擇已確認狀態的交易作為資金來源
            <br />• 原始資金：初始收入或資本投入
            <br />• 延伸使用：使用其他交易的資金進行新的交易
            <br />• 資金轉移：在不同帳戶間轉移資金
          </Typography>
          
          {/* 同步選項 */}
          {showSyncOption && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={syncToEntries}
                    onChange={(e) => setSyncToEntries(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    <strong>同步到分錄：</strong>自動為借方分錄設定相同的資金來源
                  </Typography>
                }
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                啟用此選項可減少重複操作，系統會自動為所有借方分錄設定選擇的資金來源
              </Typography>
            </Box>
          )}
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          取消
        </Button>
      </DialogActions>
      
      {/* 用戶反饋訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default FundingSourceSelector3;