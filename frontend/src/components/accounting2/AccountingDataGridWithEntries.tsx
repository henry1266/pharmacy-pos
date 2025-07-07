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
  Collapse,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
  Link as LinkIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '../../../../shared';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchTransactionGroupsWithEntries } from '../../redux/actions';

// 臨時型別擴展，確保 referencedByInfo 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  // 處理展開/收合行
  const handleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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
                      <TableCell width="50px"></TableCell>
                      <TableCell>交易描述</TableCell>
                      <TableCell>交易日期</TableCell>
                      <TableCell>交易編號</TableCell>
                      <TableCell align="right">金額</TableCell>
                      <TableCell align="center">狀態</TableCell>
                      <TableCell align="center">平衡</TableCell>
                      <TableCell align="center">被引用</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactionGroups.map((group) => (
                      <React.Fragment key={group._id}>
                        {/* 主要交易行 */}
                        <TableRow hover>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(group._id)}
                            >
                              {expandedRows.has(group._id) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </TableCell>
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
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(calculateTotalAmount(group.entries))}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {getStatusChip(group.status || 'draft')}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={isBalanced(group.entries) ? '已平衡' : '未平衡'}
                              color={isBalanced(group.entries) ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {(group as ExtendedTransactionGroupWithEntries).referencedByInfo && (group as ExtendedTransactionGroupWithEntries).referencedByInfo!.length > 0 ? (
                              <Tooltip
                                title={
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                      被引用情況：
                                    </Typography>
                                    {(group as ExtendedTransactionGroupWithEntries).referencedByInfo!.map((ref, index) => (
                                      <Box key={ref._id} sx={{ mb: 0.5 }}>
                                        <Typography variant="caption" display="block">
                                          {formatDate(ref.transactionDate)} - {ref.groupNumber}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                          {ref.description} ({formatCurrency(ref.totalAmount)})
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                }
                                arrow
                                placement="left"
                              >
                                <Chip
                                  icon={<LinkIcon />}
                                  label={`${(group as ExtendedTransactionGroupWithEntries).referencedByInfo!.length} 筆引用`}
                                  color="warning"
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                -
                              </Typography>
                            )}
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

                        {/* 展開的分錄詳情 */}
                        <TableRow>
                          <TableCell colSpan={9} sx={{ p: 0 }}>
                            <Collapse in={expandedRows.has(group._id)}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>序號</TableCell>
                                      <TableCell>會計科目</TableCell>
                                      <TableCell>摘要</TableCell>
                                      <TableCell align="right">借方</TableCell>
                                      <TableCell align="right">貸方</TableCell>
                                      <TableCell>資金來源</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.entries && group.entries.length > 0 ? group.entries
                                      .sort((a, b) => a.sequence - b.sequence)
                                      .map((entry) => (
                                      <TableRow key={entry._id || `${group._id}-${entry.sequence}`}>
                                        <TableCell>
                                          <Typography variant="body2" fontFamily="monospace">
                                            {entry.sequence}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {(entry as any).accountName || '未知科目'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {entry.description}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          {entry.debitAmount && entry.debitAmount > 0 ? (
                                            <Typography variant="body2" color="success.main">
                                              {formatCurrency(entry.debitAmount)}
                                            </Typography>
                                          ) : (
                                            '-'
                                          )}
                                        </TableCell>
                                        <TableCell align="right">
                                          {entry.creditAmount && entry.creditAmount > 0 ? (
                                            <Typography variant="body2" color="error.main">
                                              {formatCurrency(entry.creditAmount)}
                                            </Typography>
                                          ) : (
                                            '-'
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {entry.sourceTransactionId ? (
                                            <Box>
                                              <Chip
                                                label={`資金來源: ${(entry as any).sourceTransactionDescription || '未知交易'}`}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ mb: 0.5 }}
                                              />
                                              
                                              {/* 來源交易編號 */}
                                              {(entry as any).sourceTransactionGroupNumber && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                  交易編號: {(entry as any).sourceTransactionGroupNumber}
                                                </Typography>
                                              )}
                                              
                                              {/* 來源交易日期 */}
                                              {(entry as any).sourceTransactionDate && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                  交易日期: {new Date((entry as any).sourceTransactionDate).toLocaleDateString('zh-TW')}
                                                </Typography>
                                              )}
                                              
                                              {/* 來源交易總額 */}
                                              {(entry as any).sourceTransactionAmount && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                  來源總額: {formatCurrency((entry as any).sourceTransactionAmount)}
                                                </Typography>
                                              )}
                                              
                                              {/* 追蹤金額 */}
                                              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                追蹤金額: {entry.debitAmount ? formatCurrency(entry.debitAmount) : formatCurrency(entry.creditAmount || 0)}
                                              </Typography>
                                              
                                              {/* 來源ID（縮短顯示） */}
                                              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                                來源ID: {String(entry.sourceTransactionId).slice(-8)}
                                              </Typography>
                                            </Box>
                                          ) : (
                                            '-'
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )) : (
                                      <TableRow>
                                        <TableCell colSpan={6} align="center">
                                          <Typography variant="body2" color="text.secondary">
                                            此交易群組尚無分錄資料
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
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