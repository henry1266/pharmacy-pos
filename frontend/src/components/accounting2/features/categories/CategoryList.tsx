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
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon
} from '@mui/icons-material';
import { Category2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { categoryApiClient } from './core/api-clients';
import organizationService from '../../services/organizationService';
import CategoryForm from './CategoryForm';

interface CategoryListProps {
  selectedOrganizationId: string | null;
}

const CategoryList: React.FC<CategoryListProps> = ({ selectedOrganizationId }) => {
  const [categories, setCategories] = useState<Category2[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category2 | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // 載入類別資料
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      if (selectedOrganizationId) {
        params.organizationId = selectedOrganizationId;
      }

      console.log('🔍 CategoryList 載入類別 - 參數:', params);

      const response = await categoryApiClient.getCategories(params);
      if (response.success) {
        setCategories(response.data);
        console.log('✅ CategoryList 載入成功:', response.data.length, '個類別');
      } else {
        setError('載入類別失敗');
      }
    } catch (err: any) {
      console.error('載入類別錯誤:', err);
      setError(err.message || '載入類別時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入機構資料
  const loadOrganizations = async () => {
    try {
      const response = await organizationService.getOrganizations();
      if (response.success) {
        setOrganizations(response.data);
        console.log('✅ CategoryList 載入機構成功:', response.data.length, '個機構');
      }
    } catch (err) {
      console.error('載入機構錯誤:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [selectedOrganizationId, typeFilter]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  // 處理表單提交
  const handleFormSubmit = async (categoryData: Partial<Category2>) => {
    try {
      setError(null);

      // CategoryForm 已經正確處理 organizationId，不需要覆蓋
      const submitData = categoryData;

      console.log('📤 CategoryList 提交類別資料:', submitData);

      let response;
      if (editingCategory) {
        // 更新類別
        response = await categoryApiClient.updateCategory(editingCategory._id, submitData as any);
      } else {
        // 建立新類別 - 確保必填欄位存在
        const createData = {
          name: submitData.name!,
          type: submitData.type!,
          ...submitData
        };
        response = await categoryApiClient.createCategory(createData as any);
      }

      if (response.success) {
        console.log('✅ 類別操作成功');
        setFormOpen(false);
        setEditingCategory(null);
        await loadCategories(); // 重新載入資料
      } else {
        setError(response.message || '操作失敗');
      }
    } catch (err: any) {
      console.error('類別操作錯誤:', err);
      setError(err.message || '操作時發生錯誤');
    }
  };

  // 處理編輯
  const handleEdit = (category: Category2) => {
    console.log('🔍 CategoryList 編輯類別:', category);
    setEditingCategory(category);
    setFormOpen(true);
  };

  // 處理刪除
  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('確定要刪除此類別嗎？')) {
      return;
    }

    try {
      setError(null);
      const response = await categoryApiClient.deleteCategory(categoryId);
      
      if (response.success) {
        console.log('✅ 類別刪除成功');
        await loadCategories(); // 重新載入資料
      } else {
        setError(response.message || '刪除失敗');
      }
    } catch (err: any) {
      console.error('刪除類別錯誤:', err);
      setError(err.message || '刪除時發生錯誤');
    }
  };

  // 關閉表單
  const handleFormClose = () => {
    setFormOpen(false);
    setEditingCategory(null);
  };

  // 按類型分組類別
  const groupedCategories = {
    income: categories.filter(cat => cat.type === 'income'),
    expense: categories.filter(cat => cat.type === 'expense')
  };

  // 渲染類別項目
  const renderCategoryItem = (category: Category2) => (
    <ListItem key={category._id} divider>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {category.icon && <span>{category.icon}</span>}
            <Typography variant="body1">{category.name}</Typography>
            {category.organizationId && (
              <Chip label="機構" size="small" color="primary" />
            )}
            {!category.organizationId && (
              <Chip label="個人" size="small" color="default" />
            )}
          </Box>
        }
        secondary={
          <React.Fragment>
            {category.description && (
              <span style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                {category.description}
              </span>
            )}
            {category.parentId && (
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                子類別
              </span>
            )}
          </React.Fragment>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="編輯"
          onClick={() => handleEdit(category)}
          size="small"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="刪除"
          onClick={() => handleDelete(category._id)}
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
    <Box>
      {/* 標題和操作區 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          類別管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          新增類別
        </Button>
      </Box>

      {/* 篩選器 */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>類型篩選</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
            label="類型篩選"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="income">收入</MenuItem>
            <MenuItem value="expense">支出</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 錯誤訊息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 類別列表 */}
      <Grid container spacing={3}>
        {(typeFilter === 'all' || typeFilter === 'income') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2}>
              <Box sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IncomeIcon />
                  <Typography variant="h6">收入類別</Typography>
                  <Chip 
                    label={groupedCategories.income.length} 
                    size="small" 
                    sx={{ bgcolor: 'success.dark', color: 'white' }}
                  />
                </Box>
              </Box>
              <List>
                {groupedCategories.income.length > 0 ? (
                  groupedCategories.income.map(renderCategoryItem)
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary="尚無收入類別" 
                      secondary="點擊上方「新增類別」按鈕建立收入類別"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}

        {(typeFilter === 'all' || typeFilter === 'expense') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2}>
              <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ExpenseIcon />
                  <Typography variant="h6">支出類別</Typography>
                  <Chip 
                    label={groupedCategories.expense.length} 
                    size="small" 
                    sx={{ bgcolor: 'error.dark', color: 'white' }}
                  />
                </Box>
              </Box>
              <List>
                {groupedCategories.expense.length > 0 ? (
                  groupedCategories.expense.map(renderCategoryItem)
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary="尚無支出類別" 
                      secondary="點擊上方「新增類別」按鈕建立支出類別"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* 類別表單對話框 */}
      <CategoryForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        categories={categories}
      />
    </Box>
  );
};

export default CategoryList;