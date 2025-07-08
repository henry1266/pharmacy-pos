import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  TextField,
  Pagination,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  SwapHoriz as TransferIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { format } from 'date-fns';
import { AccountingRecord2, Account2, Category2, TransactionGroup } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { accountApiClient, transactionApiClient, categoryApiClient } from './core/api-clients';
import organizationService from '../../services/organizationService';
import RecordForm from './RecordForm';

interface RecordListProps {
  selectedOrganizationId: string | null;
  refreshTrigger?: number;
}

interface RecordFilter {
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

const RecordList: React.FC<RecordListProps> = ({ selectedOrganizationId, refreshTrigger }) => {
  const [records, setRecords] = useState<TransactionGroup[]>([]);
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [categories, setCategories] = useState<Category2[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TransactionGroup | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filter, setFilter] = useState<RecordFilter>({
    page: 1,
    limit: 20
  });

  // 載入記帳記錄
  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: filter.page,
        limit: filter.limit
      };

      if (filter.type) params.type = filter.type;
      if (filter.categoryId) params.categoryId = filter.categoryId;
      if (filter.accountId) params.accountId = filter.accountId;
      if (filter.startDate) params.startDate = filter.startDate.toISOString();
      if (filter.endDate) params.endDate = filter.endDate.toISOString();
      if (selectedOrganizationId) params.organizationId = selectedOrganizationId;

      console.log('🔍 RecordList 載入記錄 - 參數:', params);

      const response = await transactionApiClient.getTransactions(params);
      setRecords(response.data.groups || []);
      setPagination({
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 20,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      });
      console.log('✅ RecordList 載入成功:', (response.data.groups || []).length, '筆記錄');
    } catch (err) {
      console.error('載入記帳記錄錯誤:', err);
      setError('載入記帳記錄時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入帳戶資料
  const loadAccounts = async () => {
    try {
      const params = selectedOrganizationId ? { organizationId: selectedOrganizationId } : {};
      const response = await accountApiClient.getAccounts(params);
      setAccounts(response.data);
      console.log('✅ RecordList 載入帳戶成功:', response.data.length, '個帳戶');
    } catch (err) {
      console.error('載入帳戶錯誤:', err);
    }
  };

  // 載入類別資料
  const loadCategories = async () => {
    try {
      const params = selectedOrganizationId ? { organizationId: selectedOrganizationId } : {};
      const response = await categoryApiClient.getCategories(params);
      setCategories(response.data);
      console.log('✅ RecordList 載入類別成功:', response.data.length, '個類別');
    } catch (err) {
      console.error('載入類別錯誤:', err);
    }
  };

  // 載入機構資料
  const loadOrganizations = async () => {
    try {
      const response = await organizationService.getOrganizations();
      if (response.success) {
        setOrganizations(response.data);
        console.log('✅ RecordList 載入機構成功:', response.data.length, '個機構');
      }
    } catch (err) {
      console.error('載入機構錯誤:', err);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [selectedOrganizationId, filter, refreshTrigger]);

  useEffect(() => {
    loadAccounts();
    loadCategories();
    loadOrganizations();
  }, [selectedOrganizationId, refreshTrigger]);

  // 處理表單提交
  const handleFormSubmit = async (recordData: Partial<TransactionGroup>) => {
    try {
      setError(null);

      console.log('📤 RecordList 提交記錄資料:', recordData);

      if (editingRecord) {
        // 更新記錄
        await transactionApiClient.updateTransaction(editingRecord._id, recordData as any);
      } else {
        // 建立新記錄
        await transactionApiClient.createTransaction(recordData as any);
      }

      console.log('✅ 記錄操作成功');
      setFormOpen(false);
      setEditingRecord(null);
      await loadRecords(); // 重新載入資料
      await loadAccounts(); // 重新載入帳戶餘額
    } catch (err) {
      console.error('記錄操作錯誤:', err);
      setError('操作時發生錯誤');
    }
  };

  // 處理編輯 (暫時禁用，因為 RecordForm 不支援 TransactionGroup)
  const handleEdit = (record: TransactionGroup) => {
    console.log('⚠️ RecordList 編輯功能暫時禁用 - TransactionGroup 與 RecordForm 不相容');
    // TODO: 需要建立支援 TransactionGroup 的表單組件
    alert('編輯功能暫時不可用，請使用新增功能');
  };

  // 處理刪除
  const handleDelete = async (recordId: string) => {
    if (!window.confirm('確定要刪除此交易記錄嗎？')) {
      return;
    }

    try {
      setError(null);
      await transactionApiClient.deleteTransaction(recordId);
      
      console.log('✅ 記錄刪除成功');
      await loadRecords(); // 重新載入資料
      await loadAccounts(); // 重新載入帳戶餘額
    } catch (err) {
      console.error('刪除記錄錯誤:', err);
      setError('刪除時發生錯誤');
    }
  };

  // 關閉表單
  const handleFormClose = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

  // 處理篩選變更
  const handleFilterChange = (field: keyof RecordFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value,
      page: 1 // 重置到第一頁
    }));
  };

  // 處理分頁變更
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setFilter(prev => ({
      ...prev,
      page: value
    }));
  };

  // 清除篩選
  const handleClearFilter = () => {
    setFilter({
      page: 1,
      limit: 20
    });
  };

  // 取得交易狀態圖示
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <IncomeIcon color="success" />;
      case 'draft':
        return <EditIcon color="warning" />;
      case 'cancelled':
        return <DeleteIcon color="error" />;
      default:
        return <TransferIcon color="info" />;
    }
  };

  // 取得交易狀態標籤
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '已確認';
      case 'draft':
        return '草稿';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  // 取得類別名稱
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : '未知類別';
  };

  // 取得帳戶名稱
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc._id === accountId);
    return account ? account.name : '未知帳戶';
  };

  // 渲染記錄項目
  const renderRecordItem = (record: TransactionGroup) => (
    <ListItem key={record._id} divider>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(record.status)}
            <Typography variant="body1" fontWeight="medium">
              {record.description}
            </Typography>
            <Chip
              label={getStatusLabel(record.status)}
              size="small"
              color={record.status === 'confirmed' ? 'success' : record.status === 'draft' ? 'warning' : 'error'}
            />
            {record.groupNumber && (
              <Chip
                label={record.groupNumber}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              資金類型：{record.fundingType === 'original' ? '原始資金' : record.fundingType === 'extended' ? '延伸使用' : '資金轉移'}
              {record.invoiceNo && ` | 發票號碼：${record.invoiceNo}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(record.transactionDate), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
            </Typography>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
        <Typography
          variant="h6"
          color={record.status === 'confirmed' ? 'success.main' : record.status === 'cancelled' ? 'error.main' : 'text.primary'}
          fontWeight="bold"
        >
          ${record.totalAmount.toLocaleString()}
        </Typography>
      </Box>
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="編輯"
          onClick={() => handleEdit(record)}
          size="small"
          disabled
          title="編輯功能暫時不可用"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="刪除"
          onClick={() => handleDelete(record._id)}
          size="small"
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box>
        {/* 標題和操作區 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            記帳記錄
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            新增記錄
          </Button>
        </Box>

        {/* 篩選器 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6">篩選條件</Typography>
            <Button size="small" onClick={handleClearFilter}>
              清除篩選
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>記錄類型</InputLabel>
                <Select
                  value={filter.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                  label="記錄類型"
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="income">收入</MenuItem>
                  <MenuItem value="expense">支出</MenuItem>
                  <MenuItem value="transfer">轉帳</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>類別</InputLabel>
                <Select
                  value={filter.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                  label="類別"
                >
                  <MenuItem value="">全部</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>帳戶</InputLabel>
                <Select
                  value={filter.accountId || ''}
                  onChange={(e) => handleFilterChange('accountId', e.target.value || undefined)}
                  label="帳戶"
                >
                  <MenuItem value="">全部</MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="開始日期"
                value={filter.startDate || null}
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
                value={filter.endDate || null}
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

        {/* 錯誤訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 記錄列表 */}
        <Paper elevation={2}>
          <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6">
              記帳記錄列表 ({pagination.total} 筆)
            </Typography>
          </Box>
          
          <List>
            {records.length > 0 ? (
              records.map(renderRecordItem)
            ) : (
              <ListItem>
                <ListItemText 
                  primary="尚無記帳記錄" 
                  secondary="點擊上方「新增記錄」按鈕建立第一筆記錄"
                />
              </ListItem>
            )}
          </List>

          {/* 分頁 */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Stack spacing={2}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
                <Typography variant="caption" textAlign="center">
                  第 {pagination.page} 頁，共 {pagination.pages} 頁 | 
                  顯示 {records.length} 筆，共 {pagination.total} 筆記錄
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* 記錄表單對話框 */}
        <RecordForm
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          record={null}
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
          accounts={accounts}
          categories={categories}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default RecordList;