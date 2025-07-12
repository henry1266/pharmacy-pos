import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import { TransactionGroup, TransactionGroupWithEntries } from '@pharmacy-pos/shared';
import { transactionGroupWithEntriesService } from '@services/transactionGroupWithEntriesService';

interface FundingSourceSelector3Props {
  open: boolean;
  onClose: () => void;
  onSelect: (transaction: TransactionGroupWithEntries) => void;
  onSelectWithSync?: (transaction: TransactionGroupWithEntries, syncToEntries: boolean) => void;
  showSyncOption?: boolean;
  organizationId?: string;
  excludeTransactionIds?: string[];
}

/**
 * 資金來源選擇器 (Accounting3 版本)
 * 
 * 功能：
 * - 顯示可用的資金來源交易
 * - 支援搜尋和篩選
 * - 排除指定的交易ID
 * - 顯示交易詳細資訊
 */
export const FundingSourceSelector3: React.FC<FundingSourceSelector3Props> = ({
  open,
  onClose,
  onSelect,
  onSelectWithSync,
  showSyncOption = false,
  organizationId,
  excludeTransactionIds = []
}) => {
  const [transactions, setTransactions] = useState<TransactionGroupWithEntries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 載入可用的資金來源
  useEffect(() => {
    if (open) {
      loadFundingSources();
    }
  }, [open, organizationId]);

  const loadFundingSources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        status: 'confirmed', // 只顯示已確認的交易
        page: 1,
        limit: 100
      };

      if (organizationId) {
        params.organizationId = organizationId;
      }

      const response = await transactionGroupWithEntriesService.getAll(params);
      
      if (response.success && response.data) {
        // 過濾掉排除的交易ID
        const filteredTransactions = response.data.groups.filter(
          (transaction: TransactionGroupWithEntries) => !excludeTransactionIds.includes(transaction._id)
        );
        
        setTransactions(filteredTransactions);
      } else {
        setError('載入資金來源失敗');
      }
    } catch (err) {
      console.error('載入資金來源錯誤:', err);
      setError('載入資金來源時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 搜尋過濾
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(term) ||
      transaction.groupNumber.toLowerCase().includes(term) ||
      (transaction.invoiceNo && transaction.invoiceNo.toLowerCase().includes(term))
    );
  });

  // 格式化日期
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('zh-TW');
  };

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 計算交易總金額
  const calculateTotalAmount = (transaction: TransactionGroupWithEntries) => {
    if (!transaction.entries) return 0;
    return transaction.entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

  const handleSelect = (transaction: TransactionGroupWithEntries) => {
    onSelect(transaction);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '600px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountIcon />
          <Typography variant="h6">
            選擇資金來源
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 搜尋框 */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜尋交易描述、編號或發票號碼..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 載入狀態 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              載入資金來源中...
            </Typography>
          </Box>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* 交易列表 */}
        {!loading && !error && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {filteredTransactions.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {searchTerm ? '沒有符合條件的資金來源' : '沒有可用的資金來源'}
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredTransactions.map((transaction) => {
                  const totalAmount = calculateTotalAmount(transaction);
                  
                  return (
                    <ListItem key={transaction._id} disablePadding>
                      <ListItemButton onClick={() => handleSelect(transaction)}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {transaction.description}
                              </Typography>
                              <Chip
                                label={transaction.groupNumber}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                日期: {formatDate(transaction.transactionDate)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                金額: {formatCurrency(totalAmount)}
                              </Typography>
                              {transaction.invoiceNo && (
                                <Typography variant="body2" color="text.secondary">
                                  發票: {transaction.invoiceNo}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FundingSourceSelector3;