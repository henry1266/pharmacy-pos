import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Button,
  Tooltip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Pagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ConfirmIcon,
  LockOpen as UnlockIcon,
  Link as LinkIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '../../../../shared';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchTransactionGroupsWithEntries } from '../../redux/actions';

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
}

interface AccountingDataGridWithEntriesProps {
  organizationId?: string;
  showFilters?: boolean;
  onCreateNew: () => void;
  onEdit: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onCopy: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onDelete: (id: string) => void;
  onView: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onConfirm: (id: string) => void;
  onUnlock: (id: string) => void;
  onToggleFilters?: () => void;
}

interface FilterOptions {
  search: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
}

export const AccountingDataGridWithEntries: React.FC<AccountingDataGridWithEntriesProps> = ({
  organizationId,
  showFilters = false,
  onCreateNew,
  onEdit,
  onCopy,
  onDelete,
  onView,
  onConfirm,
  onUnlock,
  onToggleFilters
}) => {
  const dispatch = useAppDispatch();
  
  // 使用 Redux 狀態
  const { transactionGroups, loading, error, pagination } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // 本地狀態管理
  const [filter, setFilter] = useState<FilterOptions>({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    page: 1,
    limit: 25
  });

  // 載入交易群組資料
  const loadTransactionGroups = () => {
    console.log('🔍 AccountingDataGridWithEntries - 載入交易群組:', { organizationId, filter });

    const params: any = {
      organizationId,
      page: filter.page,
      limit: filter.limit
    };

    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate.toISOString();
    if (filter.endDate) params.endDate = filter.endDate.toISOString();

    dispatch(fetchTransactionGroupsWithEntries(params) as any);
  };

  // 初始載入和篩選變更時重新載入
  useEffect(() => {
    console.log('🔍 AccountingDataGridWithEntries - 載入交易群組:', {
      organizationId,
      search: filter.search,
      status: filter.status,
      startDate: filter.startDate,
      endDate: filter.endDate,
      page: filter.page,
      limit: filter.limit
    });

    const params: any = {
      organizationId,
      page: filter.page,
      limit: filter.limit
    };

    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate.toISOString();
    if (filter.endDate) params.endDate = filter.endDate.toISOString();

    dispatch(fetchTransactionGroupsWithEntries(params) as any);
  }, [
    dispatch,
    organizationId,
    filter.search,
    filter.status,
    filter.startDate,
    filter.endDate,
    filter.page,
    filter.limit
  ]); // 直接在 useEffect 中執行邏輯，避免函數依賴項問題

  // 監聽 Redux 狀態變化
  useEffect(() => {
    console.log('📊 AccountingDataGridWithEntries Redux 狀態變化:', {
      transactionGroupsLength: transactionGroups.length,
      loading,
      error,
      pagination
    });
  }, [transactionGroups, loading, error, pagination]);

  // 處理篩選變更
  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value // 非分頁變更時重置到第一頁
    }));
  };

  // 處理分頁變更
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  // 清除篩選
  const handleClearFilter = () => {
    setFilter({
      search: '',
      status: '',
      startDate: null,
      endDate: null,
      page: 1,
      limit: 25
    });
  };

  // 格式化日期
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('zh-TW');
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 取得狀態標籤
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip label="已確認" color="success" size="small" />;
      case 'draft':
        return <Chip label="草稿" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="已取消" color="error" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  // 計算交易群組總金額
  const calculateTotalAmount = (entries: EmbeddedAccountingEntry[]) => {
    return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

  // 檢查借貸平衡
  const isBalanced = (entries: EmbeddedAccountingEntry[]) => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差
  };

  // 計算剩餘可用金額（使用後端提供的精確資料）
  const calculateAvailableAmount = (group: ExtendedTransactionGroupWithEntries) => {
    const totalAmount = calculateTotalAmount(group.entries);
    
    if (!group.referencedByInfo || group.referencedByInfo.length === 0) {
      return totalAmount; // 沒有被引用，全額可用
    }
    
    // 🎯 使用後端提供的精確已使用金額資料
    // 計算實際已使用金額（從 referencedByInfo 中獲取，排除已取消的交易）
    const actualUsedAmount = group.referencedByInfo
      .filter(ref => ref.status !== 'cancelled') // 排除已取消的交易
      .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0);
    
    // 剩餘可用金額 = 總金額 - 實際已使用金額
    const availableAmount = totalAmount - actualUsedAmount;
    
    console.log(`💰 交易 ${group.groupNumber} 剩餘可用金額計算:`, {
      totalAmount,
      actualUsedAmount,
      availableAmount,
      referencedByCount: group.referencedByInfo.length,
      referencedBy: group.referencedByInfo.map(ref => ({
        groupNumber: ref.groupNumber,
        amount: ref.totalAmount,
        status: ref.status
      }))
    });
    
    // 確保不會是負數
    return Math.max(0, availableAmount);
  };

  // 取得剩餘可用狀態顏色
  const getAvailableAmountColor = (availableAmount: number, totalAmount: number) => {
    if (totalAmount === 0) return 'default';
    const percentage = (availableAmount / totalAmount) * 100;
    if (percentage >= 100) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // 渲染整合的資金狀態
  const renderIntegratedFundingStatus = (group: ExtendedTransactionGroupWithEntries) => {
    const totalAmount = calculateTotalAmount(group.entries);
    const availableAmount = calculateAvailableAmount(group);
    const hasReferences = group.referencedByInfo && group.referencedByInfo.length > 0;
    const hasFundingSources = group.fundingSourceUsages && group.fundingSourceUsages.length > 0;
    
    // 如果有資金來源使用，優先顯示資金來源資訊
    if (hasFundingSources) {
      const totalUsedAmount = group.fundingSourceUsages!.reduce((sum, usage) => sum + usage.usedAmount, 0);
      
      return (
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                💰 資金來源追蹤 ({group.fundingSourceUsages!.length} 筆)
              </Typography>
              
              {group.fundingSourceUsages!.map((usage, index) => (
                <Box key={usage.sourceTransactionId} sx={{ mb: 1, pb: 1, borderBottom: index < group.fundingSourceUsages!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                    來源 {index + 1}: {usage.sourceTransactionDescription || '未知交易'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>編號：</strong>{usage.sourceTransactionGroupNumber || 'N/A'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>使用金額：</strong>{formatCurrency(usage.usedAmount)}
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
                <strong>總使用金額：</strong>{formatCurrency(totalUsedAmount)}
              </Typography>
            </Box>
          }
          arrow
          placement="left"
        >
          <Stack direction="column" spacing={0.5} alignItems="center">
            <Chip
              label={`💰 ${group.fundingSourceUsages!.length} 筆`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ cursor: 'help' }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(totalUsedAmount)}
            </Typography>
          </Stack>
        </Tooltip>
      );
    }
    
    // 如果被引用，顯示被引用和剩餘可用狀態
    if (hasReferences) {
      const color = getAvailableAmountColor(availableAmount, totalAmount);
      
      return (
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                🔗 被引用情況 ({group.referencedByInfo!.length} 筆)
              </Typography>
              
              {group.referencedByInfo!.map((ref, index) => (
                <Box key={ref._id} sx={{ mb: 1, pb: 1, borderBottom: index < group.referencedByInfo!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>{formatDate(ref.transactionDate)}</strong> - {ref.groupNumber}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {ref.description} ({formatCurrency(ref.totalAmount)})
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
                <strong>總金額：</strong>{formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>已使用：</strong>{formatCurrency(totalAmount - availableAmount)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                <strong>剩餘可用：</strong>{formatCurrency(availableAmount)}
              </Typography>
            </Box>
          }
          arrow
          placement="left"
        >
          <Stack direction="column" spacing={0.5} alignItems="center">
            <Chip
              icon={<LinkIcon />}
              label={` ${group.referencedByInfo!.length} 筆`}
              color="warning"
              size="small"
              variant="outlined"
              sx={{ cursor: 'help' }}
            />
            <Chip
              label={formatCurrency(availableAmount)}
              color={color}
              size="small"
              variant={availableAmount === totalAmount ? 'filled' : 'outlined'}
            />
          </Stack>
        </Tooltip>
      );
    }
    
    // 沒有資金追蹤的情況
    if (totalAmount === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          無金額交易
        </Typography>
      );
    }
    
    return (
      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center' }}>
        ✓
      </Typography>
    );
  };

  // 渲染交易流向圖
  const renderTransactionFlow = (group: ExtendedTransactionGroupWithEntries) => {
    if (!group.entries || group.entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = group.entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = group.entries.filter(entry => (entry.creditAmount || 0) > 0);

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
          size="medium"
          color="secondary"
          sx={{
            fontSize: '0.8rem',
            height: 28,
            mr: 0.5,
            maxWidth: 90,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.8rem'
            }
          }}
        />
        <ArrowForwardIcon sx={{ fontSize: 18, color: 'primary.main', mx: 0.25 }} />
        <Chip
          label={toAccountName}
          size="medium"
          color="primary"
          sx={{
            fontSize: '0.8rem',
            height: 28,
            ml: 0.5,
            maxWidth: 90,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.8rem'
            }
          }}
        />
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          載入交易群組資料中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={loadTransactionGroups} sx={{ ml: 2 }}>
          重新載入
        </Button>
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Card>
        <CardContent>
          {/* 篩選器 */}
          {showFilters && (
            <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterIcon />
              <Typography variant="h6">篩選條件</Typography>
              <Button size="small" onClick={handleClearFilter}>
                清除篩選
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="搜尋"
                  value={filter.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="交易描述、發票號碼..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>狀態</InputLabel>
                  <Select
                    value={filter.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="狀態"
                  >
                    <MenuItem value="">全部</MenuItem>
                    <MenuItem value="draft">草稿</MenuItem>
                    <MenuItem value="confirmed">已確認</MenuItem>
                    <MenuItem value="cancelled">已取消</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="開始日期"
                  value={filter.startDate}
                  onChange={(newValue) => handleFilterChange('startDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="結束日期"
                  value={filter.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
          )}

          {/* 交易群組表格 */}
          {transactionGroups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ReceiptIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                尚無交易記錄
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                開始建立您的第一筆複式記帳交易
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateNew}
              >
                建立交易
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>交易描述</TableCell>
                      <TableCell>交易日期</TableCell>
                      <TableCell>交易編號</TableCell>
                      <TableCell align="center">交易流向</TableCell>
                      <TableCell align="right">金額</TableCell>
                      <TableCell align="center">狀態</TableCell>
                      <TableCell align="center">資金狀態</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactionGroups.map((group) => (
                      <TableRow key={group._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {group.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(group.transactionDate)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {group.groupNumber}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {renderTransactionFlow(group as ExtendedTransactionGroupWithEntries)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(calculateTotalAmount(group.entries))}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {getStatusChip(group.status || 'draft')}
                        </TableCell>
                        <TableCell align="center">
                          {renderIntegratedFundingStatus(group as ExtendedTransactionGroupWithEntries)}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Tooltip title="檢視">
                              <IconButton
                                size="small"
                                onClick={() => onView(group)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {/* 編輯按鈕 - 只有草稿狀態可以編輯 */}
                            {group.status === 'draft' && (
                              <Tooltip title="編輯">
                                <IconButton
                                  size="small"
                                  onClick={() => onEdit(group)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            <Tooltip title="複製">
                              <IconButton
                                size="small"
                                onClick={() => onCopy(group)}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
                            {group.status === 'draft' && isBalanced(group.entries) && (
                              <Tooltip title="確認交易">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => onConfirm(group._id)}
                                >
                                  <ConfirmIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
                            {group.status === 'confirmed' && (
                              <Tooltip title="解鎖交易">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => onUnlock(group._id)}
                                >
                                  <UnlockIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
                            {group.status === 'draft' && (
                              <Tooltip title="刪除">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => onDelete(group._id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 分頁 */}
              {pagination && pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Stack spacing={2} alignItems="center">
                    <Pagination
                      count={pagination.totalPages}
                      page={pagination.page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                    <Typography variant="caption" color="text.secondary">
                      第 {pagination.page} 頁，共 {pagination.totalPages} 頁 |
                      顯示 {transactionGroups.length} 筆，共 {pagination.total} 筆交易群組
                    </Typography>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default AccountingDataGridWithEntries;