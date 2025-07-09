import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { TransactionGroupWithEntries } from '@pharmacy-pos/shared/types/accounting2';
import { accounting3Service } from '../../../../../services/accounting3Service';

interface AccountTransactionListProps {
  selectedAccount: Account2 | null;
  onTransactionView?: (transaction: TransactionGroupWithEntries) => void;
  onTransactionEdit?: (transaction: TransactionGroupWithEntries) => void;
  onAddTransaction?: (accountId: string) => void;
}

/**
 * 科目交易列表組件
 * 顯示選中科目的相關交易
 */
export const AccountTransactionList: React.FC<AccountTransactionListProps> = ({
  selectedAccount,
  onTransactionView,
  onTransactionEdit,
  onAddTransaction
}) => {
  const [transactions, setTransactions] = useState<TransactionGroupWithEntries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 彈出式對話框狀態
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<TransactionGroupWithEntries | null>(null);
  
  // 操作選單狀態
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTransactionForAction, setSelectedTransactionForAction] = useState<TransactionGroupWithEntries | null>(null);

  // 載入選中科目的交易
  useEffect(() => {
    if (selectedAccount) {
      loadAccountTransactions(selectedAccount._id);
    } else {
      setTransactions([]);
    }
  }, [selectedAccount]);

  const loadAccountTransactions = async (accountId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('載入科目交易:', accountId);
      
      // 使用 accounting3Service 的交易 API
      const response = await accounting3Service.transactions.getByAccount(accountId, {
        limit: 100, // 限制載入數量
        page: 1
      });
      
      if (response.success) {
        console.log('交易載入成功:', response.data.length, '筆交易');
        setTransactions(response.data || []);
      } else {
        console.warn('交易載入失敗:', response);
        setTransactions([]);
        setError('載入交易資料失敗');
      }
    } catch (err) {
      console.error('載入科目交易失敗:', err);
      setError('載入交易資料失敗');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-TW');
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'draft': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'draft': return '草稿';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 計算交易群組總金額
  const calculateTotalAmount = (entries: any[]) => {
    return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

  // 計算科目在交易中的金額（考慮借貸方向）
  const getAccountAmountInTransaction = (transaction: TransactionGroupWithEntries, accountId: string) => {
    if (!transaction.entries) return 0;
    
    const accountEntry = transaction.entries.find(entry =>
      (entry as any).accountId === accountId || (entry as any).account === accountId
    );
    
    if (!accountEntry) return 0;
    
    // 根據科目類型決定正負號
    const debitAmount = accountEntry.debitAmount || 0;
    const creditAmount = accountEntry.creditAmount || 0;
    
    // 對於資產、費用科目：借方為正，貸方為負
    // 對於負債、權益、收入科目：貸方為正，借方為負
    // 這裡簡化處理，可以根據科目類型調整
    return debitAmount - creditAmount;
  };

  // 計算統計資料
  const statistics = useMemo(() => {
    if (!selectedAccount || transactions.length === 0) {
      return {
        totalTransactions: 0,
        totalDebitAmount: 0,
        totalCreditAmount: 0,
        netAmount: 0,
        averageAmount: 0,
        lastTransactionDate: null
      };
    }

    let totalDebitAmount = 0;
    let totalCreditAmount = 0;
    let lastTransactionDate: Date | null = null;

    transactions.forEach(transaction => {
      if (!transaction.entries) return;
      
      const accountEntry = transaction.entries.find(entry =>
        (entry as any).accountId === selectedAccount._id || (entry as any).account === selectedAccount._id
      );
      
      if (accountEntry) {
        totalDebitAmount += accountEntry.debitAmount || 0;
        totalCreditAmount += accountEntry.creditAmount || 0;
        
        const transactionDate = new Date(transaction.transactionDate);
        if (!lastTransactionDate || transactionDate > lastTransactionDate) {
          lastTransactionDate = transactionDate;
        }
      }
    });

    const netAmount = totalDebitAmount - totalCreditAmount;
    const averageAmount = transactions.length > 0 ? Math.abs(netAmount) / transactions.length : 0;

    return {
      totalTransactions: transactions.length,
      totalDebitAmount,
      totalCreditAmount,
      netAmount,
      averageAmount,
      lastTransactionDate
    };
  }, [selectedAccount, transactions]);

  // 計算帶累計餘額的交易列表（累加順序與顯示順序完全反過來）
  const transactionsWithRunningBalance = useMemo(() => {
    if (!selectedAccount || transactions.length === 0) return [];

    // 穩定排序函數：先按日期，再按 ID 確保同日期交易順序穩定
    const stableSortOldToNew = (a: TransactionGroupWithEntries, b: TransactionGroupWithEntries) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateA !== dateB) {
        return dateA - dateB; // 舊到新
      }
      // 同日期時按 ID 排序確保穩定性
      return a._id.localeCompare(b._id);
    };

    const stableSortNewToOld = (a: TransactionGroupWithEntries, b: TransactionGroupWithEntries) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // 新到舊
      }
      // 同日期時按 ID 反向排序確保與舊到新的順序一致
      return b._id.localeCompare(a._id);
    };

    // 1. 先按日期排序（從最舊到最新）用於累計餘額計算
    const sortedForBalance = [...transactions].sort(stableSortOldToNew);

    // 2. 從最舊的交易開始累加餘額
    let runningBalance = 0;
    const balanceMap = new Map<string, number>();
    
    sortedForBalance.forEach(transaction => {
      const amount = getAccountAmountInTransaction(transaction, selectedAccount._id);
      runningBalance += amount;
      balanceMap.set(transaction._id, runningBalance);
    });

    // 3. 按日期排序（從最新到最舊）用於顯示，並對應累計餘額
    const sortedForDisplay = [...transactions].sort(stableSortNewToOld);

    // 4. 將累計餘額對應到顯示順序
    return sortedForDisplay.map((transaction, index) => ({
      ...transaction,
      accountAmount: getAccountAmountInTransaction(transaction, selectedAccount._id),
      runningBalance: balanceMap.get(transaction._id) || 0,
      // 添加排序索引用於調試
      displayOrder: index + 1
    }));
  }, [selectedAccount, transactions]);

  // 處理交易編號點擊
  const handleTransactionNumberClick = (transaction: TransactionGroupWithEntries) => {
    setSelectedTransactionForDetail(transaction);
    setTransactionDetailOpen(true);
  };

  // 處理列點擊（彈出操作選單）
  const handleRowClick = (event: React.MouseEvent<HTMLElement>, transaction: TransactionGroupWithEntries) => {
    event.preventDefault();
    setActionMenuAnchor(event.currentTarget);
    setSelectedTransactionForAction(transaction);
  };

  // 關閉操作選單
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedTransactionForAction(null);
  };

  // 處理查看交易
  const handleViewTransaction = () => {
    if (selectedTransactionForAction && onTransactionView) {
      onTransactionView(selectedTransactionForAction);
    }
    handleActionMenuClose();
  };

  // 處理編輯交易
  const handleEditTransaction = () => {
    if (selectedTransactionForAction && onTransactionEdit) {
      onTransactionEdit(selectedTransactionForAction);
    }
    handleActionMenuClose();
  };

  // 處理複製交易
  const handleCopyTransaction = async () => {
    if (selectedTransactionForAction) {
      try {
        // 複製交易資料到剪貼簿
        const transactionData = {
          編號: (selectedTransactionForAction as any).groupNumber || 'N/A',
          描述: selectedTransactionForAction.description,
          日期: formatDate(selectedTransactionForAction.transactionDate),
          狀態: getStatusLabel(selectedTransactionForAction.status),
          金額: formatCurrency(calculateTotalAmount(selectedTransactionForAction.entries || []))
        };
        
        const textToCopy = Object.entries(transactionData)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        
        await navigator.clipboard.writeText(textToCopy);
        console.log('交易資料已複製到剪貼簿');
      } catch (err) {
        console.error('複製失敗:', err);
      }
    }
    handleActionMenuClose();
  };

  // 渲染交易詳情對話框
  const renderTransactionDetailDialog = () => (
    <Dialog
      open={transactionDetailOpen}
      onClose={() => setTransactionDetailOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          交易詳情
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedTransactionForDetail && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">交易編號</Typography>
                <Typography variant="body1" fontFamily="monospace" fontWeight="bold">
                  {(selectedTransactionForDetail as any).groupNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">交易日期</Typography>
                <Typography variant="body1">
                  {formatDate(selectedTransactionForDetail.transactionDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">交易描述</Typography>
                <Typography variant="body1">
                  {selectedTransactionForDetail.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">狀態</Typography>
                <Chip
                  label={getStatusLabel(selectedTransactionForDetail.status)}
                  color={getStatusColor(selectedTransactionForDetail.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">總金額</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(calculateTotalAmount(selectedTransactionForDetail.entries || []))}
                </Typography>
              </Grid>
              {selectedTransactionForDetail.entries && selectedTransactionForDetail.entries.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    分錄明細
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>科目</TableCell>
                          <TableCell align="right">借方</TableCell>
                          <TableCell align="right">貸方</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTransactionForDetail.entries.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {(entry as any).accountName || '未知科目'}
                            </TableCell>
                            <TableCell align="right">
                              {entry.debitAmount ? formatCurrency(entry.debitAmount) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {entry.creditAmount ? formatCurrency(entry.creditAmount) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTransactionDetailOpen(false)}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );

  // 渲染操作選單
  const renderActionMenu = () => (
    <Menu
      anchorEl={actionMenuAnchor}
      open={Boolean(actionMenuAnchor)}
      onClose={handleActionMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      {onTransactionView && (
        <MenuItem onClick={handleViewTransaction}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>查看詳情</ListItemText>
        </MenuItem>
      )}
      
      {onTransactionEdit && selectedTransactionForAction?.status === 'draft' && (
        <MenuItem onClick={handleEditTransaction}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編輯交易</ListItemText>
        </MenuItem>
      )}

      <MenuItem onClick={handleCopyTransaction}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>複製資料</ListItemText>
      </MenuItem>
    </Menu>
  );

  // 渲染統計卡片
  const renderStatisticsCards = () => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                交易筆數
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {statistics.totalTransactions}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                借方總額
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(statistics.totalDebitAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingDownIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                貸方總額
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="error.main">
              {formatCurrency(statistics.totalCreditAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                淨額
              </Typography>
            </Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              color={statistics.netAmount >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(statistics.netAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // 渲染交易流向圖
  const renderTransactionFlow = (transaction: TransactionGroupWithEntries) => {
    if (!transaction.entries || transaction.entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = transaction.entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = transaction.entries.filter(entry => (entry.creditAmount || 0) > 0);

    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    // 獲取科目名稱
    const fromAccountName = (fromAccount as any).accountName || '未知科目';
    const toAccountName = (toAccount as any).accountName || '未知科目';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, minWidth: 180 }}>
        <Chip
          label={fromAccountName}
          size="small"
          color="secondary"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            mr: 0.5,
            maxWidth: 80,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.75rem'
            }
          }}
        />
        <ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main', mx: 0.25 }} />
        <Chip
          label={toAccountName}
          size="small"
          color="primary"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            ml: 0.5,
            maxWidth: 80,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.75rem'
            }
          }}
        />
      </Box>
    );
  };

  if (!selectedAccount) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box textAlign="center" color="text.secondary">
          <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            請選擇科目
          </Typography>
          <Typography variant="body2">
            選擇左側科目以查看相關交易
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題區域 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            {selectedAccount.name} 的交易記錄
          </Typography>
          
          {onAddTransaction && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onAddTransaction(selectedAccount._id)}
            >
              新增交易
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={selectedAccount.code}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Typography variant="body2" color="text.secondary">
            {selectedAccount.type}
          </Typography>
        </Box>
      </Box>

      {/* 內容區域 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <Box textAlign="center" color="text.secondary">
              <ReceiptIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body1">
                此科目暫無交易記錄
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Dashboard 統計區域 */}
            {renderStatisticsCards()}
            
            {/* 交易列表 */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>交易描述</TableCell>
                    <TableCell>交易日期</TableCell>
                    <TableCell align="center">交易流向</TableCell>
                    <TableCell align="right">本科目金額</TableCell>
                    <TableCell align="right">累計餘額</TableCell>
                    <TableCell align="center">狀態</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionsWithRunningBalance.map((transaction) => (
                    <TableRow
                      key={transaction._id}
                      hover
                      onClick={(event) => handleRowClick(event, transaction)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          #{(transaction as any).groupNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell align="center">
                        {renderTransactionFlow(transaction)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={(transaction as any).accountAmount >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency((transaction as any).accountAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={(transaction as any).runningBalance >= 0 ? 'success.main' : 'error.main'}
                          sx={{
                            backgroundColor: (transaction as any).runningBalance >= 0 ? 'success.50' : 'error.50',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                          }}
                        >
                          {formatCurrency((transaction as any).runningBalance)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(transaction.status)}
                          color={getStatusColor(transaction.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>

      {/* 交易詳情對話框 */}
      {renderTransactionDetailDialog()}

      {/* 操作選單 */}
      {renderActionMenu()}
    </Paper>
  );
};

export default AccountTransactionList;