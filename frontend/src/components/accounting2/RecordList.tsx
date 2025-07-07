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
import { AccountingRecord2, Account2, Category2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { accounting3Service } from '../../services/accounting3Service';
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
  const [records, setRecords] = useState<AccountingRecord2[]>([]);
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [categories, setCategories] = useState<Category2[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountingRecord2 | null>(null);
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

      const response = await accounting3Service.records.getAll(params);
      if (response.success) {
        setRecords(response.data.records);
        setPagination(response.data.pagination);
        console.log('✅ RecordList 載入成功:', response.data.records.length, '筆記錄');
      } else {
        setError('載入記帳記錄失敗');
      }
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
      const response = await accounting3Service.accounts.getAll(selectedOrganizationId);
      if (response.success) {
        setAccounts(response.data);
        console.log('✅ RecordList 載入帳戶成功:', response.data.length, '個帳戶');
      }
    } catch (err) {
      console.error('載入帳戶錯誤:', err);
    }
  };

  // 載入類別資料
  const loadCategories = async () => {
    try {
      const params = selectedOrganizationId ? { organizationId: selectedOrganizationId } : {};
      const response = await accounting3Service.categories.getAll(params);
      if (response.success) {
        setCategories(response.data);
        console.log('✅ RecordList 載入類別成功:', response.data.length, '個類別');
      }
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
  const handleFormSubmit = async (recordData: Partial<AccountingRecord2>) => {
    try {
      setError(null);

      console.log('📤 RecordList 提交記錄資料:', recordData);

      let response;
      if (editingRecord) {
        // 更新記錄
        response = await accounting3Service.records.update(editingRecord._id, recordData as any);
      } else {
        // 建立新記錄
        response = await accounting3Service.records.create(recordData as any);
      }

      if (response.success) {
        console.log('✅ 記錄操作成功');
        setFormOpen(false);
        setEditingRecord(null);
        await loadRecords(); // 重新載入資料
        await loadAccounts(); // 重新載入帳戶餘額
      } else {
        setError(response.message || '操作失敗');
      }
    } catch (err) {
      console.error('記錄操作錯誤:', err);
      setError('操作時發生錯誤');
    }
  };

  // 處理編輯
  const handleEdit = (record: AccountingRecord2) => {
    console.log('🔍 RecordList 編輯記錄:', record);
    setEditingRecord(record);
    setFormOpen(true);
  };

  // 處理刪除
  const handleDelete = async (recordId: string) => {
    if (!window.confirm('確定要刪除此記帳記錄嗎？')) {
      return;
    }

    try {
      setError(null);
      const response = await accounting3Service.records.delete(recordId);
      
      if (response.success) {
        console.log('✅ 記錄刪除成功');
        await loadRecords(); // 重新載入資料
        await loadAccounts(); // 重新載入帳戶餘額
      } else {
        setError(response.message || '刪除失敗');
      }
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

  // 取得記錄類型圖示
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <IncomeIcon color="success" />;
      case 'expense':
        return <ExpenseIcon color="error" />;
      case 'transfer':
        return <TransferIcon color="info" />;
      default:
        return null;
    }
  };

  // 取得記錄類型標籤
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return '收入';
      case 'expense':
        return '支出';
      case 'transfer':
        return '轉帳';
      default:
        return type;
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
  const renderRecordItem = (record: AccountingRecord2) => (
    <ListItem key={record._id} divider>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon(record.type)}
            <Typography variant="body1" fontWeight="medium">
              {record.description || getCategoryName(record.categoryId as string)}
            </Typography>
            <Chip 
              label={getTypeLabel(record.type)} 
              size="small" 
              color={record.type === 'income' ? 'success' : record.type === 'expense' ? 'error' : 'info'}
            />
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              類別：{getCategoryName(record.categoryId as string)} | 
              帳戶：{getAccountName(record.accountId as string)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(record.date), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
            </Typography>
            {record.tags && record.tags.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {record.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        }
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
        <Typography 
          variant="h6" 
          color={record.type === 'income' ? 'success.main' : 'error.main'}
          fontWeight="bold"
        >
          {record.type === 'income' ? '+' : '-'}${record.amount.toLocaleString()}
        </Typography>
      </Box>
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="編輯"
          onClick={() => handleEdit(record)}
          size="small"
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
          record={editingRecord}
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